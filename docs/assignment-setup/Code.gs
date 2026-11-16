/**
 * BTW Group Careers: assignment intake
 *
 * Receives the starter-assignment answers from the careers website, saves every
 * submission as a row in this Google Sheet (one tab per role) and emails HR.
 *
 * Setup guide: README.md in the same folder (about 10 minutes).
 *
 * Security notes
 *  - The web app only ACCEPTS submissions. It never returns sheet data to anyone
 *    (the only reply is {"ok":true} or {"ok":false}).
 *  - The spreadsheet itself stays private to the people you share it with.
 *  - Only the two roles listed below are accepted; each goes to its own tab.
 *  - Size limits, field limits and a hidden spam trap protect against abuse.
 *  - Candidate text is stored as plain text and can never run as a formula.
 *  - The HR email address is fixed in this script; the website cannot change it.
 */

// ===== EDIT THIS =====================================================
// Inbox(es) that receive a notification for every new submission.
// For several people, separate with commas: 'hr@btwvisas.com, hiring@btwvisas.com'
var HR_EMAIL = 'hr@btwvisas.com';
// =====================================================================

// Only these roles are accepted. Each one is saved in a tab with exactly this name.
var ALLOWED_ROLES = ['Digital Marketing Intern', 'Video Editor Intern'];

var BASE_HEADERS = ['Submission ID', 'Submitted at', 'Role', 'Name', 'Email', 'Phone', 'Current status', 'HR email'];
var MAX_BODY_CHARS = 60000;     // whole request
var MAX_FIELDS = 60;            // questions per submission
var MAX_ANSWER_CHARS = 3000;    // one answer
var MAX_KEY_CHARS = 200;        // one question label
var MAX_SHORT_CHARS = 200;      // name, email, phone, status

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var raw = (e && e.postData && e.postData.contents) ? String(e.postData.contents) : '';
    if (!raw || raw.length > MAX_BODY_CHARS) { return reply_({ ok: false, error: 'bad request' }); }

    var data;
    try { data = JSON.parse(raw); } catch (parseErr) { return reply_({ ok: false, error: 'bad request' }); }
    if (!data || typeof data !== 'object') { return reply_({ ok: false, error: 'bad request' }); }

    // Spam trap: real candidates never fill the hidden "website" field. Pretend success, store nothing.
    if (data.website) { return reply_({ ok: true }); }

    var role = String(data.role || '');
    if (ALLOWED_ROLES.indexOf(role) === -1) { return reply_({ ok: false, error: 'unknown role' }); }

    var name = clip_(data.name, MAX_SHORT_CHARS);
    var email = clip_(data.email, MAX_SHORT_CHARS);
    var phone = clip_(data.phone, MAX_SHORT_CHARS);
    var status = clip_(data.status, MAX_SHORT_CHARS);
    var id = clip_(data.id, 80);
    if (!name || !phone || !/^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']{2,}$/.test(email)) {
      return reply_({ ok: false, error: 'missing details' });
    }

    // Clean the answers: plain text, limited count and length.
    var fields = {};
    var incoming = (data.fields && typeof data.fields === 'object') ? data.fields : {};
    Object.keys(incoming).slice(0, MAX_FIELDS).forEach(function (k) {
      var key = clip_(k, MAX_KEY_CHARS);
      if (key) { fields[key] = clip_(incoming[k], MAX_ANSWER_CHARS); }
    });

    lock.waitLock(20000);
    locked = true;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(role) || ss.insertSheet(role);   // one tab per role

    // A resend of the same submission (candidate pressed "Try again") is ignored.
    if (id && sheet.getLastRow() > 1) {
      var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === id) { return reply_({ ok: true, duplicate: true }); }
      }
    }

    // Make sure the header row has a column for every question (new questions add new columns).
    var headers = sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].filter(String)
      : [];
    if (headers.length === 0) { headers = BASE_HEADERS.slice(); }
    Object.keys(fields).forEach(function (k) { if (headers.indexOf(k) === -1) { headers.push(k); } });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);

    var base = {
      'Submission ID': id,
      'Submitted at': new Date().toISOString(),
      'Role': role,
      'Name': name,
      'Email': email,
      'Phone': phone,
      'Current status': status,
      'HR email': 'pending'
    };
    var row = headers.map(function (h) {
      return safe_(h in base ? base[h] : (h in fields ? fields[h] : ''));
    });
    sheet.appendRow(row);                       // 1) the answers are saved first, whatever happens next
    var rowIndex = sheet.getLastRow();

    // 2) then HR is emailed. If email fails (for example the daily limit), the row is still safe.
    var mailStatus;
    try {
      notify_(role, name, email, phone, status, fields, ss.getUrl());
      mailStatus = 'sent';
    } catch (mailErr) {
      mailStatus = 'FAILED: ' + clip_(mailErr, 120);
    }
    var statusCol = headers.indexOf('HR email') + 1;
    if (statusCol > 0) { sheet.getRange(rowIndex, statusCol).setValue(mailStatus); }

    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: 'server error' });   // details are not exposed to the public
  } finally {
    if (locked) { try { lock.releaseLock(); } catch (ignore) {} }
  }
}

