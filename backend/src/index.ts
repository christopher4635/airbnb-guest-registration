import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Bindings } from './types';
import bookingsRoute from './routes/bookings';
import submissionsRoute from './routes/submissions';
import uploadsRoute from './routes/uploads';
import configRoute from './routes/config';
import propertiesRoute from './routes/properties';
import icalRoute, { executeIcalSync } from './routes/ical';
import expensesRoute from './routes/expenses';
import channelsRoute from './routes/channels';

const app = new Hono<{ Bindings: Bindings }>();

// 1. Logging Middleware
app.use('*', logger());

// 2. CORS Middleware - allow frontend access from any origin (or custom specified)
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow localhost, Cloudflare Pages (*.pages.dev), or custom domain
      return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Pin'],
    exposeHeaders: ['Content-Length', 'ETag'],
    maxAge: 86400,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// 3. Health & Edge Info
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Airbnb Multi-Property Management API',
    runtime: 'Cloudflare Workers (Hono)',
    storage: {
      database: 'Cloudflare D1 (Edge SQLite)',
      images: 'Cloudflare R2 Bucket'
    }
  });
});

// 4. Mount API Routes
app.route('/api/bookings', bookingsRoute);
app.route('/api/submissions', submissionsRoute);
app.route('/api/uploads', uploadsRoute);
app.route('/api/config', configRoute);
app.route('/api/properties', propertiesRoute);
app.route('/api/ical', icalRoute);
app.route('/ical', icalRoute);
app.route('/api/expenses', expensesRoute);
app.route('/api/finances', expensesRoute);
app.route('/api/channels', channelsRoute);

// 4b. Common Unified Earnings Dashboard API
app.get('/api/dashboard/earnings', async (c) => {
  const month = c.req.query('month');
  try {
    const targetUrl = 'https://staff-management.elitehomes-portal.workers.dev/api/dashboard/earnings' + (month ? `?month=${encodeURIComponent(month)}` : '');
    
    // 1. First try Service Binding (In-memory edge call without HTTP)
    if (c.env.STAFF_SERVICE) {
      const sRes = await c.env.STAFF_SERVICE.fetch(targetUrl);
      if (sRes.ok) {
        const data = await sRes.json();
        return c.json(data);
      }
    }

    // 2. Fallback to direct HTTP fetch
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Cloudflare-Worker-AirbnbPortal)',
        'Accept': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return c.json(data);
    }
  } catch (e) {
    console.error('Error forwarding dashboard earnings request:', e);
  }
  return c.json({ error: 'Failed to retrieve unified dashboard data' }, 500);
});

// 5. 404 Handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint not found', path: c.req.path }, 404);
});

// 6. Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Worker error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error'
  }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Bindings, ctx: any) {
    console.log('[Cron] Triggering automatic 2-way iCal sync across Airbnb & Booking.com...');
    ctx.waitUntil(executeIcalSync(env, null, ctx).then((stats: any) => {
      console.log('[Cron] iCal sync completed:', stats.message);
    }).catch((err: any) => {
      console.error('[Cron] iCal sync failed:', err);
    }));
  }
};
