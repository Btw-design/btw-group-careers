/**
 * BTW Group Internship Assignment Portal: Google Sheet backend (v3)
 *
 * What this does
 *  - Receives each candidate's finished assignment from the careers website.
 *  - Saves it as a new row in this Google Sheet, in ONE TAB PER ROLE.
 *  - Marks the multiple-choice questions automatically ("MCQ score", e.g. 7/8).
 *  - Gives HR a simple Dashboard tab, a "Review status" dropdown and a menu.
 *  - Emails HR for every new submission.
 *
 * Setup guide: README.md in the same folder.
 *
 * Security notes
 *  - The web app only ACCEPTS submissions. It never returns sheet data to anyone
 *    (its only replies are {"ok":true} / {"ok":false}).
 *  - The multiple-choice ANSWER KEY lives only in this script (not on the website).
 *  - Only the roles listed below are accepted; each goes to its own tab.
 *  - Size limits, field limits and a hidden spam trap protect against abuse.
 *  - Candidate text is stored as plain text and can never run as a formula.
 *  - The HR email address is fixed here; the website cannot change it.
 */

// ===== EDIT THIS =====================================================
// Inbox(es) that receive a notification for every new submission.
// For several people, separate with commas: 'hr@btwvisas.com, hiring@btwvisas.com'
var HR_EMAIL = 'hr@btwvisas.com';
// =====================================================================

// Roles accepted, and the answer key for their multiple-choice questions.
// (Question ids M1, M2... match the website. The text must match the option text exactly.)
var ROLE_CONFIG = {
  'Digital Marketing Intern': {
    key: {
      M1: 'Promoting products or services using the internet and digital channels',
      M2: 'Search Engine Optimization',
      M3: 'It helps the website show up in search results so more people can find it',
      M4: 'Writing clear answers that search engines and AI assistants can use as a direct answer',
      M5: 'Making your brand and content easy for AI tools (like ChatGPT) to find and mention in their answers',
      M6: 'Google Analytics',
      M7: 'Running Google Ads',
      M8: 'The group of people you most want to reach with your message'
    }
  },
  'Video Editor Intern': {
    key: {
      M1: 'A tall, vertical video: the shape used for Instagram Reels and YouTube Shorts',
      M2: 'Frames per second: how many pictures are shown each second',
      M3: 'More pixels, so it can look sharper',
      M4: 'The first few seconds that make people want to keep watching',
      M5: 'To show spoken words as text so people can follow even without sound',
      M6: 'An effect that smoothly connects one clip to the next',
      M7: 'Vertical 1080 x 1920 (1080p), MP4'
    }
  }
};
var ALLOWED_ROLES = Object.keys(ROLE_CONFIG);

var REVIEW_STATUSES = ['New', 'Reviewed', 'Shortlisted', 'Not shortlisted'];
var STATUS_COLORS = { 'New': '#FFF4CC', 'Reviewed': '#DCE8F3', 'Shortlisted': '#DDEFC8', 'Not shortlisted': '#E7E4DC' };

var BASE_HEADERS = ['Submission ID', 'Submitted at', 'Role', 'Name', 'Email', 'Phone', 'Candidate type',
                    'MCQ score', 'Time taken (min)', 'Review status', 'HR notes', 'HR email'];

var DASHBOARD = 'Dashboard';
var MAX_BODY_CHARS = 60000;     // whole request
var MAX_FIELDS = 80;            // questions per submission
var MAX_ANSWER_CHARS = 3000;    // one answer
var MAX_KEY_CHARS = 200;        // one question label
var MAX_SHORT_CHARS = 200;      // name, email, phone, status
var FORMAT_ROWS = 2000;         // rows that get the dropdown + colours

