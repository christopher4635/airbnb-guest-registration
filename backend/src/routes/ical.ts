import { Hono } from 'hono';
import { Bindings } from '../types';

const icalRoute = new Hono<{ Bindings: Bindings }>();

// Helper to format Date string (YYYY-MM-DD) to iCal date format (YYYYMMDD)
function toIcalDate(dateStr: string): string {
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

// Helper to format ISO date to iCal UTC timestamp (YYYYMMDDTHHMMSSZ)
function toIcalTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Helper to parse RFC 5545 date/datetime value into standard YYYY-MM-DD
function parseIcsDate(rawVal: string): string | null {
  if (!rawVal) return null;
  // If format is like "VALUE=DATE:20261029" or "TZID=...:20261029T150000" or "20261029"
  const val = rawVal.split(':').pop() || rawVal;
  const match = val.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

// Calculate days between two YYYY-MM-DD dates
function calculateNights(checkIn: string, checkOut: string): number {
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const diffTime = dOut.getTime() - dIn.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
}

// 1. GET /api/ical/export/:property - Outbound iCal feed for any room/property
icalRoute.get('/export/:property', async (c) => {
  try {
    const rawProp = c.req.param('property');
    // Allow property with or without .ics extension
    const cleanProp = decodeURIComponent(rawProp.replace(/\.ics$/i, '')).trim();

    // Query non-cancelled bookings for this property (or all if 'all')
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
      ? 'Elite Homes - All Properties' 
      : `${cleanProp} - Elite Homes Calendar`;

    // Construct standard RFC 5545 iCalendar format
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Elite Homes//Property Booking Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      'X-WR-TIMEZONE:UTC',
      'X-PUBLISHED-TTL:PT1H',
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H'
    ];

    for (const bk of bookings as any[]) {
      const checkInIcal = toIcalDate(bk.check_in_date);
      let checkOutIcal = toIcalDate(bk.check_out_date);

      // If check-out is missing or equal to check-in, advance by 1 day
      if (checkInIcal === checkOutIcal || !checkOutIcal) {
        const nextDay = new Date(bk.check_in_date);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutIcal = toIcalDate(nextDay.toISOString().split('T')[0]);
      }

      const uid = bk.external_uid || `bk-${bk.id}@elitehomes-portal.workers.dev`;
      const summary = `Reserved - ${bk.guest_name || 'Guest'} (${bk.platform || 'Direct'})`;
      const description = [
        `Guest: ${bk.guest_name || 'Direct Guest'}`,
        `Property: ${bk.property}`,
        `Platform: ${bk.platform || 'Direct'}`,
        `Reservation: ${bk.reservation_code || bk.id}`,
        `Nights: ${bk.nights || 1}`
      ].join('\\n');

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${uid}`);
      icsContent.push(`DTSTAMP:${nowStamp}`);
      icsContent.push(`DTSTART;VALUE=DATE:${checkInIcal}`);
      icsContent.push(`DTEND;VALUE=DATE:${checkOutIcal}`);
      icsContent.push(`SUMMARY:${summary}`);
      icsContent.push(`DESCRIPTION:${description}`);
      icsContent.push('STATUS:CONFIRMED');
      icsContent.push('TRANSP:OPAQUE');
      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');
    const finalIcs = icsContent.join('\r\n') + '\r\n';

    return new Response(finalIcs, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${encodeURIComponent(cleanProp)}.ics"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    console.error('Error generating outbound iCal feed:', err);
    return c.text('Error generating calendar feed: ' + err.message, 500);
  }
});

// 2. GET /api/ical/feeds - List all configured feeds with incoming & outgoing URLs
icalRoute.get('/feeds', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, color, airbnb_ical_url, booking_com_ical_url, other_ical_url, last_synced_at
      FROM properties
      ORDER BY name ASC
    `).all();

    const origin = new URL(c.req.url).origin;
    const feeds = (results || []).map((p: any) => ({
      ...p,
      exportUrl: `${origin}/api/ical/export/${encodeURIComponent(p.name)}.ics`
    }));

    return c.json({ success: true, data: feeds });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. PUT /api/ical/feeds/:name - Update inbound feed URLs for a specific property
icalRoute.put('/feeds/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name')).trim();
    const body = await c.req.json();

    const airbnbUrl = body.airbnbIcalUrl !== undefined ? body.airbnbIcalUrl.trim() : null;
    const bookingComUrl = body.bookingComIcalUrl !== undefined ? body.bookingComIcalUrl.trim() : null;
    const otherUrl = body.otherIcalUrl !== undefined ? body.otherIcalUrl.trim() : null;

    const existing = await c.env.DB.prepare(`SELECT * FROM properties WHERE name = ?`).bind(name).first();
    if (!existing) {
      return c.json({ success: false, error: `Property "${name}" not found.` }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE properties SET
        airbnb_ical_url = ?,
        booking_com_ical_url = ?,
        other_ical_url = ?
      WHERE name = ?
    `).bind(airbnbUrl, bookingComUrl, otherUrl, name).run();

    return c.json({
      success: true,
      message: `iCal feeds updated for "${name}".`,
      data: { name, airbnbUrl, bookingComUrl, otherUrl }
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. POST /api/ical/sync - Inbound Sync: fetch external iCal URLs and upsert bookings
icalRoute.post('/sync', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const targetProperty = body.property ? body.property.trim() : null;

    // Fetch properties to sync
    let propQuery = `SELECT * FROM properties WHERE (airbnb_ical_url IS NOT NULL AND airbnb_ical_url != '') 
      OR (booking_com_ical_url IS NOT NULL AND booking_com_ical_url != '') 
      OR (other_ical_url IS NOT NULL AND other_ical_url != '')`;
    const propParams: any[] = [];

    if (targetProperty) {
      propQuery += ` AND LOWER(name) = LOWER(?)`;
      propParams.push(targetProperty);
    }

    const { results } = propParams.length > 0 
      ? await c.env.DB.prepare(propQuery).bind(...propParams).all()
      : await c.env.DB.prepare(propQuery).all();

    const properties = results || [];
    if (properties.length === 0) {
      return c.json({
        success: true,
        message: 'No external iCal URLs configured for syncing. Configure an Airbnb or Booking.com iCal URL in Manage Rooms.',
        syncedCount: 0,
        stats: { imported: 0, updated: 0, skipped: 0 }
      });
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const syncLogs: string[] = [];
    const errors: string[] = [];

    for (const prop of properties as any[]) {
      const feeds = [
        { url: prop.airbnb_ical_url, platform: 'Airbnb' },
        { url: prop.booking_com_ical_url, platform: 'Booking.com' },
        { url: prop.other_ical_url, platform: 'iCal External' }
      ].filter(f => f.url && f.url.trim().startsWith('http'));

      for (const feed of feeds) {
        try {
          // Fetch remote iCal with timeout
          const res = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; EliteHomesCalendarSync/1.0)',
              'Accept': 'text/calendar, text/plain, */*'
            }
          });

          if (!res.ok) {
            errors.push(`Failed to fetch ${feed.platform} for ${prop.name} (HTTP ${res.status})`);
            continue;
          }

          const icsText = await res.text();
          // Unfold RFC 5545 lines (CRLF or LF followed by a space or tab)
          const unfolded = icsText.replace(/\r?\n[ \t]/g, '');

          // Split events
          const eventBlocks = unfolded.split(/BEGIN:VEVENT/i).slice(1);

          for (const block of eventBlocks) {
            const eventContent = block.split(/END:VEVENT/i)[0];

            // Parse fields
            const uidMatch = eventContent.match(/UID:(.+?)(\r?\n|$)/i);
            const summaryMatch = eventContent.match(/SUMMARY:(.+?)(\r?\n|$)/i);
            const dtStartMatch = eventContent.match(/DTSTART[^:]*:(.+?)(\r?\n|$)/i);
            const dtEndMatch = eventContent.match(/DTEND[^:]*:(.+?)(\r?\n|$)/i);
            const statusMatch = eventContent.match(/STATUS:(.+?)(\r?\n|$)/i);

            const uid = uidMatch ? uidMatch[1].trim() : null;
            const summary = summaryMatch ? summaryMatch[1].trim() : `${feed.platform} Reservation`;
            const checkIn = dtStartMatch ? parseIcsDate(dtStartMatch[1].trim()) : null;
            let checkOut = dtEndMatch ? parseIcsDate(dtEndMatch[1].trim()) : null;
            const eventStatus = statusMatch ? statusMatch[1].trim().toUpperCase() : 'CONFIRMED';

            if (!uid || !checkIn) {
              totalSkipped++;
              continue;
            }

            // Ensure checkOut is at least 1 day after checkIn
            if (!checkOut || checkOut <= checkIn) {
              const d = new Date(checkIn);
              d.setDate(d.getDate() + 1);
              checkOut = d.toISOString().split('T')[0];
            }

            const nights = calculateNights(checkIn, checkOut);

            // Clean guest name from SUMMARY
            let guestName = summary;
            if (/airbnb|not available|reserved|closed|blocked/i.test(guestName)) {
              if (guestName.includes('-')) {
                const parts = guestName.split('-');
                const candidate = parts[parts.length - 1].trim();
                if (candidate && !/not available|reserved|closed/i.test(candidate)) {
                  guestName = candidate;
                } else {
                  guestName = `${feed.platform} Guest`;
                }
              } else {
                guestName = `${feed.platform} Guest`;
              }
            }

            const bookingStatus = eventStatus === 'CANCELLED' ? 'Cancelled' : 'Confirmed';

            // Check if booking already exists with this external UID
            const existing = await c.env.DB.prepare(`
              SELECT id, status, check_in_date, check_out_date FROM bookings WHERE external_uid = ?
            `).bind(uid).first();

            if (existing) {
              // Update existing synced booking
              await c.env.DB.prepare(`
                UPDATE bookings SET
                  property = ?, guest_name = ?, check_in_date = ?, check_out_date = ?,
                  nights = ?, status = ?, updated_at = datetime('now')
                WHERE id = ?
              `).bind(prop.name, guestName, checkIn, checkOut, nights, bookingStatus, existing.id).run();
              totalUpdated++;
            } else {
              // Check if manual booking exists with same property and matching check-in
              const conflictManual = await c.env.DB.prepare(`
                SELECT id FROM bookings 
                WHERE property = ? 
                  AND check_in_date = ? 
                  AND check_out_date = ?
                  AND status != 'Cancelled'
                  AND external_uid IS NULL
              `).bind(prop.name, checkIn, checkOut).first();

              if (conflictManual) {
                // Link external UID to existing manual booking to prevent duplicate
                await c.env.DB.prepare(`
                  UPDATE bookings SET external_uid = ?, platform = ?, updated_at = datetime('now')
                  WHERE id = ?
                `).bind(uid, feed.platform, conflictManual.id).run();
                totalUpdated++;
              } else {
                // Insert new imported booking
                const newId = `bk_ical_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                await c.env.DB.prepare(`
                  INSERT INTO bookings (
                    id, property, guest_name, phone, email,
                    check_in_date, check_out_date, nights, guests_count,
                    platform, reservation_code, external_uid, payout, payment_status,
                    status, notes, created_at, updated_at
                  ) VALUES (?, ?, ?, '', '', ?, ?, ?, 1, ?, ?, ?, '', 'Paid via Channel', ?, ?, datetime('now'), datetime('now'))
                `).bind(
                  newId, prop.name, guestName, checkIn, checkOut, nights,
                  feed.platform, uid.slice(0, 30), uid, bookingStatus,
                  `Imported via ${feed.platform} iCal sync on ${new Date().toLocaleDateString()}`
                ).run();
                totalImported++;
              }
            }
          }

          syncLogs.push(`Successfully synced ${feed.platform} for ${prop.name}`);
        } catch (feedErr: any) {
          errors.push(`Error syncing ${feed.platform} for ${prop.name}: ${feedErr.message}`);
        }
      }

      // Update property last_synced_at
      await c.env.DB.prepare(`
        UPDATE properties SET last_synced_at = datetime('now') WHERE id = ?
      `).bind(prop.id).run();
    }

    return c.json({
      success: true,
      message: `iCal sync completed: ${totalImported} imported, ${totalUpdated} updated, ${totalSkipped} skipped.`,
      stats: {
        totalImported,
        totalUpdated,
        totalSkipped,
        propertiesCount: properties.length,
        logs: syncLogs,
        errors
      }
    });
  } catch (err: any) {
    console.error('Fatal sync error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Alias for direct .ics download (e.g. /api/ical/1 BHK.ics)
icalRoute.get('/:filename{.+\\.ics$}', async (c) => {
  const filename = c.req.param('filename');
  const propName = filename.slice(0, -4);
  return c.redirect(`/api/ical/export/${encodeURIComponent(propName)}`, 302);
});

export default icalRoute;
