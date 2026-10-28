/**
 * =========================================================================
 * AIRBNB GUEST VERIFICATION & ID UPLOADER - GOOGLE APPS SCRIPT
 * =========================================================================
 * 
 * This script runs in your Google account (script.google.com).
 * It receives submissions from your webform, automatically:
 * 1. Creates a dedicated folder in Google Drive for the booking.
 * 2. Saves all guest ID photos (Front & Back) + Signature directly to Drive.
 * 3. Logs all guest details, travel info (Coming from, Going to, Purpose),
 *    and clickable links to IDs into a Google Sheet.
 * 
 * -------------------------------------------------------------------------
 * HOW TO DEPLOY IN 2 MINUTES:
 * -------------------------------------------------------------------------
 * 1. Go to https://script.google.com and click "New project".
 * 2. Delete any existing code, paste this entire file, and click Save (Ctrl+S or Cmd+S).
 * 3. Click the blue "Deploy" button (top right) -> "New deployment".
 * 4. Under "Select type", choose "Web app".
 * 5. Set:
 *    - Description: "Airbnb Guest Webhook"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (IMPORTANT: so guests can upload without logging into Google!)
 * 6. Click "Deploy", authorize permissions when prompted.
 * 7. Copy the "Web app URL" (ends in /exec) and paste it into:
 *    index.html -> const GOOGLE_SCRIPT_WEBHOOK_URL = "YOUR_WEB_APP_URL";
 * =========================================================================
 */

// Optional: If you already have a specific Google Sheet, paste its ID here.
// If left blank (""), it will automatically create a sheet named "Airbnb Guest Registry".
const SPREADSHEET_ID = "";

// Main folder in Google Drive where all guest folders will be stored
const ROOT_FOLDER_NAME = "Airbnb Guest Verifications";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: "error", message: "No data received" });
    }

    const data = JSON.parse(e.postData.contents);
    
    // 1. Get or create root Drive folder
    const rootFolder = getOrCreateFolder(ROOT_FOLDER_NAME);

    // 2. Create subfolder for this booking: [Check-in] - [Primary Guest] - [Code]
    const primaryGuest = (data.guests && data.guests.length > 0) ? data.guests[0].name : "Guest";
    const resCode = data.reservationCode || "NoCode";
    const checkIn = data.checkInDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const folderTitle = `${checkIn} - ${primaryGuest} (${resCode})`;
    
    const bookingFolder = rootFolder.createFolder(folderTitle);
    const folderUrl = bookingFolder.getUrl();

    // 3. Save Signature Image (if provided)
    let signatureUrl = "";
    if (data.signature && data.signature.indexOf("base64,") !== -1) {
      const sigFile = saveBase64Image(bookingFolder, data.signature, `${primaryGuest}_Signature.png`, "image/png");
      signatureUrl = sigFile ? sigFile.getUrl() : "";
    }

    // 4. Get or create the Google Sheet
    const sheet = getRegistrySheet();

    // 5. Process each guest and append rows
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    
    if (data.guests && Array.isArray(data.guests)) {
      data.guests.forEach(function(g) {
        let frontUrl = "";
        let backUrl = "";

        // Save Front ID
        if (g.frontPhoto && g.frontPhoto.indexOf("base64,") !== -1) {
          const frontFile = saveBase64Image(
            bookingFolder, 
            g.frontPhoto, 
            `Guest_${g.guestNumber}_${sanitizeFileName(g.name)}_Front.jpg`,
            "image/jpeg"
          );
          if (frontFile) frontUrl = frontFile.getUrl();
        }

        // Save Back ID
        if (g.backPhoto && g.backPhoto.indexOf("base64,") !== -1) {
          const backFile = saveBase64Image(
            bookingFolder, 
            g.backPhoto, 
            `Guest_${g.guestNumber}_${sanitizeFileName(g.name)}_Back.jpg`,
            "image/jpeg"
          );
          if (backFile) backUrl = backFile.getUrl();
        }

        // Append row to sheet:
        // [Timestamp, Res Code, Check-in, Check-out, Arrival, Total Guests, Guest #, Guest Name, Age, Phone, Email, Coming From, Going To, Purpose, ID Type, ID Number, Front ID, Back ID, Signature, Drive Folder]
        sheet.appendRow([
          timestamp,
          data.reservationCode || "",
          data.checkInDate || "",
          data.checkOutDate || "",
          data.arrivalTime || "",
          data.totalGuests || 1,
          `Guest #${g.guestNumber} ${g.isPrimary ? '(Primary)' : ''}`,
          g.name || "",
          g.age || "",
          g.phone || "",
          g.email || "",
          data.comingFrom || "",
          data.goingTo || "",
          data.purposeOfVisit || "",
          g.idType || "",
          g.idNumber || "",
          frontUrl ? `=HYPERLINK("${frontUrl}", "View Front ID")` : "No upload",
          backUrl ? `=HYPERLINK("${backUrl}", "View Back ID")` : "Not provided",
          signatureUrl ? `=HYPERLINK("${signatureUrl}", "View Signature")` : "",
          `=HYPERLINK("${folderUrl}", "Open Booking Folder")`
        ]);
      });
    }

    return responseJSON({
      status: "success",
      folderUrl: folderUrl
    });

  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Airbnb Guest Registration Webhook is active and listening for POST requests.");
}

// ---------------- Helper Utilities ----------------

function saveBase64Image(folder, base64Data, filename, mimeType) {
  try {
    const parts = base64Data.split("base64,");
    const rawData = parts.length > 1 ? parts[1] : parts[0];
    const decoded = Utilities.base64Decode(rawData);
    const blob = Utilities.newBlob(decoded, mimeType, filename);
    const file = folder.createFile(blob);
    // Grant view access to anyone with link (accessible within your Google Workspace / Drive)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file;
  } catch (err) {
    Logger.log("Failed to save image: " + err.toString());
    return null;
  }
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function getRegistrySheet() {
  let ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    // Check if a sheet named "Airbnb Guest Registry" already exists in root Drive
    const files = DriveApp.getFilesByName("Airbnb Guest Registry");
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create("Airbnb Guest Registry");
      // Move spreadsheet to our main folder
      const rootFolder = getOrCreateFolder(ROOT_FOLDER_NAME);
      DriveApp.getFileById(ss.getId()).moveTo(rootFolder);
    }
  }

  const sheet = ss.getActiveSheet();
  
  // Setup headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Timestamp",
      "Reservation Code",
      "Check-in Date",
      "Check-out Date",
      "Arrival Time",
      "Total Guests",
      "Guest Number",
      "Guest Legal Name",
      "Age",
      "Phone / WhatsApp",
      "Email Address",
      "Coming From",
      "Going To",
      "Purpose of Visit",
      "ID Type",
      "ID Number",
      "Front ID Photo",
      "Back ID Photo",
      "Digital Signature",
      "Drive Folder"
    ];

    sheet.appendRow(headers);

    // Format headers (Airbnb coral background, bold white text)
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#FF385C");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Arial");
    sheet.setFrozenRows(1);
    
    // Auto resize column widths
    for (let c = 1; c <= headers.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }

  return sheet;
}

function sanitizeFileName(name) {
  return (name || "Guest").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