/* ===================== Web app entry points ===================== */

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

    var submittedAt = new Date();
    var minutes = minutesBetween_(data.startedAt, submittedAt);
    var score = score_(role, fields);

    lock.waitLock(20000);
    locked = true;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureAll_(ss);                                   // role tabs + Dashboard exist
    var sheet = ss.getSheetByName(role);

    // A resend of the same submission (candidate pressed "Try again") is ignored.
    if (id && sheet.getLastRow() > 1) {
      var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === id) { return reply_({ ok: true, duplicate: true }); }
      }
    }

    // Header row: base columns first, then one column per question (new questions add new columns).
    var headers = readHeaders_(sheet);
    Object.keys(fields).forEach(function (k) { if (headers.indexOf(k) === -1) { headers.push(k); } });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

    var base = {
      'Submission ID': id,
      'Submitted at': submittedAt.toISOString(),
      'Role': role,
      'Name': name,
      'Email': email,
      'Phone': phone,
      'Candidate type': status,
      'MCQ score': score.text,
      'Time taken (min)': minutes === '' ? '' : minutes,
      'Review status': 'New',
      'HR notes': '',
      'HR email': 'pending'
    };
    var row = headers.map(function (h) {
      return h === 'Time taken (min)' ? base[h] : safe_(h in base ? base[h] : (h in fields ? fields[h] : ''));
    });
    sheet.appendRow(row);                       // 1) the answers are saved first, whatever happens next
    var rowIndex = sheet.getLastRow();

    // 2) then HR is emailed. If email fails (for example the daily limit), the row is still safe.
    var mailStatus;
    try {
      notify_(role, name, email, phone, status, score.text, minutes, fields, ss.getUrl());
      mailStatus = 'sent';
    } catch (mailErr) {
      mailStatus = 'FAILED: ' + clip_(mailErr, 120);
    }
    var statusCol = headers.indexOf('HR email') + 1;
    if (statusCol > 0) { sheet.getRange(rowIndex, statusCol).setValue(mailStatus); }

    buildDashboard_(ss);
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: 'server error' });   // details are not exposed to the public
  } finally {
    if (locked) { try { lock.releaseLock(); } catch (ignore) {} }
  }
}

// Opening the web-app URL in a browser only shows that it is running. No data is returned.
function doGet() { return reply_({ ok: true, service: 'BTW assignment intake' }); }

/* ===================== HR menu + setup helpers ===================== */

// Adds a "BTW Assignments" menu to the sheet for HR.
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('BTW Assignments')
      .addItem('Set up / repair this sheet', 'setupSheets')
      .addItem('Refresh the Dashboard', 'refreshDashboard')
      .addSeparator()
      .addItem('Send a test submission', 'testSetup')
      .addToUi();
  } catch (ignore) { /* menu is a convenience only */ }
}

/** RUN ONCE: creates the role tabs, the Dashboard, the Review status dropdowns and colours. Safe to run again. */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureAll_(ss);
  buildDashboard_(ss);
  return 'Ready: tabs ' + ALLOWED_ROLES.join(', ') + ' and ' + DASHBOARD + '.';
}

function refreshDashboard() { buildDashboard_(SpreadsheetApp.getActiveSpreadsheet()); }

/**
 * RUN THIS ONCE from the editor to check your setup (README step 5).
 * It saves a clearly marked TEST row in the Digital Marketing tab and sends a test email to HR_EMAIL.
 * It does not need the website.
 */
function testSetup() {
  var key = ROLE_CONFIG['Digital Marketing Intern'].key;
  var fake = {
    postData: { contents: JSON.stringify({
      id: 'test-' + new Date().getTime(),
      role: 'Digital Marketing Intern',
      name: 'TEST - please ignore',
      email: 'test@example.com',
      phone: '0000000000',
      status: 'Test',
      website: '',
      startedAt: new Date(new Date().getTime() - 5 * 60000).toISOString(),
      fields: { 'M1. What is digital marketing?': key.M1, 'M2. What does SEO stand for?': key.M2, 'A2. Why are you interested?': 'This is a setup test.' }
    }) }
  };
  var out = JSON.parse(doPost(fake).getContent());
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Digital Marketing Intern');
  var last = sheet ? sheet.getLastRow() : 0;
  var headers = sheet ? readHeaders_(sheet) : [];
  var mailCol = headers.indexOf('HR email') + 1;
  var mail = (sheet && mailCol) ? sheet.getRange(last, mailCol).getValue() : 'unknown';
  var msg = 'Result: ' + JSON.stringify(out) + ' | Row saved in the "Digital Marketing Intern" tab: ' + (out.ok ? 'YES (row ' + last + ')' : 'NO') +
            ' | HR email: ' + mail + ' (sent to ' + HR_EMAIL + ') | Tabs: ' + SpreadsheetApp.getActiveSpreadsheet().getSheets().length;
  Logger.log(msg);
  return msg;
}

