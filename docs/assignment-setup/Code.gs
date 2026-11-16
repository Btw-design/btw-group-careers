/**
 * BTW Group Careers: assignment intake
 *
 * Receives the starter-assignment answers from the careers website, saves each
 * submission as a row in this Google Sheet (one tab per role) and emails HR.
 *
 * Setup (about 5 minutes): see README.md in the same folder.
 */

// Where HR notification emails go. Change if needed.
var HR_EMAIL = 'hr@btwvisas.com';

// Only these roles are accepted (anything else is ignored).
var ALLOWED_ROLES = ['Digital Marketing Intern', 'Video Editor Intern'];

var BASE_HEADERS = ['Submission ID', 'Submitted at', 'Role', 'Name', 'Email', 'Phone', 'Current status'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);

    // Spam trap: real candidates never fill the hidden "website" field.
    if (data.website) { return reply_({ ok: true }); }

    var role = String(data.role || '');
    if (ALLOWED_ROLES.indexOf(role) === -1) { return reply_({ ok: false, error: 'unknown role' }); }

    var id = String(data.id || '');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(role) || ss.insertSheet(role);

    // Ignore a resend of the same submission (happens if the candidate presses "Try again").
    if (id && sheet.getLastRow() > 1) {
      var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) { if (String(ids[i][0]) === id) { return reply_({ ok: true, duplicate: true }); } }
    }

    // Make sure the header row has every question as a column.
    var fields = data.fields || {};
    var keys = Object.keys(fields);
    var headers = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].filter(String)
      : [];
    if (headers.length === 0) { headers = BASE_HEADERS.slice(); }
    keys.forEach(function (k) { if (headers.indexOf(k) === -1) { headers.push(k); } });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    var base = {
      'Submission ID': id,
      'Submitted at': data.submittedAt || new Date().toISOString(),
      'Role': role,
      'Name': data.name,
      'Email': data.email,
      'Phone': data.phone,
      'Current status': data.status
    };
    var row = headers.map(function (h) {
      return safe_(h in base ? base[h] : (h in fields ? fields[h] : ''));
    });
    sheet.appendRow(row);

    notify_(role, data, fields, ss.getUrl());
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// Visiting the web-app URL in a browser shows that it is running.
function doGet() { return reply_({ ok: true, service: 'BTW assignment intake' }); }

function notify_(role, data, fields, sheetUrl) {
  var lines = [
    'New assignment submitted for: ' + role,
    '',
    'Name:  ' + data.name,
    'Email: ' + data.email,
    'Phone: ' + data.phone,
    'Status: ' + (data.status || '-'),
    ''
  ];
  Object.keys(fields).forEach(function (k) { if (fields[k]) { lines.push(k, '   ' + fields[k], ''); } });
  lines.push('All submissions: ' + sheetUrl);
  MailApp.sendEmail({
    to: HR_EMAIL,
    replyTo: data.email,
    subject: 'Assignment: ' + role + ' - ' + data.name,
    body: lines.join('\n')
  });
}

// Stops a candidate's text from being treated as a spreadsheet formula.
function safe_(v) {
  v = (v === null || v === undefined) ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
