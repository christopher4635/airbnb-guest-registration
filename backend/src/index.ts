import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Bindings } from './types';
import bookingsRoute from './routes/bookings';
import submissionsRoute from './routes/submissions';
import uploadsRoute from './routes/uploads';
import configRoute from './routes/config';

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

export default app;
