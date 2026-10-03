// Shared header behaviour for blog / article pages (mobile menu + scroll shadow)
(function () {
    var hamburger = document.getElementById('hamburgerBtn');
    var navLinks = document.getElementById('navLinks');
    var overlay = document.getElementById('navOverlay');
    var nav = document.querySelector('.top-nav');
    if (hamburger && navLinks) {
        var setOpen = function (open) {
            hamburger.classList.toggle('active', open);
            navLinks.classList.toggle('open', open);
            if (overlay) overlay.classList.toggle('open', open);
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
        };
        hamburger.addEventListener('click', function () { setOpen(!navLinks.classList.contains('open')); });
        if (overlay) overlay.addEventListener('click', function () { setOpen(false); });
        navLinks.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
    if (nav) {
        window.addEventListener('scroll', function () { nav.classList.toggle('nav-scrolled', window.scrollY > 40); }, { passive: true });
    }
})();
