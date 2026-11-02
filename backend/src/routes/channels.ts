import { Hono } from 'hono';
import { Bindings } from '../types';

const channelsRoute = new Hono<{ Bindings: Bindings }>();

// Helper to ensure channels table exists and seed defaults if empty
export async function ensureChannelsTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📌',
      color TEXT DEFAULT '#3B82F6',
      is_active INTEGER DEFAULT 1,
      type TEXT DEFAULT 'custom',
      is_system INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).run();

  // Check if channels table is empty
  const countRow = await db.prepare(`SELECT count(*) as count FROM channels`).first();
  if (!countRow || Number(countRow.count) === 0) {
    await db.batch([
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, name, icon, color, is_active, type, is_system)
        VALUES ('ch_offline', 'Offline / Direct', '🤝', '#0D9488', 1, 'direct', 1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, name, icon, color, is_active, type, is_system)
        VALUES ('ch_airbnb', 'Airbnb', '🏠', '#FF385C', 1, 'ota', 1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, name, icon, color, is_active, type, is_system)
        VALUES ('ch_booking', 'Booking.com', '🌐', '#003580', 1, 'ota', 1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, name, icon, color, is_active, type, is_system)
        VALUES ('ch_whatsapp', 'Direct Call / WhatsApp', '💬', '#16A34A', 1, 'direct', 1)
      `),
      db.prepare(`
        INSERT OR IGNORE INTO channels (id, name, icon, color, is_active, type, is_system)
        VALUES ('ch_other', 'Other Channels', '✨', '#8B5CF6', 1, 'custom', 1)
      `)
    ]);
  }
}

// 1. GET /api/channels - List all channels (active and inactive) with bookings count
channelsRoute.get('/', async (c) => {
  try {
    await ensureChannelsTable(c.env.DB);

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM channels ORDER BY is_system DESC, created_at ASC
    `).all();

    const channels = (results || []).map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      icon: ch.icon || '📌',
      color: ch.color || '#3B82F6',
      isActive: Boolean(ch.is_active),
      is_active: Number(ch.is_active),
      type: ch.type || 'custom',
      isSystem: Boolean(ch.is_system),
      is_system: Number(ch.is_system),
      createdAt: ch.created_at
    }));

    // Fetch booking counts for each channel
    const { results: allBookings } = await c.env.DB.prepare(`
      SELECT platform, notes FROM bookings WHERE status != 'Cancelled'
    `).all();

    const bookingList = allBookings || [];

    const enriched = channels.map(ch => {
      const chNameLower = ch.name.toLowerCase();
      let count = 0;

      bookingList.forEach((b: any) => {
        const plat = (b.platform || '').toLowerCase();
        const notes = (b.notes || '').toLowerCase();

        if (ch.id === 'ch_whatsapp' || chNameLower.includes('whatsapp')) {
          if (notes.includes('whatsapp') || notes.includes('direct call') || plat.includes('whatsapp')) {
            count++;
            return;
          }
        } else if (ch.id === 'ch_offline' || chNameLower === 'offline / direct' || chNameLower === 'offline') {
          if (notes.includes('mode: offline') || (plat === 'direct' && !notes.includes('whatsapp') && !notes.includes('call'))) {
            count++;
            return;
          }
        } else if (ch.id === 'ch_airbnb' || chNameLower === 'airbnb') {
          if (plat.includes('airbnb') || notes.includes('mode: airbnb')) {
            count++;
            return;
          }
        } else if (ch.id === 'ch_booking' || chNameLower.includes('booking.com')) {
          if (plat.includes('booking.com') || notes.includes('mode: booking.com')) {
            count++;
            return;
          }
        } else if (ch.id === 'ch_other' || chNameLower.includes('other')) {
          if (plat.includes('other') || notes.includes('mode: other')) {
            count++;
            return;
          }
        } else {
          // Generic match for custom channels
          if (notes.includes(`booking mode: ${chNameLower}`) || plat === chNameLower) {
            count++;
          }
        }
      });

      return {
        ...ch,
        bookingsCount: count,
        activeBookingsCount: count
      };
    });

    return c.json({
      success: true,
      data: enriched
    });
  } catch (err: any) {
    console.error('Error fetching channels:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. POST /api/channels - Add a new channel
channelsRoute.post('/', async (c) => {
  try {
    await ensureChannelsTable(c.env.DB);
    const body = await c.req.json();
    const name = (body.name || '').trim();
    const icon = (body.icon || '📌').trim();
    const color = (body.color || '#3B82F6').trim();
    const type = (body.type || 'custom').trim();
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : 1;

    if (!name) {
      return c.json({ success: false, error: 'Channel name is required.' }, 400);
    }

    // Check collision
    const existing = await c.env.DB.prepare(`
      SELECT * FROM channels WHERE LOWER(name) = LOWER(?)
    `).bind(name).first();

    if (existing) {
      return c.json({
        success: false,
        error: `A channel named "${name}" already exists.`
      }, 409);
    }

    const id = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await c.env.DB.prepare(`
      INSERT INTO channels (id, name, icon, color, is_active, type, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `).bind(id, name, icon, color, isActive, type).run();

    return c.json({
      success: true,
      message: `Channel "${name}" created successfully.`,
      data: {
        id,
        name,
        icon,
        color,
        type,
        isActive: Boolean(isActive),
        is_active: isActive,
        isSystem: false,
        is_system: 0
      }
    }, 201);
  } catch (err: any) {
    console.error('Error creating channel:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. PUT /api/channels/:id/toggle - Toggle active/deactive status
channelsRoute.put('/:id/toggle', async (c) => {
  try {
    await ensureChannelsTable(c.env.DB);
    const id = c.req.param('id');

    const channel = await c.env.DB.prepare(`SELECT * FROM channels WHERE id = ?`).bind(id).first();
    if (!channel) {
      return c.json({ success: false, error: 'Channel not found.' }, 404);
    }

    const currentStatus = Number(channel.is_active);
    const newStatus = currentStatus === 1 ? 0 : 1;

    await c.env.DB.prepare(`
      UPDATE channels SET is_active = ? WHERE id = ?
    `).bind(newStatus, id).run();

    return c.json({
      success: true,
      message: `Channel "${channel.name}" ${newStatus === 1 ? 'activated' : 'deactivated'} successfully.`,
      data: {
        id,
        name: channel.name,
        isActive: Boolean(newStatus),
        is_active: newStatus
      }
    });
  } catch (err: any) {
    console.error('Error toggling channel:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT /api/channels/:id - Update channel details (name, icon, color, isActive, type)
channelsRoute.put('/:id', async (c) => {
  try {
    await ensureChannelsTable(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare(`SELECT * FROM channels WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: false, error: 'Channel not found.' }, 404);
    }

    const oldName = existing.name as string;
    const newName = (body.name !== undefined ? body.name : oldName).trim();
    const icon = body.icon !== undefined ? body.icon.trim() : existing.icon;
    const color = body.color !== undefined ? body.color.trim() : existing.color;
    const type = body.type !== undefined ? body.type.trim() : existing.type;
    const isActive = body.isActive !== undefined ? (body.isActive ? 1 : 0) : existing.is_active;

    if (!newName) {
      return c.json({ success: false, error: 'Channel name cannot be empty.' }, 400);
    }

    // Check name collision with another channel
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const conflict = await c.env.DB.prepare(`
        SELECT * FROM channels WHERE LOWER(name) = LOWER(?) AND id != ?
      `).bind(newName, id).first();

      if (conflict) {
        return c.json({
          success: false,
          error: `Another channel named "${newName}" already exists.`
        }, 409);
      }
    }

    await c.env.DB.prepare(`
      UPDATE channels SET name = ?, icon = ?, color = ?, type = ?, is_active = ?
      WHERE id = ?
    `).bind(newName, icon, color, type, isActive, id).run();

    // If channel name changed, cascade update to bookings notes
    if (newName !== oldName) {
      try {
        await c.env.DB.prepare(`
          UPDATE bookings
          SET notes = REPLACE(notes, 'Booking Mode: ' || ?, 'Booking Mode: ' || ?)
          WHERE notes LIKE '%' || 'Booking Mode: ' || ? || '%'
        `).bind(oldName, newName, oldName).run();
      } catch (cascadeErr) {
        console.warn('Booking cascade update warning:', cascadeErr);
      }
    }

    return c.json({
      success: true,
      message: `Channel "${newName}" updated successfully.`,
      data: {
        id,
        name: newName,
        icon,
        color,
        type,
        isActive: Boolean(isActive),
        is_active: isActive
      }
    });
  } catch (err: any) {
    console.error('Error updating channel:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE /api/channels/:id - Remove channel (safe deletion with booking check)
channelsRoute.delete('/:id', async (c) => {
  try {
    await ensureChannelsTable(c.env.DB);
    const id = c.req.param('id');
    const force = c.req.query('force') === 'true';

    const channel = await c.env.DB.prepare(`SELECT * FROM channels WHERE id = ?`).bind(id).first();
    if (!channel) {
      return c.json({ success: false, error: 'Channel not found.' }, 404);
    }

    const channelName = channel.name as string;
    const chNameLower = channelName.toLowerCase();

    // Check if bookings exist for this channel
    const { results: allBookings } = await c.env.DB.prepare(`
      SELECT platform, notes FROM bookings WHERE status != 'Cancelled'
    `).all();

    let count = 0;
    (allBookings || []).forEach((b: any) => {
      const plat = (b.platform || '').toLowerCase();
      const notes = (b.notes || '').toLowerCase();

      if (id === 'ch_whatsapp' || chNameLower.includes('whatsapp')) {
        if (notes.includes('whatsapp') || notes.includes('direct call') || plat.includes('whatsapp')) {
          count++;
          return;
        }
      } else if (id === 'ch_offline' || chNameLower === 'offline / direct' || chNameLower === 'offline') {
        if (notes.includes('mode: offline') || (plat === 'direct' && !notes.includes('whatsapp') && !notes.includes('call'))) {
          count++;
          return;
        }
      } else if (id === 'ch_airbnb' || chNameLower === 'airbnb') {
        if (plat.includes('airbnb') || notes.includes('mode: airbnb')) {
          count++;
          return;
        }
      } else if (id === 'ch_booking' || chNameLower.includes('booking.com')) {
        if (plat.includes('booking.com') || notes.includes('mode: booking.com')) {
          count++;
          return;
        }
      } else if (id === 'ch_other' || chNameLower.includes('other')) {
        if (plat.includes('other') || notes.includes('mode: other')) {
          count++;
          return;
        }
      } else {
        if (notes.includes(`booking mode: ${chNameLower}`) || plat === chNameLower) {
          count++;
        }
      }
    });

    if (count > 0 && !force) {
      return c.json({
        success: false,
        hasBookings: true,
        count,
        error: `Channel "${channelName}" is used by ${count} booking(s). You can deactivate it instead to hide it from new bookings while keeping historical records intact, or pass ?force=true to delete.`
      }, 400);
    }

    // Delete the channel
    await c.env.DB.prepare(`DELETE FROM channels WHERE id = ?`).bind(id).run();

    return c.json({
      success: true,
      message: `Channel "${channelName}" removed successfully.`
    });
  } catch (err: any) {
    console.error('Error deleting channel:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default channelsRoute;
