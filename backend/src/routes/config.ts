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
  bankDetails: {
    bankName: "UCO Bank",
    accountName: "Elite Homes",
    accountNumber: "04990110124666",
    ifsc: "UCBA0000499",
    upiId: "bobuco@ybl",
    qrCodeUrl: ""
  },
  propertyOptions: [
    "1 Room / Studio",
    "1 BHK",
    "2 BHK"
  ],
  defaultPropertyOption: "1 BHK",
  standardFields: [
    { id: "comingFrom", label: "Coming From", type: "text", section: "Travel Details", placeholder: "City / State (e.g. Guwahati)", required: true, enabled: true },
    { id: "goingTo", label: "Going To", type: "text", section: "Travel Details", placeholder: "City / State (e.g. Kokrajhar)", required: true, enabled: true },
    { id: "purposeOfVisit", label: "Purpose of Visit", type: "select", section: "Trip Purpose", required: true, enabled: true },
    { id: "totalGuests", label: "Number of Persons", type: "stepper", section: "Guests & ID", required: true, enabled: true },
    { id: "guestFullName", label: "Full Name (Per Person)", type: "text", section: "Guests & ID", required: true, enabled: true },
    { id: "guestAge", label: "Age (Per Person)", type: "number", section: "Guests & ID", required: true, enabled: true },
    { id: "guestIdType", label: "ID Document Type (Per Person)", type: "select", section: "Guests & ID", required: true, enabled: true },
    { id: "guestIdFront", label: "Front ID Photo Upload (Per Person)", type: "file", section: "Guests & ID", required: true, enabled: true },
    { id: "guestIdBack", label: "Back ID Photo Upload (Per Person)", type: "file", section: "Guests & ID", required: false, enabled: true },
    { id: "arrivalTime", label: "Estimated Arrival Time", type: "text", section: "Extra Stay Details", placeholder: "e.g. 2:30 PM", required: false, enabled: false },
    { id: "guestPhoneInput", label: "Phone / WhatsApp Number", type: "tel", section: "Extra Stay Details", placeholder: "+91 98765 43210", required: false, enabled: false },
    { id: "guestEmailInput", label: "Email Address", type: "email", section: "Extra Stay Details", placeholder: "guest@example.com", required: false, enabled: false },
    { id: "rulesConsent", label: "House Rules Agreement", type: "checkbox", section: "House Rules", required: true, enabled: false }
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
