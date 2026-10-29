import { Hono } from 'hono';
import { Bindings } from '../types';

const configRoute = new Hono<{ Bindings: Bindings }>();

const DEFAULT_CONFIG = {
  adminPin: "4635",
  hostContact: {
    phone: "+917002293073",
    instagramUrl: "https://www.instagram.com/elitehomes.kokrajhar/",
    instagramHandle: "Elite Homes"
  },
  propertyOptions: [
    "1 Room / Studio",
    "1 BHK",
    "2 BHK"
  ],
  defaultPropertyOption: "1 BHK",
  standardFields: [
    {
      id: "propertyOption",
      label: "Property / Room Type",
      type: "select",
      required: true,
      enabled: true,
      helpText: "Select the room or unit booked"
    },
    {
      id: "totalGuests",
      label: "Total Number of Guests",
      type: "stepper",
      required: true,
      enabled: true
    },
    {
      id: "comingFrom",
      label: "Coming From",
      type: "text",
      placeholder: "City / Country (Origin)",
      required: true,
      enabled: true
    },
    {
      id: "goingTo",
      label: "Going To",
      type: "text",
      placeholder: "City / Country (Next Destination)",
      required: true,
      enabled: true
    },
    {
      id: "purposeOfVisit",
      label: "Purpose of Visit",
      type: "select",
      options: [
        "Vacation / Tourism / Sightseeing",
        "Business / Official Work / Conference",
        "Visiting Family / Friends",
        "Transit / Short Stay",
        "Medical / Healthcare",
        "Other"
      ],
      required: true,
      enabled: true
    }
  ],
  customFields: [],
  rulesText: "1. Check-in after 2:00 PM, Check-out by 11:00 AM.\n2. Valid government ID required for all staying guests.\n3. No unauthorized extra visitors or parties.\n4. Please keep noise to a minimum after 10:00 PM."
};

// 1. GET /api/config - Retrieve configuration
configRoute.get('/', async (c) => {
  try {
    const row = await c.env.DB.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
    if (row && row.value) {
      try {
        const parsed = JSON.parse(row.value as string);
        return c.json({ success: true, data: parsed });
      } catch (e) {}
    }

    // Default configuration if not set in D1
    return c.json({ success: true, data: DEFAULT_CONFIG });
  } catch (err: any) {
    console.error('Config fetch error:', err);
    return c.json({ success: false, data: DEFAULT_CONFIG, error: err.message });
  }
});

// 2. POST /api/config - Update configuration (with PIN check)
configRoute.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const pin = c.req.header('X-Admin-Pin') || body.adminPinAuth;

    // Verify PIN against existing config
    const current = await c.env.DB.prepare(`SELECT value FROM app_config WHERE key = 'app_config'`).first();
    let expectedPin = c.env.ADMIN_PIN || "4635";
    if (current && current.value) {
      try {
        const parsed = JSON.parse(current.value as string);
        if (parsed.adminPin) expectedPin = parsed.adminPin;
      } catch (e) {}
    }

    if (pin && pin !== expectedPin) {
      return c.json({ success: false, error: 'Unauthorized: Invalid Admin PIN' }, 401);
    }

    const newConfig = { ...DEFAULT_CONFIG, ...body };
    // Remove auth parameter if passed in body
    delete newConfig.adminPinAuth;

    const valueStr = JSON.stringify(newConfig);
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO app_config (key, value, updated_at) 
      VALUES ('app_config', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).bind(valueStr, now).run();

    return c.json({ success: true, message: 'Configuration saved in D1', data: newConfig });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default configRoute;
