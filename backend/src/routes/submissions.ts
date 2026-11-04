import { Hono } from 'hono';
import { Bindings, CheckInPayload, Submission } from '../types';
import { parseBase64DataUrl } from './uploads';

const submissionsRoute = new Hono<{ Bindings: Bindings }>();

function mapDbRowToSubmission(row: any): Submission {
  let customDetails = row.custom_details;
  if (typeof customDetails === 'string') {
    try {
      customDetails = JSON.parse(customDetails);
    } catch (e) {}
  }

  return {
    id: row.id,
    reservationCode: row.reservation_code || '',
    propertyOption: row.property_option || '',
    checkInDate: row.check_in_date || '',
    checkOutDate: row.check_out_date || '',
    arrivalTime: row.arrival_time || '',
    totalGuests: Number(row.total_guests) || 1,
    guestNumber: row.guest_number || '',
    guestName: row.guest_name,
    age: row.age ? Number(row.age) : undefined,
    phone: row.phone || '',
    email: row.email || '',
    comingFrom: row.coming_from || '',
    goingTo: row.going_to || '',
    purposeOfVisit: row.purpose_of_visit || '',
    customDetails,
    idType: row.id_type || 'Government ID',
    idNumber: row.id_number || '',
    frontPhotoKey: row.front_photo_key || '',
    frontPhotoUrl: row.front_photo_url || '',
    backPhotoKey: row.back_photo_key || '',
    backPhotoUrl: row.back_photo_url || '',
    signatureKey: row.signature_key || '',
    signatureUrl: row.signature_url || '',
    createdAt: row.created_at
  };
}

