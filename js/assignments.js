/* ==========================================================================
   Pre-application assignment step (Digital Marketing Intern, Video Editor Intern)

   Clicking "Apply Now" on one of these roles opens a short, friendly
   "Before you apply" dialog:
     - start the assignment (opens the HR Google Form), then continue; or
     - skip straight to the application if the assignment isn't required.

   Progressive enhancement: the Apply buttons keep their normal href, so with
   JavaScript off (or <dialog> unsupported) they go straight to the application.
   ========================================================================== */
(function () {
    'use strict';

    /* ----------------------------------------------------------------------
       CONFIG — HR: paste each role's Google Form link here (view-only link to
       the form's "Send" URL, e.g. https://forms.gle/xxxxxxxx). Until a link is
       added, the dialog still shows the brief but offers "Continue to
       application" only (no broken link is ever shown to candidates).

       Tip: in the Google Form's settings, set the confirmation message to
       something like "Thank you! Now complete your application at
       https://hr.btwgroup.co/apply" so candidates land back in the right place.
       ---------------------------------------------------------------------- */
    var ASSIGNMENT_FORMS = {
        'Digital Marketing Intern': '',
        'Video Editor Intern': ''
    };

    /* ---- Draft briefs (for HR review) ------------------------------------- */
    var BRIEFS = {
        'Digital Marketing Intern': {
            minutes: '30 minutes',
            intro: 'This quick task helps us see how you think about content. It is not a test of tools or experience, and it does not need to be perfect.',
            task: 'Pick one BTW Group service (for example Tourist Visa, Air Ticketing or Insurance) and plan one week of social media content for it, for Instagram or LinkedIn.',
            doList: [
                'List 5 posts. For each one write the topic, the format (reel, carousel or single image), a one-line hook, a caption of up to 40 words and a call to action.',
                'Add 2 lines on who you are speaking to and why this plan would work for them.',
                'Optional: design one of the posts in Canva and share the link.'
            ],
            submit: 'A link to a Google Doc, Sheet or PDF (set to "anyone with the link can view").',
            look: 'We look at clarity, how well the posts fit the audience and your creativity. Polished design is a bonus, not a requirement.'
        },
        'Video Editor Intern': {
            minutes: '30 to 45 minutes',
            intro: 'This quick task helps us see how you tell a story with video. Use any tool you like (CapCut, InShot, VN, Premiere) and any free footage.',
            task: 'Edit a 30 to 45 second vertical (9:16) reel with the message "Why travellers trust an experienced visa team".',
            doList: [
                'Use your own clips or free stock footage (for example Pexels or Pixabay) and copyright-free music.',
                'Add on-screen captions and a clear opening hook in the first 3 seconds.',
                'Write 2 lines: the tool you used and one thing you would improve with more time.'
            ],
            submit: 'A link to your video (Google Drive or unlisted YouTube, viewable by anyone with the link) and your 2-line note.',
            look: 'We look at pacing, captions, sound and storytelling. Fancy equipment or footage is not needed.'
        }
    };

    var STORAGE_PREFIX = 'btw_assignment_';
    var REMEMBER_DAYS = 30;

    /* ---- Small helpers ----------------------------------------------------- */
    function track(name, role) {
        try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: name, assignment_role: role });
        } catch (e) { /* analytics must never break the flow */ }
    }
    function remembered(role) {
        try {
            var v = window.localStorage.getItem(STORAGE_PREFIX + role);
            if (!v) { return false; }
            return (Date.now() - parseInt(v, 10)) < REMEMBER_DAYS * 86400000;
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
        if (BRIEFS[r]) { all[i].setAttribute('data-assignment-role', r); buttons.push(all[i]); }
    }
    if (!buttons.length) { return; }

    /* ---- Dialog ------------------------------------------------------------ */
    var dialog = el('dialog', 'assign-dialog');
    dialog.setAttribute('aria-labelledby', 'assignTitle');
    document.body.appendChild(dialog);

    var lastTrigger = null;
    var state = { role: '', applyUrl: '', formUrl: '' };

    function close() {
        if (dialog.open) { dialog.close(); }
    }
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
    dialog.addEventListener('click', function (e) {          // click on the backdrop closes
        if (e.target === dialog) { close(); }
    });

    function goToApplication() {
        remember(state.role);
        track('assignment_continue_to_application', state.role);
        window.location.href = state.applyUrl;
    }

    function render(stage) {
        var role = state.role;
        var b = BRIEFS[role];
        var hasForm = !!state.formUrl;
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
        var h = el('h2', 'assign-title', role + ': a quick first task');
        h.id = 'assignTitle';
        h.tabIndex = -1;
        body.appendChild(h);

        var chips = el('ul', 'assign-chips');
        ['About ' + b.minutes, 'No experience needed', 'Do it at your own pace'].forEach(function (t) {
            chips.appendChild(el('li', '', t));
        });
        body.appendChild(chips);

        if (stage === 'opened') {
            /* ---- After the Google Form has been opened ---- */
            var done = el('div', 'assign-done');
            done.appendChild(el('strong', '', 'Your assignment form is open in a new tab.'));
            done.appendChild(el('span', '', 'Submit it there, then come back here and continue. If the tab did not open, use the link below.'));
            var again = el('a', 'assign-link', 'Open the assignment form again');
            again.href = state.formUrl; again.target = '_blank'; again.rel = 'noopener';
            done.appendChild(again);
            body.appendChild(done);

            var actions = el('div', 'assign-actions');
            var go = el('button', 'btn btn-primary assign-primary', 'I have submitted it, continue to application');
            go.type = 'button';
            go.addEventListener('click', goToApplication);
            actions.appendChild(go);
            var back = el('button', 'assign-secondary', 'Back to the assignment details');
            back.type = 'button';
            back.addEventListener('click', function () { render('brief'); focusTitle(); });
            actions.appendChild(back);
            body.appendChild(actions);
        } else {
            /* ---- The brief ---- */
            body.appendChild(el('p', 'assign-intro', b.intro));
            if (hasForm) {
                body.appendChild(el('p', 'assign-notreq', 'Not required to take the assignment? For example, you have already completed it, or our team asked you to skip it. You can go straight to the application using the link at the bottom.'));
            }

            var steps = el('ol', 'assign-steps');
            ['Do the task', 'Submit it', 'Complete your application'].forEach(function (t, idx) {
                var li = el('li', '');
                li.appendChild(el('span', 'assign-step-n', String(idx + 1)));
                li.appendChild(document.createTextNode(t));
                steps.appendChild(li);
            });
            body.appendChild(steps);

            var sec1 = el('div', 'assign-section');
            sec1.appendChild(el('h3', '', 'The task'));
            sec1.appendChild(el('p', '', b.task));
            var ul = el('ul', '');
            b.doList.forEach(function (t) { ul.appendChild(el('li', '', t)); });
            sec1.appendChild(ul);
            body.appendChild(sec1);

            var sec2 = el('div', 'assign-section');
            sec2.appendChild(el('h3', '', 'What to submit'));
            sec2.appendChild(el('p', '', b.submit));
            body.appendChild(sec2);

            var sec3 = el('div', 'assign-section');
            sec3.appendChild(el('h3', '', 'How we look at it'));
            sec3.appendChild(el('p', '', b.look));
            body.appendChild(sec3);

            body.appendChild(el('p', 'assign-save', 'Want to come back later? Bookmark this page. This assignment will be here whenever you are ready.'));

            var actions2 = el('div', 'assign-actions');
            if (hasForm) {
                var start = el('a', 'btn btn-primary assign-primary', 'Open the assignment form');
                start.href = state.formUrl; start.target = '_blank'; start.rel = 'noopener';
                start.addEventListener('click', function () {
                    track('assignment_started', state.role);
                    window.setTimeout(function () { render('opened'); focusTitle(); }, 150);
                });
                actions2.appendChild(start);
                var line = el('p', 'assign-skip-line', 'Not required for you? ');
                var skip = el('button', 'assign-secondary', 'Skip and go straight to the application');
                skip.type = 'button';
                skip.addEventListener('click', function () { track('assignment_skipped', state.role); goToApplication(); });
                line.appendChild(skip);
                actions2.appendChild(line);
            } else {
                var go2 = el('button', 'btn btn-primary assign-primary', 'Continue to application');
                go2.type = 'button';
                go2.addEventListener('click', goToApplication);
                actions2.appendChild(go2);
            }
            body.appendChild(actions2);
        }

        wrap.appendChild(body);
        dialog.appendChild(wrap);
    }

    function focusTitle() {
        var t = document.getElementById('assignTitle');
        if (t) { t.focus(); }
    }

    function openFor(link) {
        var role = link.getAttribute('data-assignment-role');
        state.role = role;
        state.applyUrl = link.getAttribute('href');
        state.formUrl = ASSIGNMENT_FORMS[role] || '';
        lastTrigger = link;
        render('brief');
        dialog.showModal();
        setHash(role);
        focusTitle();
        dialog.scrollTop = 0;
        track('assignment_opened', role);
    }

    buttons.forEach(function (link) {
        link.addEventListener('click', function (e) {
            // Let new-tab / modified clicks behave normally
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
            var role = link.getAttribute('data-assignment-role');
            if (remembered(role)) { return; }          // already went through the step: straight to the form
            e.preventDefault();
            openFor(link);
        });
    });

    /* Deep link: #assignment=Role-Name opens the brief (handy to share/bookmark) */
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
