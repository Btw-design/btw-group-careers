/* ==========================================================================
   BTW Group Internship Assignment Portal: app logic

   Landing page : shows each role's status (not started / in progress / submitted)
                  and a "welcome back" resume banner.
   Role page    : Register -> Assignment -> Review & submit -> Confirmation.
                  Skip is available at every step.

   - Progress is saved on this device as the candidate types (30 days) and is
     restored when they come back.
   - Answers are sent to the HR Google Sheet (js/assignment-config.js). Success
     is shown ONLY when the sheet script replies {"ok":true}.
   - Nothing here touches the HR application: "Continue to application" and
     "Skip" are plain links to the existing hr.btwgroup.co/apply form.
   ========================================================================== */
(function () {
    'use strict';

    var P = window.BTW_PORTAL;
    var cfg = window.BTW_ASSIGNMENT || {};
    var endpoint = cfg.endpoint || '';
    var KEY_PREFIX = 'btw_portal_v1_';
    var REMEMBER_PREFIX = 'btw_assignment_';          // same key the Careers "Apply" step uses
    var EXPIRY_MS = 30 * 86400000;
    if (!P) { return; }

    /* ---------------------------- small helpers ---------------------------- */
    function esc(s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage may be blocked */ } }
    function safeDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }
    function track(name, role) { try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, assignment_role: role }); } catch (e) { /* never break the page */ } }
    function uuid() { return (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2)); }
    function applyUrl(role) { return P.applyBase + encodeURIComponent(role).replace(/%20/g, '%20'); }
    function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

    function load(slug) {
        var raw = safeGet(KEY_PREFIX + slug);
        if (!raw) { return null; }
        try {
            var st = JSON.parse(raw);
            if (!st || st.v !== 1) { return null; }
            if (Date.now() - (st.updatedAt || 0) > EXPIRY_MS) { safeDel(KEY_PREFIX + slug); return null; }
            return st;
        } catch (e) { return null; }
    }
    function save(slug, st) { st.updatedAt = Date.now(); safeSet(KEY_PREFIX + slug, JSON.stringify(st)); }

    /* ------------------------- question model helpers ----------------------- */
    function items(def) { var out = []; def.sections.forEach(function (s) { s.items.forEach(function (it) { out.push(it); }); }); return out; }
    function keysOf(it) {
        if (it.type === 'multi') { var k = []; for (var i = 1; i <= it.count; i++) { k.push(it.id + '_' + i); } return k; }
        var base = [it.id];
        if (it.other) { base.push(it.id + '__other'); }
        if (it.follow) { base.push(it.id + '__follow'); }
        return base;
    }
    function nonEmpty(v) { return Array.isArray(v) ? v.length > 0 : String(v === undefined || v === null ? '' : v).trim() !== ''; }
    function answered(it, a) {
        if (it.type === 'multi') { return keysOf(it).some(function (k) { return nonEmpty(a[k]); }); }
        // the optional follow-up alone does not count as answering the question
        return nonEmpty(a[it.id]) || (it.other && nonEmpty(a[it.id + '__other']));
    }
    function counts(def, a) { var all = items(def), n = 0; all.forEach(function (it) { if (answered(it, a)) { n++; } }); return { n: n, total: all.length }; }
    function labelOf(it) { return it.id + '. ' + it.label; }
    function valueOf(it, a) {
        var parts = [];
        if (it.type === 'multi') {
            for (var i = 1; i <= it.count; i++) { var v = String(a[it.id + '_' + i] || '').trim(); if (v) { parts.push(it.prefix + ' ' + i + ': ' + v); } }
        } else if (it.type === 'checks') {
            (a[it.id] || []).forEach(function (x) { parts.push(x); });
            var o = String(a[it.id + '__other'] || '').trim(); if (o) { parts.push('Other: ' + o); }
        } else {
            var s = String(a[it.id] || '').trim(); if (s) { parts.push(s); }
            var f = String(a[it.id + '__follow'] || '').trim(); if (f) { parts.push((it.follow || 'More').replace(/\s*\(optional\)\s*/i, '') + ' ' + f); }
        }
        return parts.join(' | ');
    }

    /* ------------------------------ page chrome ----------------------------- */
    function skipLink(role, cls, text) {
        return '<a class="' + cls + '" href="' + esc(applyUrl(role)) + '" data-skip="' + esc(role) + '">' + esc(text) + '</a>';
    }
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('[data-skip]');
        if (a) { var role = a.getAttribute('data-skip'); safeSet(REMEMBER_PREFIX + role, String(Date.now())); track('portal_skipped', role); }
    });

    /* ============================== LANDING ================================ */
    function initLanding() {
        var root = document.getElementById('portal-landing');
        if (!root) { return false; }
        var notice = document.getElementById('pNotice');
        if (!endpoint && notice) {
            notice.hidden = false;
            notice.textContent = 'The assignments are not open for submissions right now. You can still apply directly using "Skip assignment, apply directly".';
        }
        var resume = [];
        var cards = root.querySelectorAll('[data-role-card]');
        for (var i = 0; i < cards.length; i++) {
            (function (card) {
                var slug = card.getAttribute('data-role-card');
                var def = P.roles[slug]; if (!def) { return; }
                var st = load(slug);
                var badge = card.querySelector('[data-status]');
                var btn = card.querySelector('[data-start]');
                if (!endpoint) { btn.setAttribute('aria-disabled', 'true'); btn.removeAttribute('href'); btn.classList.add('is-disabled'); btn.textContent = 'Not open right now'; return; }
                if (st && st.submittedAt) {
                    badge.textContent = 'Submitted'; badge.className = 'p-badge is-done';
                    btn.textContent = 'View confirmation';
                } else if (st && st.reg && st.reg.name) {
                    var c = counts(def, st.answers || {});
                    badge.textContent = 'In progress: ' + c.n + ' of ' + c.total + ' answered'; badge.className = 'p-badge is-progress';
                    btn.textContent = 'Continue your assignment';
                    resume.push({ slug: slug, def: def, st: st, c: c });
                }
            })(cards[i]);
        }
        var banner = document.getElementById('pResume');
        if (banner && resume.length) {
            var r = resume[0];
            banner.hidden = false;
            banner.innerHTML = '<div><strong>Welcome back, ' + esc(firstName(r.st.reg.name)) + '!</strong><span>We saved your ' + esc(r.def.short) + ' assignment (' + r.c.n + ' of ' + r.c.total + ' answered). Pick up where you left off.</span></div>' +
                '<a class="btn btn-primary" href="' + esc(r.slug) + '/">Continue</a>';
        }
        return true;
    }

    /* ============================== ROLE APP =============================== */
    function initRole() {
        var root = document.getElementById('portal-app');
        if (!root) { return false; }
        var slug = root.getAttribute('data-role-key');
        var def = P.roles[slug];
        if (!def) { return false; }
        var role = def.role;
        var st = load(slug);
        var resumedOnLoad = !!(st && st.reg && st.reg.name && !st.submittedAt && counts(def, st.answers || {}).n > 0);
        var banner = resumedOnLoad;
        if (!st) { st = { v: 1, step: 'register', reg: {}, answers: {}, startedAt: null, submissionId: '', submittedAt: null }; }
        var saveTimer = null;

        function persist() { save(slug, st); }
        function persistSoon() { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(persist, 350); }
        function focusHeading() { var h = root.querySelector('[data-focus]'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } }
        function stepper(current) {
            var names = ['Register', 'Assignment', 'Submit'];
            var idx = { register: 0, questions: 1, review: 2 }[current];
            return '<ol class="p-steps" aria-label="Progress">' + names.map(function (n, i) {
                var cls = i < idx ? 'is-done' : (i === idx ? 'is-current' : '');
                return '<li class="' + cls + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="p-step-n">' + (i < idx ? '&#10003;' : (i + 1)) + '</span><span class="p-step-t">' + n + '</span></li>';
            }).join('') + '</ol>';
        }
        function topBar(extra) {
            return '<div class="p-topbar"><a class="p-back" href="../">&larr; All internships</a>' + (extra || '') + skipLink(role, 'p-skip', 'Skip assignment, apply directly') + '</div>';
        }
        function chips() {
            return '<ul class="p-chips"><li>About ' + esc(def.time) + '</li><li>Freshers welcome</li><li>No experience needed</li><li>Save and continue later</li></ul>';
        }

        /* ---------- closed (not configured) ---------- */
        function renderClosed() {
            root.innerHTML = topBar() + '<section class="p-card p-center"><h1 data-focus>' + esc(role) + ' assignment</h1><p class="p-lead">This assignment is not open for submissions right now.</p>' +
                '<p>You can still apply directly.</p>' + skipLink(role, 'btn btn-primary', 'Continue to application') + '</section>';
        }

        /* ---------- step 1: register ---------- */
        function renderRegister(errors) {
            errors = errors || {};
            var r = st.reg || {};
            var types = '<option value="">Choose one (optional)</option>' + P.candidateTypes.map(function (t) { return '<option' + (r.type === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
            function err(k) { return errors[k] ? '<p class="p-error" id="r-' + k + '-err" role="alert">' + esc(errors[k]) + '</p>' : ''; }
            function inv(k) { return errors[k] ? ' aria-invalid="true" aria-describedby="r-' + k + '-err"' : ''; }
            root.innerHTML = topBar() + stepper('register') +
                '<section class="p-card"><p class="p-eyebrow">' + esc(def.short) + ' assignment</p><h1 data-focus>Let us get to know you</h1>' +
                '<p class="p-lead">' + esc(def.blurb) + '</p>' + chips() +
                '<form id="pRegister" novalidate class="p-form">' +
                (Object.keys(errors).length ? '<div class="p-summary" role="alert">Please check the highlighted fields.</div>' : '') +
                '<div class="p-field"><label for="r-name">Your full name <span class="p-req">(required)</span></label><input class="p-input" id="r-name" name="name" type="text" autocomplete="name" required aria-required="true" value="' + esc(r.name || '') + '"' + inv('name') + '>' + err('name') + '</div>' +
                '<div class="p-field"><label for="r-email">Email address <span class="p-req">(required)</span></label><input class="p-input" id="r-email" name="email" type="email" autocomplete="email" required aria-required="true" value="' + esc(r.email || '') + '"' + inv('email') + '>' + err('email') + '</div>' +
                '<div class="p-field"><label for="r-phone">Mobile number <span class="p-req">(required)</span></label><input class="p-input" id="r-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-required="true" value="' + esc(r.phone || '') + '"' + inv('phone') + '>' + err('phone') + '</div>' +
                '<div class="p-field"><label for="r-type">What best describes you right now?</label><select class="p-input" id="r-type" name="type">' + types + '</select></div>' +
                '<p class="p-fine">We use these details only to review your internship application. Everything else in the assignment is optional.</p>' +
                '<div class="p-actions"><button type="submit" class="btn btn-primary p-wide">' + (r.name ? 'Continue' : 'Start the assignment') + '</button></div>' +
                '<p class="p-or">Not required to take the assignment? ' + skipLink(role, 'p-link', 'Skip and go straight to the application') + '</p>' +
                '</form></section>';
            focusHeading();
            document.getElementById('pRegister').addEventListener('submit', function (e) {
                e.preventDefault();
                var f = e.target, reg = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), type: f.type.value };
                var errs = {};
                if (!reg.name) { errs.name = 'Please enter your name.'; }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(reg.email)) { errs.email = 'Please enter a valid email address, like name@example.com.'; }
                var digits = reg.phone.replace(/\D/g, '');
                if (digits.length < 8 || digits.length > 15) { errs.phone = 'Please enter your mobile number (8 to 15 digits).'; }
                if (Object.keys(errs).length) {
                    st.reg = reg; renderRegister(errs);
                    var firstBad = root.querySelector('[aria-invalid="true"]'); if (firstBad) { firstBad.focus(); }
                    return;
                }
                st.reg = reg; st.step = 'questions'; if (!st.startedAt) { st.startedAt = new Date().toISOString(); }
                persist(); track('portal_registered', role); render(); window.scrollTo(0, 0);
            });
        }

        /* ---------- step 2: questions ---------- */
        function ansVal(k) { return st.answers[k] === undefined ? '' : st.answers[k]; }
        function renderItem(it, n) {
            var id = 'q-' + it.id, a = st.answers, label = '<span class="p-qid">' + esc(it.id) + '</span>' + esc(it.label);
            var hint = it.hint ? '<p class="p-hint" id="' + id + '-hint">' + esc(it.hint) + '</p>' : '';
            var d = it.hint ? ' aria-describedby="' + id + '-hint"' : '';
            var out = '';
            if (it.type === 'mcq' || it.type === 'radio') {
                var letters = 'ABCDEFG';
                out = '<fieldset class="p-q"><legend class="p-legend">' + label + '</legend>' + hint + '<div class="p-options' + (it.type === 'mcq' ? ' is-mcq' : '') + '">' +
                    it.options.map(function (o, i) {
                        return '<label class="p-option"><input type="radio" name="' + id + '" value="' + esc(o) + '" data-k="' + it.id + '"' + (a[it.id] === o ? ' checked' : '') + '><span>' + (it.type === 'mcq' ? '<b class="p-letter">' + letters[i] + '</b>' : '') + '<span>' + esc(o) + '</span></span></label>';
                    }).join('') + '</div>' +
                    (it.follow ? '<label class="p-sub" for="' + id + '-f">' + esc(it.follow) + '</label><input class="p-input" id="' + id + '-f" type="text" data-k="' + it.id + '__follow" value="' + esc(ansVal(it.id + '__follow')) + '">' : '') + '</fieldset>';
            } else if (it.type === 'checks') {
                var cur = a[it.id] || [];
                out = '<fieldset class="p-q"><legend class="p-legend">' + label + '</legend>' + (it.hint ? hint : '<p class="p-hint">Tick all that apply.</p>') + '<div class="p-options">' +
                    it.options.map(function (o) { return '<label class="p-option"><input type="checkbox" value="' + esc(o) + '" data-k="' + it.id + '" data-multi="1"' + (cur.indexOf(o) !== -1 ? ' checked' : '') + '><span><span>' + esc(o) + '</span></span></label>'; }).join('') + '</div>' +
                    (it.other ? '<label class="p-sub" for="' + id + '-o">Other (optional)</label><input class="p-input" id="' + id + '-o" type="text" data-k="' + it.id + '__other" placeholder="Type any other tool you know" value="' + esc(ansVal(it.id + '__other')) + '">' : '') + '</fieldset>';
            } else if (it.type === 'multi') {
                var rows = '';
                for (var i = 1; i <= it.count; i++) { rows += '<label class="p-sub" for="' + id + '-' + i + '">' + esc(it.prefix) + ' ' + i + '</label><input class="p-input" id="' + id + '-' + i + '" type="text" data-k="' + it.id + '_' + i + '" value="' + esc(ansVal(it.id + '_' + i)) + '">'; }
                out = '<fieldset class="p-q"><legend class="p-legend">' + label + '</legend>' + hint + rows + '</fieldset>';
            } else if (it.type === 'text') {
                out = '<div class="p-q"><label class="p-legend" for="' + id + '">' + label + '</label>' + hint + '<textarea class="p-input" id="' + id + '" rows="' + (it.rows || 3) + '" data-k="' + it.id + '"' + d + '>' + esc(ansVal(it.id)) + '</textarea></div>';
            } else { // line, url
                out = '<div class="p-q"><label class="p-legend" for="' + id + '">' + label + '</label>' + hint + '<input class="p-input" id="' + id + '" type="' + (it.type === 'url' ? 'url' : 'text') + '"' + (it.type === 'url' ? ' inputmode="url"' : '') + ' data-k="' + it.id + '" placeholder="' + esc(it.placeholder || '') + '" value="' + esc(ansVal(it.id)) + '"' + d + '></div>';
            }
            return out;
        }
        function progressHtml() {
            var c = counts(def, st.answers), pct = c.total ? Math.round(c.n * 100 / c.total) : 0;
            return '<div class="p-progress"><div class="p-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + c.total + '" aria-valuenow="' + c.n + '" aria-label="Questions answered"><span style="width:' + pct + '%"></span></div><p id="pProgressText" aria-live="polite">' + c.n + ' of ' + c.total + ' answered. You can skip any you are unsure about.</p></div>';
        }
        function renderQuestions() {
            var html = topBar() + stepper('questions');
            if (banner) {
                var c0 = counts(def, st.answers);
                html += '<div class="p-welcome" role="status"><div><strong>Welcome back, ' + esc(firstName(st.reg.name)) + '!</strong><span>We saved your progress (' + c0.n + ' of ' + c0.total + ' answered). Carry on where you left off.</span></div><button type="button" class="p-link" id="pStartOver">Start over</button></div><div id="pConfirmReset" class="p-confirm" hidden><span>This deletes your saved answers on this device.</span><button type="button" class="btn btn-primary" id="pReset">Yes, start over</button><button type="button" class="p-link" id="pCancelReset">Cancel</button></div>';
            }
            html += '<section class="p-card"><p class="p-eyebrow">' + esc(def.short) + ' assignment</p><h1 data-focus>Hi ' + esc(firstName(st.reg.name)) + ', here is your assignment</h1>' +
                '<p class="p-lead">Take your time. Your answers are saved on this device as you type.</p></section>';
            def.sections.forEach(function (s) {
                html += '<section class="p-card p-section" aria-labelledby="s-' + s.id + '"><h2 id="s-' + s.id + '">' + esc(s.title) + '</h2><p class="p-intro">' + esc(s.intro) + '</p>';
                if (s.checklist) { html += '<ol class="p-tasks">' + s.checklist.map(function (t, i) { return '<li><span class="p-task-n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>'; }).join('') + '</ol>'; }
                s.items.forEach(function (it) { html += renderItem(it); });
                html += '</section>';
            });
            html += '<div class="p-savedmsg" id="pSaved" role="status" aria-live="polite"></div><div class="p-bar-spacer" aria-hidden="true"></div>' +
                '<div class="p-bottombar"><div class="p-bottombar-in">' + progressHtml() +
                '<div class="p-bottom-actions"><button type="button" class="btn btn-outline" id="pSaveLater">Save and continue later</button><button type="button" class="btn btn-primary" id="pToReview">Review and submit</button></div></div></div>';
            root.innerHTML = html;
            focusHeading();

            document.getElementById('pToReview').addEventListener('click', function () { persist(); st.step = 'review'; persist(); render(); window.scrollTo(0, 0); });
            document.getElementById('pSaveLater').addEventListener('click', function () {
                persist(); track('portal_saved_for_later', role);
                var m = document.getElementById('pSaved');
                m.innerHTML = '<strong>Saved.</strong> You can close this page. Come back to this device and pick up where you left off. <a href="../">Back to the portal home</a>';
                m.classList.add('is-on'); m.scrollIntoView({ block: 'center', behavior: 'smooth' });
            });
            var so = document.getElementById('pStartOver');
            if (so) {
                so.addEventListener('click', function () { document.getElementById('pConfirmReset').hidden = false; });
                document.getElementById('pCancelReset').addEventListener('click', function () { document.getElementById('pConfirmReset').hidden = true; });
                document.getElementById('pReset').addEventListener('click', function () {
                    safeDel(KEY_PREFIX + slug);
                    st = { v: 1, step: 'register', reg: {}, answers: {}, startedAt: null, submissionId: '', submittedAt: null };
                    banner = false; render(); window.scrollTo(0, 0);
                });
            }
        }
        function onInput(e) {
            var t = e.target, k = t.getAttribute && t.getAttribute('data-k');
            if (!k) { return; }
            if (t.getAttribute('data-multi')) {
                var cur = st.answers[k] || [], v = t.value, i = cur.indexOf(v);
                if (t.checked && i === -1) { cur.push(v); } else if (!t.checked && i !== -1) { cur.splice(i, 1); }
                st.answers[k] = cur;
            } else if (t.type === 'radio') {
                if (t.checked) { st.answers[k] = t.value; }
            } else { st.answers[k] = t.value; }
            persistSoon();
            var c = counts(def, st.answers), pct = c.total ? Math.round(c.n * 100 / c.total) : 0;
            var txt = document.getElementById('pProgressText'); if (txt) { txt.textContent = c.n + ' of ' + c.total + ' answered. You can skip any you are unsure about.'; }
            var bar = root.querySelector('.p-bar'); if (bar) { bar.setAttribute('aria-valuenow', c.n); bar.firstChild.style.width = pct + '%'; }
        }

        /* ---------- step 3: review and submit ---------- */
        function renderReview(message) {
            var c = counts(def, st.answers);
            var skipped = items(def).filter(function (it) { return !answered(it, st.answers); });
            root.innerHTML = topBar() + stepper('review') +
                '<section class="p-card"><p class="p-eyebrow">Almost done</p><h1 data-focus>Review and submit</h1>' +
                '<p class="p-lead">You answered <strong>' + c.n + ' of ' + c.total + '</strong> questions. You can submit now, or go back and add more.</p>' +
                '<div class="p-reviewbox"><div><span>Name</span><strong>' + esc(st.reg.name) + '</strong></div><div><span>Email</span><strong>' + esc(st.reg.email) + '</strong></div><div><span>Mobile</span><strong>' + esc(st.reg.phone) + '</strong></div></div>' +
                (skipped.length ? '<details class="p-skipped"><summary>' + skipped.length + ' not answered (that is okay)</summary><ul>' + skipped.map(function (it) { return '<li><strong>' + esc(it.id) + '</strong> ' + esc(it.label) + '</li>'; }).join('') + '</ul></details>' : '') +
                (message ? '<div class="p-summary" role="alert" tabindex="-1" id="pMsg">' + esc(message) + '</div>' : '') +
                '<div class="p-actions p-split"><button type="button" class="btn btn-outline" id="pBack">Back to the questions</button><button type="button" class="btn btn-primary" id="pSubmit">Submit my assignment</button></div>' +
                '<p class="p-or">Changed your mind? ' + skipLink(role, 'p-link', 'Skip and go straight to the application') + '</p></section>';
            if (message) { var m = document.getElementById('pMsg'); if (m) { m.focus(); } } else { focusHeading(); }
            document.getElementById('pBack').addEventListener('click', function () { st.step = 'questions'; persist(); render(); window.scrollTo(0, 0); });
            document.getElementById('pSubmit').addEventListener('click', submit);
        }

        function buildPayload() {
            var fields = {};
            items(def).forEach(function (it) { var v = valueOf(it, st.answers); if (v) { fields[labelOf(it)] = v; } });
            if (!st.submissionId) { st.submissionId = uuid(); persist(); }       // a retry reuses the same id: HR never gets duplicates
            return { id: st.submissionId, role: role, submittedAt: new Date().toISOString(), startedAt: st.startedAt, page: window.location.href,
                name: st.reg.name, email: st.reg.email, phone: st.reg.phone, status: st.reg.type || '', website: '', fields: fields };
        }
        function submit() {
            var c = counts(def, st.answers);
            if (c.n < 1) { renderReview('Please answer at least one question before submitting, or skip the assignment and apply directly.'); return; }
            var badLink = items(def).filter(function (it) { return it.type === 'url' && nonEmpty(st.answers[it.id]) && !/^https?:\/\/\S+\.\S+/i.test(String(st.answers[it.id]).trim()); })[0];
            if (badLink) { renderReview('The link in "' + badLink.label + '" should start with https:// . Please go back and fix it, or clear it if you do not have a video yet.'); return; }
            var btn = document.getElementById('pSubmit'); btn.disabled = true; btn.textContent = 'Sending...';
            track('portal_submit_clicked', role);
            var payload = buildPayload();
            var ctrl = ('AbortController' in window) ? new AbortController() : null;
            var timer = window.setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 25000);
            fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
                .then(function (res) { return res.json().catch(function () { return { ok: false }; }); })      // success ONLY on {"ok":true}
                .then(function (json) {
                    window.clearTimeout(timer);
                    if (!json || json.ok !== true) { throw new Error('server'); }
                    st.submittedAt = new Date().toISOString(); st.answers = {}; st.step = 'done'; persist();
                    safeSet(REMEMBER_PREFIX + role, String(Date.now()));
                    track('portal_submitted', role);
                    render(); window.scrollTo(0, 0);
                })
                .catch(function () {
                    window.clearTimeout(timer);
                    track('portal_submit_failed', role);
                    renderReview('Sorry, we could not send your answers just now. Please check your internet connection and press "Submit my assignment" again. Your answers are saved, so you will not lose anything.');
                });
        }

        /* ---------- confirmation ---------- */
        function renderDone() {
            var when = st.submittedAt ? new Date(st.submittedAt) : null;
            root.innerHTML = topBar() +
                '<section class="p-card p-center p-done"><div class="p-done-icon" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                '<h1 data-focus>Thank you' + (st.reg && st.reg.name ? ', ' + esc(firstName(st.reg.name)) : '') + '! Your assignment has been submitted.</h1>' +
                '<p class="p-lead">We have received your answers' + (when && !isNaN(when) ? ' on ' + esc(when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })) : '') + '. Our team will look at them together with your application.</p>' +
                '<div class="p-next"><p><strong>One more step:</strong> please complete your application so we can consider your profile.</p>' +
                '<a class="btn btn-primary p-wide" id="pContinue" href="' + esc(applyUrl(role)) + '">Continue to application</a>' +
                '<a class="p-link" href="../">Back to the portal home</a></div></section>';
            focusHeading();
        }

        function render() {
            if (!endpoint) { renderClosed(); return; }
            if (st.submittedAt) { renderDone(); return; }
            if (st.step === 'review' && st.reg && st.reg.name) { renderReview(); return; }
            if (st.step === 'questions' && st.reg && st.reg.name) { renderQuestions(); return; }
            st.step = 'register'; renderRegister();
        }
        root.addEventListener('input', onInput);       // attached once; the questions screen is re-rendered often
        root.addEventListener('change', onInput);
        render();
        return true;
    }

    function start() { if (!initLanding()) { initRole(); } }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
