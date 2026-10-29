-- ==============================================================================
-- Cloudflare D1 Database Seed: Confirmed Live Bookings & Initial Config
-- ==============================================================================

-- Clear previous test data
DELETE FROM bookings;
DELETE FROM submissions;
DELETE FROM app_config;

-- 1. Insert Actual Real Bookings
INSERT INTO bookings (
    id, property, guest_name, phone, email,
    check_in_date, check_out_date, nights, guests_count,
    platform, reservation_code, payout, payment_status, status, notes
) VALUES
-- Booking 1: 1 BHK Offline Guest (Oct 29-31)
(
    'bk_real_1bhk_1', '1 BHK', 'Offline Guest', '', '',
    '2026-10-29', '2026-10-31', 2, 2,
    'Direct', 'OFFLINE-1029', '₹2,500', 'Deposit Paid', 'Checked In',
    'Booked Rate: ₹2,500 | Advance Paid: ₹1,000 | Booking Mode: Offline'
),
-- Booking 2: 2 BHK Offline Guest (Oct 29-31)
(
    'bk_real_2bhk_1', '2 BHK', 'Offline Guest', '', '',
    '2026-10-29', '2026-10-31', 2, 2,
    'Direct', 'OFFLINE-1029', '₹2,500', 'Deposit Paid', 'Checked In',
    'Booked Rate: ₹2,500 | Advance Paid: ₹1,000 | Booking Mode: Offline'
),
-- Booking 3: 2 BHK Adhikari Anuj (Oct 31 - Nov 1)
(
    'bk_real_2bhk_2', '2 BHK', 'Adhikari Anuj', '', '',
    '2026-10-31', '2026-11-01', 1, 2,
    'Booking.com', 'BK-ANUJ', '₹4,000', 'Pay on Arrival', 'Confirmed',
    'Booked Rate: ₹4,000 | Advance: ₹0 | Booking Mode: Booking.com'
),
-- Booking 4: 2 BHK Nikunjan (Nov 1 - Nov 8)
(
    'bk_real_2bhk_3', '2 BHK', 'Nikunjan', '', '',
    '2026-11-01', '2026-11-08', 7, 2,
    'Direct', 'OFFLINE-NIK', '₹18,900', 'Pay on Arrival', 'Confirmed',
    'Booked Rate: ₹2,700/night (Total: ₹18,900) | Advance: ₹0 | Booking Mode: Offline'
),
-- Booking 5: 2 BHK Faucauld Laurent (Nov 8 - Nov 11)
(
    'bk_real_2bhk_4', '2 BHK', 'Faucauld Laurent', '', '',
    '2026-11-08', '2026-11-11', 3, 2,
    'Booking.com', 'BK-LAURENT', '₹9,405', 'Pay on Arrival', 'Confirmed',
    'Booked Rate: ₹3,135/night (Total: ₹9,405) | Advance: ₹0 | Booking Mode: Booking.com'
),
-- Booking 6: 2 BHK Kaudek Sonia (Nov 11 - Nov 15)
(
    'bk_real_2bhk_5', '2 BHK', 'Kaudek Sonia', '', '',
    '2026-11-11', '2026-11-15', 4, 2,
    'Booking.com', 'BK-SONIA', '₹16,000', 'Pay on Arrival', 'Confirmed',
    'Booked Rate: ₹16,000 (₹4,000/night) | Advance: ₹0 | Booking Mode: Booking.com'
);

-- 2. Seed Guest Submissions
INSERT INTO submissions (
    id, reservation_code, property_option, check_in_date, check_out_date,
    arrival_time, total_guests, guest_number, guest_name, age, phone, email,
    coming_from, going_to, purpose_of_visit, id_type, custom_details
) VALUES
(
    'sub_real_1', 'OFFLINE-1029', '1 BHK & 2 BHK', '2026-10-29', '2026-10-31',
    '14:00', 2, 'Guest #1 (Primary)', 'Offline Guest', 32, '+91 98765 43210', 'guest@directstay.in',
    'Guwahati', 'Kokrajhar', 'Personal Stay', 'Aadhaar Card',
    '{"rate": "₹2,500", "advance": "₹1,000", "mode": "Offline"}'
),
(
    'sub_real_2', 'BK-ANUJ', '2 BHK', '2026-10-31', '2026-11-01',
    '13:00', 2, 'Guest #1 (Primary)', 'Adhikari Anuj', 29, '+91 94350 12345', 'anuj.adhikari@gmail.com',
    'Siliguri', 'Kokrajhar', 'Vacation / Travel', 'Voter ID',
    '{"rate": "₹4,000", "advance": "₹0", "mode": "Booking.com"}'
),
(
    'sub_real_3', 'OFFLINE-NIK', '2 BHK', '2026-11-01', '2026-11-08',
    '15:00', 2, 'Guest #1 (Primary)', 'Nikunjan', 35, '+91 97060 98765', 'nikunjan.stay@outlook.com',
    'Bongaigaon', 'Kokrajhar', 'Business / Work', 'Driving License',
    '{"rate": "₹2,700/night", "total": "₹18,900", "mode": "Offline"}'
),
(
    'sub_real_4', 'BK-LAURENT', '2 BHK', '2026-11-08', '2026-11-11',
    '14:30', 2, 'Guest #1 (Primary)', 'Faucauld Laurent', 41, '+33 6 12 34 56 78', 'laurent.faucauld@free.fr',
    'Paris, France', 'Assam Tour', 'Tourism', 'Passport',
    '{"rate": "₹3,135/night", "total": "₹9,405", "mode": "Booking.com"}'
),
(
    'sub_real_5', 'BK-SONIA', '2 BHK', '2026-11-11', '2026-11-15',
    '12:00', 2, 'Guest #1 (Primary)', 'Kaudek Sonia', 38, '+49 151 2345678', 'sonia.kaudek@web.de',
    'Munich, Germany', 'North East India', 'Tourism', 'Passport',
    '{"rate": "₹16,000 total", "mode": "Booking.com"}'
);

-- 3. Seed App Config
INSERT INTO app_config (key, value) VALUES
(
    'app_config',
    '{"adminPin":"4635","hostContact":{"phone":"+917002293073","instagramUrl":"https://www.instagram.com/elitehomes.kokrajhar/","instagramHandle":"Elite Homes"},"propertyOptions":["1 Room / Studio","1 BHK","2 BHK"],"defaultPropertyOption":"1 BHK","standardFields":[{"id":"propertyOption","label":"Property / Room Type","type":"select","required":true,"enabled":true,"helpText":"Select the room or unit booked"},{"id":"totalGuests","label":"Total Number of Guests","type":"stepper","required":true,"enabled":true},{"id":"comingFrom","label":"Coming From","type":"text","placeholder":"City / Country (Origin)","required":true,"enabled":true},{"id":"goingTo","label":"Going To","type":"text","placeholder":"City / Country (Next Destination)","required":true,"enabled":true},{"id":"purposeOfVisit","label":"Purpose of Visit","type":"select","options":["Vacation / Tourism / Sightseeing","Business / Official Work / Conference","Visiting Family / Friends","Transit / Short Stay","Medical / Healthcare","Other"],"required":true,"enabled":true}],"customFields":[],"rulesText":"1. Check-in after 2:00 PM, Check-out by 11:00 AM.\\n2. Valid government ID required for all staying guests.\\n3. No unauthorized extra visitors or parties.\\n4. Please keep noise to a minimum after 10:00 PM."}'
);
