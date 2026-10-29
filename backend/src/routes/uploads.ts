import { Hono } from 'hono';
import { Bindings } from '../types';

const uploadsRoute = new Hono<{ Bindings: Bindings }>();

// Helper to convert base64 data URL to ArrayBuffer
export function parseBase64DataUrl(dataUrl: string): { buffer: ArrayBuffer; contentType: string } | null {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  const contentType = matches[1];
  const b64Data = matches[2];
  const binaryStr = atob(b64Data);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { buffer: bytes.buffer, contentType };
}

// 1. POST /api/uploads - Upload an image (base64 JSON or FormData) directly to Cloudflare R2
uploadsRoute.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    let buffer: ArrayBuffer;
    let mimeType = 'image/jpeg';
    let filename = `upload_${Date.now()}.jpg`;
    let folder = 'general';

    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      const base64Str = body.data || body.image || body.base64;
      if (!base64Str) {
        return c.json({ success: false, error: 'No image data provided' }, 400);
      }

      const parsed = parseBase64DataUrl(base64Str);
      if (!parsed) {
        return c.json({ success: false, error: 'Invalid base64 image data URI' }, 400);
      }
      buffer = parsed.buffer;
      mimeType = parsed.contentType;
      folder = body.folder || body.reservationCode || 'guests';
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      filename = `${body.name || body.type || 'img'}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return c.json({ success: false, error: 'No file found in form data' }, 400);
      }
      buffer = await file.arrayBuffer();
      mimeType = file.type || 'image/jpeg';
      folder = (formData.get('folder') as string) || (formData.get('reservationCode') as string) || 'guests';
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      filename = `${Date.now()}_${cleanName}`;
    } else {
      return c.json({ success: false, error: 'Unsupported Content-Type. Use application/json or multipart/form-data.' }, 400);
    }

    const key = `uploads/${folder}/${filename}`;

    // Upload to Cloudflare R2
    await c.env.IMAGES_BUCKET.put(key, buffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    const publicUrl = `/api/uploads/${key}`;

    return c.json({
      success: true,
      key,
      url: publicUrl,
      size: buffer.byteLength,
      mimeType
    });
  } catch (err: any) {
    console.error('R2 Upload error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. GET /api/uploads/* - Serve an image from Cloudflare R2 bucket with streaming & cache headers
uploadsRoute.get('/*', async (c) => {
  try {
    const rawKey = c.req.path.replace(/^\/api\/uploads\/?/, '');
    const key = decodeURIComponent(rawKey);

    if (!key) {
      return c.json({ error: 'Missing key' }, 400);
    }

    const object = await c.env.IMAGES_BUCKET.get(key);
    if (!object) {
      return c.text('Image not found in R2 bucket', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  } catch (err: any) {
    console.error('R2 Get error:', err);
    return c.text('Error retrieving file from R2', 500);
  }
});

export default uploadsRoute;