/* ===================== Sheet building ===================== */

function ensureAll_(ss) {
  ALLOWED_ROLES.forEach(function (role) {
    var sh = ss.getSheetByName(role);
    if (!sh) { sh = ss.insertSheet(role); }
    var headers = readHeaders_(sh);                       // adds any missing base columns, keeps existing ones
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    formatRoleSheet_(sh);
  });
  if (!ss.getSheetByName(DASHBOARD)) { ss.insertSheet(DASHBOARD, 0); buildDashboard_(ss); }
}

// Header row = existing headers + any base headers that are missing.
function readHeaders_(sheet) {
  var headers = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].filter(String)
    : [];
  BASE_HEADERS.forEach(function (h) { if (headers.indexOf(h) === -1) { headers.push(h); } });
  return headers;
}

// Review status dropdown + colours, and a readable layout.
function formatRoleSheet_(sheet) {
  var headers = readHeaders_(sheet);
  var col = headers.indexOf('Review status') + 1;
  if (col < 1) { return; }
  var range = sheet.getRange(2, col, FORMAT_ROWS, 1);
  range.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(REVIEW_STATUSES, true).setAllowInvalid(false).build());
  var rules = REVIEW_STATUSES.map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(STATUS_COLORS[s]).setRanges([range]).build();
  });
  sheet.setConditionalFormatRules(rules);
  try {
    sheet.setColumnWidth(headers.indexOf('Name') + 1, 170);
    sheet.setColumnWidth(headers.indexOf('Email') + 1, 210);
    sheet.setColumnWidth(col, 130);
  } catch (ignore) { /* layout only */ }
}

