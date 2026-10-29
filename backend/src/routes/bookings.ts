import { Hono } from 'hono';
import { Bindings, Booking } from '../types';

const bookingsRoute = new Hono<{ Bindings: Bindings }>();

// Helper to map DB row to camelCase Booking object
function mapDbRowToBooking(row: any): Booking {
  return {
    id: row.id,
    property: row.property,
    guestName: row.guest_name,
    phone: row.phone || '',
    email: row.email || '',
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    nights: Number(row.nights) || 1,
    guestsCount: Number(row.guests_count) || 1,
    platform: row.platform || 'Direct',
    reservationCode: row.reservation_code || '',
    payout: row.payout || '',
    paymentStatus: row.payment_status || 'Pay on Arrival',
    status: row.status || 'Confirmed',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// 1. GET /api/bookings - Fetch all bookings
bookingsRoute.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM bookings ORDER BY check_in_date ASC, property ASC`
    ).all();

    const bookings = (results || []).map(mapDbRowToBooking);
    return c.json({ success: true, count: bookings.length, data: bookings });
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. GET /api/bookings/:id - Fetch single booking
bookingsRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const row = await c.env.DB.prepare(
      `SELECT * FROM bookings WHERE id = ?`
    ).bind(id).first();

    if (!row) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    return c.json({ success: true, data: mapDbRowToBooking(row) });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. POST /api/bookings - Create new booking
bookingsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const property = body.property || '1 BHK';
    const guestName = body.guestName || 'Guest';
    const phone = body.phone || '';
    const email = body.email || '';
    const checkInDate = body.checkInDate;
    const checkOutDate = body.checkOutDate;
    const nights = Number(body.nights) || 1;
    const guestsCount = Number(body.guestsCount) || 1;
    const platform = body.platform || 'Direct';
    const reservationCode = body.reservationCode || '';
    const payout = body.payout || '';
    const paymentStatus = body.paymentStatus || 'Pay on Arrival';
    const status = body.status || 'Confirmed';
    const notes = body.notes || '';

    if (!checkInDate || !checkOutDate) {
      return c.json({ success: false, error: 'checkInDate and checkOutDate are required.' }, 400);
    }

    // Check for double booking conflicts on the same property (unless status is Cancelled)
    if (status !== 'Cancelled') {
      const conflict = await c.env.DB.prepare(`
        SELECT * FROM bookings 
        WHERE property = ? 
          AND status != 'Cancelled'
          AND check_in_date < ? 
          AND check_out_date > ?
      `).bind(property, checkOutDate, checkInDate).first();

      if (conflict) {
        return c.json({
          success: false,
          conflict: true,
          error: `Overlap conflict with existing booking for ${conflict.guest_name} (${conflict.check_in_date} to ${conflict.check_out_date}).`
        }, 409);
      }
    }

    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      INSERT INTO bookings (
        id, property, guest_name, phone, email,
        check_in_date, check_out_date, nights, guests_count,
        platform, reservation_code, payout, payment_status,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, property, guestName, phone, email,
      checkInDate, checkOutDate, nights, guestsCount,
      platform, reservationCode, payout, paymentStatus,
      status, notes, now, now
    ).run();

    const created = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapDbRowToBooking(created) }, 201);
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT /api/bookings/:id - Update existing booking
bookingsRoute.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: false, error: 'Booking not found' }, 404);
    }

    const property = body.property !== undefined ? body.property : existing.property;
    const guestName = body.guestName !== undefined ? body.guestName : existing.guest_name;
    const phone = body.phone !== undefined ? body.phone : existing.phone;
    const email = body.email !== undefined ? body.email : existing.email;
    const checkInDate = body.checkInDate !== undefined ? body.checkInDate : existing.check_in_date;
    const checkOutDate = body.checkOutDate !== undefined ? body.checkOutDate : existing.check_out_date;
    const nights = body.nights !== undefined ? Number(body.nights) : existing.nights;
    const guestsCount = body.guestsCount !== undefined ? Number(body.guestsCount) : existing.guests_count;
    const platform = body.platform !== undefined ? body.platform : existing.platform;
    const reservationCode = body.reservationCode !== undefined ? body.reservationCode : existing.reservation_code;
    const payout = body.payout !== undefined ? body.payout : existing.payout;
    const paymentStatus = body.paymentStatus !== undefined ? body.paymentStatus : existing.payment_status;
    const status = body.status !== undefined ? body.status : existing.status;
    const notes = body.notes !== undefined ? body.notes : existing.notes;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE bookings SET
        property = ?, guest_name = ?, phone = ?, email = ?,
        check_in_date = ?, check_out_date = ?, nights = ?, guests_count = ?,
        platform = ?, reservation_code = ?, payout = ?, payment_status = ?,
        status = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      property, guestName, phone, email,
      checkInDate, checkOutDate, nights, guestsCount,
      platform, reservationCode, payout, paymentStatus,
      status, notes, now, id
    ).run();

    const updated = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapDbRowToBooking(updated) });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE /api/bookings/:id - Delete booking
bookingsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const res = await c.env.DB.prepare(`DELETE FROM bookings WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: `Booking ${id} deleted` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. POST /api/bookings/batch - Batch import / backup restore
bookingsRoute.post('/batch', async (c) => {
  try {
    const { bookings } = await c.req.json();
    if (!Array.isArray(bookings)) {
      return c.json({ success: false, error: 'Expected an array of bookings' }, 400);
    }

    const statements = bookings.map((b: any) => {
      const now = new Date().toISOString();
      return c.env.DB.prepare(`
        INSERT OR REPLACE INTO bookings (
          id, property, guest_name, phone, email,
          check_in_date, check_out_date, nights, guests_count,
          platform, reservation_code, payout, payment_status,
          status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        b.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        b.property || '1 BHK',
        b.guestName || 'Guest',
        b.phone || '',
        b.email || '',
        b.checkInDate,
        b.checkOutDate,
        Number(b.nights) || 1,
        Number(b.guestsCount) || 1,
        b.platform || 'Direct',
        b.reservationCode || '',
        b.payout || '',
        b.paymentStatus || 'Pay on Arrival',
        b.status || 'Confirmed',
        b.notes || '',
        b.createdAt || now,
        now
      );
    });

    await c.env.DB.batch(statements);
    return c.json({ success: true, count: bookings.length });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default bookingsRoute;
