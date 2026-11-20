import { Hono } from 'hono';
import { Bindings } from '../types';
import {
  CanonicalBookingSource,
  OtaChannel,
  classifyBookingSource,
  calculateNights,
  parseMoneyAmount,
  formatCurrencyAmount,
  isDateRangeCoveredByBookings,
  acquireRoomInventoryLock,
  releaseRoomInventoryLock,
  recalculateRoomAvailability,
  recordAvailabilityAudit,
  enqueueAndDispatchAvailabilityUpdate,
  processOutboxRetries,
  ingestExternalBookingEvent
} from './syncEngine';

export { classifyBookingSource };
export type { CanonicalBookingSource };

const icalRoute = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// RFC 5545 iCAL PARSING & FORMATTING HELPERS
// =============================================================================

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

function foldIcalLine(line: string): string {
  // RFC 5545 Section 3.1: lines should be folded at <= 75 characters
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 74));
  remaining = remaining.slice(74);
  while (remaining.length > 0) {
    parts.push(' ' + remaining.slice(0, 73));
    remaining = remaining.slice(73);
  }
  return parts.join('\r\n');
}

function parseIcsDate(rawVal: string): string | null {
  if (!rawVal) return null;
  const val = rawVal.split(':').pop() || rawVal;
  const match = val.trim().match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
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

function parseEventMetadata(summary: string, description: string, source: OtaChannel) {
  const sumLower = summary.toLowerCase();
  const desc = description || '';

  // Reservation code (e.g. Airbnb HM34XZ891K or Booking.com confirmation number)
  let reservationCode = '';
  const codeMatch =
    desc.match(/reservations\/details\/([A-Z0-9]{6,16})/i) ||
    desc.match(/Reservation\s*(?:Code|ID|Number)?[:#\s]+([A-Z0-9-]{5,20})/i) ||
    desc.match(/Confirmation\s*(?:Code|Number)?[:#\s]+([A-Z0-9-]{5,20})/i);
  if (codeMatch) {
    reservationCode = codeMatch[1].toUpperCase();
  }

  // Phone hint if present in description
  let phoneHint = '';
  const phoneMatch = desc.match(/Phone(?:\s*Number)?[^:]*:\s*([^\n]+)/i);
  if (phoneMatch) {
    phoneHint = phoneMatch[1].trim();
  }

  // Email hint if present
  let emailHint = '';
  const emailMatch = desc.match(/Email[^:]*:\s*([^\s\n]+@[^\s\n]+)/i);
  if (emailMatch) {
    emailHint = emailMatch[1].trim();
  }

  // Guests count hint if present
  let guestsCount = 1;
  const guestsMatch = desc.match(/Guests?[^:]*:\s*(\d+)/i);
  if (guestsMatch) {
    guestsCount = Math.max(1, parseInt(guestsMatch[1], 10) || 1);
  }

  // Price & currency hint if present in description
  let totalPrice: number | null = null;
  let currency = 'INR';
  const priceMatch = desc.match(/(?:Total\s*Price|Price|Payout|Amount)[^:]*:\s*(INR|USD|EUR|GBP|₹|\$|€|£)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (priceMatch) {
    const curToken = (priceMatch[1] || '').toUpperCase();
    if (curToken === '$' || curToken === 'USD') currency = 'USD';
    else if (curToken === '€' || curToken === 'EUR') currency = 'EUR';
    else if (curToken === '£' || curToken === 'GBP') currency = 'GBP';
    else currency = 'INR';
    totalPrice = parseMoneyAmount(priceMatch[2]);
  }

  const isAirbnbNotAvailable = source === 'Airbnb' && /not available/i.test(sumLower) && !reservationCode;
  const isGenericBlockSummary =
    /not available|unavailable|blocked|closed/i.test(sumLower) && !reservationCode;

  // Clean guest display name
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
    emailHint,
    guestsCount,
    totalPrice,
    currency,
    isAirbnbNotAvailable,
    isGenericBlockSummary
  };
}

async function recordSyncLog(
  env: Bindings,
  entry: {
    property: string;
    source: string;
    triggerType: 'cron' | 'manual' | 'webhook';
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

    // Probabilistically prune sync logs (~1 in 30 writes) using indexed created_at
    // Prevents quadratic table-scan reads on every single iCal sync write
    if (Math.random() < 0.03) {
      const cutoffRow: any = await env.DB.prepare(`
        SELECT created_at FROM ical_sync_logs ORDER BY created_at DESC LIMIT 1 OFFSET 300
      `).first();
      if (cutoffRow && cutoffRow.created_at) {
        await env.DB.prepare(`
          DELETE FROM ical_sync_logs WHERE created_at < ?
        `).bind(cutoffRow.created_at).run();
      }
    }
  } catch (logErr) {
    console.error('[iCal Sync] Failed to write ical_sync_logs:', logErr);
  }
}

// =============================================================================
// 1. MASTER CALENDAR OUTBOUND iCAL EXPORT (HUB-AND-SPOKE, ZERO ECHO LOOPS)
// =============================================================================

/**
 * GET /api/ical/export/:property
 *
 * Hub-and-Spoke Master Calendar Rules (Website = Single Source of Truth):
 * - Website -> Airbnb (?target=airbnb):
 *   Export ALL active website unavailability (Direct Booking, Manual Booking,
 *   Booking.com reservations, Blocked dates, Other) EXCEPT Airbnb's own
 *   reservations — so Booking.com & Website stays block Airbnb with ZERO loop!
 * - Website -> Booking.com (?target=bookingcom):
 *   Export ALL active website unavailability (Direct Booking, Manual Booking,
 *   Airbnb reservations, Blocked dates, Other) EXCEPT Booking.com's own
 *   reservations — so Airbnb & Website stays block Booking.com with ZERO loop!
 * - Personal Read-Only (?scope=all on all.ics):
 *   Export ALL active bookings across all channels.
 */
async function generateOutboundIcsResponse(
  c: any,
  rawProp: string,
  targetOverride?: string | null
) {
  try {
    const cleanParam = decodeURIComponent(rawProp.replace(/\.ics$/i, '')).trim();
    const target = (targetOverride || c.req.query('target') || c.req.query('channel') || '').toLowerCase().trim();
    const scope = (c.req.query('scope') || '').toLowerCase().trim();

    // Resolve either room ID (e.g. prop_1793346773822_um49) OR room Name (e.g. Luna (Studio Room))
    let cleanProp = cleanParam;
    if (cleanParam.toLowerCase() !== 'all') {
      const propMatch: any = await c.env.DB.prepare(`
        SELECT name FROM properties WHERE id = ? OR LOWER(name) = LOWER(?) LIMIT 1
      `).bind(cleanParam, cleanParam).first();
      if (propMatch && propMatch.name) {
        cleanProp = propMatch.name;
      }
    }

    const includeAllForPersonalReadOnly = (scope === 'all' && !target && cleanProp.toLowerCase() === 'all');

    let query = `SELECT * FROM bookings WHERE status != 'Cancelled'`;
    const params: any[] = [];

    if (!includeAllForPersonalReadOnly) {
      // Export recent + all future unavailability for fast, accurate OTA ingestion
      query += ` AND check_out_date >= date('now', '-30 days')`;
    }

    if (cleanProp.toLowerCase() !== 'all') {
      query += ` AND LOWER(property) = LOWER(?)`;
      params.push(cleanProp);
    }
    query += ` ORDER BY check_in_date ASC`;

    const stmt = c.env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    const bookings = results || [];
    const nowStamp = toIcalTimestamp();
    const targetLabel = target === 'airbnb'
      ? 'Airbnb Master Sync'
      : target === 'bookingcom' || target === 'booking.com'
        ? 'Booking.com Master Sync'
        : includeAllForPersonalReadOnly
          ? 'All Bookings (Read-Only)'
          : 'Master Calendar Availability';

    const calName = cleanProp.toLowerCase() === 'all'
      ? `Elite Homes - ${targetLabel}`
      : `${cleanProp} - Elite Homes (${targetLabel})`;

    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Elite Homes//Master Calendar Two-Way Sync v4//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeIcalText(calName)}`,
      'X-WR-TIMEZONE:UTC',
      'X-PUBLISHED-TTL:PT5M',
      'REFRESH-INTERVAL;VALUE=DURATION:PT5M'
    ];

    for (const bk of bookings as any[]) {
      const source = classifyBookingSource(bk);

      // OUTBOUND EXPORT FOR OTAs:
      // Airbnb and Booking.com sync directly with each other.
      // Therefore, the website exports ONLY Website Direct Bookings, Manual Admin Bookings,
      // and Administrative / Maintenance Date Blocks.
      // We NEVER export OTA stays back to OTAs, avoiding duplicate blocks, lag, and echo loops.
      if (!includeAllForPersonalReadOnly) {
        const isWebsiteOriginating = (
          source === 'Direct Booking' ||
          source === 'Manual Booking' ||
          source === 'Blocked' ||
          bk.status === 'Blocked' ||
          (bk.platform && String(bk.platform).toLowerCase() === 'blocked')
        );
        if (!isWebsiteOriginating) {
          continue; // Do not export OTA bookings back to OTAs!
        }
      }

      const checkInIcal = toIcalDate(bk.check_in_date);
      if (!checkInIcal || checkInIcal.length !== 8) continue;

      let checkOutIcal = toIcalDate(bk.check_out_date);
      if (!checkOutIcal || checkOutIcal <= checkInIcal) {
        const nextDay = new Date(`${bk.check_in_date}T00:00:00Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        checkOutIcal = toIcalDate(nextDay.toISOString().split('T')[0]);
      }

      const uidPrefix = source === 'Direct Booking' ? 'direct' : 'master';
      const uid = `${uidPrefix}-${bk.id}@elitehomes-portal.workers.dev`;
      const updatedDate = bk.updated_at
        ? new Date(String(bk.updated_at).replace(' ', 'T') + (String(bk.updated_at).includes('Z') ? '' : 'Z'))
        : new Date();
      const lastModStamp = toIcalTimestamp(updatedDate);
      const seqNum = Math.max(
        Number(bk.sync_version) || 1,
        isNaN(updatedDate.getTime()) ? 1 : Math.floor(updatedDate.getTime() / 1000) % 10000000
      );

      const summary = includeAllForPersonalReadOnly
        ? `${bk.property} - ${bk.guest_name || 'Reserved'} (${source})`
        : source === 'Blocked'
          ? `Closed - Not available`
          : `Reserved`;

      const description = [
        `Master Source: Elite Homes Website`,
        `Origin Channel: ${source}`,
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
      icsLines.push(`X-ELITEHOMES-BOOKING-ID:${escapeIcalText(String(bk.id || ''))}`);
      icsLines.push('STATUS:CONFIRMED');
      icsLines.push('TRANSP:OPAQUE');
      icsLines.push('END:VEVENT');
    }

    icsLines.push('END:VCALENDAR');
    const finalIcs = icsLines.map(foldIcalLine).join('\r\n') + '\r\n';

    // Log outbound export request for audit visibility and troubleshooting
    try {
      const ua = c.req.header('user-agent') || 'Unknown User-Agent';
      const clientIp = c.req.header('cf-connecting-ip') || 'Unknown IP';
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(
          recordAvailabilityAudit(c.env.DB, {
            property: cleanProp,
            action: 'ical_export_requested',
            source: ua.slice(0, 100),
            details: `Exported ${bookings.length} event(s) (Target: ${target || 'default'}). IP: ${clientIp}`
          })
        );
      }
    } catch (_) {}

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
    console.error('[iCal Export] Error generating master outbound feed:', err);
    return c.text('Error generating calendar feed: ' + err.message, 500);
  }
}

// Clean, zero-special-character, query-free OTA import URLs (maximum Airbnb & Booking.com compatibility)
icalRoute.get('/airbnb/:property', async (c) => generateOutboundIcsResponse(c, c.req.param('property'), 'airbnb'));
icalRoute.get('/bookingcom/:property', async (c) => generateOutboundIcsResponse(c, c.req.param('property'), 'bookingcom'));
icalRoute.get('/export/:property', async (c) => generateOutboundIcsResponse(c, c.req.param('property'), null));

// =============================================================================
// 2. ROOM-WISE OTA MAPPINGS, FEEDS & MASTER SYNCHRONISATION DASHBOARD
// =============================================================================

icalRoute.get('/feeds', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, color,
             airbnb_listing_id, booking_com_property_id,
             airbnb_ical_url, booking_com_ical_url, other_ical_url,
             airbnb_webhook_url, booking_com_webhook_url, sync_webhook_secret,
             last_synced_at
      FROM properties
      ORDER BY name ASC
    `).all();

    let latestByPropSource: Record<string, any> = {};
    try {
      const logRes = await c.env.DB.prepare(`
        SELECT property, source, trigger_type, status, imported, updated, cancelled, conflicts, message, error_detail, created_at
        FROM ical_sync_logs
        ORDER BY created_at DESC
        LIMIT 120
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
        syncMode: 'master-hub-two-way',
        exportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.name)}.ics`,
        airbnbExportUrl: `${origin}/api/ical/airbnb/${encodeURIComponent(p.id)}.ics`,
        bookingComExportUrl: `${origin}/api/ical/bookingcom/${encodeURIComponent(p.id)}.ics`,
        inboundWebhookAirbnb: `${origin}/api/sync/webhook/airbnb`,
        inboundWebhookBookingCom: `${origin}/api/sync/webhook/bookingcom`,
        airbnbSyncStatus: latestByPropSource[`${pLower}::airbnb`] || null,
        bookingComSyncStatus: latestByPropSource[`${pLower}::booking.com`] || null
      };
    });

    return c.json({ success: true, data: feeds });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PUT /api/ical/feeds/:name - Update room-wise OTA IDs, iCal feeds, and optional real-time push webhooks
icalRoute.put('/feeds/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name')).trim();
    const body = await c.req.json();

    const existing: any = await c.env.DB.prepare(`SELECT * FROM properties WHERE LOWER(name) = LOWER(?)`).bind(name).first();
    if (!existing) {
      return c.json({ success: false, error: `Property "${name}" not found.` }, 404);
    }

    const airbnbListingId = body.airbnbListingId !== undefined ? String(body.airbnbListingId || '').trim() : (existing.airbnb_listing_id || '');
    const bookingComPropertyId = body.bookingComPropertyId !== undefined ? String(body.bookingComPropertyId || '').trim() : (existing.booking_com_property_id || '');
    const airbnbUrl = body.airbnbIcalUrl !== undefined ? String(body.airbnbIcalUrl || '').trim() : (existing.airbnb_ical_url || '');
    const bookingComUrl = body.bookingComIcalUrl !== undefined ? String(body.bookingComIcalUrl || '').trim() : (existing.booking_com_ical_url || '');
    const otherUrl = body.otherIcalUrl !== undefined ? String(body.otherIcalUrl || '').trim() : (existing.other_ical_url || '');
    const airbnbWebhookUrl = body.airbnbWebhookUrl !== undefined ? String(body.airbnbWebhookUrl || '').trim() : (existing.airbnb_webhook_url || '');
    const bookingComWebhookUrl = body.bookingComWebhookUrl !== undefined ? String(body.bookingComWebhookUrl || '').trim() : (existing.booking_com_webhook_url || '');
    const syncWebhookSecret = body.syncWebhookSecret !== undefined ? String(body.syncWebhookSecret || '').trim() : (existing.sync_webhook_secret || '');

    for (const [label, url] of [
      ['Airbnb iCal URL', airbnbUrl],
      ['Booking.com iCal URL', bookingComUrl],
      ['Airbnb Outbound Webhook URL', airbnbWebhookUrl],
      ['Booking.com Outbound Webhook URL', bookingComWebhookUrl]
    ]) {
      if (url && !url.startsWith('http')) {
        return c.json({ success: false, error: `${label} must start with https:// or http://` }, 400);
      }
    }

    await c.env.DB.prepare(`
      UPDATE properties SET
        airbnb_listing_id = ?,
        booking_com_property_id = ?,
        airbnb_ical_url = ?,
        booking_com_ical_url = ?,
        other_ical_url = ?,
        airbnb_webhook_url = ?,
        booking_com_webhook_url = ?,
        sync_webhook_secret = ?
      WHERE id = ?
    `).bind(
      airbnbListingId || null,
      bookingComPropertyId || null,
      airbnbUrl || null,
      bookingComUrl || null,
      otherUrl || null,
      airbnbWebhookUrl || null,
      bookingComWebhookUrl || null,
      syncWebhookSecret || null,
      existing.id
    ).run();

    return c.json({
      success: true,
      message: `OTA mappings & sync feeds updated for "${existing.name}".`,
      data: {
        name: existing.name,
        airbnbListingId,
        bookingComPropertyId,
        airbnbUrl,
        bookingComUrl,
        airbnbWebhookUrl,
        bookingComWebhookUrl
      }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/sync/dashboard (and /api/ical/dashboard) - Full Master Calendar Sync Dashboard Payload
icalRoute.get('/dashboard', async (c) => {
  try {
    const origin = new URL(c.req.url).origin;

    const [propsRes, logsRes, outboxRes, auditRes, recentImportsRes] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, name, color,
               airbnb_listing_id, booking_com_property_id,
               airbnb_ical_url, booking_com_ical_url, other_ical_url,
               airbnb_webhook_url, booking_com_webhook_url, sync_webhook_secret,
               last_synced_at
        FROM properties ORDER BY name ASC
      `).all(),
      c.env.DB.prepare(`
        SELECT * FROM ical_sync_logs ORDER BY created_at DESC LIMIT 40
      `).all(),
      c.env.DB.prepare(`
        SELECT * FROM sync_outbox ORDER BY created_at DESC LIMIT 40
      `).all(),
      c.env.DB.prepare(`
        SELECT * FROM availability_audit_logs ORDER BY created_at DESC LIMIT 40
      `).all(),
      c.env.DB.prepare(`
        SELECT id, property, guest_name, phone, email, check_in_date, check_out_date,
               nights, guests_count, platform, booking_mode, reservation_code, external_reservation_id,
               payout, total_price, currency, taxes_fees, payment_status, ota_payout_status,
               status, notes, created_at, updated_at
        FROM bookings
        WHERE COALESCE(booking_mode, platform) IN ('Airbnb', 'Booking.com')
           OR external_uid IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT 30
      `).all()
    ]);

    const props = (propsRes.results || []) as any[];
    const logs = (logsRes.results || []) as any[];
    const outbox = (outboxRes.results || []) as any[];
    const audits = (auditRes.results || []) as any[];
    const recentImports = (recentImportsRes.results || []) as any[];

    const latestByPropSource: Record<string, any> = {};
    for (const row of logs) {
      const key = `${String(row.property).toLowerCase()}::${String(row.source).toLowerCase()}`;
      if (!latestByPropSource[key]) latestByPropSource[key] = row;
    }

    // Channel-level health summary
    const buildChannelOverview = (channel: OtaChannel) => {
      const isAirbnb = channel === 'Airbnb';
      const configuredRooms = props.filter(p =>
        Boolean(isAirbnb ? p.airbnb_ical_url : p.booking_com_ical_url) ||
        Boolean(isAirbnb ? p.airbnb_webhook_url : p.booking_com_webhook_url)
      ).length;
      const realtimePushRooms = props.filter(p =>
        Boolean(isAirbnb ? p.airbnb_webhook_url : p.booking_com_webhook_url)
      ).length;

      const chLogs = logs.filter(l => String(l.source).toLowerCase() === channel.toLowerCase());
      const lastInboundSuccess = chLogs.find(l => l.status === 'success' || l.status === 'warning') || null;
      const lastInboundError = chLogs.find(l => l.status === 'error') || null;

      const chOutbox = outbox.filter(o => String(o.channel).toLowerCase() === channel.toLowerCase());
      const lastOutboundSuccess = chOutbox.find(o => o.status === 'acknowledged' || o.status === 'feed_ready') || null;
      const pendingUpdates = chOutbox.filter(o => o.status === 'pending' || o.status === 'retrying').length;
      const failedUpdates = chOutbox.filter(o => o.status === 'failed').length;

      let connectionStatus: 'connected' | 'degraded' | 'not_configured' = 'not_configured';
      if (configuredRooms > 0) {
        const hasRecentError = Boolean(lastInboundError && (!lastInboundSuccess || lastInboundError.created_at > lastInboundSuccess.created_at));
        connectionStatus = (hasRecentError || failedUpdates > 0) ? 'degraded' : 'connected';
      }

      return {
        channel,
        connectionStatus,
        transportMode: realtimePushRooms > 0 ? 'hybrid_realtime_and_ical' : 'ical_polling',
        realtimeGuaranteed: realtimePushRooms > 0,
        configuredRooms,
        totalRooms: props.length,
        realtimePushRooms,
        lastSuccessfulInboundSync: lastInboundSuccess?.created_at || null,
        lastSuccessfulOutboundSync: lastOutboundSuccess?.acknowledged_at || lastOutboundSuccess?.created_at || null,
        lastError: lastInboundError?.message || null,
        pendingUpdates,
        failedUpdates
      };
    };

    const rooms = await Promise.all(
      props.map(async (p) => {
        const pLower = String(p.name || '').toLowerCase();
        const avail = await recalculateRoomAvailability(c.env.DB, p.name);
        return {
          ...p,
          websiteExportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.id)}.ics`,
          airbnbExportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.id)}.ics`,
          bookingComExportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.id)}.ics`,
          airbnbSyncStatus: latestByPropSource[`${pLower}::airbnb`] || null,
          bookingComSyncStatus: latestByPropSource[`${pLower}::booking.com`] || null,
          availability: {
            activeBookingsCount: avail.activeCount,
            unavailableRanges: avail.allUnavailableRanges.slice(0, 12),
            exportedToAirbnbCount: (avail as any).forWebsiteExport?.length || avail.forAirbnb.length,
            exportedToBookingComCount: (avail as any).forWebsiteExport?.length || avail.forBookingCom.length,
            exportedToWebsiteCount: (avail as any).forWebsiteExport?.length || 0
          }
        };
      })
    );

    const outboxStats = {
      pending: outbox.filter(o => o.status === 'pending').length,
      retrying: outbox.filter(o => o.status === 'retrying').length,
      failed: outbox.filter(o => o.status === 'failed').length,
      acknowledged: outbox.filter(o => o.status === 'acknowledged').length,
      feedReady: outbox.filter(o => o.status === 'feed_ready').length
    };

    return c.json({
      success: true,
      data: {
        masterTopology: {
          sourceOfTruth: 'Website Direct & Master Calendar (Cloudflare D1)',
          directOtaToOtaSync: true,
          topologyDescription: 'Direct Airbnb ↔ Booking.com connection with Website Direct Export',
          cronIntervalMinutes: 5,
          webhookEndpoints: {
            airbnb: `${origin}/api/sync/webhook/airbnb`,
            bookingCom: `${origin}/api/sync/webhook/bookingcom`
          }
        },
        channels: {
          airbnb: buildChannelOverview('Airbnb'),
          bookingCom: buildChannelOverview('Booking.com')
        },
        outboxStats,
        rooms,
        recentImports,
        outbox,
        syncLogs: logs,
        auditLogs: audits
      }
    });
  } catch (err: any) {
    console.error('[SyncDashboard] Error loading dashboard:', err);
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
// 3. REAL-TIME EVENT-DRIVEN WEBHOOK ENDPOINTS (AIRBNB & BOOKING.COM)
// =============================================================================

async function verifyWebhookAuth(c: any): Promise<boolean> {
  const adminPin = c.env.ADMIN_PIN || '4635';
  const providedPin = c.req.header('X-Admin-Pin') || c.req.header('X-Sync-Secret') || '';
  const authHeader = c.req.header('Authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (providedPin === adminPin || bearer === adminPin) return true;

  // Also check if any room's configured sync_webhook_secret matches
  const candidate = providedPin || bearer;
  if (!candidate) return false;
  const match = await c.env.DB.prepare(`
    SELECT id FROM properties WHERE sync_webhook_secret = ? LIMIT 1
  `).bind(candidate).first();
  return Boolean(match);
}

icalRoute.post('/webhook/airbnb', async (c) => {
  try {
    if (!(await verifyWebhookAuth(c))) {
      return c.json({ success: false, error: 'Unauthorized webhook request. Provide valid X-Sync-Secret or Bearer token.' }, 401);
    }
    const payload = await c.req.json();
    const result = await ingestExternalBookingEvent(c.env, c.executionCtx, 'Airbnb', payload);
    return c.json(result, (result.httpStatus || 200) as any);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

icalRoute.post('/webhook/bookingcom', async (c) => {
  try {
    if (!(await verifyWebhookAuth(c))) {
      return c.json({ success: false, error: 'Unauthorized webhook request. Provide valid X-Sync-Secret or Bearer token.' }, 401);
    }
    const payload = await c.req.json();
    const result = await ingestExternalBookingEvent(c.env, c.executionCtx, 'Booking.com', payload);
    return c.json(result, (result.httpStatus || 200) as any);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Admin-PIN protected test/simulation endpoint for verifying real-time two-way OTA workflows
icalRoute.post('/simulate-webhook', async (c) => {
  try {
    if (!(await verifyWebhookAuth(c))) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const body = await c.req.json();
    const source: OtaChannel = String(body.source || '').toLowerCase().includes('booking') ? 'Booking.com' : 'Airbnb';
    const result = await ingestExternalBookingEvent(c.env, c.executionCtx, source, {
      ...body,
      _awaitDispatch: true
    });
    return c.json(result, (result.httpStatus || 200) as any);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/sync/retry-outbox - Retry failed or pending outbound pushes
icalRoute.post('/retry-outbox', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const forceAllFailed = body.forceAllFailed !== false;
    const result = await processOutboxRetries(c.env, forceAllFailed);
    return c.json({
      success: true,
      message: `Outbox retry complete: checked ${result.checked}, retried ${result.retried}, acknowledged ${result.acknowledged}, failed ${result.failed}.`,
      data: result
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// =============================================================================
// 4. INDEPENDENT HUB-AND-SPOKE INBOUND iCAL SYNC (AIRBNB + BOOKING.COM)
// =============================================================================

export async function executeIcalSync(
  env: Bindings,
  targetProperty?: string | null,
  executionCtx?: any,
  triggerType: 'cron' | 'manual' = 'manual',
  targetSource?: OtaChannel | null
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
      message: 'No external Airbnb or Booking.com iCal URLs configured. Add room OTA links in Master OTA Sync Dashboard.',
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
    // Hub-and-Spoke: Website connects independently to Airbnb AND Booking.com
    const feeds: Array<{ url: string; source: OtaChannel }> = [];
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
        const res = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; EliteHomesMasterCalendarSync/4.0)',
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

        const unfolded = icsText.replace(/\r?\n[ \t]/g, '');
        const eventBlocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);
        eventsFound = eventBlocks.length;
        const seenUids = new Set<string>();

        const roomBookingsRes = (triggerType === 'cron')
          ? await env.DB.prepare(`
              SELECT * FROM bookings
              WHERE LOWER(property) = LOWER(?) AND check_out_date >= ?
            `).bind(prop.name, todayIso).all()
          : await env.DB.prepare(`
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

          // GUARD 1: Direct Echo Prevention — never re-import our own Master Calendar exported events
          const uidLower = uid.toLowerCase();
          if (
            uidLower.includes('@elitehomes-portal.workers.dev') ||
            uidLower.startsWith('direct-bk_') ||
            uidLower.startsWith('unavailable-') ||
            uidLower.startsWith('master-') ||
            Boolean(ownSourceTag)
          ) {
            feedSkipped++;
            continue;
          }

          if (!checkOut || checkOut <= checkIn) {
            const d = new Date(`${checkIn}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + 1);
            checkOut = d.toISOString().split('T')[0];
          }

          // PAST DATES OPTIMIZATION: Only today and future dates need to be refreshed during cron!
          // If check-out is in the past, skip it to eliminate unnecessary DB row reads and writes
          if (triggerType === 'cron' && checkOut < todayIso) {
            feedSkipped++;
            continue;
          }

          const nights = calculateNights(checkIn, checkOut);
          const meta = parseEventMetadata(summary, description, feed.source);

          // Skip rolling >45-night generic OTA calendar closure windows
          if (nights > 45 && meta.isGenericBlockSummary) {
            feedSkipped++;
            continue;
          }

          seenUids.add(uid);

          // Idempotency Check: match by external_uid OR external_reservation_id
          const existingByUid = roomBookings.find(
            b =>
              (b.external_uid && String(b.external_uid).trim() === uid) ||
              (meta.reservationCode && b.external_reservation_id && String(b.external_reservation_id).trim() === meta.reservationCode)
          );

          if (existingByUid) {
            const existingNotes = String(existingByUid.notes || '');
            const wasAutoCancelled = existingNotes.includes('[Cancelled on ');
            if (existingByUid.status === 'Cancelled' && !wasAutoCancelled) {
              feedSkipped++;
              continue;
            }

            const nextStatus =
              eventStatus === 'CANCELLED'
                ? 'Cancelled'
                : (existingByUid.status === 'Checked In' || existingByUid.status === 'Completed' || existingByUid.status === 'Checked Out')
                  ? existingByUid.status
                  : 'Confirmed';

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
              // REQUIREMENT 3: NEVER overwrite existing payment_status on subsequent sync updates!
              await env.DB.prepare(`
                UPDATE bookings SET
                  guest_name = ?,
                  phone = CASE WHEN ? != '' AND (phone IS NULL OR phone = '') THEN ? ELSE phone END,
                  email = CASE WHEN ? != '' AND (email IS NULL OR email = '') THEN ? ELSE email END,
                  check_in_date = ?,
                  check_out_date = ?,
                  nights = ?,
                  platform = ?,
                  booking_mode = ?,
                  reservation_code = ?,
                  external_reservation_id = COALESCE(external_reservation_id, ?),
                  status = ?,
                  sync_version = COALESCE(sync_version, 1) + 1,
                  updated_at = datetime('now')
                WHERE id = ?
              `).bind(
                nameToSave,
                meta.phoneHint, meta.phoneHint,
                meta.emailHint, meta.emailHint,
                checkIn,
                checkOut,
                nights,
                feed.source,
                feed.source,
                codeToSave,
                meta.reservationCode || null,
                nextStatus,
                existingByUid.id
              ).run();

              await recordAvailabilityAudit(env.DB, {
                property: prop.name,
                bookingId: existingByUid.id,
                action: nextStatus === 'Cancelled' ? 'cancelled' : 'modified',
                source: feed.source,
                bookingMode: feed.source,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                previousState: { checkIn: existingByUid.check_in_date, checkOut: existingByUid.check_out_date, status: existingByUid.status },
                newState: { checkIn, checkOut, status: nextStatus, paymentStatusPreserved: existingByUid.payment_status },
                details: `Updated via ${feed.source} iCal sync (existing payment_status preserved).`
              });

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

          if (eventStatus === 'CANCELLED') {
            feedSkipped++;
            continue;
          }

          // Active bookings overlapping [checkIn, checkOut) in THIS room
          const activeOverlaps = roomBookings.filter(
            b => b.status !== 'Cancelled' && b.check_in_date < checkOut! && b.check_out_date > checkIn
          );

          // GUARD 2: Master Hub Echo-Loop Prevention
          // Our website exports ALL non-Airbnb unavailability to Airbnb and ALL non-Booking.com
          // unavailability to Booking.com. If an incoming OTA feed sends back a generic
          // "Not available" / "CLOSED - Not available" block whose nights are ALREADY 100%
          // covered by other sources on our website, it is an echo of our own export — skip it!
          const otherSourceActiveBookings = roomBookings.filter(
            b => b.status !== 'Cancelled' && classifyBookingSource(b) !== feed.source
          );
          if (meta.isGenericBlockSummary && isDateRangeCoveredByBookings(checkIn, checkOut, otherSourceActiveBookings)) {
            feedSkipped++;
            continue;
          }
          if (meta.isAirbnbNotAvailable && activeOverlaps.some(b => classifyBookingSource(b) !== feed.source)) {
            feedSkipped++;
            continue;
          }

          // GUARD 2.5: Cross-OTA Direct Sync Deduplication
          // Airbnb and Booking.com sync directly with each other. If an incoming OTA feed
          // has dates that are ALREADY covered by an existing OTA booking in this room
          // (e.g. Booking.com stay appearing inside Airbnb's feed, or vice-versa),
          // treat it as the same stay and do not create a duplicate booking!
          const existingOtaMatch = activeOverlaps.find(b => {
            const src = classifyBookingSource(b);
            return (src === 'Airbnb' || src === 'Booking.com');
          });
          if (existingOtaMatch) {
            if (existingOtaMatch.check_in_date === checkIn && existingOtaMatch.check_out_date === checkOut) {
              if (meta.reservationCode && !existingOtaMatch.external_reservation_id) {
                await env.DB.prepare(`
                  UPDATE bookings SET
                    external_reservation_id = COALESCE(external_reservation_id, ?),
                    updated_at = datetime('now')
                  WHERE id = ?
                `).bind(meta.reservationCode, existingOtaMatch.id).run();
              }
              feedSkipped++;
              continue;
            }
          }

          // GUARD 3: Same-Source Manual Booking Deduplication
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
                external_reservation_id = COALESCE(external_reservation_id, ?),
                reservation_code = ?,
                booking_mode = ?,
                updated_at = datetime('now')
              WHERE id = ?
            `).bind(uid, meta.reservationCode || null, codeToSave, feed.source, sameSourceManualMatch.id).run();
            sameSourceManualMatch.external_uid = uid;
            feedUpdated++;
            continue;
          }

          // GUARD 4: Atomic Room Lock + Genuine Conflict Detection (NEVER overwrite existing booking!)
          const lock = await acquireRoomInventoryLock(env.DB, prop.name, checkIn, checkOut, feed.source);
          try {
            const directConflict = activeOverlaps.find(b => {
              const src = classifyBookingSource(b);
              return (src === 'Direct Booking' || src === 'Manual Booking');
            });
            let importNote = `Imported via ${feed.source} iCal sync on ${todayIso} | Booking Mode: ${feed.source}`;
            if (meta.phoneHint) importNote += ` | Phone hint: ${meta.phoneHint}`;
            if (meta.totalPrice !== null) importNote += ` | Booked Rate: ${formatCurrencyAmount(meta.totalPrice, meta.currency)}`;
            if (directConflict) {
              importNote += ` | [⚠️ Inventory Conflict with Direct Booking: ${directConflict.guest_name}]`;
              feedConflicts++;
            }

            const newId = `bk_ical_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const newResCode = meta.reservationCode || uid.slice(0, 30);
            const payoutFormatted = meta.totalPrice !== null ? formatCurrencyAmount(meta.totalPrice, meta.currency) : '';

            // REQUIREMENT 3: Every newly imported Airbnb or Booking.com booking defaults
            // internal payment_status = 'Paid', with separate ota_payout_status = 'Pending Settlement'!
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
                ?, ?, ?, 0,
                'Paid', 'Pending Settlement', 'Confirmed', ?, 1,
                datetime('now'), datetime('now')
              )
            `).bind(
              newId,
              prop.name,
              meta.guestName,
              meta.phoneHint,
              meta.emailHint,
              checkIn,
              checkOut,
              nights,
              meta.guestsCount,
              feed.source,
              feed.source,
              newResCode,
              meta.reservationCode || null,
              uid,
              payoutFormatted,
              meta.totalPrice,
              meta.currency,
              importNote
            ).run();

            await recordAvailabilityAudit(env.DB, {
              property: prop.name,
              bookingId: newId,
              action: directConflict ? 'conflict_detected' : 'imported',
              source: feed.source,
              bookingMode: feed.source,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              newState: { guestName: meta.guestName, paymentStatus: 'Paid', otaPayoutStatus: 'Pending Settlement' },
              details: directConflict
                ? `⚠️ Conflict during ${feed.source} iCal sync with existing Direct booking ${directConflict.id} (${directConflict.guest_name}).`
                : `Imported ${feed.source} stay (${checkIn} → ${checkOut}) with default payment_status = Paid.`
            });

            roomBookings.push({
              id: newId,
              property: prop.name,
              guest_name: meta.guestName,
              check_in_date: checkIn,
              check_out_date: checkOut,
              nights,
              platform: feed.source,
              booking_mode: feed.source,
              reservation_code: newResCode,
              external_uid: uid,
              payment_status: 'Paid',
              status: 'Confirmed',
              notes: importNote
            });

            feedImported++;
          } finally {
            await releaseRoomInventoryLock(env.DB, lock.lockToken);
          }
        }

        // CANCELLATION RECONCILIATION (Missing-Event Detection)
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
                sync_version = COALESCE(sync_version, 1) + 1,
                updated_at = datetime('now')
              WHERE id = ?
            `).bind(cancelNote, staleBk.id).run();

            await recordAvailabilityAudit(env.DB, {
              property: prop.name,
              bookingId: staleBk.id,
              action: 'cancelled',
              source: feed.source,
              bookingMode: feed.source,
              checkInDate: staleBk.check_in_date,
              checkOutDate: staleBk.check_out_date,
              details: `${feed.source} reservation disappeared from live feed — marked Cancelled and room availability recalculated.`
            });

            feedCancelled++;
          }
        }

        // HUB-AND-SPOKE CROSS-OTA PROPAGATION:
        // Whenever Airbnb changes -> immediately push updated availability to Booking.com!
        // Whenever Booking.com changes -> immediately push updated availability to Airbnb!
        if (feedImported > 0 || feedUpdated > 0 || feedCancelled > 0) {
          await enqueueAndDispatchAvailabilityUpdate(env, executionCtx, {
            property: prop.name,
            eventType: feedCancelled > 0 && feedImported === 0 ? 'booking_cancelled' : (feedImported > 0 ? 'booking_created' : 'booking_updated'),
            originSource: feed.source
          });
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
    message: `Master sync complete: +${totalImported} imported, ~${totalUpdated} updated, -${totalCancelled} cancelled, ${totalSkipped} unchanged${totalConflicts > 0 ? `, ⚠️ ${totalConflicts} conflict(s)` : ''}${errors.length > 0 ? ` (${errors.length} error(s))` : ''}.`,
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

// POST /api/ical/sync (and /api/sync/sync) - Manual reconciliation (both OTAs, single room, or single OTA)
icalRoute.post('/sync', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const targetProperty = body.property ? String(body.property).trim() : null;
    const rawSource = body.source ? String(body.source).trim() : null;
    const targetSource: OtaChannel | null =
      rawSource === 'Airbnb' || rawSource === 'Booking.com' ? rawSource : null;
    const result = await executeIcalSync(c.env, targetProperty, c.executionCtx, 'manual', targetSource);
    return c.json(result);
  } catch (err: any) {
    console.error('[iCal Sync] Fatal sync error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Alias for direct .ics download (e.g. /api/ical/2 BHK.ics?target=bookingcom)
icalRoute.get('/:filename{.+\\.ics$}', async (c) => {
  const filename = c.req.param('filename');
  const propName = filename.slice(0, -4);
  const qs = new URL(c.req.url).search;
  return c.redirect(`/api/ical/export/${encodeURIComponent(propName)}.ics${qs}`, 302);
});

export default icalRoute;