// The Dashboard tab: counts per role and per review status. Uses live formulas, so it always shows the current numbers.
function buildDashboard_(ss) {
  var sh = ss.getSheetByName(DASHBOARD) || ss.insertSheet(DASHBOARD, 0);
  var NAVY = '#0B2A47', BLUE = '#0B4A7A', SOFT = '#EEF3F8', LINE = '#D5DEE8';
  var roles = ALLOWED_ROLES;
  try { sh.clear(); sh.clearConditionalFormatRules(); sh.setHiddenGridlines(true); } catch (ignore) { /* layout only */ }

  // Formula pieces per role tab (a missing column simply shows a dash).
  var info = roles.map(function (role) {
    var tab = ss.getSheetByName(role);
    var headers = tab ? readHeaders_(tab) : BASE_HEADERS;
    var q = "'" + role + "'!";
    function col(name) { var i = headers.indexOf(name); return i < 0 ? null : colLetter_(i + 1); }
    var st = col('Review status'), sc = col('MCQ score');
    return {
      role: role, q: q, headers: headers,
      total: '=COUNTA(' + q + 'A2:A)',
      reviewed: st ? '=COUNTIF(' + q + st + '2:' + st + ',"Reviewed")' : '=0',
      short: st ? '=COUNTIF(' + q + st + '2:' + st + ',"Shortlisted")' : '=0',
      notshort: st ? '=COUNTIF(' + q + st + '2:' + st + ',"Not shortlisted")' : '=0',
      avg: sc ? '=IFERROR(TEXT(AVERAGE(ARRAYFORMULA(IFERROR(VALUE(LEFT(' + q + sc + '2:' + sc + ',FIND("/",' + q + sc + '2:' + sc + ')-1))/VALUE(MID(' + q + sc + '2:' + sc + ',FIND("/",' + q + sc + '2:' + sc + ')+1,5)),""))),"0%"),"-")' : '="-"',
      last: '=IFERROR(LOOKUP(2,1/(' + q + 'A2:A<>""),' + q + 'B2:B),"-")',
      col: col
    };
  });

  // Title band
  sh.getRange('A1:H1').merge().setValue('BTW Group: Internship assignments')
    .setBackground(NAVY).setFontColor('#FFFFFF').setFontSize(18).setFontWeight('bold').setVerticalAlignment('middle');
  sh.getRange('A2:H2').merge().setValue('Live overview. This page updates by itself. Open a role tab to read the answers, then set the Review status and add HR notes.')
    .setFontColor('#5B6B7B').setFontStyle('italic').setWrap(true);
  sh.setRowHeight(1, 44);

  // KPI cards (row 4 label, row 5 number)
  var tot = info.map(function (r) { return r.total.slice(1); }).join('+');
  var rev = info.map(function (r) { return r.reviewed.slice(1); }).join('+');
  var sho = info.map(function (r) { return r.short.slice(1); }).join('+');
  var nsh = info.map(function (r) { return r.notshort.slice(1); }).join('+');
  var kpis = [
    ['Total submissions', '=' + tot],
    ['Awaiting review', '=(' + tot + ')-(' + rev + ')-(' + sho + ')-(' + nsh + ')'],
    ['Reviewed', '=' + rev],
    ['Shortlisted', '=' + sho],
    ['Not shortlisted', '=' + nsh]
  ];
  kpis.forEach(function (k, i) {
    var c = 1 + i; // columns A..E
    sh.getRange(4, c).setValue(k[0]).setFontColor('#5B6B7B').setFontSize(10).setBackground(SOFT).setHorizontalAlignment('center');
    sh.getRange(5, c).setFormula(k[1]).setFontSize(26).setFontWeight('bold').setFontColor(BLUE).setBackground(SOFT).setHorizontalAlignment('center');
  });
  sh.setRowHeight(5, 52);

  // By role
  sh.getRange('A7').setValue('By role').setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
  var head = ['Role', 'Total', 'Awaiting review', 'Reviewed', 'Shortlisted', 'Not shortlisted', 'Average MCQ score', 'Last submission'];
  sh.getRange(8, 1, 1, head.length).setValues([head]).setBackground(BLUE).setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
  info.forEach(function (r, i) {
    var row = 9 + i;
    sh.getRange(row, 1).setValue(r.role).setFontWeight('bold');
    sh.getRange(row, 2).setFormula(r.total);
    sh.getRange(row, 3).setFormula('=B' + row + '-D' + row + '-E' + row + '-F' + row);
    sh.getRange(row, 4).setFormula(r.reviewed);
    sh.getRange(row, 5).setFormula(r.short);
    sh.getRange(row, 6).setFormula(r.notshort);
    sh.getRange(row, 7).setFormula(r.avg);
    sh.getRange(row, 8).setFormula(r.last);
  });
  var endRole = 8 + info.length;
  sh.getRange(9, 2, info.length, 6).setHorizontalAlignment('center');
  sh.getRange(8, 1, info.length + 1, 8).setBorder(true, true, true, true, true, true, LINE, SpreadsheetApp.BorderStyle.SOLID);

  // Latest submissions (5 per role, newest first)
  var lt = endRole + 2;
  sh.getRange(lt, 1).setValue('Latest submissions').setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
  var lh = ['Role', 'Submitted at (UTC)', 'Name', 'Email', 'Phone', 'MCQ score', 'Review status'];
  sh.getRange(lt + 1, 1, 1, lh.length).setValues([lh]).setBackground(BLUE).setFontColor('#FFFFFF').setFontWeight('bold');
  var r0 = lt + 2, n = 0;
  info.forEach(function (r) {
    for (var k = 0; k < 5; k++) {
      var row = r0 + n; n++;
      var pick = function (name) {
        var c = r.col(name);
        return c ? '=IFERROR(INDEX(' + r.q + c + ':' + c + ',COUNTA(' + r.q + 'A:A)-' + k + ')&"","")' : '=""';
      };
      var has = 'COUNTA(' + r.q + 'A:A)-' + k + '>1';
      sh.getRange(row, 1).setFormula('=IF(' + has + ',"' + r.role + '","")');
      ['Submitted at', 'Name', 'Email', 'Phone', 'MCQ score', 'Review status'].forEach(function (name, j) {
        sh.getRange(row, 2 + j).setFormula('=IF(' + has + ',' + pick(name).slice(1) + ',"")');
      });
    }
  });
  sh.getRange(lt + 1, 1, n + 1, 7).setBorder(true, true, true, true, true, true, LINE, SpreadsheetApp.BorderStyle.SOLID);

  // How to use
  var ht = r0 + n + 1;
  sh.getRange(ht, 1).setValue('How to review').setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
  var tips = [
    '1. Open a role tab. Each candidate is one row, newest at the bottom.',
    '2. Read the written answers. The MCQ score is marked automatically and is only a quick guide.',
    '3. Pick a Review status (New, Reviewed, Shortlisted, Not shortlisted) and write notes in HR notes.',
    '4. Rows with no status yet are counted as "Awaiting review".',
    '5. HR gets an email for every submission. Press Reply to write to the candidate.'
  ];
  sh.getRange(ht + 1, 1, tips.length, 1).setValues(tips.map(function (t) { return [t]; })).setFontColor('#2B3A49');

  try {
    sh.setColumnWidth(1, 230);
    [2, 3, 4, 5, 6, 7, 8].forEach(function (c) { sh.setColumnWidth(c, c === 4 ? 230 : 150); });
    sh.setColumnWidth(3, 170);
    sh.setFrozenRows(0);
    // status colours in the Latest table
    var rg = sh.getRange(r0, 7, n, 1);
    sh.setConditionalFormatRules(REVIEW_STATUSES.map(function (st) {
      return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(st).setBackground(STATUS_COLORS[st]).setRanges([rg]).build();
    }));
  } catch (ignore) { /* layout only */ }
}

function colLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s || 'A';
}

/* ===================== Scoring, email, cleaning ===================== */

// "M3. Why is SEO important?" -> id "M3". Compares the chosen option text with the answer key.
function score_(role, fields) {
  var key = ROLE_CONFIG[role].key;
  var total = Object.keys(key).length, right = 0;
  Object.keys(fields).forEach(function (label) {
    var m = /^(M\d+)\./.exec(label);
    if (m && key[m[1]] !== undefined && String(fields[label]).trim() === key[m[1]]) { right++; }
  });
  return { right: right, total: total, text: right + '/' + total };
}

function minutesBetween_(startIso, endDate) {
  var s = startIso ? new Date(String(startIso)).getTime() : NaN;
  if (isNaN(s)) { return ''; }
  var mins = Math.round((endDate.getTime() - s) / 60000);
  return (mins >= 0 && mins <= 720) ? mins : '';
}

function notify_(role, name, email, phone, status, score, minutes, fields, sheetUrl) {
  var lines = [
    'New assignment submitted for: ' + role,
    '',
    'Name:   ' + name,
    'Email:  ' + email,
    'Phone:  ' + phone,
    'Type:   ' + (status || '-'),
    'MCQ score (automatic): ' + score,
    'Time taken: ' + (minutes === '' ? '-' : minutes + ' min'),
    ''
  ];
  Object.keys(fields).forEach(function (k) { if (fields[k]) { lines.push(k, '   ' + fields[k], ''); } });
  lines.push('Review it in the sheet: ' + sheetUrl);
  MailApp.sendEmail({
    to: HR_EMAIL,
    replyTo: email,                              // HR can simply press Reply to write to the candidate
    subject: 'Assignment: ' + role + ' - ' + name.replace(/[\r\n]+/g, ' ') + ' (MCQ ' + score + ')',
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
