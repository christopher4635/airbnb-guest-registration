# Airbnb Multi-Property Booking Portal & Guest Registration System

A unified, mobile-friendly Host Management Portal and Guest ID Verification web application built specifically for Airbnb and vacation rental hosts managing multiple properties.

### Key Capabilities:
- **Unified 3-Property Bookings Calendar (`admin.html` & `portal.html`):** View all 3 of your Airbnb properties side-by-side in one place with distinctive color coding (1 BHK: Coral, 2 BHK: Emerald, Studio: Indigo).
- **Channel Manager Timeline View:** A visual horizontal timeline across the month (days 1–31) showing check-ins, check-outs, guest names, nights, and booking platforms with smooth auto-scroll to today.
- **Traditional Month Calendar View:** 7-column calendar showing all bookings, turnovers, and stays on any day.
- **Add / Edit Bookings in Real-Time:** Add new reservations as they arrive via Airbnb, Booking.com, WhatsApp, or phone.
- **Real-Time Double-Booking Conflict Detection:** Live warnings if you accidentally select dates that overlap with an existing booking on that property!
- **Quick Block Dates:** Block dates in 1 click for maintenance, deep cleaning, or personal owner stays.
- **Airbnb iCal Sync:** Paste Airbnb calendar export links to sync bookings automatically, or import `.ics` files.
- **1-Click WhatsApp & Guest Check-in Link:** Message guests on WhatsApp or send personalized ID verification links with pre-filled booking details.
- **Guest ID Verification Form (`index.html`):** Guests upload front & back ID photos and sign on their touchscreen without needing a Google account.
- **Google Drive & Sheets Integration (`google-apps-script.js`):** Automatically files guest IDs into dedicated Drive folders and logs bookings and check-in registries into Google Sheets.

---

## Accessing the Host Portal

You can access the portal locally or live on GitHub Pages:
- **Admin & Bookings Portal**: `https://christopher4635.github.io/airbnb-guest-registration/admin.html`
- **Fullscreen Bookings Portal**: `https://christopher4635.github.io/airbnb-guest-registration/portal.html`
- **Guest Check-in Form**: `https://christopher4635.github.io/airbnb-guest-registration/index.html`
- **Default Host PIN**: `4635` (can be customized in Admin Settings)

### What you can do in the Host Portal:
1. **Multi-Property Calendar**: Switch between Timeline view (Gantt grid), Month Grid view, and filterable Bookings List.
2. **Add / Edit Bookings**: Click any date directly on the calendar or click **+ Add Booking** to log new reservations with guest names, platforms, payout amounts, and status.
3. **Prevent Double-Bookings**: Automatic real-time conflict detector warns you if a unit is already occupied.
4. **Maintenance Blocks**: Use **Block Dates** to take a property off the calendar for cleaning or owner stays.
5. **Sync Airbnb iCal**: Export your calendar `.ics` links from Airbnb and sync them across all 3 listings.
6. **Backup & CSV**: Export JSON backups or download CSV spreadsheets anytime.
7. **Form Customization**: Add custom questions, change required fields, and edit house rules in the settings tab.

---

## Quick Start (Test Locally)

You can view and test the webform immediately:
1. Double-click [index.html](file:///Users/christopherbasumatary/FreelanceTime/index.html) in your file manager to open it in your browser, or
2. Run a simple local server:
   ```bash
   python3 -m http.server 8080
   ```
   and visit `http://localhost:8080`.

---

## 2-Minute Google Drive & Sheets Setup

To have submissions and ID photos automatically save into your own Google Drive and Google Sheets:

### Step 1: Create the Google Apps Script Webhook
1. Go to [script.google.com](https://script.google.com/) and click **+ New project**.
2. Delete any boilerplate code inside `Code.gs`.
3. Open [google-apps-script.js](file:///Users/christopherbasumatary/FreelanceTime/google-apps-script.js), copy the entire code, and paste it into the editor.
4. Click the **Save** icon (diskette or `Cmd+S` / `Ctrl+S`).

### Step 2: Deploy as a Web App
1. Click the blue **Deploy** button (top right) -> **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Configure the settings:
   - **Description**: `Airbnb Guest Verification Webhook`
   - **Execute as**: `Me (your email address)`
   - **Who has access**: **`Anyone`** *(Crucial: This lets your guests upload photos without needing to sign into Google).*
4. Click **Deploy**.
5. Google will ask you to authorize access:
   - Click *Review permissions* -> Choose your Google Account.
   - Click *Advanced* -> *Go to Untitled project (unsafe)* -> Click *Allow*.
6. Copy the generated **Web app URL** (it looks like `https://script.google.com/macros/s/AKfycbx.../exec`).

### Step 3: Link Webhook to your Webform
1. Open [index.html](file:///Users/christopherbasumatary/FreelanceTime/index.html).
2. Look around line 430 for:
   ```javascript
   const GOOGLE_SCRIPT_WEBHOOK_URL = "";
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const GOOGLE_SCRIPT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx.../exec";
   ```
4. Save the file!

Now, whenever a guest submits:
- A folder named `Airbnb Guest Verifications` will be created in your Google Drive.
- A subfolder like `2026-11-05 - John Doe (HM34XZ891)` will be created containing all front & back ID photos and the digital signature.
- A spreadsheet named `Airbnb Guest Registry` will record all details (Check-in, Check-out, Total Guests, Coming From, Going To, Purpose of Visit, and direct clickable links to the uploaded IDs).

---

## How to Share with Guests

You can host this single `index.html` file on any free web hosting service:
- **Netlify Drop**: Drag and drop the `FreelanceTime` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) to get a free live URL (e.g., `https://your-listing-checkin.netlify.app`) in 10 seconds.
- **GitHub Pages**: Push this repo to GitHub and enable Pages in repository settings.
- **Vercel / Cloudflare Pages**: Free static site hosting with custom domains.

### Pre-filling Information for Guests
You can send personalized links that automatically populate property and reservation info:
```
https://your-form-url.com/?code=HM8829X&property=Oceanview+Villa
```
- `?code=HM8829X` pre-fills the reservation code.
- `?property=Oceanview+Villa` customizes the form title to your property name.
