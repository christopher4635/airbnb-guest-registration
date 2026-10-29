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

// 3. PUT /api/properties/:name - Rename property and cascade update to bookings
propertiesRoute.put('/:name', async (c) => {
  try {
    await ensurePropertiesTable(c.env.DB);
    const oldName = decodeURIComponent(c.req.param('name')).trim();
    const body = await c.req.json();
    const newName = (body.newName || body.name || '').trim();
    const color = body.color;
    const airbnbIcalUrl = body.airbnbIcalUrl !== undefined ? body.airbnbIcalUrl.trim() : undefined;
    const bookingComIcalUrl = body.bookingComIcalUrl !== undefined ? body.bookingComIcalUrl.trim() : undefined;
    const otherIcalUrl = body.otherIcalUrl !== undefined ? body.otherIcalUrl.trim() : undefined;

    if (!oldName) {
      return c.json({ success: false, error: 'Existing property name is required.' }, 400);
    }
    if (!newName) {
      return c.json({ success: false, error: 'New property name cannot be empty.' }, 400);
    }

    // Verify old property exists
    const existing = await c.env.DB.prepare(`SELECT * FROM properties WHERE name = ?`).bind(oldName).first();
    if (!existing) {
      return c.json({ success: false, error: `Property "${oldName}" not found.` }, 404);
    }

    // If name is changing, ensure new name is not already taken by another property
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const conflict = await c.env.DB.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?) AND name != ?`).bind(newName, oldName).first();
      if (conflict) {
        return c.json({ success: false, error: `Property name "${newName}" is already taken.` }, 409);
      }
    }

    // Prepare batch update statements
    const stmts: D1PreparedStatement[] = [];

    // 1. Update properties table
    const finalColor = color || existing.color || '#FF385C';
    const finalAirbnb = airbnbIcalUrl !== undefined ? airbnbIcalUrl : existing.airbnb_ical_url;
    const finalBooking = bookingComIcalUrl !== undefined ? bookingComIcalUrl : existing.booking_com_ical_url;
    const finalOther = otherIcalUrl !== undefined ? otherIcalUrl : existing.other_ical_url;

    stmts.push(
      c.env.DB.prepare(`
        UPDATE properties SET 
          name = ?, color = ?, airbnb_ical_url = ?, booking_com_ical_url = ?, other_ical_url = ?
        WHERE name = ?
      `).bind(newName, finalColor, finalAirbnb, finalBooking, finalOther, oldName)
    );

    // 2. Cascade rename to all existing bookings for this property!
    if (newName !== oldName) {
      stmts.push(
        c.env.DB.prepare(`UPDATE bookings SET property = ? WHERE property = ?`).bind(newName, oldName)
      );
      stmts.push(
        c.env.DB.prepare(`UPDATE submissions SET property_option = ? WHERE property_option = ?`).bind(newName, oldName)
      );
    }

    await c.env.DB.batch(stmts);

    // 3. Update app_config.propertyOptions
    const configRow = await c.env.DB.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
    if (configRow && configRow.value) {
      try {
        const config = JSON.parse(configRow.value as string);
        if (Array.isArray(config.propertyOptions)) {
          config.propertyOptions = config.propertyOptions.map((opt: string) => opt === oldName ? newName : opt);
          if (config.defaultPropertyOption === oldName) config.defaultPropertyOption = newName;
          await c.env.DB.prepare(`
            UPDATE app_config SET value = ?, updated_at = datetime('now') WHERE key = 'app_config'
          `).bind(JSON.stringify(config)).run();
        }
      } catch(e) {}
    }

    return c.json({
      success: true,
      message: `Property renamed from "${oldName}" to "${newName}". All bookings updated!`,
      data: { oldName, newName, color: finalColor }
    });
  } catch (err: any) {
    console.error('Error updating property:', err);
    return c.json({ success: false, error: err.message }, 500);
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
