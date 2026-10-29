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
    reservation_code TEXT,
    external_uid TEXT,
    payout TEXT,                              -- e.g. '₹2,500'
    payment_status TEXT DEFAULT 'Pay on Arrival', -- 'Paid in Full', 'Deposit Paid', 'Pay on Arrival'
    status TEXT NOT NULL DEFAULT 'Confirmed', -- 'Confirmed', 'Checked In', 'Completed', 'Cancelled', 'Blocked'
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property);
CREATE INDEX IF NOT EXISTS idx_bookings_external_uid ON bookings(external_uid);

-- 2. Properties / Rooms Table (Multi-room management & iCal Sync)
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,                -- e.g. '1 BHK', '2 BHK', 'Studio'
    color TEXT DEFAULT '#FF385C',             -- Calendar badge color
    airbnb_ical_url TEXT,                     -- Inbound Airbnb iCal feed
    booking_com_ical_url TEXT,                -- Inbound Booking.com iCal feed
    other_ical_url TEXT,                      -- Other OTA/VRBO/Google Calendar feed
    last_synced_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Guest Submissions & Check-ins Table
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
