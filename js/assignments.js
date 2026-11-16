/* ==========================================================================
   Pre-application assignment step (Digital Marketing Intern, Video Editor Intern)

   Clicking "Apply Now" on one of these roles opens a short, friendly
   "Before you apply" dialog:
     - start the starter assignment (a short beginner-level questionnaire on its
       own page, with a clear submit button and confirmation), or
     - skip straight to the HR application if the assignment isn't required.

   Progressive enhancement and safe by default:
     - Without JavaScript, or for any other role, the Apply buttons are plain links
       to the HR portal, exactly as before.
     - Until HR sets the intake endpoint in js/assignment-config.js, this step is
       switched off and the buttons behave exactly as before.
   ========================================================================== */
(function () {
    'use strict';

    var cfg = window.BTW_ASSIGNMENT || {};
    if (!cfg.endpoint) { return; }                       // not configured yet: leave Apply buttons untouched

    var ROLES = {
        'Digital Marketing Intern': {
            page: 'assignment/digital-marketing-intern/',
            minutes: '20 to 30 minutes',
            what: '10 short questions, 5 small practical tasks and 2 quick questions about you.'
        },
        'Video Editor Intern': {
            page: 'assignment/video-editor-intern/',
            minutes: '30 to 45 minutes',
            what: '8 short questions, one small practical edit and 2 quick questions about you.'
        }
    };

    var STORAGE_PREFIX = 'btw_assignment_';
    var REMEMBER_DAYS = 30;

    /* ---- Small helpers ----------------------------------------------------- */
    function track(name, role) {
        try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, assignment_role: role }); } catch (e) { /* analytics must never break the flow */ }
    }
    function remembered(role) {
        try {
            var v = window.localStorage.getItem(STORAGE_PREFIX + role);
            return !!v && (Date.now() - parseInt(v, 10)) < REMEMBER_DAYS * 86400000;
        } catch (e) { return false; }
    }
    function remember(role) {
        try { window.localStorage.setItem(STORAGE_PREFIX + role, String(Date.now())); } catch (e) { /* ignore */ }
    }
    function el(tag, className, text) {
        var n = document.createElement(tag);
        if (className) { n.className = className; }
        if (text) { n.textContent = text; }
        return n;
    }
    function roleFromHref(href) {
        var m = /[?&]job=([^&#]+)/.exec(href || '');
        if (!m) { return ''; }
        try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return m[1]; }
    }

    /* ---- Feature check ----------------------------------------------------- */
    var probe = document.createElement('dialog');
    if (typeof probe.showModal !== 'function') { return; }   // old browser: normal links keep working

    var buttons = [];
    var all = document.querySelectorAll('a.card-apply-btn[href*="job="]');
    for (var i = 0; i < all.length; i++) {
        var r = roleFromHref(all[i].getAttribute('href'));
        if (ROLES[r]) { all[i].setAttribute('data-assignment-role', r); buttons.push(all[i]); }
    }
    if (!buttons.length) { return; }

    /* ---- Dialog ------------------------------------------------------------ */
    var dialog = el('dialog', 'assign-dialog');
    dialog.setAttribute('aria-labelledby', 'assignTitle');
    document.body.appendChild(dialog);

    var lastTrigger = null;
    var state = { role: '', applyUrl: '' };

    function close() { if (dialog.open) { dialog.close(); } }
    function setHash(role) {
        try {
            var url = window.location.pathname + window.location.search + (role ? '#assignment=' + role.replace(/\s+/g, '-') : '');
            window.history.replaceState(null, '', url);
        } catch (e) { /* ignore */ }
    }
    dialog.addEventListener('close', function () {
        setHash('');
        if (lastTrigger && typeof lastTrigger.focus === 'function') { lastTrigger.focus(); }
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) { close(); } });   // backdrop click

    function render() {
        var role = state.role, info = ROLES[role];
        dialog.innerHTML = '';
        var wrap = el('div', 'assign-card');

        var closeBtn = el('button', 'assign-close');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        closeBtn.addEventListener('click', close);
        wrap.appendChild(closeBtn);

        var body = el('div', 'assign-body');
        body.appendChild(el('p', 'assign-eyebrow', 'Before you apply'));
        var h = el('h2', 'assign-title', role + ': a quick starter assignment');
        h.id = 'assignTitle';
        h.tabIndex = -1;
        body.appendChild(h);

        var chips = el('ul', 'assign-chips');
        ['About ' + info.minutes, 'Freshers welcome', 'No experience needed', 'Do it at your own pace'].forEach(function (t) {
            chips.appendChild(el('li', '', t));
        });
        body.appendChild(chips);

        body.appendChild(el('p', 'assign-intro', 'A short, friendly task so we can get to know your basic knowledge, creativity and interest. It is not an exam, and nobody expects expert skills. Freshers and people with no work experience can apply too.'));

        var steps = el('ol', 'assign-steps');
        ['Do the assignment', 'Submit it', 'Complete your application'].forEach(function (t, idx) {
            var li = el('li', '');
            li.appendChild(el('span', 'assign-step-n', String(idx + 1)));
            li.appendChild(document.createTextNode(t));
            steps.appendChild(li);
        });
        body.appendChild(steps);

        var sec = el('div', 'assign-section');
        sec.appendChild(el('h3', '', 'What is inside'));
        sec.appendChild(el('p', '', info.what));
        sec.appendChild(el('p', '', 'Your answers are saved on your device as you type, so you can stop and come back later.'));
        body.appendChild(sec);

        var actions = el('div', 'assign-actions');
        var start = el('a', 'btn btn-primary assign-primary', 'Start the assignment');
        start.href = info.page;
        start.addEventListener('click', function () { track('assignment_started', role); });
        actions.appendChild(start);

        var line = el('p', 'assign-skip-line', 'Not required for you? ');
        var skip = el('button', 'assign-secondary', 'Skip and go straight to the application');
        skip.type = 'button';
        skip.addEventListener('click', function () {
            track('assignment_skipped', role);
            remember(role);
            window.location.href = state.applyUrl;
        });
        line.appendChild(skip);
        actions.appendChild(line);
        body.appendChild(actions);

        wrap.appendChild(body);
        dialog.appendChild(wrap);
    }

    function openFor(link) {
        var role = link.getAttribute('data-assignment-role');
        state.role = role;
        state.applyUrl = link.getAttribute('href');
        lastTrigger = link;
        render();
        dialog.showModal();
        setHash(role);
        var t = document.getElementById('assignTitle');
        if (t) { t.focus(); }
        dialog.scrollTop = 0;
        track('assignment_opened', role);
    }

    buttons.forEach(function (link) {
        link.addEventListener('click', function (e) {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
            var role = link.getAttribute('data-assignment-role');
            if (remembered(role)) { return; }            // already submitted or skipped: straight to the application
            e.preventDefault();
            openFor(link);
        });
    });

    /* Deep link: #assignment=Role-Name opens the dialog (handy to share or bookmark) */
    function openFromHash() {
        if (dialog.open) { return; }
        var m = /assignment=([^&]+)/.exec(window.location.hash || '');
        if (!m) { return; }
        var wanted = decodeURIComponent(m[1]).replace(/-/g, ' ').toLowerCase();
        for (var k = 0; k < buttons.length; k++) {
            if (buttons[k].getAttribute('data-assignment-role').toLowerCase() === wanted) {
                var card = buttons[k].closest('.job-card');
                if (card && card.scrollIntoView) { card.scrollIntoView({ block: 'center' }); }
                openFor(buttons[k]);
                return;
            }
        }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
})();
