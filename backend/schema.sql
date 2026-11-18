-- ==============================================================================
-- Cloudflare D1 Database Schema: Airbnb Multi-Property Portal
-- ==============================================================================

-- 1. Bookings Table (1 BHK, 2 BHK, Studio)
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,                   -- '1 BHK', '2 BHK', '1 Room / Studio'
    guest_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    check_in_date TEXT NOT NULL,              -- YYYY-MM-DD
    check_out_date TEXT NOT NULL,             -- YYYY-MM-DD
    nights INTEGER NOT NULL DEFAULT 1,
    guests_count INTEGER NOT NULL DEFAULT 1,
    platform TEXT NOT NULL DEFAULT 'Direct',  -- 'Direct', 'Booking.com', 'Airbnb', 'Blocked'
    booking_mode TEXT,                        -- 'Airbnb', 'Booking.com', 'Direct Booking', 'Manual Booking', 'Blocked'
    reservation_code TEXT,
    external_reservation_id TEXT,
    external_uid TEXT,
    payout TEXT,                              -- e.g. '₹2,500'
    total_price REAL,
    currency TEXT DEFAULT 'INR',
    taxes_fees REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'Pay on Arrival', -- 'Paid', 'Paid in Full', 'Deposit Paid', 'Pay on Arrival'
    ota_payout_status TEXT DEFAULT 'N/A',     -- 'Pending Settlement', 'Settled', 'N/A'
    status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Confirmed', 'Checked In', 'Completed', 'Cancelled', 'Blocked'
    notes TEXT,
    id_documents TEXT,
    sync_version INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property);
CREATE INDEX IF NOT EXISTS idx_bookings_external_uid ON bookings(external_uid);
CREATE INDEX IF NOT EXISTS idx_bookings_ext_res_id ON bookings(external_reservation_id);

-- 2. Properties / Rooms Table (Multi-room management, OTA Mappings & Two-Way Sync)
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,                -- e.g. 'Ripple 1 BHK', '2 BHK', 'Demilune', 'Luna (Studio Room)'
    color TEXT DEFAULT '#FF385C',             -- Calendar badge color
    airbnb_listing_id TEXT,                   -- Airbnb Room / Listing ID
    booking_com_property_id TEXT,             -- Booking.com Room / Property ID
    airbnb_ical_url TEXT,                     -- Inbound Airbnb iCal feed
    booking_com_ical_url TEXT,                -- Inbound Booking.com iCal feed
    other_ical_url TEXT,                      -- Other OTA/VRBO/Google Calendar feed
    airbnb_webhook_url TEXT,                  -- Optional real-time outbound push URL (Airbnb API / Channex / Bridge)
    booking_com_webhook_url TEXT,             -- Optional real-time outbound push URL (Booking.com API / Channex / Bridge)
    sync_webhook_secret TEXT,                 -- Shared secret for inbound/outbound webhook verification
    last_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Operating Expenses Table (Electricity, Wi-Fi, Water, Cleaning, Maintenance)
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,                      -- e.g. 'October Electricity Bill'
    amount REAL NOT NULL,                     -- e.g. 2400.00
    category TEXT NOT NULL,                   -- 'Electricity / Power', 'Water', 'Internet', 'Cleaning', 'Maintenance', 'Supplies', 'Other'
    date TEXT NOT NULL,                       -- YYYY-MM-DD
    property TEXT DEFAULT 'All Units',        -- '1 BHK', '2 BHK', 'Studio', 'All Units'
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property);

-- 4. Guest Submissions & Check-ins Table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    reservation_code TEXT,
    property_option TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    arrival_time TEXT,
    total_guests INTEGER DEFAULT 1,
    guest_number TEXT,                       -- e.g. 'Guest #1 (Primary)'
    guest_name TEXT NOT NULL,
    age INTEGER,
    phone TEXT,
    email TEXT,
    coming_from TEXT,
    going_to TEXT,
    purpose_of_visit TEXT,
    custom_details TEXT,                     -- JSON payload for extra fields
    id_type TEXT,                            -- 'Aadhaar Card', 'Passport', 'Voter ID', 'Driving License'
    id_number TEXT,
    front_photo_key TEXT,                    -- R2 storage key
    front_photo_url TEXT,                    -- Stream/Public URL
    back_photo_key TEXT,                     -- R2 storage key
    back_photo_url TEXT,                     -- Stream/Public URL
    signature_key TEXT,                      -- R2 storage key
    signature_url TEXT,                      -- Stream/Public URL
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submissions_code ON submissions(reservation_code);
CREATE INDEX IF NOT EXISTS idx_submissions_dates ON submissions(check_in_date);

-- 3. Application Configuration Table (PIN, Host Info, Custom Form Fields)
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,                     -- JSON serialized config
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Persistent iCal Sync Audit & Error Logs (Per Room & Per Channel)
CREATE TABLE IF NOT EXISTS ical_sync_logs (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,
    source TEXT NOT NULL,                    -- 'Airbnb' | 'Booking.com'
    trigger_type TEXT NOT NULL DEFAULT 'manual', -- 'cron' | 'manual'
    status TEXT NOT NULL,                    -- 'success' | 'warning' | 'error'
    events_found INTEGER DEFAULT 0,
    imported INTEGER DEFAULT 0,
    updated INTEGER DEFAULT 0,
    cancelled INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    conflicts INTEGER DEFAULT 0,
    message TEXT,
    error_detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ical_logs_created ON ical_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_prop_uid ON bookings(property, external_uid);

-- 6. Atomic Room Inventory Locks (Simultaneous Booking Protection)
CREATE TABLE IF NOT EXISTS inventory_locks (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,
    lock_token TEXT NOT NULL,
    source TEXT NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inv_locks_prop ON inventory_locks(property, expires_at);

-- 7. Outbound Availability Sync Queue (Real-Time Push + Retries + iCal Pull Readiness)
CREATE TABLE IF NOT EXISTS sync_outbox (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,
    channel TEXT NOT NULL,                   -- 'Airbnb' | 'Booking.com'
    event_type TEXT NOT NULL,                -- 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'block_created' | 'reconcile'
    booking_id TEXT,
    payload TEXT NOT NULL,                   -- JSON authoritative availability snapshot + delta
    delivery_mode TEXT NOT NULL DEFAULT 'ical_pull', -- 'webhook_push' | 'ical_pull'
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'retrying' | 'acknowledged' | 'feed_ready' | 'failed'
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_retry_at TEXT,
    last_error TEXT,
    acknowledged_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_created ON sync_outbox(created_at DESC);

-- 8. Complete Availability & Booking Audit Trail
CREATE TABLE IF NOT EXISTS availability_audit_logs (
    id TEXT PRIMARY KEY,
    property TEXT NOT NULL,
    booking_id TEXT,
    action TEXT NOT NULL,                    -- 'created' | 'imported' | 'modified' | 'cancelled' | 'conflict_detected' | 'availability_pushed'
    source TEXT NOT NULL,
    booking_mode TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    previous_state TEXT,
    new_state TEXT,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_avail_audit_created ON availability_audit_logs(created_at DESC);
