import { Hono } from 'hono';
import { Bindings } from '../types';

const icalRoute = new Hono<{ Bindings: Bindings }>();

export type CanonicalBookingSource = 'Airbnb' | 'Booking.com' | 'Direct Booking' | 'Blocked' | 'Other';

// =============================================================================
// SOURCE CLASSIFICATION & RFC 5545 HELPERS
// =============================================================================

/**
 * Deterministically classifies a booking's true source.
 * Checks external_uid first so OTA-imported rows are never misclassified as Direct.
 */
export function classifyBookingSource(bk: any): CanonicalBookingSource {
  if (!bk) return 'Other';
  const uid = String(bk.external_uid || bk.externalUid || '').toLowerCase().trim();
  const plat = String(bk.platform || '').toLowerCase().trim();
  const status = String(bk.status || '').toLowerCase().trim();

  // 1. Explicit external OTA UID always identifies the true external source
  if (uid.endsWith('@airbnb.com') || uid.includes('airbnb')) return 'Airbnb';
  if (uid.endsWith('@booking.com') || uid.includes('booking.com')) return 'Booking.com';

  // 2. Platform label classification
  if (plat === 'blocked' || status === 'blocked') return 'Blocked';
  if (plat === 'airbnb' || plat.startsWith('airbnb')) return 'Airbnb';
  if (plat === 'booking.com' || plat.startsWith('booking')) return 'Booking.com';
  if (
    plat === 'direct' ||
    plat === 'direct booking' ||
    plat === 'website' ||
    plat === 'offline' ||
    plat === 'walk-in' ||
    plat === 'manual'
  ) {
    return 'Direct Booking';
  }

  return 'Other';
}

function toIcalDate(dateStr: string): string {
  return String(dateStr || '').replace(/[^0-9]/g, '').slice(0, 8);
}

