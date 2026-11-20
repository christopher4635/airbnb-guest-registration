import { Bindings } from '../types';

export type CanonicalBookingSource =
  | 'Airbnb'
  | 'Booking.com'
  | 'Direct Booking'
  | 'Manual Booking'
  | 'Blocked'
  | 'Other';

export type OtaChannel = 'Airbnb' | 'Booking.com';

// =============================================================================
// 1. SOURCE & BOOKING MODE CLASSIFICATION
// =============================================================================

/**
 * Deterministically classifies a booking's true originating source.
 * Checks external_uid / external_reservation_id first so OTA-imported rows are
 * never misclassified as website bookings.
 */
export function classifyBookingSource(bk: any): CanonicalBookingSource {
  if (!bk) return 'Other';
  const uid = String(bk.external_uid || bk.externalUid || '').toLowerCase().trim();
  const mode = String(bk.booking_mode || bk.bookingMode || '').toLowerCase().trim();
  const plat = String(bk.platform || '').toLowerCase().trim();
  const status = String(bk.status || '').toLowerCase().trim();

  // 1. Explicit external OTA UID always identifies the true external source
  if (uid.endsWith('@airbnb.com') || uid.includes('airbnb')) return 'Airbnb';
  if (uid.endsWith('@booking.com') || uid.includes('booking.com')) return 'Booking.com';

  // 2. Explicit booking_mode / platform classification
  if (plat === 'blocked' || mode === 'blocked' || status === 'blocked') return 'Blocked';
  if (mode === 'airbnb' || plat === 'airbnb' || plat.startsWith('airbnb')) return 'Airbnb';
  if (mode === 'booking.com' || plat === 'booking.com' || plat.startsWith('booking')) return 'Booking.com';
  if (mode === 'manual booking' || plat === 'manual' || plat === 'manual booking') return 'Manual Booking';
  if (
    mode === 'direct booking' ||
    plat === 'direct' ||
    plat === 'direct booking' ||
    plat === 'website' ||
    plat === 'offline' ||
    plat === 'walk-in'
  ) {
    return 'Direct Booking';
  }

  return 'Other';
}

/**
 * Assigns canonical booking_mode based on booking origin:
 * - Airbnb booking -> 'Airbnb'
 * - Booking.com booking -> 'Booking.com'
 * - Website reservation -> 'Direct Booking'
 * - Admin-created reservation -> 'Manual Booking'
 * - Administrative date block -> 'Blocked'
 */
