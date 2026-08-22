# Google Sheets Integration Guide for Blood Donation Queries & Requests

This guide explains how to connect your Google Sheet with the Indus Care Foundation website so that every **Blood Request**, **Blood Donation**, and **Inquiry** form submission automatically logs into your Google Sheet in real-time.

---

## Step 1: Create & Prepare Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a **Blank Spreadsheet**.
2. Name your spreadsheet (e.g. `Indus Care - Blood Requests & Queries`).
3. *(Optional)* You can manually create header row in Row 1:
   `Timestamp | Query Type | Name | Phone | Email | Blood Group | Units Required | Hospital / Location | Urgency | Age | Gender | Preferred Centre | Preferred Date | Message / Details | Status`

   *(Note: The script below will automatically create these headers if your sheet is empty!)*

---

## Step 2: Add Google Apps Script

1. In your Google Sheet, click **Extensions** -> **Apps Script** in the top menu bar.
2. Delete any default code in the editor (`Code.gs`).
3. Paste the following complete script:

```javascript
/**
 * Indus Care Foundation - Blood Donation Request & Query Logger
 * Supports automatic header matching for all form fields:
 * - Name, Phone, Email, Blood Group, Units, Hospital/Location
 * - Preferred Centre / Centre / Center
 * - Preferred Date / Date / Booking Date
 * - Message / Notes / Additional Notes / Details
 */

function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];

    // If sheet is empty, create header row automatically
    if (!headers[0] || (headers.length === 1 && headers[0] === "")) {
      headers = [
        "Timestamp",
        "Query Type",
        "Name",
        "Phone",
        "Email",
        "Blood Group",
        "Units Required",
        "Hospital / Location",
        "Urgency",
        "Age",
        "Gender",
        "Preferred Centre",
        "Preferred Date",
        "Message / Details",
        "Status"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#DC2626").setFontColor("#FFFFFF");
    }

    var data = {};
    if (e && e.parameter) {
      for (var key in e.parameter) {
        data[key] = e.parameter[key];
        data[key.trim()] = e.parameter[key];
        data[key.toLowerCase().trim()] = e.parameter[key];
      }
    }
    
    if (e && e.postData && e.postData.contents) {
      try {
        var postJson = JSON.parse(e.postData.contents);
        for (var pKey in postJson) {
          data[pKey] = postJson[pKey];
          data[pKey.trim()] = postJson[pKey];
          data[pKey.toLowerCase().trim()] = postJson[pKey];
        }
      } catch (err) {}
    }

    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i].toString().trim();
      var hLower = header.toLowerCase();
      
      // Direct key lookup first
      var value = data[header] || data[hLower] || "";
      
      // Smart Fallback matching if direct lookup didn't yield a value
      if (value === "" || value === undefined || value === null) {
        if (hLower.indexOf("time/date") !== -1 || hLower.indexOf("time / date") !== -1 || hLower === "time/date" || hLower.indexOf("timestamp") !== -1) {
          value = data["Time/Date"] || data["time/date"] || data["Timestamp"] || data["timestamp"] || new Date().toLocaleString('en-IN');
        } else if (hLower.indexOf("name") !== -1) {
          value = data["Name"] || data["name"] || data["patient_name"] || data["donor_name"] || "";
        } else if (hLower.indexOf("phone") !== -1 || hLower.indexOf("contact") !== -1 || hLower.indexOf("mobile") !== -1) {
          value = data["Contact no."] || data["Phone"] || data["phone"] || data["contact"] || "";
        } else if (hLower.indexOf("email") !== -1) {
          value = data["Email"] || data["email"] || "";
        } else if (hLower.indexOf("blood") !== -1) {
          value = data["Blood group need"] || data["Blood Group"] || data["blood_group"] || data["bloodGroup"] || "";
        } else if (hLower.indexOf("unit") !== -1) {
          value = data["Units"] || data["units"] || data["Units Required"] || "";
        } else if (hLower.indexOf("hospital") !== -1 || hLower.indexOf("city") !== -1) {
          value = data["Hospital name/City"] || data["Hospital / Location"] || data["Hospital"] || data["hospital"] || "";
        } else if (hLower.indexOf("centre") !== -1 || hLower.indexOf("center") !== -1 || hLower.indexOf("branch") !== -1) {
          value = data["Preferred Centre"] || data["Preferred Center"] || data["Centre"] || data["Center"] || data["preferred_centre"] || "";
        } else if (hLower.indexOf("preferred date") !== -1 || hLower === "date") {
          value = data["Preferred Date"] || data["Date"] || data["preferred_date"] || data["date"] || "";
        } else if (hLower.indexOf("urgency") !== -1) {
          value = data["Urgency level"] || data["Urgency"] || data["urgency"] || "";
        } else if (hLower.indexOf("age") !== -1) {
          value = data["Age"] || data["age"] || "";
        } else if (hLower.indexOf("gender") !== -1) {
          value = data["Gender"] || data["gender"] || "";
        } else if (hLower.indexOf("patient notes") !== -1 || hLower.indexOf("requirement details") !== -1 || hLower.indexOf("message") !== -1 || hLower.indexOf("notes") !== -1 || hLower.indexOf("details") !== -1) {
          value = data["Patient notes/ Requirement details"] || data["Patient Notes"] || data["userNotes"] || data["Message"] || data["Notes"] || data["notes"] || data["Additional Notes"] || "";
        } else if (hLower.indexOf("query") !== -1 || hLower.indexOf("type") !== -1) {
          value = data["Query Type"] || data["query_type"] || data["queryType"] || "";
        } else if (hLower.indexOf("status") !== -1) {
          value = data["Status"] || data["status"] || "Pending";
        }
      }
      row.push(value);
    }

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

4. Save the project (click the **Save** disk icon or press `Ctrl + S`).

---

## Step 3: Deploy as a Web App

1. Click **Deploy** (top right) -> **New deployment**.
2. Click the gear icon ⚙️ next to *Select type* and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Blood Request Webhook`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **`Anyone`** *(This is essential so your website form can submit entries without Google login)*
4. Click **Deploy**.
5. Google will ask you to **Authorize access**. Click *Authorize access*, select your Google Account, click *Advanced*, then click *Go to Untitled project (unsafe)*, and click **Allow**.
6. Copy the **Web App URL** provided (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 4: Configure Your Website

You can configure your URL in either of two ways:

### Option A: Via `.env` File (Recommended)
1. In your project root folder, open `.env`.
2. Configure both Google Sheets endpoints:
   ```env
   # Blood Donation Form Submissions
   VITE_GOOGLE_SHEETS_DONATE_URL=https://script.google.com/macros/s/AKfycbz7KbPa5Sp-ihVILCN4xIzHAGOHo_iTkicv9N0zzInzZkYTpdJ06vkPleo21-iiZoPBJw/exec

   # Blood Request Form Submissions & General Queries
   VITE_GOOGLE_SHEETS_REQUEST_URL=https://script.google.com/macros/s/AKfycbwJGSln7LPTByLaDP0WXUsnmoaqOW_mfRN-YNfOM03yW-78PnS8fnaKOtnrP8TNOqit/exec
   ```

### Option B: Directly in `js/forms.js`
`DONATE_SHEETS_URL` and `REQUEST_SHEETS_URL` are defined at the top of `js/forms.js`. Form submissions are automatically routed based on the query type (Donation vs Request).

---

## Step 5: Test Form Submissions

1. Open your website and click **Request Blood** or **Donate Blood**.
2. Fill out the form and submit.
3. Check your Google Sheet: a new row with the submission details will automatically appear!
