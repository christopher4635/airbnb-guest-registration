import { Hono } from 'hono';
import { Bindings, Booking } from '../types';
import {
  classifyBookingSource,
  deriveBookingMode,
  parseMoneyAmount,
  acquireRoomInventoryLock,
  releaseRoomInventoryLock,
  enqueueAndDispatchAvailabilityUpdate,
  recordAvailabilityAudit
} from './syncEngine';

const bookingsRoute = new Hono<{ Bindings: Bindings }>();

// Helper to map DB row to camelCase Booking object
function mapDbRowToBooking(row: any): Booking {
  let idDocuments: any[] = [];
  if (row.id_documents) {
    try {
      idDocuments = typeof row.id_documents === 'string' ? JSON.parse(row.id_documents) : row.id_documents;
    } catch (e) {
      idDocuments = [];
    }
  } else if (row.notes && row.notes.includes('[ID Documents:')) {
    try {
      const match = row.notes.match(/\[ID Documents:\s*([^\]]+)\]/i);
      if (match) idDocuments = JSON.parse(match[1]);
    } catch (e) {
      idDocuments = [];
    }
  }

  const canonicalSource = classifyBookingSource(row);
  const bookingMode = row.booking_mode || deriveBookingMode(row.platform, row.external_uid, null, row.status);

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
    bookingMode,
    source: canonicalSource,
    reservationCode: row.reservation_code || '',
    externalReservationId: row.external_reservation_id || '',
    externalUid: row.external_uid || '',
    payout: row.payout || '',
    totalPrice: row.total_price !== null && row.total_price !== undefined ? Number(row.total_price) : parseMoneyAmount(row.payout),
    currency: row.currency || 'INR',
    taxesFees: Number(row.taxes_fees) || 0,
    paymentStatus: row.payment_status || 'Pay on Arrival',
    otaPayoutStatus: row.ota_payout_status || (bookingMode === 'Airbnb' || bookingMode === 'Booking.com' ? 'Pending Settlement' : 'N/A'),
    status: row.status || 'Confirmed',
    notes: row.notes || '',
    idDocuments: idDocuments,
    syncVersion: Number(row.sync_version) || 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Automatically notify StaffSync Hub to synchronize Elite Homes room calendar & daily finances
function notifyStaffSync(c: any) {
  try {
    const p = fetch('https://staff-management.elitehomes-portal.workers.dev/api/sync/airbnb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-PIN': c.env.ADMIN_PIN || '4635'
      }
    }).catch(e => console.error('StaffSync notification error:', e));

    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
      c.executionCtx.waitUntil(p);
    }
  } catch (e) {
    console.error('Failed to notify StaffSync:', e);
  }
}

