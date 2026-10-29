import { Hono } from 'hono';
import { Bindings } from '../types';

const propertiesRoute = new Hono<{ Bindings: Bindings }>();

// Helper to ensure properties table exists
async function ensurePropertiesTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#FF385C',
      airbnb_ical_url TEXT,
      booking_com_ical_url TEXT,
      other_ical_url TEXT,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).run();

  // Seed default 3 properties if table is empty
  const countRow = await db.prepare(`SELECT count(*) as count FROM properties`).first();
  if (!countRow || Number(countRow.count) === 0) {
    await db.batch([
      db.prepare(`INSERT OR IGNORE INTO properties (id, name, color) VALUES ('prop_1', '1 BHK', '#FF385C')`),
      db.prepare(`INSERT OR IGNORE INTO properties (id, name, color) VALUES ('prop_2', '2 BHK', '#0D9488')`),
      db.prepare(`INSERT OR IGNORE INTO properties (id, name, color) VALUES ('prop_3', '1 Room / Studio', '#8B5CF6')`)
    ]);
  }
}

// 1. GET /api/properties - List all properties/rooms with bookings counts & iCal settings
propertiesRoute.get('/', async (c) => {
  try {
    await ensurePropertiesTable(c.env.DB);

    const { results } = await c.env.DB.prepare(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM bookings b WHERE b.property = p.name AND b.status != 'Cancelled') as active_bookings_count
      FROM properties p
      ORDER BY p.created_at ASC
    `).all();

    return c.json({
      success: true,
      data: results || []
    });
  } catch (err: any) {
    console.error('Error fetching properties:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. POST /api/properties - Add a new room/property
propertiesRoute.post('/', async (c) => {
  try {
    await ensurePropertiesTable(c.env.DB);
    const body = await c.req.json();
    const name = (body.name || '').trim();
    const color = body.color || '#3B82F6';
    const airbnbIcalUrl = (body.airbnbIcalUrl || '').trim();
    const bookingComIcalUrl = (body.bookingComIcalUrl || '').trim();
    const otherIcalUrl = (body.otherIcalUrl || '').trim();

    if (!name) {
      return c.json({ success: false, error: 'Property name is required.' }, 400);
    }

    // Check if property with this name already exists
    const existing = await c.env.DB.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?)`).bind(name).first();
    if (existing) {
      return c.json({ success: false, error: `Property "${name}" already exists.` }, 409);
    }

    const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Insert into properties table
    await c.env.DB.prepare(`
      INSERT INTO properties (id, name, color, airbnb_ical_url, booking_com_ical_url, other_ical_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, name, color, airbnbIcalUrl, bookingComIcalUrl, otherIcalUrl).run();

    // Also update app_config.propertyOptions
    const configRow = await c.env.DB.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
    if (configRow && configRow.value) {
      try {
        const config = JSON.parse(configRow.value as string);
        if (Array.isArray(config.propertyOptions) && !config.propertyOptions.includes(name)) {
          config.propertyOptions.push(name);
          await c.env.DB.prepare(`
            UPDATE app_config SET value = ?, updated_at = datetime('now') WHERE key = 'app_config'
          `).bind(JSON.stringify(config)).run();
        }
      } catch(e) {}
    }

    return c.json({
      success: true,
      message: `Property "${name}" added successfully.`,
      data: { id, name, color, airbnbIcalUrl, bookingComIcalUrl, otherIcalUrl }
    }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Core helper for renaming a property with cascading updates across D1
async function executeRenameProperty(
  db: D1Database,
  oldName: string,
  newName: string,
  color?: string,
  airbnbIcalUrl?: string,
  bookingComIcalUrl?: string,
  otherIcalUrl?: string
) {
  if (!oldName) throw new Error('Existing property name is required.');
  if (!newName) throw new Error('New property name cannot be empty.');

  // Verify old property exists (case-insensitive lookup fallback)
  let existing = await db.prepare(`SELECT * FROM properties WHERE name = ?`).bind(oldName).first();
  if (!existing) {
    existing = await db.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?)`).bind(oldName).first();
  }
  if (!existing) {
    throw new Error(`Property "${oldName}" not found.`);
  }

  const actualOldName = existing.name as string;

  // Check collision with another property
  if (newName.toLowerCase() !== actualOldName.toLowerCase()) {
    const conflict = await db.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?) AND name != ?`).bind(newName, actualOldName).first();
    if (conflict) {
      throw new Error(`Property name "${newName}" is already taken.`);
    }
  }

  const finalColor = color || (existing.color as string) || '#FF385C';
  const finalAirbnb = airbnbIcalUrl !== undefined ? airbnbIcalUrl : existing.airbnb_ical_url;
  const finalBooking = bookingComIcalUrl !== undefined ? bookingComIcalUrl : existing.booking_com_ical_url;
  const finalOther = otherIcalUrl !== undefined ? otherIcalUrl : existing.other_ical_url;

  const stmts: D1PreparedStatement[] = [
    db.prepare(`
      UPDATE properties SET 
        name = ?, color = ?, airbnb_ical_url = ?, booking_com_ical_url = ?, other_ical_url = ?
      WHERE name = ?
    `).bind(newName, finalColor, finalAirbnb, finalBooking, finalOther, actualOldName)
  ];

  if (newName !== actualOldName) {
    stmts.push(
      db.prepare(`UPDATE bookings SET property = ? WHERE property = ?`).bind(newName, actualOldName),
      db.prepare(`UPDATE submissions SET property_option = ? WHERE property_option = ?`).bind(newName, actualOldName)
    );
  }

  await db.batch(stmts);

  // Update app_config.propertyOptions
  const configRow = await db.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
  if (configRow && configRow.value) {
    try {
      const config = JSON.parse(configRow.value as string);
      if (Array.isArray(config.propertyOptions)) {
        config.propertyOptions = config.propertyOptions.map((opt: string) => opt === actualOldName ? newName : opt);
        if (config.defaultPropertyOption === actualOldName) config.defaultPropertyOption = newName;
        await db.prepare(`
          UPDATE app_config SET value = ?, updated_at = datetime('now') WHERE key = 'app_config'
        `).bind(JSON.stringify(config)).run();
      }
    } catch(e) {}
  }

  return { oldName: actualOldName, newName, color: finalColor };
}

// 3. POST /api/properties/rename - JSON Body Rename (Safe against slashes in room names)
propertiesRoute.post('/rename', async (c) => {
  try {
    await ensurePropertiesTable(c.env.DB);
    const body = await c.req.json();
    const oldName = (body.oldName || body.name || '').trim();
    const newName = (body.newName || '').trim();
    const color = body.color;

    const result = await executeRenameProperty(
      c.env.DB,
      oldName,
      newName,
      color,
      body.airbnbIcalUrl,
      body.bookingComIcalUrl,
      body.otherIcalUrl
    );

    return c.json({
      success: true,
      message: `Property renamed from "${result.oldName}" to "${result.newName}". All bookings updated!`,
      data: result
    });
  } catch (err: any) {
    console.error('Error renaming property via POST /rename:', err);
    return c.json({ success: false, error: err.message }, err.message.includes('not found') ? 404 : 400);
  }
});

// 4. PUT /api/properties/:name - URL Param Rename (Legacy/REST standard)
propertiesRoute.put('/:name', async (c) => {
  try {
    await ensurePropertiesTable(c.env.DB);
    const oldName = decodeURIComponent(c.req.param('name')).trim();
    const body = await c.req.json();
    const newName = (body.newName || body.name || '').trim();
    const color = body.color;

    const result = await executeRenameProperty(
      c.env.DB,
      oldName,
      newName,
      color,
      body.airbnbIcalUrl,
      body.bookingComIcalUrl,
      body.otherIcalUrl
    );

    return c.json({
      success: true,
      message: `Property renamed from "${result.oldName}" to "${result.newName}". All bookings updated!`,
      data: result
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, err.message.includes('not found') ? 404 : 400);
  }
});

// 4. DELETE /api/properties/:name - Delete or archive property
propertiesRoute.delete('/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name')).trim();
    if (!name) return c.json({ success: false, error: 'Name is required' }, 400);

    // Check active bookings
    const activeBooking = await c.env.DB.prepare(`
      SELECT count(*) as count FROM bookings WHERE property = ? AND status != 'Cancelled'
    `).bind(name).first();

    const count = Number(activeBooking?.count || 0);
    const force = c.req.query('force') === 'true';

    if (count > 0 && !force) {
      return c.json({
        success: false,
        hasActiveBookings: true,
        count,
        error: `Property "${name}" has ${count} active booking(s). Pass ?force=true to delete and cancel them.`
      }, 400);
    }

    await c.env.DB.batch([
      c.env.DB.prepare(`DELETE FROM properties WHERE name = ?`).bind(name),
      force ? c.env.DB.prepare(`UPDATE bookings SET status = 'Cancelled', notes = notes || ' [Property deleted]' WHERE property = ?`).bind(name) : c.env.DB.prepare(`SELECT 1`)
    ]);

    // Update config
    const configRow = await c.env.DB.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
    if (configRow && configRow.value) {
      try {
        const config = JSON.parse(configRow.value as string);
        if (Array.isArray(config.propertyOptions)) {
          config.propertyOptions = config.propertyOptions.filter((opt: string) => opt !== name);
          await c.env.DB.prepare(`
            UPDATE app_config SET value = ?, updated_at = datetime('now') WHERE key = 'app_config'
          `).bind(JSON.stringify(config)).run();
        }
      } catch(e) {}
    }

    return c.json({ success: true, message: `Property "${name}" removed.` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default propertiesRoute;
