# Airbnb Guest Check-in & ID Verification Webform

A mobile-friendly, high-converting Guest Registration and ID Verification web application built specifically for Airbnb and vacation rental hosts.

### Why this is better than Google Forms:
- **No Google login required:** Guests can submit from mobile browsers (WhatsApp, Airbnb in-app browser, Safari, Chrome) without ever being forced to log into a Google Account.
- **Admin Panel (`admin.html`):** Add or remove fields, customize property types (1 BHK, 2 BHK, 1 Room, etc.), and set fields as required or optional with a PIN lock.
- **Dynamic Guest Fields:** Starts with **Total Number of Guests**. As the number changes, fields for each guest's Name, Age, and ID uploads appear automatically.
- **Property Type / Option:** Dropdown for 1 BHK, 2 BHK, 1 Room / Studio, Entire Villa, or custom options.
- **Address not required:** Streamlined according to your exact requirements.
- **Trip Information:** Includes mandatory **Coming From**, **Going To**, and **Purpose of Visit**.
- **Instant Camera Upload & Compression:** Photos taken with high-resolution smartphone cameras (15MB+) are compressed on the guest's device in real time, making uploads instant even on weak mobile connections.
- **Digital Signature Pad:** Guests sign on their phone touchscreen.
- **Google Drive & Sheets Integration:** Submissions are automatically filed into your Google Drive (in a dedicated folder per booking) and logged into an "Airbnb Guest Registry" Google Sheet with clickable links to each guest's ID photos.

---

## Host Admin Panel

You have a built-in admin dashboard to manage your form:
- **Live URL**: `https://christopher4635.github.io/airbnb-guest-registration/admin.html`
- **Host PIN**: `4635` (can be changed in the admin panel)

### What you can do in Admin:
1. **Property Types**: Add/remove options like `1 Room / Studio`, `1 BHK`, `2 BHK`, `3 BHK`, `Entire Villa`, etc.
2. **Standard Fields**: Enable/disable fields or change them between Required and Optional.
3. **Custom Questions**: Add your own questions (e.g., Vehicle Plate Number, Flight Number, Special Requests).
4. **House Rules**: Edit the house rules declaration text.

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