// Helper to save base64 photo directly to Cloudflare R2
async function saveToR2(
  bucket: R2Bucket | undefined,
  dataUri: string,
  keyPrefix: string,
  filenameSuffix: string
): Promise<{ key: string; url: string } | null> {
  if (!dataUri || !dataUri.startsWith('data:')) return null;

  const parsed = parseBase64DataUrl(dataUri);
  if (!parsed) return null;

  const ext = parsed.contentType.includes('png') ? 'png' : parsed.contentType.includes('pdf') ? 'pdf' : 'jpg';
  const key = `guests/${keyPrefix}/${filenameSuffix}_${Date.now()}.${ext}`;

  if (bucket) {
    await bucket.put(key, parsed.buffer, {
      httpMetadata: {
        contentType: parsed.contentType,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    });
    return {
      key,
      url: `/api/uploads/${key}`
    };
  }

  // Fallback to data URI if R2 bucket is not yet active
  return {
    key: `local_${key}`,
    url: dataUri
  };
}

// Helper to format and send email notification to host
async function sendNotificationEmail(
  env: Bindings,
  payload: CheckInPayload,
  insertedGuests: Submission[],
  reqUrl: string
): Promise<{ sent: boolean; method?: string; recipient?: string; error?: string }> {
  const targetEmail = env.NOTIFICATION_EMAIL || 'elitehomeskokrajhar@gmail.com';
  const primaryGuest = insertedGuests[0] || (payload.guests && payload.guests[0]) || { guestName: 'Guest' };
  const guestName = primaryGuest.guestName || (primaryGuest as any).name || 'New Guest';
  const reservationCode = payload.reservationCode || 'DIRECT';
  const propertyOption = payload.propertyOption || 'Property';

  let baseUrl = 'https://airbnb-management.elitehomes-portal.workers.dev';
  try {
    const urlObj = new URL(reqUrl);
    baseUrl = urlObj.origin;
  } catch (e) {}

  const portalUrl = 'https://airbnb-portal.pages.dev/admin.html';

  // Build guests HTML list with direct links to R2 documents
  const guestsListHtml = insertedGuests.map((g, idx) => {
    const frontLink = g.frontPhotoUrl ? (g.frontPhotoUrl.startsWith('http') ? g.frontPhotoUrl : `${baseUrl}${g.frontPhotoUrl}`) : '';
    const backLink = g.backPhotoUrl ? (g.backPhotoUrl.startsWith('http') ? g.backPhotoUrl : `${baseUrl}${g.backPhotoUrl}`) : '';
    const phoneClean = (g.phone || '').replace(/[^0-9]/g, '');
    const waLink = phoneClean ? `https://wa.me/${phoneClean}` : '';

    return `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:#0f172a; font-size:15px;">Guest #${idx + 1}: ${g.guestName} ${g.age ? `(${g.age} yrs)` : ''}</h4>
        <p style="margin:4px 0; font-size:13px; color:#475569;"><strong>Phone:</strong> ${g.phone || 'N/A'} ${waLink ? ` &bull; <a href="${waLink}" style="color:#059669; font-weight:600; text-decoration:none;">💬 WhatsApp Guest</a>` : ''}</p>
        <p style="margin:4px 0; font-size:13px; color:#475569;"><strong>Email:</strong> ${g.email || 'N/A'}</p>
        <p style="margin:4px 0; font-size:13px; color:#475569;"><strong>ID Type:</strong> ${g.idType || 'Aadhaar Card'}</p>
        <div style="margin-top:10px; display:flex; gap:10px;">
          ${frontLink ? `<a href="${frontLink}" target="_blank" style="display:inline-block; background:#0284c7; color:#ffffff; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none;">🪪 View Front ID</a>` : ''}
          ${backLink ? `<a href="${backLink}" target="_blank" style="display:inline-block; background:#0284c7; color:#ffffff; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; text-decoration:none;">🪪 View Back ID</a>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const sigUrl = insertedGuests[0]?.signatureUrl
    ? (insertedGuests[0].signatureUrl.startsWith('http') ? insertedGuests[0].signatureUrl : `${baseUrl}${insertedGuests[0].signatureUrl}`)
    : '';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f1f5f9; padding:24px; margin:0;">
      <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background:#FF385C; padding:20px 24px; color:#ffffff;">
          <h2 style="margin:0; font-size:20px; font-weight:700;">🛎️ New Guest Pre-Check-in Submission</h2>
          <p style="margin:4px 0 0; font-size:13px; opacity:0.9;">Elite Homes &bull; Kokrajhar Guest Verification</p>
        </div>

        <!-- Body -->
        <div style="padding:24px;">
          <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:12px 16px; margin-bottom:20px; border-radius:4px;">
            <p style="margin:0; font-size:14px; color:#1e40af;">
              <strong>${guestName}</strong> has completed pre-check-in verification for <strong>${propertyOption}</strong>. ID documents are safely stored in Cloudflare R2 bucket <code>xsquareguestid</code>.
            </p>
          </div>

          <h3 style="margin:0 0 12px; font-size:16px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">Stay Details</h3>
          <table style="width:100%; font-size:13px; color:#334155; margin-bottom:20px; border-collapse:collapse;">
            <tr><td style="padding:6px 0; width:140px; font-weight:600;">Booking Code:</td><td><strong style="color:#0f172a;">${reservationCode}</strong></td></tr>
            <tr><td style="padding:6px 0; font-weight:600;">Room / Property:</td><td>${propertyOption}</td></tr>
            <tr><td style="padding:6px 0; font-weight:600;">Dates:</td><td>📅 ${payload.checkInDate || 'N/A'} ➔ ${payload.checkOutDate || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0; font-weight:600;">Arrival Time:</td><td>🕒 ${payload.arrivalTime || 'N/A'}</td></tr>
            <tr><td style="padding:6px 0; font-weight:600;">Total Guests:</td><td>👥 ${payload.totalGuests || insertedGuests.length}</td></tr>
            ${payload.comingFrom ? `<tr><td style="padding:6px 0; font-weight:600;">Coming From:</td><td>${payload.comingFrom}</td></tr>` : ''}
            ${payload.goingTo ? `<tr><td style="padding:6px 0; font-weight:600;">Going To:</td><td>${payload.goingTo}</td></tr>` : ''}
            ${payload.purposeOfVisit ? `<tr><td style="padding:6px 0; font-weight:600;">Purpose:</td><td>${payload.purposeOfVisit}</td></tr>` : ''}
          </table>

          <h3 style="margin:0 0 12px; font-size:16px; color:#0f172a; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">Guest Information &amp; ID Documents</h3>
          ${guestsListHtml}

          ${sigUrl ? `
            <div style="margin-top:16px; padding:12px; background:#fafafa; border:1px solid #e5e7eb; border-radius:8px;">
              <span style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:6px;">Guest Signature:</span>
              <img src="${sigUrl}" alt="Signature" style="max-height:60px; background:#fff; padding:4px; border:1px solid #d1d5db; border-radius:4px;">
            </div>
          ` : ''}

          <div style="margin-top:24px; text-align:center;">
            <a href="${portalUrl}" target="_blank" style="display:inline-block; background:#FF385C; color:#ffffff; font-weight:600; padding:12px 24px; border-radius:8px; text-decoration:none; font-size:14px;">
              Open Admin Portal
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc; border-top:1px solid #e2e8f0; padding:14px 24px; text-align:center; font-size:12px; color:#64748b;">
          Automated notification delivered by Cloudflare Worker &bull; Elite Homes Kokrajhar
        </div>

      </div>
    </body>
    </html>
  `;

  const subject = `🛎️ New Check-in: ${guestName} — ${propertyOption} (${reservationCode})`;

  // 1. Send via Resend API if API Key is configured
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Elite Homes <onboarding@resend.dev>',
          to: [targetEmail],
          subject: subject,
          html: htmlBody
        })
      });

      if (res.ok) {
        console.log(`Notification email sent to ${targetEmail} via Resend`);
        return { sent: true, method: 'resend', recipient: targetEmail };
      }

      // Check if Resend sandbox restricted the recipient to the account owner
      const errJson: any = await res.json().catch(() => null);
      if (errJson && errJson.message && errJson.message.includes('only send testing emails to your own email address')) {
        const match = errJson.message.match(/\(([^)]+@[^)]+)\)/);
        const fallbackEmail = match ? match[1] : null;
        if (fallbackEmail) {
          console.log(`Resend sandbox restriction: delivering notification to Resend owner email ${fallbackEmail}`);
          const retryRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Elite Homes <onboarding@resend.dev>',
              to: [fallbackEmail],
              subject: `[For: ${targetEmail}] ${subject}`,
              html: `<div style="background:#fef3c7; border:1px solid #fde68a; padding:10px 14px; border-radius:6px; margin-bottom:16px; font-size:13px; color:#92400e;">⚠️ <strong>Note:</strong> Delivered to your Resend account email (<code>${fallbackEmail}</code>). To receive directly at <code>${targetEmail}</code> without forwarding, sign up on Resend using your Google account (<code>${targetEmail}</code>) or add your domain at resend.com/domains.</div>` + htmlBody
            })
          });
          if (retryRes.ok) {
            console.log(`Delivered notification to fallback address ${fallbackEmail}`);
            return { sent: true, method: 'resend_fallback', recipient: fallbackEmail };
          }
        }
      } else {
        console.warn('Resend send failed:', errJson || (await res.text().catch(() => '')));
      }
    } catch (e: any) {
      console.error('Resend error:', e);
    }
  }

  // 2. Send via Webhook (Google Apps Script / Gmail) if configured
  if (env.EMAIL_WEBHOOK_URL) {
    try {
      const res = await fetch(env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetEmail,
          subject,
          html: htmlBody
        })
      });
      if (res.ok) {
        console.log(`Notification email sent to ${targetEmail} via Webhook`);
        return { sent: true, method: 'webhook' };
      }
    } catch (e: any) {
      console.error('Webhook send error:', e);
    }
  }

  // 3. Send via Cloudflare Native SEND_EMAIL binding if configured
  if (env.SEND_EMAIL && typeof env.SEND_EMAIL.send === 'function') {
    try {
      await env.SEND_EMAIL.send({
        from: { email: 'checkin@elitehomes.in', name: 'Elite Homes' },
        to: [{ email: targetEmail }],
        subject,
        content: [
          { type: 'text/html', value: htmlBody },
          { type: 'text/plain', value: `Guest Check-in: ${guestName} - ${propertyOption} (${reservationCode})` }
        ]
      });
      console.log(`Notification email sent to ${targetEmail} via Cloudflare SEND_EMAIL`);
      return { sent: true, method: 'cloudflare_send_email' };
    } catch (e: any) {
      console.error('Cloudflare send_email error:', e);
    }
  }

  console.log(`Email notification prepared for ${targetEmail} (awaiting provider credentials: RESEND_API_KEY, EMAIL_WEBHOOK_URL, or SEND_EMAIL binding)`);
  return { sent: false, error: 'No active email provider credential set' };
}

// 1. GET /api/submissions - List all guest check-in submissions
submissionsRoute.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM submissions ORDER BY created_at DESC`
    ).all();

    const submissions = (results || []).map(mapDbRowToSubmission);
    return c.json({ success: true, count: submissions.length, data: submissions });
  } catch (err: any) {
    console.error('Error fetching submissions:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. POST /api/submissions - Receive Guest Registration Form from index.html
submissionsRoute.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as CheckInPayload;

    const reservationCode = (body.reservationCode || 'DIRECT').replace(/[^a-zA-Z0-9_-]/g, '');
    const propertyOption = body.propertyOption || '1 BHK';
    const checkInDate = body.checkInDate || '';
    const checkOutDate = body.checkOutDate || '';
    const arrivalTime = body.arrivalTime || '';
    const totalGuests = Number(body.totalGuests) || (body.guests ? body.guests.length : 1);
    const comingFrom = body.comingFrom || '';
    const goingTo = body.goingTo || '';
    const purposeOfVisit = body.purposeOfVisit || '';
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const customDetailsObj = Object.assign({}, body.customDetails || {}, { groupId });
    const customDetailsStr = JSON.stringify(customDetailsObj);

    // 1. Handle Digital Signature to R2
    let signatureKey = '';
    let signatureUrl = '';
    if (body.signature) {
      const sigUpload = await saveToR2(c.env.IMAGES_BUCKET, body.signature, reservationCode, 'signature');
      if (sigUpload) {
        signatureKey = sigUpload.key;
        signatureUrl = sigUpload.url;
      }
    }

    // 2. Process each guest in the party
    const guests = body.guests && Array.isArray(body.guests) ? body.guests : [];
    if (guests.length === 0) {
      return c.json({ success: false, error: 'At least one guest is required.' }, 400);
    }

    const insertedRows: Submission[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const guestId = `sub_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      const guestNumLabel = `Guest #${i + 1} ${g.isPrimary || i === 0 ? '(Primary)' : ''}`;
      const guestCleanName = (g.name || `Guest ${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');

      // Upload Front ID to R2
      let frontKey = '';
      let frontUrl = '';
      if (g.frontPhoto) {
        const up = await saveToR2(c.env.IMAGES_BUCKET, g.frontPhoto, reservationCode, `guest_${i + 1}_${guestCleanName}_front`);
        if (up) {
          frontKey = up.key;
          frontUrl = up.url;
        }
      }

      // Upload Back ID to R2
      let backKey = '';
      let backUrl = '';
      if (g.backPhoto) {
        const up = await saveToR2(c.env.IMAGES_BUCKET, g.backPhoto, reservationCode, `guest_${i + 1}_${guestCleanName}_back`);
        if (up) {
          backKey = up.key;
          backUrl = up.url;
        }
      }

      await c.env.DB.prepare(`
        INSERT INTO submissions (
          id, reservation_code, property_option, check_in_date, check_out_date,
          arrival_time, total_guests, guest_number, guest_name, age, phone, email,
          coming_from, going_to, purpose_of_visit, custom_details,
          id_type, id_number,
          front_photo_key, front_photo_url,
          back_photo_key, back_photo_url,
          signature_key, signature_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        guestId, reservationCode, propertyOption, checkInDate, checkOutDate,
        arrivalTime, totalGuests, guestNumLabel, g.name || '', g.age || null, g.phone || '', g.email || '',
        comingFrom, goingTo, purposeOfVisit, customDetailsStr,
        g.idType || 'Aadhaar Card', g.idNumber || '',
        frontKey, frontUrl,
        backKey, backUrl,
        signatureKey, signatureUrl,
        now
      ).run();

      insertedRows.push({
        id: guestId,
        reservationCode,
        propertyOption,
        checkInDate,
        checkOutDate,
        guestNumber: guestNumLabel,
        guestName: g.name || '',
        phone: g.phone || '',
        frontPhotoUrl: frontUrl,
        backPhotoUrl: backUrl,
        signatureUrl
      });
    }

    // Send automated email notification to host (elitehomeskokrajhar@gmail.com)
    try {
      await sendNotificationEmail(c.env, body, insertedRows, c.req.url);
    } catch (mailErr) {
      console.error('Email notification background error:', mailErr);
    }

    return c.json({
      success: true,
      message: `Successfully registered ${guests.length} guest(s). ID cards safely stored in Cloudflare R2.`,
      reservationCode,
      data: insertedRows
    }, 201);
  } catch (err: any) {
    console.error('Submission error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. DELETE /api/submissions/:id - Delete an individual submission or comma-separated batch of IDs, and clean up R2 images
submissionsRoute.delete('/:id', async (c) => {
  try {
    const rawId = decodeURIComponent(c.req.param('id') || '');
    const ids = rawId.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return c.json({ success: false, error: 'No submission ID provided' }, 400);
    }

    let deletedCount = 0;
    for (const id of ids) {
      const row = await c.env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first<any>();
      if (row) {
        if (c.env.IMAGES_BUCKET) {
          const keys = [row.front_photo_key, row.back_photo_key, row.signature_key].filter(Boolean);
          for (const k of keys) {
            if (!k.startsWith('local_')) {
              await c.env.IMAGES_BUCKET.delete(k).catch(() => {});
            }
          }
        }
        await c.env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run();
        deletedCount++;
      }
    }

    return c.json({ success: true, message: `Deleted ${deletedCount} submission record(s) successfully` });
  } catch (err: any) {
    console.error('Delete submission error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 4. DELETE /api/submissions - Purge all submissions and clean up all uploaded R2 images
submissionsRoute.delete('/', async (c) => {
  try {
    if (c.env.IMAGES_BUCKET) {
      const { results } = await c.env.DB.prepare(
        'SELECT front_photo_key, back_photo_key, signature_key FROM submissions'
      ).all<any>();

      if (results && results.length > 0) {
        for (const row of results) {
          const keys = [row.front_photo_key, row.back_photo_key, row.signature_key].filter(Boolean);
          for (const k of keys) {
            if (!k.startsWith('local_')) {
              await c.env.IMAGES_BUCKET.delete(k).catch(() => {});
            }
          }
        }
      }
    }

    await c.env.DB.prepare('DELETE FROM submissions').run();
    return c.json({ success: true, message: 'All submissions cleared successfully' });
  } catch (err: any) {
    console.error('Purge submissions error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default submissionsRoute;
