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
    const customDetailsStr = body.customDetails ? JSON.stringify(body.customDetails) : '';

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

// 3. DELETE /api/submissions/:id - Delete an individual submission and clean up R2 images
submissionsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const row = await c.env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first<any>();
    if (!row) {
      return c.json({ success: false, error: 'Submission not found' }, 404);
    }

    if (c.env.IMAGES_BUCKET) {
      const keys = [row.front_photo_key, row.back_photo_key, row.signature_key].filter(Boolean);
      for (const k of keys) {
        if (!k.startsWith('local_')) {
          await c.env.IMAGES_BUCKET.delete(k).catch(() => {});
        }
      }
    }

    await c.env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: 'Submission deleted successfully' });
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