// 1. GET /api/bookings - Fetch all bookings
bookingsRoute.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM bookings ORDER BY check_in_date DESC, property ASC`
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

// 3. POST /api/bookings - Create new booking (Master Calendar Source of Truth + Atomic Lock + OTA Push)
bookingsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const property = body.property || 'Ripple 1 BHK';
    const guestName = body.guestName || 'Guest';
    const phone = body.phone || '';
    const email = body.email || '';
    const checkInDate = body.checkInDate;
    const checkOutDate = body.checkOutDate;
    const nights = Number(body.nights) || 1;
    const guestsCount = Number(body.guestsCount) || 1;
    const platform = body.platform || 'Direct';
    const reservationCode = body.reservationCode || '';
    const externalReservationId = body.externalReservationId || null;
    const externalUid = body.externalUid || null;
    const payout = body.payout || '';
    const totalPrice = body.totalPrice !== undefined ? parseMoneyAmount(body.totalPrice) : parseMoneyAmount(payout);
    const currency = (body.currency || 'INR').toUpperCase();
    const taxesFees = parseMoneyAmount(body.taxesFees) || 0;
    const status = body.status || 'Confirmed';
    const bookingMode = deriveBookingMode(platform, externalUid, body.bookingMode, status);
    const isOta = bookingMode === 'Airbnb' || bookingMode === 'Booking.com';
    const paymentStatus = body.paymentStatus || (isOta ? 'Paid' : 'Pay on Arrival');
    const otaPayoutStatus = body.otaPayoutStatus || (isOta ? 'Pending Settlement' : 'N/A');
    const notes = body.notes || '';
    const idDocuments = body.idDocuments !== undefined
      ? (typeof body.idDocuments === 'string' ? body.idDocuments : JSON.stringify(body.idDocuments))
      : null;

    if (!checkInDate || !checkOutDate) {
      return c.json({ success: false, error: 'checkInDate and checkOutDate are required.' }, 400);
    }

    const originSource = classifyBookingSource({ platform, booking_mode: bookingMode, external_uid: externalUid, status });

    // Acquire atomic room inventory lock to guard against simultaneous cross-platform double bookings
    const lock = await acquireRoomInventoryLock(c.env.DB, property, checkInDate, checkOutDate, originSource);
    if (!lock.acquired) {
      return c.json({
        success: false,
        conflict: true,
        error: `Simultaneous booking in progress on "${property}" (${checkInDate} to ${checkOutDate}). Please retry in a moment.`
      }, 409);
    }

    try {
      // Atomic overlap check on the same property (unless status is Cancelled)
      if (status !== 'Cancelled') {
        const conflict = await c.env.DB.prepare(`
          SELECT * FROM bookings 
          WHERE LOWER(property) = LOWER(?) 
            AND status != 'Cancelled'
            AND check_in_date < ? 
            AND check_out_date > ?
        `).bind(property, checkOutDate, checkInDate).first();

        if (conflict) {
          await recordAvailabilityAudit(c.env.DB, {
            property,
            bookingId: id,
            action: 'conflict_detected',
            source: originSource,
            bookingMode,
            checkInDate,
            checkOutDate,
            details: `Blocked double-booking attempt: overlaps existing booking ${conflict.id} (${conflict.guest_name}, ${conflict.check_in_date} to ${conflict.check_out_date}).`
          });
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
          platform, booking_mode, reservation_code, external_reservation_id, external_uid,
          payout, total_price, currency, taxes_fees,
          payment_status, ota_payout_status, status, notes, id_documents, sync_version,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        id, property, guestName, phone, email,
        checkInDate, checkOutDate, nights, guestsCount,
        platform, bookingMode, reservationCode, externalReservationId, externalUid,
        payout, totalPrice, currency, taxesFees,
        paymentStatus, otaPayoutStatus, status, notes, idDocuments, now, now
      ).run();

      await recordAvailabilityAudit(c.env.DB, {
        property,
        bookingId: id,
        action: status === 'Blocked' ? 'block_created' : 'created',
        source: originSource,
        bookingMode,
        checkInDate,
        checkOutDate,
        newState: { guestName, status, paymentStatus, totalPrice, currency },
        details: `${bookingMode} created on Master Calendar; pushing availability to OTAs.`
      });

      // Immediately recalculate room availability & push to both Airbnb and Booking.com!
      await enqueueAndDispatchAvailabilityUpdate(c.env, c.executionCtx, {
        property,
        bookingId: id,
        eventType: status === 'Blocked' ? 'block_created' : 'booking_created',
        originSource,
        checkInDate,
        checkOutDate,
        forceBothChannels: !externalUid // Website/Admin-entered bookings always sync to BOTH OTAs
      });
    } finally {
      await releaseRoomInventoryLock(c.env.DB, lock.lockToken);
    }

    notifyStaffSync(c);
    const created = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapDbRowToBooking(created) }, 201);
  } catch (err: any) {
    console.error('Error creating booking:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. PUT /api/bookings/:id - Update existing booking (Atomic Overlap Check + Cross-Room OTA Propagation)
bookingsRoute.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing: any = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
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
    const totalPrice = body.totalPrice !== undefined
      ? parseMoneyAmount(body.totalPrice)
      : (body.payout !== undefined ? parseMoneyAmount(body.payout) : existing.total_price);
    const currency = body.currency !== undefined ? String(body.currency).toUpperCase() : (existing.currency || 'INR');
    const taxesFees = body.taxesFees !== undefined ? (parseMoneyAmount(body.taxesFees) || 0) : (existing.taxes_fees || 0);
    const paymentStatus = body.paymentStatus !== undefined ? body.paymentStatus : existing.payment_status;
    const status = body.status !== undefined ? body.status : existing.status;
    const bookingMode = body.bookingMode !== undefined
      ? deriveBookingMode(platform, existing.external_uid, body.bookingMode, status)
      : (existing.booking_mode || deriveBookingMode(platform, existing.external_uid, null, status));
    const otaPayoutStatus = body.otaPayoutStatus !== undefined
      ? body.otaPayoutStatus
      : (existing.ota_payout_status || (bookingMode === 'Airbnb' || bookingMode === 'Booking.com' ? 'Pending Settlement' : 'N/A'));
    const notes = body.notes !== undefined ? body.notes : existing.notes;
    const idDocuments = body.idDocuments !== undefined
      ? (typeof body.idDocuments === 'string' ? body.idDocuments : JSON.stringify(body.idDocuments))
      : existing.id_documents;
    const now = new Date().toISOString();

    const datesOrRoomChanged =
      String(property).toLowerCase() !== String(existing.property).toLowerCase() ||
      checkInDate !== existing.check_in_date ||
      checkOutDate !== existing.check_out_date;
    const statusChanged = status !== existing.status;

    const originSource = classifyBookingSource({
      platform,
      booking_mode: bookingMode,
      external_uid: existing.external_uid,
      status
    });

    const lock = await acquireRoomInventoryLock(c.env.DB, property, checkInDate, checkOutDate, originSource);
    if (!lock.acquired) {
      return c.json({
        success: false,
        conflict: true,
        error: `Simultaneous update in progress on "${property}". Please retry.`
      }, 409);
    }

    try {
      // Check for double-booking conflict if moving dates/room or reactivating a booking
      if (status !== 'Cancelled' && (datesOrRoomChanged || (existing.status === 'Cancelled' && status !== 'Cancelled'))) {
        const conflict = await c.env.DB.prepare(`
          SELECT * FROM bookings
          WHERE id != ?
            AND LOWER(property) = LOWER(?)
            AND status != 'Cancelled'
            AND check_in_date < ?
            AND check_out_date > ?
          LIMIT 1
        `).bind(id, property, checkOutDate, checkInDate).first();

        if (conflict) {
          return c.json({
            success: false,
            conflict: true,
            error: `Date/room change conflicts with existing booking for ${conflict.guest_name} (${conflict.check_in_date} to ${conflict.check_out_date}).`
          }, 409);
        }
      }

      await c.env.DB.prepare(`
        UPDATE bookings SET
          property = ?, guest_name = ?, phone = ?, email = ?,
          check_in_date = ?, check_out_date = ?, nights = ?, guests_count = ?,
          platform = ?, booking_mode = ?, reservation_code = ?,
          payout = ?, total_price = ?, currency = ?, taxes_fees = ?,
          payment_status = ?, ota_payout_status = ?, status = ?, notes = ?, id_documents = ?,
          sync_version = COALESCE(sync_version, 1) + 1,
          updated_at = ?
        WHERE id = ?
      `).bind(
        property, guestName, phone, email,
        checkInDate, checkOutDate, nights, guestsCount,
        platform, bookingMode, reservationCode,
        payout, totalPrice, currency, taxesFees,
        paymentStatus, otaPayoutStatus, status, notes, idDocuments, now, id
      ).run();

      if (datesOrRoomChanged || statusChanged) {
        const isCancelledNow = status === 'Cancelled';
        await recordAvailabilityAudit(c.env.DB, {
          property,
          bookingId: id,
          action: isCancelledNow ? 'cancelled' : 'modified',
          source: originSource,
          bookingMode,
          checkInDate,
          checkOutDate,
          previousState: { property: existing.property, checkIn: existing.check_in_date, checkOut: existing.check_out_date, status: existing.status },
          newState: { property, checkIn: checkInDate, checkOut: checkOutDate, status },
          details: isCancelledNow
            ? 'Booking cancelled on Master Calendar; recalculated room availability before reopening dates.'
            : 'Booking dates/room/status updated on Master Calendar; propagating to OTAs.'
        });

        await enqueueAndDispatchAvailabilityUpdate(c.env, c.executionCtx, {
          property,
          previousProperty: existing.property !== property ? existing.property : null,
          bookingId: id,
          eventType: isCancelledNow ? 'booking_cancelled' : 'booking_updated',
          originSource,
          checkInDate,
          checkOutDate,
          forceBothChannels: true
        });
      }
    } finally {
      await releaseRoomInventoryLock(c.env.DB, lock.lockToken);
    }

    notifyStaffSync(c);
    const updated = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    return c.json({ success: true, data: mapDbRowToBooking(updated) });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 5. DELETE /api/bookings/:id - Delete / Cancel booking + Recalculate & Push Availability
bookingsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const existing: any = await c.env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(id).first();
    if (!existing) {
      return c.json({ success: true, message: `Booking ${id} already deleted` });
    }

    const plat = ((existing.platform as string) || '').toLowerCase();
    const isSynced = Boolean(existing.external_uid || id.startsWith('bk_ical_') || id.startsWith('bk_ota_') || plat.includes('airbnb') || plat.includes('booking'));

    if (isSynced) {
      await c.env.DB.prepare(`
        UPDATE bookings SET 
          status = 'Cancelled', 
          notes = coalesce(notes, '') || ' [Deleted by Host - Do Not Resurrect]',
          sync_version = COALESCE(sync_version, 1) + 1,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(id).run();
    } else {
      await c.env.DB.prepare(`DELETE FROM bookings WHERE id = ?`).bind(id).run();
    }

    const originSource = classifyBookingSource(existing);
    await recordAvailabilityAudit(c.env.DB, {
      property: existing.property,
      bookingId: id,
      action: 'cancelled',
      source: originSource,
      bookingMode: existing.booking_mode || originSource,
      checkInDate: existing.check_in_date,
      checkOutDate: existing.check_out_date,
      details: 'Booking deleted/cancelled on Master Calendar; recalculated availability before reopening dates.'
    });

    await enqueueAndDispatchAvailabilityUpdate(c.env, c.executionCtx, {
      property: existing.property,
      bookingId: id,
      eventType: 'booking_cancelled',
      originSource,
      checkInDate: existing.check_in_date,
      checkOutDate: existing.check_out_date,
      forceBothChannels: true
    });

    notifyStaffSync(c);
    return c.json({ success: true, message: `Booking ${id} deleted` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 6. POST /api/bookings/batch - Batch import / backup restore with property normalization & chunking
bookingsRoute.post('/batch', async (c) => {
  try {
    const { bookings } = await c.req.json();
    if (!Array.isArray(bookings)) {
      return c.json({ success: false, error: 'Expected an array of bookings' }, 400);
    }

    const normalizePropName = (name?: string): string => {
      if (!name) return 'Ripple 1 BHK';
      const trimmed = name.trim();
      if (/^1\s*bhk$/i.test(trimmed)) return 'Ripple 1 BHK';
      if (/^1\s*room(\s*\/\s*studio)?$/i.test(trimmed) || /^studio(\s*suite)?$/i.test(trimmed)) return 'Studio';
      return trimmed;
    };

    const statements = bookings.map((b: any) => {
      const now = new Date().toISOString();
      const prop = normalizePropName(b.property);
      const mode = deriveBookingMode(b.platform, b.externalUid, b.bookingMode, b.status);
      return c.env.DB.prepare(`
        INSERT OR REPLACE INTO bookings (
          id, property, guest_name, phone, email,
          check_in_date, check_out_date, nights, guests_count,
          platform, booking_mode, reservation_code, payout, total_price, currency,
          payment_status, ota_payout_status, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        b.id || `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        prop,
        b.guestName || 'Guest',
        b.phone || '',
        b.email || '',
        b.checkInDate,
        b.checkOutDate,
        Number(b.nights) || 1,
        Number(b.guestsCount) || 1,
        b.platform || 'Direct',
        mode,
        b.reservationCode || '',
        b.payout || '',
        parseMoneyAmount(b.totalPrice ?? b.payout),
        (b.currency || 'INR').toUpperCase(),
        b.paymentStatus || (mode === 'Airbnb' || mode === 'Booking.com' ? 'Paid' : 'Pay on Arrival'),
        b.otaPayoutStatus || (mode === 'Airbnb' || mode === 'Booking.com' ? 'Pending Settlement' : 'N/A'),
        b.status || 'Confirmed',
        b.notes || '',
        b.createdAt || now,
        now
      );
    });

    const chunkSize = 40;
    for (let i = 0; i < statements.length; i += chunkSize) {
      await c.env.DB.batch(statements.slice(i, i + chunkSize));
    }

    notifyStaffSync(c);
    return c.json({ success: true, imported: statements.length });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default bookingsRoute;
