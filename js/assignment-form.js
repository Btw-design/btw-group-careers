/* ==========================================================================
   Assignment form behaviour (/assignment/...)
   - saves answers on the candidate's device as they type, restores them later
   - friendly validation (only name, email, mobile are required)
   - sends the answers to the HR intake endpoint, then shows a confirmation
     with a clear "Continue to application" button
   ========================================================================== */
(function () {
    'use strict';

    var form = document.getElementById('assignmentForm');
    if (!form) { return; }

    var role = form.getAttribute('data-role');
    var slug = form.getAttribute('data-slug');
    var applyUrl = form.getAttribute('data-apply');
    var DRAFT_KEY = 'btw_assignment_draft_' + slug;
    var DONE_KEY = 'btw_assignment_' + role;                 // same key the Apply dialog uses
    var cfg = window.BTW_ASSIGNMENT || {};
    var endpoint = cfg.endpoint || '';

    var submitBtn = document.getElementById('aSubmit');
    var progressEl = document.getElementById('aProgress');
    var summary = document.getElementById('aSummary');
    var done = document.getElementById('aDone');
    var notice = document.getElementById('aNotice');
    var restored = document.getElementById('aRestored');

    function track(name) {
        try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, assignment_role: role }); } catch (e) { /* never break the form */ }
    }
    function safeGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
    function safeDel(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ } }

    /* ---------- Submissions switched off (no endpoint yet) ---------- */
    if (!endpoint) {
        notice.hidden = false;
        notice.innerHTML = 'This assignment is not open for submissions right now. You can still <a class="a-link" href="' + applyUrl + '">continue to the application</a>.';
        submitBtn.textContent = 'Continue to application';
        form.addEventListener('submit', function (e) { e.preventDefault(); window.location.href = applyUrl; });
        return;
    }

    /* ---------- Read / write all answers ---------- */
    function collect() {
        var data = {};
        var els = form.elements;
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el.name || el.name === 'website' || el.disabled) { continue; }
            if (el.type === 'checkbox') {
                if (!data[el.name]) { data[el.name] = []; }
                if (el.checked) { data[el.name].push(el.value); }
            } else if (el.type === 'radio') {
                if (el.checked) { data[el.name] = el.value; } else if (!(el.name in data)) { data[el.name] = ''; }
            } else {
                data[el.name] = el.value;
            }
        }
        return data;
    }
    function apply(data) {
        var els = form.elements;
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (!el.name || !(el.name in data)) { continue; }
            if (el.type === 'checkbox') { el.checked = (data[el.name] || []).indexOf(el.value) !== -1; }
            else if (el.type === 'radio') { el.checked = (data[el.name] === el.value); }
            else { el.value = data[el.name]; }
        }
    }
    function hasAnything(data) {
        for (var k in data) {
            var v = data[k];
            if (Array.isArray(v) ? v.length : String(v).trim()) { return true; }
        }
        return false;
    }

    /* ---------- Autosave + progress ---------- */
    var saveTimer = null;
    function answeredCount() {
        var groups = form.querySelectorAll('[data-q]:not([data-meta])');
        var n = 0;
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i], filled = false;
            var inputs = g.querySelectorAll('input, textarea, select');
            for (var j = 0; j < inputs.length; j++) {
                var x = inputs[j];
                if ((x.type === 'checkbox' || x.type === 'radio') ? x.checked : String(x.value).trim() !== '') { filled = true; break; }
            }
            if (filled) { n++; }
        }
        return { n: n, total: groups.length };
    }
    function updateProgress() {
        var c = answeredCount();
        progressEl.textContent = c.n + ' of ' + c.total + ' questions answered. You can skip any you are unsure about.';
    }
    function scheduleSave() {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(function () {
            var d = collect();
            if (hasAnything(d)) { safeSet(DRAFT_KEY, JSON.stringify(d)); }
        }, 400);
        updateProgress();
    }
    form.addEventListener('input', scheduleSave);
    form.addEventListener('change', scheduleSave);

    var saved = safeGet(DRAFT_KEY);
    if (saved) {
        try { var parsed = JSON.parse(saved); if (hasAnything(parsed)) { apply(parsed); restored.hidden = false; } } catch (e) { /* ignore bad draft */ }
    }
    document.getElementById('aStartFresh').addEventListener('click', function () {
        safeDel(DRAFT_KEY); form.reset(); restored.hidden = true; updateProgress();
        var first = form.querySelector('input, textarea, select'); if (first) { first.focus(); }
    });
    updateProgress();

    /* ---------- Validation (friendly, inline) ---------- */
    function setError(input, message) {
        var err = document.getElementById(input.id + '-err');
        if (message) {
            input.setAttribute('aria-invalid', 'true');
            if (err) { err.textContent = message; err.hidden = false; }
            input.setAttribute('aria-describedby', ((input.getAttribute('aria-describedby') || '').replace(/\s*\S+-err/, '') + ' ' + input.id + '-err').trim());
        } else {
            input.removeAttribute('aria-invalid');
            if (err) { err.hidden = true; err.textContent = ''; }
        }
    }
    function validate() {
        var problems = [];
        var name = form.elements.name, email = form.elements.email, phone = form.elements.phone;
        var vName = name.value.trim(), vEmail = email.value.trim(), vPhone = phone.value.trim();
        setError(name, vName ? '' : 'Please enter your name.');
        if (!vName) { problems.push(name); }
        var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vEmail);
        setError(email, okEmail ? '' : 'Please enter a valid email address, like name@example.com.');
        if (!okEmail) { problems.push(email); }
        var digits = vPhone.replace(/\D/g, '');
        var okPhone = digits.length >= 8 && digits.length <= 15;
        setError(phone, okPhone ? '' : 'Please enter your mobile number (8 to 15 digits).');
        if (!okPhone) { problems.push(phone); }
        var link = form.elements.video_link;
        if (link && link.value.trim() && !/^https?:\/\/\S+\.\S+/i.test(link.value.trim())) {
            setError(link, 'This should be a web link that starts with https://. Or leave it empty for now.');
            problems.push(link);
        } else if (link) { setError(link, ''); }
        return problems;
    }
    ['name', 'email', 'phone'].forEach(function (n) {
        form.elements[n].addEventListener('input', function () { if (this.getAttribute('aria-invalid')) { setError(this, ''); } });
    });

    /* ---------- Build the payload: readable question -> answer ---------- */
    function labelOf(group) { return group.getAttribute('data-label'); }
    function buildPayload() {
        var fields = {};
        var groups = form.querySelectorAll('[data-q]:not([data-meta])');
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i], parts = [];
            var inputs = g.querySelectorAll('input, textarea, select');
            for (var j = 0; j < inputs.length; j++) {
                var x = inputs[j];
                if (x.type === 'checkbox' || x.type === 'radio') { if (x.checked) { parts.push(x.value); } }
                else if (String(x.value).trim()) {
                    var lab = x.previousElementSibling && x.previousElementSibling.tagName === 'LABEL' && x.type === 'text' && inputs.length > 1
                        ? x.previousElementSibling.textContent.replace(/\s*\(optional\)\s*/i, '').trim() + ': ' : '';
                    parts.push(lab + String(x.value).trim());
                }
            }
            fields[labelOf(g)] = parts.join(' | ');
        }
        var id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(16).slice(2));
        var s = form.elements.status;
        return {
            id: form.getAttribute('data-submission-id') || id,
            role: role,
            submittedAt: new Date().toISOString(),
            page: window.location.href,
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
            status: s ? s.value : '',
            website: form.elements.website.value,            // honeypot: must stay empty
            fields: fields
        };
    }

    function showSummary(msg) { summary.hidden = false; summary.textContent = msg; summary.focus(); }

    function showDone(name) {
        form.hidden = true;
        document.querySelector('.a-hero .a-skip').hidden = true;
        document.getElementById('aDoneName').textContent = name ? ', ' + name.split(' ')[0] : '';
        done.hidden = false;
        done.focus();
        window.scrollTo(0, 0);
        track('assignment_submitted');
    }

    /* ---------- Submit ---------- */
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        summary.hidden = true;
        var problems = validate();
        if (problems.length) {
            showSummary('Please check the highlighted ' + (problems.length === 1 ? 'field' : 'fields') + ' and try again. Everything else you wrote is saved.');
            problems[0].focus();
            return;
        }
        var payload = buildPayload();
        form.setAttribute('data-submission-id', payload.id);        // a retry reuses the same id, so HR never gets duplicates
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        track('assignment_submit_clicked');

        var ctrl = ('AbortController' in window) ? new AbortController() : null;
        var timer = window.setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 20000);
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },     // "simple" request: no CORS preflight needed
            body: JSON.stringify(payload),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (res) {
            // Success only if the intake script itself answers {"ok":true}. Anything else
            // (a Google login page, an error page, a wrong URL) is treated as a failure,
            // so a candidate is never told "submitted" when nothing was saved.
            return res.json().catch(function () { return { ok: false }; });
        }).then(function (json) {
            window.clearTimeout(timer);
            if (json && json.ok) {
                safeDel(DRAFT_KEY);
                safeSet(DONE_KEY, String(Date.now()));
                showDone(payload.name);
            } else {
                throw new Error('server');
            }
        }).catch(function () {
            window.clearTimeout(timer);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Try sending again';
            showSummary('Sorry, we could not send your answers just now. Please check your internet connection and press "Try sending again". Your answers are saved, so you will not lose anything.');
            track('assignment_submit_failed');
        });
    });
})();