// Opening the web-app URL in a browser only shows that it is running. No data is returned.
function doGet() { return reply_({ ok: true, service: 'BTW assignment intake' }); }

/**
 * RUN THIS ONCE from the editor to check your setup (see README step 7).
 * It saves a clearly marked TEST row in the Digital Marketing tab and sends a test email to HR_EMAIL.
 * It does not need the website.
 */
function testSetup() {
  var fake = {
    postData: { contents: JSON.stringify({
      id: 'test-' + new Date().getTime(),
      role: 'Digital Marketing Intern',
      name: 'TEST - please ignore',
      email: 'test@example.com',
      phone: '0000000000',
      status: 'Test',
      website: '',
      fields: { 'Q1. What is digital marketing?': 'This is a setup test.' }
    }) }
  };
  var out = JSON.parse(doPost(fake).getContent());
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Digital Marketing Intern');
  var last = sheet ? sheet.getLastRow() : 0;
  var statusCol = 0;
  if (sheet) { statusCol = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf('HR email') + 1; }
  var mail = (sheet && statusCol) ? sheet.getRange(last, statusCol).getValue() : 'unknown';
  var msg = 'Result: ' + JSON.stringify(out) + ' | Row saved in the "Digital Marketing Intern" tab: ' + (out.ok ? 'YES (row ' + last + ')' : 'NO') +
            ' | HR email: ' + mail + ' (sent to ' + HR_EMAIL + ')';
  Logger.log(msg);
  return msg;
}

function notify_(role, name, email, phone, status, fields, sheetUrl) {
  var lines = [
    'New assignment submitted for: ' + role,
    '',
    'Name:   ' + name,
    'Email:  ' + email,
    'Phone:  ' + phone,
    'Status: ' + (status || '-'),
    ''
  ];
  Object.keys(fields).forEach(function (k) { if (fields[k]) { lines.push(k, '   ' + fields[k], ''); } });
  lines.push('All submissions: ' + sheetUrl);
  MailApp.sendEmail({
    to: HR_EMAIL,
    replyTo: email,                              // HR can simply press Reply to write to the candidate
    subject: 'Assignment: ' + role + ' - ' + name.replace(/[\r\n]+/g, ' '),
    body: lines.join('\n')
  });
}

// Trim, remove control characters, and cap the length.
function clip_(v, max) {
  v = (v === null || v === undefined) ? '' : String(v);
  v = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  return v.length > max ? v.substring(0, max) : v;
}

// Stops a candidate's text from ever being treated as a spreadsheet formula.
function safe_(v) {
  v = (v === null || v === undefined) ? '' : String(v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