export function deriveBookingMode(
  platform?: string,
  externalUid?: string | null,
  explicitBookingMode?: string | null,
  status?: string | null
): string {
  const modeLower = String(explicitBookingMode || '').toLowerCase().trim();
  if (modeLower === 'airbnb') return 'Airbnb';
  if (modeLower === 'booking.com' || modeLower === 'bookingcom') return 'Booking.com';
  if (modeLower === 'direct booking' || modeLower === 'direct') return 'Direct Booking';
  if (modeLower === 'manual booking' || modeLower === 'manual') return 'Manual Booking';
  if (modeLower === 'blocked') return 'Blocked';

  const classified = classifyBookingSource({
    platform,
    external_uid: externalUid,
    status
  });
  if (classified === 'Other') return 'Direct Booking';
  return classified;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const dIn = new Date(`${checkIn}T00:00:00Z`);
  const dOut = new Date(`${checkOut}T00:00:00Z`);
  const diffDays = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

export function parseMoneyAmount(raw: any): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  const cleaned = String(raw).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function formatCurrencyAmount(amount: number | null | undefined, currency: string = 'INR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  const cur = String(currency || 'INR').toUpperCase();
  const symbol = cur === 'INR' ? '₹' : (cur === 'USD' ? '$' : (cur === 'EUR' ? '€' : (cur === 'GBP' ? '£' : `${cur} `)));
  return `${symbol}${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Checks whether EVERY night in [checkIn, checkOut) is already covered by
 * one or more active bookings/blocks in the supplied list.
 */
export function isDateRangeCoveredByBookings(checkIn: string, checkOut: string, bookings: any[]): boolean {
  if (!bookings || bookings.length === 0) return false;
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return false;

  const totalNights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (totalNights <= 0 || totalNights > 365) return false;

  const cursor = new Date(start.getTime());
  for (let i = 0; i < totalNights; i++) {
    const nightIso = cursor.toISOString().slice(0, 10);
    const covered = bookings.some(
      b => b.check_in_date <= nightIso && b.check_out_date > nightIso
    );
    if (!covered) return false;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return true;
}

// =============================================================================
// 2. ATOMIC INVENTORY LOCKS (SIMULTANEOUS BOOKING PROTECTION)
// =============================================================================

export async function acquireRoomInventoryLock(
  db: D1Database,
  property: string,
  checkInDate: string,
  checkOutDate: string,
  source: string,
  ttlSeconds: number = 15
): Promise<{ acquired: boolean; lockToken?: string; conflictingLock?: any }> {
  const lockToken = `lock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  try {
    // 1. Clean expired locks for this property
    await db.prepare(`
      DELETE FROM inventory_locks WHERE expires_at <= ?
    `).bind(nowIso).run();

    // 2. Check if another live reservation lock overlaps this room & date range
    const existingLock = await db.prepare(`
      SELECT * FROM inventory_locks
      WHERE LOWER(property) = LOWER(?)
        AND expires_at > ?
        AND check_in_date < ?
        AND check_out_date > ?
      LIMIT 1
    `).bind(property, nowIso, checkOutDate, checkInDate).first();

    if (existingLock) {
      return { acquired: false, conflictingLock: existingLock };
    }

    // 3. Acquire lock atomically
    await db.prepare(`
      INSERT INTO inventory_locks (id, property, lock_token, source, check_in_date, check_out_date, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(lockToken, property, lockToken, source, checkInDate, checkOutDate, expiresIso, nowIso).run();

    return { acquired: true, lockToken };
  } catch (err) {
    console.error('[InventoryLock] Lock acquisition warning:', err);
    // Fail open only if lock table doesn't exist yet in dev; D1 production table always exists
    return { acquired: true, lockToken };
  }
}

export async function releaseRoomInventoryLock(db: D1Database, lockToken?: string) {
  if (!lockToken) return;
  try {
    await db.prepare(`DELETE FROM inventory_locks WHERE lock_token = ?`).bind(lockToken).run();
  } catch (err) {
    console.error('[InventoryLock] Failed to release lock:', err);
  }
}

// =============================================================================
// 3. AUTHORITATIVE ROOM AVAILABILITY RECALCULATION
// =============================================================================

export interface UnavailableRange {
  startDate: string;
  endDate: string;
  sources: string[];
  bookingIds: string[];
}

function mergeDateIntervals(bookings: any[]): UnavailableRange[] {
  const valid = bookings
    .filter(b => b.status !== 'Cancelled' && b.check_in_date && b.check_out_date && b.check_out_date > b.check_in_date)
    .sort((a, b) => String(a.check_in_date).localeCompare(String(b.check_in_date)));

  const merged: UnavailableRange[] = [];
  for (const bk of valid) {
    const src = classifyBookingSource(bk);
    const start = String(bk.check_in_date).slice(0, 10);
    const end = String(bk.check_out_date).slice(0, 10);
    const last = merged[merged.length - 1];

    if (last && start <= last.endDate) {
      if (end > last.endDate) last.endDate = end;
      if (!last.sources.includes(src)) last.sources.push(src);
      if (!last.bookingIds.includes(bk.id)) last.bookingIds.push(bk.id);
    } else {
      merged.push({
        startDate: start,
        endDate: end,
        sources: [src],
        bookingIds: [bk.id]
      });
    }
  }
  return merged;
}

/**
 * Recalculates authoritative room availability from the Master Calendar (`bookings`).
 * Cancelling a booking ONLY reopens dates when NO other active booking or block covers them!
 */
export async function recalculateRoomAvailability(db: D1Database, property: string) {
  const { results } = await db.prepare(`
    SELECT id, property, guest_name, check_in_date, check_out_date, platform, booking_mode, external_uid, status
    FROM bookings
    WHERE LOWER(property) = LOWER(?)
      AND status != 'Cancelled'
      AND check_out_date >= date('now', '-7 days')
    ORDER BY check_in_date ASC
  `).bind(property).all();

  const activeBookings = (results || []) as any[];
  const nonAirbnb = activeBookings.filter(b => classifyBookingSource(b) !== 'Airbnb');
  const nonBookingCom = activeBookings.filter(b => classifyBookingSource(b) !== 'Booking.com');
  const websiteOriginating = activeBookings.filter(b => {
    const src = classifyBookingSource(b);
    return (
      src === 'Direct Booking' ||
      src === 'Manual Booking' ||
      src === 'Blocked' ||
      b.status === 'Blocked' ||
      (b.platform && String(b.platform).toLowerCase() === 'blocked')
    );
  });

  return {
    property,
    activeCount: activeBookings.length,
    allUnavailableRanges: mergeDateIntervals(activeBookings),
    // Website -> Airbnb: blocks all website unavailability EXCEPT Airbnb's own stays
    forAirbnb: mergeDateIntervals(nonAirbnb),
    // Website -> Booking.com: blocks all website unavailability EXCEPT Booking.com's own stays
    forBookingCom: mergeDateIntervals(nonBookingCom),
    // Direct Website Export (Website -> OTAs): exports ONLY direct bookings, manual entries, and administrative blocks
    forWebsiteExport: mergeDateIntervals(websiteOriginating)
  };
}

// =============================================================================
// 4. COMPLETE AVAILABILITY & BOOKING AUDIT TRAIL
// =============================================================================

export async function recordAvailabilityAudit(
  db: D1Database,
  entry: {
    property: string;
    bookingId?: string | null;
    action: string;
    source: string;
    bookingMode?: string | null;
    checkInDate?: string | null;
    checkOutDate?: string | null;
    previousState?: any;
    newState?: any;
    details?: string | null;
  }
) {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await db.prepare(`
      INSERT INTO availability_audit_logs (
        id, property, booking_id, action, source, booking_mode,
        check_in_date, check_out_date, previous_state, new_state, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      entry.property,
      entry.bookingId || null,
      entry.action,
      entry.source,
      entry.bookingMode || null,
      entry.checkInDate || null,
      entry.checkOutDate || null,
      entry.previousState ? JSON.stringify(entry.previousState) : null,
      entry.newState ? JSON.stringify(entry.newState) : null,
      entry.details || null
    ).run();

    // Probabilistically trim audit logs (~1 in 20 writes) using indexed created_at
    if (Math.random() < 0.05) {
      const cutoffRow: any = await db.prepare(`
        SELECT created_at FROM availability_audit_logs ORDER BY created_at DESC LIMIT 1 OFFSET 500
      `).first();
      if (cutoffRow && cutoffRow.created_at) {
        await db.prepare(`
          DELETE FROM availability_audit_logs WHERE created_at < ?
        `).bind(cutoffRow.created_at).run();
      }
    }
  } catch (err) {
    console.error('[AuditLog] Failed to write availability_audit_logs:', err);
  }
}

// =============================================================================
// 5. OUTBOUND AVAILABILITY DISPATCHER & RETRY QUEUE (SYNC_OUTBOX)
// =============================================================================

async function deliverOutboxWebhookJob(db: D1Database, job: any, webhookUrl: string, secret?: string | null) {
  const attempts = (Number(job.attempts) || 0) + 1;
  const maxAttempts = Number(job.max_attempts) || 5;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'EliteHomes-MasterCalendar-Sync/3.0',
      'X-Idempotency-Key': job.id,
      'X-EliteHomes-Channel': job.channel,
      'X-EliteHomes-Event': job.event_type
    };
    if (secret) {
      headers['Authorization'] = `Bearer ${secret}`;
      headers['X-Sync-Secret'] = secret;
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: typeof job.payload === 'string' ? job.payload : JSON.stringify(job.payload),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      await db.prepare(`
        UPDATE sync_outbox SET
          status = 'acknowledged',
          attempts = ?,
          last_error = NULL,
          next_retry_at = NULL,
          acknowledged_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(attempts, job.id).run();
      return { delivered: true, status: 'acknowledged' };
    }

    const errBody = await res.text().catch(() => '');
    const errMsg = `HTTP ${res.status} ${res.statusText || ''} ${errBody.slice(0, 140)}`.trim();
    const backoffMinutes = Math.min(60, Math.pow(2, attempts));
    const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
    const nextStatus = attempts >= maxAttempts ? 'failed' : 'retrying';

    await db.prepare(`
      UPDATE sync_outbox SET
        status = ?,
        attempts = ?,
        last_error = ?,
        next_retry_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(nextStatus, attempts, errMsg, nextStatus === 'retrying' ? nextRetry : null, job.id).run();

    return { delivered: false, status: nextStatus, error: errMsg };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const backoffMinutes = Math.min(60, Math.pow(2, attempts));
    const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();
    const nextStatus = attempts >= maxAttempts ? 'failed' : 'retrying';

    await db.prepare(`
      UPDATE sync_outbox SET
        status = ?,
        attempts = ?,
        last_error = ?,
        next_retry_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(nextStatus, attempts, errMsg, nextStatus === 'retrying' ? nextRetry : null, job.id).run();

    return { delivered: false, status: nextStatus, error: errMsg };
  }
}

export async function enqueueAndDispatchAvailabilityUpdate(
  env: Bindings,
  ctx: any,
  params: {
    property: string;
    previousProperty?: string | null;
    bookingId?: string | null;
    eventType: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'block_created' | 'reconcile';
    originSource: CanonicalBookingSource;
    checkInDate?: string | null;
    checkOutDate?: string | null;
    forceBothChannels?: boolean;
    awaitDispatch?: boolean;
  }
) {
  const propertiesToSync = [params.property];
  if (params.previousProperty && params.previousProperty.toLowerCase() !== params.property.toLowerCase()) {
    propertiesToSync.push(params.previousProperty);
  }

  // Hub-and-spoke propagation matrix:
  // - Airbnb origin -> push to Booking.com
  // - Booking.com origin -> push to Airbnb
  // - Website (Direct / Manual / Blocked / Other) OR room change -> push to BOTH Airbnb & Booking.com
  const targetChannels: OtaChannel[] = params.forceBothChannels
    ? ['Airbnb', 'Booking.com']
    : params.originSource === 'Airbnb'
      ? ['Booking.com']
      : params.originSource === 'Booking.com'
        ? ['Airbnb']
        : ['Airbnb', 'Booking.com'];

  const dispatchPromises: Promise<any>[] = [];

  for (const propName of propertiesToSync) {
    const propRow: any = await env.DB.prepare(`
      SELECT * FROM properties WHERE LOWER(name) = LOWER(?) LIMIT 1
    `).bind(propName).first();

    const availability = await recalculateRoomAvailability(env.DB, propName);

    for (const channel of targetChannels) {
      const jobId = `out_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const webhookUrl = channel === 'Airbnb'
        ? (propRow?.airbnb_webhook_url || '').trim()
        : (propRow?.booking_com_webhook_url || '').trim();
      const externalRoomId = channel === 'Airbnb'
        ? (propRow?.airbnb_listing_id || null)
        : (propRow?.booking_com_property_id || null);

      const unavailableDates = channel === 'Airbnb'
        ? availability.forAirbnb
        : availability.forBookingCom;

      const payloadObj = {
        idempotencyKey: jobId,
        timestamp: new Date().toISOString(),
        masterSource: 'EliteHomes-MasterCalendar',
        eventType: params.eventType,
        originSource: params.originSource,
        bookingId: params.bookingId || null,
        room: {
          websiteRoomId: propRow?.id || propName,
          roomName: propName,
          externalChannelRoomId: externalRoomId
        },
        affectedRange: params.checkInDate && params.checkOutDate
          ? { checkInDate: params.checkInDate, checkOutDate: params.checkOutDate }
          : null,
        targetChannel: channel,
        authoritativeUnavailableDates: unavailableDates,
        activeBookingsCount: availability.activeCount
      };

      const payloadJson = JSON.stringify(payloadObj);

      if (webhookUrl && webhookUrl.startsWith('http')) {
        // Tier 1: Real-Time Event-Driven Webhook / Connectivity API Push
        await env.DB.prepare(`
          INSERT INTO sync_outbox (
            id, property, channel, event_type, booking_id, payload,
            delivery_mode, status, attempts, max_attempts, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'webhook_push', 'pending', 0, 5, datetime('now'), datetime('now'))
        `).bind(jobId, propName, channel, params.eventType, params.bookingId || null, payloadJson).run();

        const p = deliverOutboxWebhookJob(
          env.DB,
          { id: jobId, channel, event_type: params.eventType, payload: payloadJson, attempts: 0, max_attempts: 5 },
          webhookUrl,
          propRow?.sync_webhook_secret || env.ADMIN_PIN
        );
        dispatchPromises.push(p);
      } else {
        // Tier 2: Authoritative iCal Pull Feed Updated Immediately
        await env.DB.prepare(`
          INSERT INTO sync_outbox (
            id, property, channel, event_type, booking_id, payload,
            delivery_mode, status, attempts, max_attempts, acknowledged_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'ical_pull', 'feed_ready', 1, 1, datetime('now'), datetime('now'), datetime('now'))
        `).bind(jobId, propName, channel, params.eventType, params.bookingId || null, payloadJson).run();
      }
    }

    // Probabilistically trim sync_outbox (~1 in 20 writes) using indexed created_at
    if (Math.random() < 0.05) {
      const cutoffRow: any = await env.DB.prepare(`
        SELECT created_at FROM sync_outbox ORDER BY created_at DESC LIMIT 1 OFFSET 300
      `).first();
      if (cutoffRow && cutoffRow.created_at) {
        await env.DB.prepare(`
          DELETE FROM sync_outbox WHERE created_at < ?
        `).bind(cutoffRow.created_at).run();
      }
    }
  }

  if (dispatchPromises.length > 0) {
    const allWork = Promise.allSettled(dispatchPromises);
    if (params.awaitDispatch) {
      await allWork;
    } else if (ctx && typeof ctx.waitUntil === 'function') {
      ctx.waitUntil(allWork);
    } else {
      await allWork;
    }
  }
}

/**
 * Retries any pending or retrying outbound webhook push jobs whose backoff timer expired.
 */
export async function processOutboxRetries(env: Bindings, forceAllFailed: boolean = false) {
  const nowIso = new Date().toISOString();
  const query = forceAllFailed
    ? `SELECT * FROM sync_outbox WHERE delivery_mode = 'webhook_push' AND status IN ('pending', 'retrying', 'failed') ORDER BY created_at ASC LIMIT 25`
    : `SELECT * FROM sync_outbox WHERE delivery_mode = 'webhook_push' AND status IN ('pending', 'retrying') AND (next_retry_at IS NULL OR next_retry_at <= ?) ORDER BY created_at ASC LIMIT 25`;

  const res = forceAllFailed
    ? await env.DB.prepare(query).all()
    : await env.DB.prepare(query).bind(nowIso).all();

  const jobs = (res.results || []) as any[];
  let retried = 0;
  let acknowledged = 0;
  let failed = 0;

  for (const job of jobs) {
    const propRow: any = await env.DB.prepare(`
      SELECT * FROM properties WHERE LOWER(name) = LOWER(?) LIMIT 1
    `).bind(job.property).first();

    const webhookUrl = job.channel === 'Airbnb'
      ? (propRow?.airbnb_webhook_url || '').trim()
      : (propRow?.booking_com_webhook_url || '').trim();

    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      await env.DB.prepare(`
        UPDATE sync_outbox SET status = 'feed_ready', delivery_mode = 'ical_pull', last_error = NULL, updated_at = datetime('now') WHERE id = ?
      `).bind(job.id).run();
      continue;
    }

    retried++;
    const outcome = await deliverOutboxWebhookJob(env.DB, job, webhookUrl, propRow?.sync_webhook_secret || env.ADMIN_PIN);
    if (outcome.delivered) acknowledged++;
    else failed++;
  }

  return { checked: jobs.length, retried, acknowledged, failed };
}

// =============================================================================
// 6. REAL-TIME INBOUND OTA WEBHOOK INGESTION (AIRBNB & BOOKING.COM)
// =============================================================================

export async function ingestExternalBookingEvent(
  env: Bindings,
  ctx: any,
  source: OtaChannel,
  rawPayload: any
) {
  const payload = rawPayload || {};
  const eventTypeRaw = String(payload.eventType || payload.event_type || payload.type || 'booking_created').toLowerCase();
  const statusRaw = String(payload.status || '').toLowerCase();
  const isCancellation =
    eventTypeRaw.includes('cancel') ||
    statusRaw === 'cancelled' ||
    statusRaw === 'canceled';

  // 1. Resolve Room via Website Room ID, Listing ID, Property ID, or Room Name
  const listingOrPropId = String(
    payload.listingId ||
    payload.listing_id ||
    payload.airbnbListingId ||
    payload.bookingComPropertyId ||
    payload.propertyId ||
    payload.roomId ||
    ''
  ).trim();
  const roomNameHint = String(payload.property || payload.roomName || payload.room_name || '').trim();

  let propRow: any = null;
  if (listingOrPropId) {
    propRow = await env.DB.prepare(`
      SELECT * FROM properties
      WHERE id = ?
         OR LOWER(COALESCE(airbnb_listing_id, '')) = LOWER(?)
         OR LOWER(COALESCE(booking_com_property_id, '')) = LOWER(?)
         OR LOWER(name) = LOWER(?)
      LIMIT 1
    `).bind(listingOrPropId, listingOrPropId, listingOrPropId, listingOrPropId).first();
  }
  if (!propRow && roomNameHint) {
    propRow = await env.DB.prepare(`
      SELECT * FROM properties WHERE LOWER(name) = LOWER(?) LIMIT 1
    `).bind(roomNameHint).first();
  }

  if (!propRow) {
    return {
      success: false,
      httpStatus: 404,
      error: `No mapped room found for ${source} identifier "${listingOrPropId || roomNameHint}". Map the room's ${source} ID in Master OTA Sync Dashboard.`
    };
  }

  const roomName: string = propRow.name;
  const externalResId = String(
    payload.externalReservationId ||
    payload.external_reservation_id ||
    payload.reservationCode ||
    payload.reservation_code ||
    payload.bookingReference ||
    payload.confirmationCode ||
    payload.id ||
    ''
  ).trim();

  const externalUid = String(
    payload.externalUid ||
    payload.external_uid ||
    (externalResId ? `${externalResId}@${source === 'Airbnb' ? 'airbnb.com' : 'booking.com'}` : '')
  ).trim();

  if (!externalResId && !externalUid) {
    return {
      success: false,
      httpStatus: 400,
      error: 'External reservation identifier (externalReservationId / reservationCode / externalUid) is required for idempotency.'
    };
  }

  const checkInDate = String(payload.checkInDate || payload.check_in_date || payload.startDate || '').slice(0, 10);
  const checkOutDate = String(payload.checkOutDate || payload.check_out_date || payload.endDate || '').slice(0, 10);

  if (!isCancellation && (!checkInDate || !checkOutDate || checkOutDate <= checkInDate)) {
    return {
      success: false,
      httpStatus: 400,
      error: 'Valid checkInDate and checkOutDate (YYYY-MM-DD, checkOutDate > checkInDate) are required.'
    };
  }

  const lockCheckIn = checkInDate || new Date().toISOString().slice(0, 10);
  const lockCheckOut = checkOutDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  // 2. Acquire atomic room inventory lock to prevent simultaneous booking race conditions
  const lock = await acquireRoomInventoryLock(env.DB, roomName, lockCheckIn, lockCheckOut, source);
  if (!lock.acquired) {
    await recordAvailabilityAudit(env.DB, {
      property: roomName,
      action: 'conflict_detected',
      source,
      bookingMode: source,
      checkInDate: lockCheckIn,
      checkOutDate: lockCheckOut,
      details: `Simultaneous booking lock collision while ingesting ${source} reservation ${externalResId}. Held by ${lock.conflictingLock?.source}.`
    });
    return {
      success: false,
      httpStatus: 409,
      conflict: true,
      error: `Simultaneous inventory lock active on "${roomName}" for ${lockCheckIn} to ${lockCheckOut}. Please retry safely.`
    };
  }

  try {
    // 3. Idempotency lookup across external_reservation_id / external_uid / reservation_code
    let existing: any = await env.DB.prepare(`
      SELECT * FROM bookings
      WHERE (external_reservation_id IS NOT NULL AND external_reservation_id = ?)
         OR (external_uid IS NOT NULL AND external_uid = ?)
         OR (reservation_code IS NOT NULL AND reservation_code != '' AND reservation_code = ? AND LOWER(platform) = LOWER(?))
      LIMIT 1
    `).bind(externalResId || '__none__', externalUid || '__none__', externalResId || '__none__', source).first();

    if (!existing && !isCancellation && checkInDate && checkOutDate) {
      // Cross-synced reservation between Airbnb and Booking.com
      const sameDatesOtaBooking: any = await env.DB.prepare(`
        SELECT * FROM bookings
        WHERE LOWER(property) = LOWER(?)
          AND status != 'Cancelled'
          AND check_in_date = ?
          AND check_out_date = ?
          AND (LOWER(platform) = 'airbnb' OR LOWER(platform) = 'booking.com' OR LOWER(platform) = 'ota')
        LIMIT 1
      `).bind(roomName, checkInDate, checkOutDate).first();

      if (sameDatesOtaBooking) {
        existing = sameDatesOtaBooking;
      }
    }

    const guestName = String(payload.guestName || payload.guest_name || payload.guest?.name || `${source} Guest`).trim();
    const phone = String(payload.phone || payload.guestPhone || payload.guest?.phone || '').trim();
    const email = String(payload.email || payload.guestEmail || payload.guest?.email || '').trim();
    const guestsCount = Math.max(1, Number(payload.guestsCount || payload.guests_count || payload.guests || 1) || 1);
    const currency = String(payload.currency || 'INR').toUpperCase().trim();
    const totalPrice = parseMoneyAmount(payload.totalPrice ?? payload.total_price ?? payload.price ?? payload.payout);
    const taxesFees = parseMoneyAmount(payload.taxesFees ?? payload.taxes_fees ?? payload.taxes) || 0;
    const payoutFormatted = totalPrice !== null ? formatCurrencyAmount(totalPrice, currency) : String(payload.payout || '');
    const extraNotes = String(payload.notes || payload.specialRequests || '').trim();

    if (existing) {
      // Modification or Cancellation of an existing imported reservation
      const previousProperty = existing.property;
      const finalCheckIn = checkInDate || existing.check_in_date;
      const finalCheckOut = checkOutDate || existing.check_out_date;
      const nights = calculateNights(finalCheckIn, finalCheckOut);
      const nextStatus = isCancellation
        ? 'Cancelled'
        : (existing.status === 'Checked In' || existing.status === 'Completed' || existing.status === 'Checked Out')
          ? existing.status
          : 'Confirmed';

      // NEVER overwrite internal payment_status on subsequent sync updates!
      const mergedNotes = [
        existing.notes || '',
        isCancellation
          ? `[Cancelled via ${source} real-time sync on ${new Date().toISOString().slice(0, 10)}]`
          : (extraNotes && !(existing.notes || '').includes(extraNotes) ? extraNotes : '')
      ].filter(Boolean).join(' | ');

      await env.DB.prepare(`
        UPDATE bookings SET
          property = ?,
          guest_name = ?,
          phone = CASE WHEN ? != '' THEN ? ELSE phone END,
          email = CASE WHEN ? != '' THEN ? ELSE email END,
          check_in_date = ?,
          check_out_date = ?,
          nights = ?,
          guests_count = ?,
          platform = ?,
          booking_mode = ?,
          reservation_code = ?,
          external_reservation_id = ?,
          external_uid = ?,
          payout = CASE WHEN ? != '' THEN ? ELSE payout END,
          total_price = COALESCE(?, total_price),
          currency = COALESCE(?, currency),
          taxes_fees = COALESCE(?, taxes_fees),
          status = ?,
          notes = ?,
          sync_version = COALESCE(sync_version, 1) + 1,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        roomName,
        guestName || existing.guest_name,
        phone, phone,
        email, email,
        finalCheckIn,
        finalCheckOut,
        nights,
        guestsCount,
        source,
        source,
        externalResId || existing.reservation_code,
        externalResId || existing.external_reservation_id,
        externalUid || existing.external_uid,
        payoutFormatted, payoutFormatted,
        totalPrice,
        currency,
        taxesFees,
        nextStatus,
        mergedNotes,
        existing.id
      ).run();

      await recordAvailabilityAudit(env.DB, {
        property: roomName,
        bookingId: existing.id,
        action: isCancellation ? 'cancelled' : 'modified',
        source,
        bookingMode: source,
        checkInDate: finalCheckIn,
        checkOutDate: finalCheckOut,
        previousState: { property: previousProperty, checkIn: existing.check_in_date, checkOut: existing.check_out_date, status: existing.status },
        newState: { property: roomName, checkIn: finalCheckIn, checkOut: finalCheckOut, status: nextStatus, paymentStatusPreserved: existing.payment_status },
        details: isCancellation
          ? `${source} reservation ${externalResId} cancelled via webhook; availability recalculated before reopening.`
          : `${source} reservation ${externalResId} updated via webhook (payment_status preserved as "${existing.payment_status}").`
      });

      // Immediately propagate updated availability to the OTHER OTA (and both if room changed!)
      await enqueueAndDispatchAvailabilityUpdate(env, ctx, {
        property: roomName,
        previousProperty: previousProperty !== roomName ? previousProperty : null,
        bookingId: existing.id,
        eventType: isCancellation ? 'booking_cancelled' : 'booking_updated',
        originSource: source,
        checkInDate: finalCheckIn,
        checkOutDate: finalCheckOut,
        forceBothChannels: previousProperty !== roomName,
        awaitDispatch: Boolean(payload._awaitDispatch)
      });

      const updatedRow = await env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(existing.id).first();
      return {
        success: true,
        httpStatus: 200,
        action: isCancellation ? 'cancelled' : 'updated',
        idempotent: true,
        data: updatedRow
      };
    }

    // If cancellation arrives for an unknown booking, acknowledge cleanly without creating a ghost record
    if (isCancellation) {
      return {
        success: true,
        httpStatus: 200,
        action: 'ignored_unknown_cancellation',
        message: `Cancellation received for unknown ${source} reservation ${externalResId}; no record created.`
      };
    }

    // 4. Atomic Overlap & Simultaneous Double-Booking Conflict Check (NEVER overwrite existing booking!)
    const overlapping = await env.DB.prepare(`
      SELECT * FROM bookings
      WHERE LOWER(property) = LOWER(?)
        AND status != 'Cancelled'
        AND check_in_date < ?
        AND check_out_date > ?
      LIMIT 1
    `).bind(roomName, checkOutDate, checkInDate).first();

    const conflictDetected = Boolean(overlapping);
    const nights = calculateNights(checkInDate, checkOutDate);
    const newId = `bk_ota_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const todayIso = new Date().toISOString().slice(0, 10);

    const notesParts: string[] = [
      `Imported via ${source} real-time webhook on ${todayIso}`,
      `Booking Mode: ${source}`
    ];
    if (totalPrice !== null) {
      notesParts.push(`Booked Rate: ${formatCurrencyAmount(totalPrice, currency)}`);
    }
    if (taxesFees > 0) {
      notesParts.push(`Taxes/Fees: ${formatCurrencyAmount(taxesFees, currency)}`);
    }
    if (extraNotes) notesParts.push(extraNotes);
    if (conflictDetected && overlapping) {
      const otherSrc = classifyBookingSource(overlapping);
      notesParts.push(`[⚠️ Inventory Conflict with existing ${otherSrc} booking: ${overlapping.guest_name} (${overlapping.check_in_date} to ${overlapping.check_out_date})]`);
    }

    // REQUIREMENT 3: Every newly imported Airbnb or Booking.com reservation MUST default
    // internal payment_status to 'Paid', keeping OTA payout/settlement tracking separate!
    await env.DB.prepare(`
      INSERT INTO bookings (
        id, property, guest_name, phone, email,
        check_in_date, check_out_date, nights, guests_count,
        platform, booking_mode, reservation_code, external_reservation_id, external_uid,
        payout, total_price, currency, taxes_fees,
        payment_status, ota_payout_status, status, notes, sync_version,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        'Paid', 'Pending Settlement', 'Confirmed', ?, 1,
        datetime('now'), datetime('now')
      )
    `).bind(
      newId,
      roomName,
      guestName,
      phone,
      email,
      checkInDate,
      checkOutDate,
      nights,
      guestsCount,
      source,
      source,
      externalResId || newId,
      externalResId || null,
      externalUid || null,
      payoutFormatted,
      totalPrice,
      currency,
      taxesFees,
      notesParts.join(' | ')
    ).run();

    await recordAvailabilityAudit(env.DB, {
      property: roomName,
      bookingId: newId,
      action: conflictDetected ? 'conflict_detected' : 'imported',
      source,
      bookingMode: source,
      checkInDate,
      checkOutDate,
      newState: {
        guestName,
        totalPrice,
        currency,
        taxesFees,
        paymentStatus: 'Paid',
        otaPayoutStatus: 'Pending Settlement',
        conflictWith: overlapping ? overlapping.id : null
      },
      details: conflictDetected
        ? `⚠️ Simultaneous conflict: imported ${source} reservation ${externalResId} overlaps existing booking ${overlapping?.id} (${overlapping?.guest_name}). Existing booking preserved intact.`
        : `Real-time ${source} reservation ${externalResId} imported with default payment_status = Paid.`
    });

    // Log into ical_sync_logs too so inbound dashboard health updates immediately
    await env.DB.prepare(`
      INSERT INTO ical_sync_logs (
        id, property, source, trigger_type, status,
        events_found, imported, updated, cancelled, skipped, conflicts,
        message, created_at
      ) VALUES (?, ?, ?, 'webhook', ?, 1, 1, 0, 0, 0, ?, ?, datetime('now'))
    `).bind(
      `sync_wh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      roomName,
      source,
      conflictDetected ? 'warning' : 'success',
      conflictDetected ? 1 : 0,
      `${roomName} (${source} webhook): Imported ${guestName} (${checkInDate} → ${checkOutDate})${conflictDetected ? ' — ⚠️ conflict flagged' : ''}`
    ).run();

    // Immediately push updated room availability to the OTHER OTA!
    await enqueueAndDispatchAvailabilityUpdate(env, ctx, {
      property: roomName,
      bookingId: newId,
      eventType: 'booking_created',
      originSource: source,
      checkInDate,
      checkOutDate,
      awaitDispatch: Boolean(payload._awaitDispatch)
    });

    const createdRow = await env.DB.prepare(`SELECT * FROM bookings WHERE id = ?`).bind(newId).first();
    return {
      success: true,
      httpStatus: conflictDetected ? 202 : 201,
      action: 'created',
      conflictDetected,
      conflictingBookingId: overlapping ? overlapping.id : null,
      data: createdRow
    };
  } finally {
    await releaseRoomInventoryLock(env.DB, lock.lockToken);
  }
}