function toIcalTimestamp(date: Date = new Date()): string {
  const safe = isNaN(date.getTime()) ? new Date() : date;
  return safe.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcalText(val: string): string {
  return String(val || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function parseIcsDate(rawVal: string): string | null {
  if (!rawVal) return null;
  const val = rawVal.split(':').pop() || rawVal;
  const match = val.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const diffDays = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

function extractIcsProperty(eventContent: string, propName: string): string | null {
  const regex = new RegExp(`^${propName}(?:;[^:]*)?:(.*)$`, 'im');
  const match = eventContent.match(regex);
  if (!match) return null;
  return match[1]
    .trim()
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parseEventMetadata(summary: string, description: string, source: 'Airbnb' | 'Booking.com') {
  const sumLower = summary.toLowerCase();
  const desc = description || '';

  // Extract Airbnb reservation code (e.g. HM34XZ891K) from Reservation URL in DESCRIPTION
  let reservationCode = '';
  const airbnbCodeMatch = desc.match(/reservations\/details\/([A-Z0-9]{6,14})/i) || desc.match(/Reservation\s*(?:Code|ID)?[:#\s]+([A-Z0-9]{6,14})/i);
  if (airbnbCodeMatch) {
    reservationCode = airbnbCodeMatch[1].toUpperCase();
  }

  // Extract phone last-4 hint if present in Airbnb description
  let phoneHint = '';
  const phoneMatch = desc.match(/Phone Number[^:]*:\s*([^\n]+)/i);
  if (phoneMatch) {
    phoneHint = phoneMatch[1].trim();
  }

  // Identify whether this VEVENT is a generic unavailability block vs an identifiable reservation
  const isAirbnbNotAvailable = source === 'Airbnb' && /not available/i.test(sumLower) && !reservationCode;
  const isGenericBlockSummary =
    /not available|unavailable|blocked|closed/i.test(sumLower) && !reservationCode;

  // Determine clean guest display name
  let guestName = summary.trim();
  if (
    !guestName ||
    /^reserved$/i.test(guestName) ||
    /airbnb|booking\.com|not available|closed|blocked|unavailable/i.test(guestName)
  ) {
    if (guestName.includes('-') && !/closed\s*-\s*not available/i.test(guestName)) {
      const parts = guestName.split('-');
      const candidate = parts[parts.length - 1].trim();
      if (candidate && !/not available|reserved|closed|blocked|unavailable/i.test(candidate)) {
        guestName = candidate;
      } else {
        guestName = `${source} Guest`;
      }
    } else {
      guestName = `${source} Guest`;
    }
  }

  return {
    guestName,
    reservationCode,
    phoneHint,
    isAirbnbNotAvailable,
    isGenericBlockSummary
  };
}

// =============================================================================
// PERSISTENT SYNC LOGGING HELPER
// =============================================================================

async function recordSyncLog(
  env: Bindings,
  entry: {
    property: string;
    source: string;
    triggerType: 'cron' | 'manual';
    status: 'success' | 'warning' | 'error';
    eventsFound?: number;
    imported?: number;
    updated?: number;
    cancelled?: number;
    skipped?: number;
    conflicts?: number;
    message: string;
    errorDetail?: string | null;
  }
) {
  try {
    const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await env.DB.prepare(`
      INSERT INTO ical_sync_logs (
        id, property, source, trigger_type, status,
        events_found, imported, updated, cancelled, skipped, conflicts,
        message, error_detail, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      entry.property,
      entry.source,
      entry.triggerType,
      entry.status,
      entry.eventsFound || 0,
      entry.imported || 0,
      entry.updated || 0,
      entry.cancelled || 0,
      entry.skipped || 0,
      entry.conflicts || 0,
      entry.message,
      entry.errorDetail || null
    ).run();

    // Keep latest 250 sync log rows to prevent unbounded growth
    await env.DB.prepare(`
      DELETE FROM ical_sync_logs
      WHERE id NOT IN (
        SELECT id FROM ical_sync_logs ORDER BY created_at DESC LIMIT 250
      )
    `).run();
  } catch (logErr) {
    console.error('[iCal Sync] Failed to write ical_sync_logs:', logErr);
  }
}

// =============================================================================
// 1. OUTBOUND iCAL EXPORT — STRICT DIRECT-BOOKING-ONLY FOR EXTERNAL CHANNELS
// =============================================================================

/**
 * GET /api/ical/export/:property
 *
 * Synchronisation rules enforced:
 * - For Airbnb (?target=airbnb), Booking.com (?target=bookingcom), or default room feeds:
 *   STRICTLY export ONLY bookings whose source is "Direct Booking".
 *   - NEVER export Airbnb bookings to Booking.com or Airbnb.
 *   - NEVER export Booking.com bookings to Airbnb or Booking.com.
 * - Only if ?scope=all is explicitly passed (e.g. host's personal read-only Google Calendar)
 *   will all active stays be included.
 */
icalRoute.get('/export/:property', async (c) => {
  try {
    const rawProp = c.req.param('property');
    const cleanProp = decodeURIComponent(rawProp.replace(/\.ics$/i, '')).trim();
    const target = (c.req.query('target') || c.req.query('channel') || '').toLowerCase().trim();
    const scope = (c.req.query('scope') || '').toLowerCase().trim();
    const includeAllForPersonalReadOnly = (scope === 'all' && !target && cleanProp.toLowerCase() === 'all');

    let query = `SELECT * FROM bookings WHERE status != 'Cancelled'`;
    const params: any[] = [];

    if (cleanProp.toLowerCase() !== 'all') {
      query += ` AND LOWER(property) = LOWER(?)`;
      params.push(cleanProp);
    }
    query += ` ORDER BY check_in_date ASC`;

    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    const bookings = results || [];
    const nowStamp = toIcalTimestamp();
    const calName = cleanProp.toLowerCase() === 'all'
      ? (includeAllForPersonalReadOnly ? 'Elite Homes - All Bookings (Read-Only)' : 'Elite Homes - Direct Bookings')
      : `${cleanProp} - Elite Homes Direct Bookings`;

    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Elite Homes//Channel Sync v2//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeIcalText(calName)}`,
      'X-WR-TIMEZONE:UTC',
      'X-PUBLISHED-TTL:PT10M',
      'REFRESH-INTERVAL;VALUE=DURATION:PT10M'
    ];

    for (const bk of bookings as any[]) {
      const source = classifyBookingSource(bk);

      // STRICT LOOP-PREVENTION RULE:
      // External channel exports (Airbnb, Booking.com, and per-room feeds) MUST ONLY export Direct Bookings.
      if (!includeAllForPersonalReadOnly && source !== 'Direct Booking') {
        continue;
      }

      const checkInIcal = toIcalDate(bk.check_in_date);
      if (!checkInIcal || checkInIcal.length !== 8) continue;

      let checkOutIcal = toIcalDate(bk.check_out_date);
      if (!checkOutIcal || checkOutIcal <= checkInIcal) {
        const nextDay = new Date(bk.check_in_date);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutIcal = toIcalDate(nextDay.toISOString().split('T')[0]);
      }

      // Deterministic, stable UID per booking so Airbnb & Booking.com update in-place without duplicating
      const uid = `direct-${bk.id}@elitehomes-portal.workers.dev`;
      const updatedDate = bk.updated_at ? new Date(String(bk.updated_at).replace(' ', 'T') + (String(bk.updated_at).includes('Z') ? '' : 'Z')) : new Date();
      const lastModStamp = toIcalTimestamp(updatedDate);
      // Monotonic SEQUENCE from updated_at guarantees OTAs apply date changes reliably
      const seqNum = isNaN(updatedDate.getTime()) ? 1 : Math.max(1, Math.floor(updatedDate.getTime() / 1000) % 10000000);

      const summary = includeAllForPersonalReadOnly
        ? `${bk.property} - ${bk.guest_name || 'Reserved'} (${source})`
        : `Direct Booking - ${bk.property}`;

      const description = [
        `Source: ${source}`,
        `Property: ${bk.property}`,
        `Reference: ${bk.reservation_code || bk.id}`,
        `Nights: ${bk.nights || calculateNights(bk.check_in_date, bk.check_out_date)}`
      ].join('\n');

      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${uid}`);
      icsLines.push(`DTSTAMP:${nowStamp}`);
      icsLines.push(`LAST-MODIFIED:${lastModStamp}`);
      icsLines.push(`SEQUENCE:${seqNum}`);
      icsLines.push(`DTSTART;VALUE=DATE:${checkInIcal}`);
      icsLines.push(`DTEND;VALUE=DATE:${checkOutIcal}`);
      icsLines.push(`SUMMARY:${escapeIcalText(summary)}`);
      icsLines.push(`DESCRIPTION:${escapeIcalText(description)}`);
      icsLines.push(`X-ELITEHOMES-SOURCE:${escapeIcalText(source)}`);
      icsLines.push('STATUS:CONFIRMED');
      icsLines.push('TRANSP:OPAQUE');
      icsLines.push('END:VEVENT');
    }

    icsLines.push('END:VCALENDAR');
    const finalIcs = icsLines.join('\r\n') + '\r\n';

    return new Response(finalIcs, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${encodeURIComponent(cleanProp)}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    console.error('[iCal Export] Error generating outbound feed:', err);
    return c.text('Error generating calendar feed: ' + err.message, 500);
  }
});

// =============================================================================
// 2. ROOM-WISE FEED CONFIGURATION & HEALTH METADATA
// =============================================================================

icalRoute.get('/feeds', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, color, airbnb_ical_url, booking_com_ical_url, other_ical_url, last_synced_at
      FROM properties
      ORDER BY name ASC
    `).all();

    // Fetch latest sync log per (property, source) for health indicators
    let latestByPropSource: Record<string, any> = {};
    try {
      const logRes = await c.env.DB.prepare(`
        SELECT property, source, status, imported, updated, cancelled, conflicts, message, error_detail, created_at
        FROM ical_sync_logs
        ORDER BY created_at DESC
        LIMIT 100
      `).all();
      for (const row of (logRes.results || []) as any[]) {
        const key = `${String(row.property).toLowerCase()}::${String(row.source).toLowerCase()}`;
        if (!latestByPropSource[key]) {
          latestByPropSource[key] = row;
        }
      }
    } catch (e) {}

    const origin = new URL(c.req.url).origin;
    const feeds = (results || []).map((p: any) => {
      const pLower = String(p.name || '').toLowerCase();
      return {
        ...p,
        exportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.name)}.ics`,
        airbnbExportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.name)}.ics?target=airbnb`,
        bookingComExportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.name)}.ics?target=bookingcom`,
        airbnbSyncStatus: latestByPropSource[`${pLower}::airbnb`] || null,
        bookingComSyncStatus: latestByPropSource[`${pLower}::booking.com`] || null
      };
    });

    return c.json({ success: true, data: feeds });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Update inbound feed URLs independently per room (preserving fields not explicitly provided)
icalRoute.put('/feeds/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name')).trim();
    const body = await c.req.json();

    const existing: any = await c.env.DB.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?)`).bind(name).first();
    if (!existing) {
      return c.json({ success: false, error: `Property "${name}" not found.` }, 404);
    }

    const airbnbUrl = body.airbnbIcalUrl !== undefined ? String(body.airbnbIcalUrl || '').trim() : (existing.airbnb_ical_url || '');
    const bookingComUrl = body.bookingComIcalUrl !== undefined ? String(body.bookingComIcalUrl || '').trim() : (existing.booking_com_ical_url || '');
    const otherUrl = body.otherIcalUrl !== undefined ? String(body.otherIcalUrl || '').trim() : (existing.other_ical_url || '');

    // Basic URL sanity check if non-empty
    if (airbnbUrl && !airbnbUrl.startsWith('http')) {
      return c.json({ success: false, error: 'Airbnb iCal URL must start with https:// or http://' }, 400);
    }
    if (bookingComUrl && !bookingComUrl.startsWith('http')) {
      return c.json({ success: false, error: 'Booking.com iCal URL must start with https:// or http://' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE properties SET
        airbnb_ical_url = ?,
        booking_com_ical_url = ?,
        other_ical_url = ?
      WHERE id = ?
    `).bind(airbnbUrl || null, bookingComUrl || null, otherUrl || null, existing.id).run();

    return c.json({
      success: true,
      message: `iCal feeds updated for "${existing.name}".`,
      data: { name: existing.name, airbnbUrl, bookingComUrl, otherUrl }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/ical/logs - Retrieve recent persistent sync logs & errors
icalRoute.get('/logs', async (c) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '30', 10) || 30));
    const property = (c.req.query('property') || '').trim();
    const source = (c.req.query('source') || '').trim();

    let query = `SELECT * FROM ical_sync_logs WHERE 1=1`;
    const params: any[] = [];
    if (property) {
      query += ` AND LOWER(property) = LOWER(?)`;
      params.push(property);
    }
    if (source) {
      query += ` AND LOWER(source) = LOWER(?)`;
      params.push(source);
    }
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    return c.json({ success: true, data: results || [] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// =============================================================================
// 3. INDEPENDENT, LOOP-PROOF INBOUND SYNC ENGINE (HTTP + CRON)
// =============================================================================

export async function executeIcalSync(
  env: Bindings,
  targetProperty?: string | null,
  executionCtx?: any,
  triggerType: 'cron' | 'manual' = 'manual',
  targetSource?: 'Airbnb' | 'Booking.com' | null
) {
  let propQuery = `
    SELECT * FROM properties
    WHERE (airbnb_ical_url IS NOT NULL AND trim(airbnb_ical_url) != '')
       OR (booking_com_ical_url IS NOT NULL AND trim(booking_com_ical_url) != '')
  `;
  const propParams: any[] = [];

  if (targetProperty) {
    propQuery += ` AND LOWER(name) = LOWER(?)`;
    propParams.push(targetProperty);
  }

  const { results } = propParams.length > 0
    ? await env.DB.prepare(propQuery).bind(...propParams).all()
    : await env.DB.prepare(propQuery).all();

  const properties = results || [];
  if (properties.length === 0) {
    return {
      success: true,
      message: 'No external Airbnb or Booking.com iCal URLs configured. Add room iCal URLs in iCal Channel Manager.',
      stats: {
        totalImported: 0,
        totalUpdated: 0,
        totalCancelled: 0,
        totalSkipped: 0,
        totalConflicts: 0,
        propertiesCount: 0,
        logs: [],
        errors: []
      }
    };
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  let totalImported = 0;
  let totalUpdated = 0;
  let totalCancelled = 0;
  let totalSkipped = 0;
  let totalConflicts = 0;
  const syncLogs: string[] = [];
  const errors: string[] = [];

  for (const prop of properties as any[]) {
    // Independent channel feeds per room — Airbnb and Booking.com never cross-sync through us
    const feeds: Array<{ url: string; source: 'Airbnb' | 'Booking.com' }> = [];
    if (prop.airbnb_ical_url && String(prop.airbnb_ical_url).trim().startsWith('http')) {
      if (!targetSource || targetSource === 'Airbnb') {
        feeds.push({ url: String(prop.airbnb_ical_url).trim(), source: 'Airbnb' });
      }
    }
    if (prop.booking_com_ical_url && String(prop.booking_com_ical_url).trim().startsWith('http')) {
      if (!targetSource || targetSource === 'Booking.com') {
        feeds.push({ url: String(prop.booking_com_ical_url).trim(), source: 'Booking.com' });
      }
    }

    let anyFeedSucceededForRoom = false;

    for (const feed of feeds) {
      let feedImported = 0;
      let feedUpdated = 0;
      let feedCancelled = 0;
      let feedSkipped = 0;
      let feedConflicts = 0;
      let eventsFound = 0;

      try {
        // 1. Fetch external feed with timeout & no-cache headers
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EliteHomesCalendarSync/2.0)',
            'Accept': 'text/calendar, text/plain, */*',
            'Cache-Control': 'no-cache'
          },
          signal: AbortSignal.timeout(15000)
        });

        if (!res.ok) {
          const errMsg = `HTTP ${res.status} fetching ${feed.source} feed for ${prop.name}`;
          errors.push(errMsg);
          await recordSyncLog(env, {
            property: prop.name,
            source: feed.source,
            triggerType,
            status: 'error',
            message: errMsg,
            errorDetail: `HTTP status ${res.status} ${res.statusText || ''}`.trim()
          });
          continue;
        }

        const icsText = await res.text();
        // Validate genuine RFC 5545 calendar payload before touching ANY database records
        if (!/BEGIN:VCALENDAR/i.test(icsText) || !/END:VCALENDAR/i.test(icsText)) {
          const errMsg = `Invalid iCal payload from ${feed.source} for ${prop.name} (missing VCALENDAR wrapper)`;
          errors.push(errMsg);
          await recordSyncLog(env, {
            property: prop.name,
            source: feed.source,
            triggerType,
            status: 'error',
            message: errMsg,
            errorDetail: icsText.slice(0, 200)
          });
          continue;
        }

        anyFeedSucceededForRoom = true;

        // Unfold RFC 5545 folded lines (CRLF/LF followed by space or tab)
        const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
        const eventBlocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);
        eventsFound = eventBlocks.length;

        // Track every active UID seen in THIS valid feed for accurate cancellation reconciliation
        const seenUids = new Set<string>();

        // Load all active non-cancelled bookings for THIS room once for fast, isolated conflict/echo checks
        const roomBookingsRes = await env.DB.prepare(`
          SELECT * FROM bookings WHERE LOWER(property) = LOWER(?)
        `).bind(prop.name).all();
        const roomBookings: any[] = (roomBookingsRes.results || []) as any[];

        for (const block of eventBlocks) {
          const eventContent = block.split(/END:VEVENT/i)[0] || '';

          const uid = extractIcsProperty(eventContent, 'UID');
          const summary = extractIcsProperty(eventContent, 'SUMMARY') || `${feed.source} Reservation`;
          const description = extractIcsProperty(eventContent, 'DESCRIPTION') || '';
          const dtStartRaw = extractIcsProperty(eventContent, 'DTSTART');
          const dtEndRaw = extractIcsProperty(eventContent, 'DTEND');
          const eventStatus = (extractIcsProperty(eventContent, 'STATUS') || 'CONFIRMED').toUpperCase();
          const ownSourceTag = extractIcsProperty(eventContent, 'X-ELITEHOMES-SOURCE');

          const checkIn = dtStartRaw ? parseIcsDate(dtStartRaw) : null;
          let checkOut = dtEndRaw ? parseIcsDate(dtEndRaw) : null;

          if (!uid || !checkIn) {
            feedSkipped++;
            continue;
          }

          // GUARD 1: Echo Loop Prevention — never re-import our own exported Direct Booking events
          const uidLower = uid.toLowerCase();
          if (
            uidLower.includes('@elitehomes-portal.workers.dev') ||
            uidLower.startsWith('direct-bk_') ||
            (ownSourceTag && ownSourceTag.toLowerCase().includes('direct'))
          ) {
            feedSkipped++;
            continue;
          }

          if (!checkOut || checkOut <= checkIn) {
            const d = new Date(checkIn);
            d.setDate(d.getDate() + 1);
            checkOut = d.toISOString().split('T')[0];
          }

          const nights = calculateNights(checkIn, checkOut);
          const meta = parseEventMetadata(summary, description, feed.source);

          // Skip long rolling OTA availability windows (> 45 nights of generic unavailable closure)
          if (nights > 45 && meta.isGenericBlockSummary) {
            feedSkipped++;
            continue;
          }

          // Record UID as present in this feed
          seenUids.add(uid);

          // Check if an existing booking in THIS room already matches this exact external_uid
          const existingByUid = roomBookings.find(
            b => b.external_uid && String(b.external_uid).trim() === uid
          );

          if (existingByUid) {
            // If host manually cancelled/deleted this booking (not auto-removed by sync), respect host decision
            const existingNotes = String(existingByUid.notes || '');
            const wasAutoCancelled = existingNotes.includes('[Cancelled on ');
            if (existingByUid.status === 'Cancelled' && !wasAutoCancelled && eventStatus !== 'CONFIRMED') {
              feedSkipped++;
              continue;
            }
            if (existingByUid.status === 'Cancelled' && !wasAutoCancelled) {
              // Host manually cancelled it on website — do not resurrect
              feedSkipped++;
              continue;
            }

            const nextStatus =
              eventStatus === 'CANCELLED'
                ? 'Cancelled'
                : (existingByUid.status === 'Checked In' || existingByUid.status === 'Completed' || existingByUid.status === 'Checked Out')
                  ? existingByUid.status
                  : 'Confirmed';

            // Preserve host's customized guest name if they replaced generic placeholder
            const currentName = String(existingByUid.guest_name || '').trim();
            const isCurrentGeneric = !currentName || /^(airbnb|booking\.com)\s+guest$/i.test(currentName) || /not available|closed|blocked|reserved/i.test(currentName);
            const nameToSave = isCurrentGeneric ? meta.guestName : currentName;

            const codeToSave = existingByUid.reservation_code && !existingByUid.reservation_code.includes('@')
              ? existingByUid.reservation_code
              : (meta.reservationCode || existingByUid.reservation_code || uid.slice(0, 30));

            const datesChanged = existingByUid.check_in_date !== checkIn || existingByUid.check_out_date !== checkOut;
            const statusChanged = existingByUid.status !== nextStatus;
            const nameChanged = currentName !== nameToSave;

            if (datesChanged || statusChanged || nameChanged) {
              await env.DB.prepare(`
                UPDATE bookings SET
                  guest_name = ?,
                  check_in_date = ?,
                  check_out_date = ?,
                  nights = ?,
                  platform = ?,
                  reservation_code = ?,
                  status = ?,
                  updated_at = datetime('now')
                WHERE id = ?
              `).bind(
                nameToSave,
                checkIn,
                checkOut,
                nights,
                feed.source,
                codeToSave,
                nextStatus,
                existingByUid.id
              ).run();

              existingByUid.guest_name = nameToSave;
              existingByUid.check_in_date = checkIn;
              existingByUid.check_out_date = checkOut;
              existingByUid.nights = nights;
              existingByUid.status = nextStatus;

              if (nextStatus === 'Cancelled') feedCancelled++;
              else feedUpdated++;
            } else {
              feedSkipped++;
            }
            continue;
          }

          // If external event is already marked CANCELLED and not in our DB, skip inserting
          if (eventStatus === 'CANCELLED') {
            feedSkipped++;
            continue;
          }

          // Find active (non-cancelled) bookings in THIS room overlapping [checkIn, checkOut)
          const activeOverlaps = roomBookings.filter(
            b => b.status !== 'Cancelled' && b.check_in_date < checkOut! && b.check_out_date > checkIn
          );

          // GUARD 2: Direct Booking Echo Prevention
          // If an active Direct Booking covers these dates AND incoming event is a generic OTA block
          // (no reservation code, generic summary), it's the OTA echoing back our exported Direct Booking!
          const overlappingDirect = activeOverlaps.find(b => classifyBookingSource(b) === 'Direct Booking');
          if (overlappingDirect && meta.isGenericBlockSummary) {
            feedSkipped++;
            continue;
          }

          // GUARD 3: Same-Source Manual Booking Deduplication (zero duplicates!)
          // If host manually entered this exact Airbnb or Booking.com stay with same dates before sync ran,
          // attach external_uid to it without overwriting guest name, payout, or status!
          const sameSourceManualMatch = activeOverlaps.find(
            b =>
              classifyBookingSource(b) === feed.source &&
              !b.external_uid &&
              b.check_in_date === checkIn &&
              b.check_out_date === checkOut
          );
          if (sameSourceManualMatch) {
            const codeToSave = sameSourceManualMatch.reservation_code || meta.reservationCode || uid.slice(0, 30);
            await env.DB.prepare(`
              UPDATE bookings SET
                external_uid = ?,
                reservation_code = ?,
                updated_at = datetime('now')
              WHERE id = ?
            `).bind(uid, codeToSave, sameSourceManualMatch.id).run();
            sameSourceManualMatch.external_uid = uid;
            feedUpdated++;
            continue;
          }

          // GUARD 4: Cross-Channel Shadow Block Isolation
          // Airbnb sends "Airbnb (Not available)" when it blocks dates from another imported calendar.
          // Never import generic "Not available" blocks that mirror an existing booking from the other OTA!
          const otherSourceOverlap = activeOverlaps.find(b => classifyBookingSource(b) !== feed.source);
          if (otherSourceOverlap && meta.isAirbnbNotAvailable) {
            feedSkipped++;
            continue;
          }
          if (otherSourceOverlap && meta.isGenericBlockSummary &&
              otherSourceOverlap.check_in_date === checkIn && otherSourceOverlap.check_out_date === checkOut) {
            feedSkipped++;
            continue;
          }

          // GUARD 5: Genuine Conflict Detection — NEVER overwrite an existing booking from another source!
          let importNote = `Imported via ${feed.source} iCal sync on ${todayIso}`;
          if (meta.phoneHint) {
            importNote += ` | Phone hint: ${meta.phoneHint}`;
          }
          if (otherSourceOverlap) {
            const otherSrc = classifyBookingSource(otherSourceOverlap);
            importNote += ` | [⚠️ Date Conflict with existing ${otherSrc} booking: ${otherSourceOverlap.guest_name}]`;
            feedConflicts++;
          }

          // Clean, isolated insert under its true source ('Airbnb' or 'Booking.com')
          const newId = `bk_ical_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const newResCode = meta.reservationCode || uid.slice(0, 30);
          await env.DB.prepare(`
            INSERT INTO bookings (
              id, property, guest_name, phone, email,
              check_in_date, check_out_date, nights, guests_count,
              platform, reservation_code, external_uid, payout, payment_status,
              status, notes, created_at, updated_at
            ) VALUES (?, ?, ?, '', '', ?, ?, ?, 1, ?, ?, ?, '', 'Paid via Channel', 'Confirmed', ?, datetime('now'), datetime('now'))
          `).bind(
            newId,
            prop.name,
            meta.guestName,
            checkIn,
            checkOut,
            nights,
            feed.source,
            newResCode,
            uid,
            importNote
          ).run();

          // Update in-memory roomBookings cache for subsequent events in this same feed
          roomBookings.push({
            id: newId,
            property: prop.name,
            guest_name: meta.guestName,
            check_in_date: checkIn,
            check_out_date: checkOut,
            nights,
            platform: feed.source,
            reservation_code: newResCode,
            external_uid: uid,
            status: 'Confirmed',
            notes: importNote
          });

          feedImported++;
        }

        // =====================================================================
        // CANCELLATION RECONCILIATION (Missing-Event Detection)
        // If a future/current iCal-imported reservation from THIS exact (room, source)
        // disappeared from a valid HTTP 200 VCALENDAR feed, mark it Cancelled.
        // Never touches past stays, never touches Direct Bookings, never deletes rows!
        // =====================================================================
        const activeSyncedForThisFeed = roomBookings.filter(b =>
          b.id &&
          String(b.id).startsWith('bk_ical_') &&
          b.external_uid &&
          classifyBookingSource(b) === feed.source &&
          b.status === 'Confirmed' &&
          b.check_out_date >= todayIso
        );

        for (const staleBk of activeSyncedForThisFeed) {
          if (!seenUids.has(String(staleBk.external_uid).trim())) {
            const cancelNote = `${staleBk.notes ? staleBk.notes + ' | ' : ''}[Cancelled on ${feed.source} — removed from feed on ${todayIso}]`;
            await env.DB.prepare(`
              UPDATE bookings SET
                status = 'Cancelled',
                notes = ?,
                updated_at = datetime('now')
              WHERE id = ?
            `).bind(cancelNote, staleBk.id).run();
            feedCancelled++;
          }
        }

        totalImported += feedImported;
        totalUpdated += feedUpdated;
        totalCancelled += feedCancelled;
        totalSkipped += feedSkipped;
        totalConflicts += feedConflicts;

        const msg = `${prop.name} (${feed.source}): +${feedImported} new, ~${feedUpdated} updated, -${feedCancelled} cancelled, ${feedSkipped} unchanged${feedConflicts > 0 ? `, ⚠️ ${feedConflicts} conflict(s)` : ''}`;
        syncLogs.push(msg);

        await recordSyncLog(env, {
          property: prop.name,
          source: feed.source,
          triggerType,
          status: feedConflicts > 0 ? 'warning' : 'success',
          eventsFound,
          imported: feedImported,
          updated: feedUpdated,
          cancelled: feedCancelled,
          skipped: feedSkipped,
          conflicts: feedConflicts,
          message: msg
        });
      } catch (feedErr: any) {
        const errMsg = `Error syncing ${feed.source} for ${prop.name}: ${feedErr.message || String(feedErr)}`;
        errors.push(errMsg);
        await recordSyncLog(env, {
          property: prop.name,
          source: feed.source,
          triggerType,
          status: 'error',
          message: errMsg,
          errorDetail: feedErr?.stack ? String(feedErr.stack).slice(0, 300) : String(feedErr)
        });
      }
    }

    if (anyFeedSucceededForRoom) {
      await env.DB.prepare(`
        UPDATE properties SET last_synced_at = datetime('now') WHERE id = ?
      `).bind(prop.id).run();
    }
  }

  // Notify downstream Staff Management service when reservations change
  if (totalImported > 0 || totalUpdated > 0 || totalCancelled > 0) {
    try {
      const p = fetch('https://staff-management.elitehomes-portal.workers.dev/api/sync/airbnb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-PIN': env.ADMIN_PIN || '4635'
        }
      }).catch(e => console.error('StaffSync notification error:', e));

      if (executionCtx && typeof executionCtx.waitUntil === 'function') {
        executionCtx.waitUntil(p);
      }
    } catch (e) {
      console.error('Failed to notify StaffSync on iCal update:', e);
    }
  }

  return {
    success: errors.length === 0 || (totalImported + totalUpdated + totalCancelled + totalSkipped) > 0,
    message: `iCal sync complete: +${totalImported} imported, ~${totalUpdated} updated, -${totalCancelled} cancelled, ${totalSkipped} unchanged${totalConflicts > 0 ? `, ⚠️ ${totalConflicts} conflict(s)` : ''}${errors.length > 0 ? ` (${errors.length} error(s))` : ''}.`,
    stats: {
      totalImported,
      totalUpdated,
      totalCancelled,
      totalSkipped,
      totalConflicts,
      propertiesCount: properties.length,
      logs: syncLogs,
      errors
    }
  };
}

// 4. POST /api/ical/sync - Manual sync (all rooms, single room, or single channel)
icalRoute.post('/sync', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const targetProperty = body.property ? String(body.property).trim() : null;
    const rawSource = body.source ? String(body.source).trim() : null;
    const targetSource = (rawSource === 'Airbnb' || rawSource === 'Booking.com') ? rawSource : null;
    const result = await executeIcalSync(c.env, targetProperty, c.executionCtx, 'manual', targetSource);
    return c.json(result);
  } catch (err: any) {
    console.error('[iCal Sync] Fatal sync error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Alias for direct .ics download (e.g. /api/ical/1 BHK.ics)
icalRoute.get('/:filename{.+\\.ics$}', async (c) => {
  const filename = c.req.param('filename');
  const propName = filename.slice(0, -4);
  const qs = new URL(c.req.url).search;
  return c.redirect(`/api/ical/export/${encodeURIComponent(propName)}.ics${qs}`, 302);
});

export default icalRoute;
