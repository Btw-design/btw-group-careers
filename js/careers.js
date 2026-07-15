        // ============================================
        // FAQ Accordion
        // ============================================
        document.querySelectorAll('.faq-question').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var item = this.parentElement;
                var isActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(function(el) {
                    el.classList.remove('active');
                    el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                });
                if (!isActive) {
                    item.classList.add('active');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
                }
            });
        });

        // ============================================
        // Job Details Toggle
        // ============================================
        function toggleJobDetails(btn) {
            var card = btn.closest('.job-card');
            card.classList.toggle('expanded');
            var isExpanded = card.classList.contains('expanded');
            btn.setAttribute('aria-expanded', isExpanded);
            btn.querySelector('.toggle-text').textContent = isExpanded ? 'Hide details' : 'View full details';
        }

        // ============================================
        // Scroll to Top Button
        // ============================================
        var scrollBtn = document.getElementById('scrollTop');
        window.addEventListener('scroll', function() {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        scrollBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // ============================================
        // Mobile Hamburger Menu
        // ============================================
        var hamburger = document.getElementById('hamburgerBtn');
        var navLinks = document.getElementById('navLinks');
        var navOverlay = document.getElementById('navOverlay');
        if (hamburger && navLinks && navOverlay) {
            function closeNav() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
                navOverlay.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
            function openNav() {
                hamburger.classList.add('active');
                navLinks.classList.add('open');
                navOverlay.classList.add('open');
                hamburger.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
            hamburger.addEventListener('click', function() {
                var isOpen = navLinks.classList.contains('open');
                if (isOpen) { closeNav(); } else { openNav(); }
            });
            navOverlay.addEventListener('click', closeNav);
            // Close nav on link click
            navLinks.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeNav);
            });
            // Close nav on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                    closeNav();
                }
            });
        }

        // ============================================
        // Smooth Scroll for Anchor Links
        // ============================================
        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // ============================================
        // Scroll-triggered Nav Background
        // ============================================
        var nav = document.querySelector('.top-nav');
        if (nav) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 60) {
                    nav.classList.add('nav-scrolled');
                } else {
                    nav.classList.remove('nav-scrolled');
                }
            });
        }

        // ============================================
        // IntersectionObserver for Fade-up Animations
        // ============================================
        var fadeEls = document.querySelectorAll('.fade-up');
        if (fadeEls.length) {
            if ('IntersectionObserver' in window) {
                var observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
                fadeEls.forEach(function(el) { observer.observe(el); });
            } else {
                // Fallback: show all immediately
                fadeEls.forEach(function(el) { el.classList.add('visible'); });
            }
        }

        // ============================================
        // Nav Link Active State on Scroll
        // ============================================
        var sections = document.querySelectorAll('section[id]');
        var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        if (sections.length && navLinks.length) {
            window.addEventListener('scroll', function() {
                var scrollPos = window.scrollY + 120;
                var currentSection = '';
                sections.forEach(function(section) {
                    var top = section.offsetTop;
                    var bottom = top + section.offsetHeight;
                    if (scrollPos >= top && scrollPos < bottom) {
                        currentSection = section.getAttribute('id');
                    }
                });
                navLinks.forEach(function(link) {
                    var href = link.getAttribute('href').replace('#', '');
                    link.style.color = href === currentSection ? '#073E61' : '';
                    // Style the underline via a custom property if needed
                });
            });
        }

        // ============================================
        // Announcement Popup
        // ============================================
        (function() {
            var popup = document.getElementById('announcementPopup');
            var closeBtn = document.getElementById('popupCloseBtn');
            if (!popup || !closeBtn) return;

            // Check if already shown this session
            if (sessionStorage.getItem('announcementShown')) return;

            function showPopup() {
                popup.classList.add('visible');
                document.body.style.overflow = 'hidden';
                sessionStorage.setItem('announcementShown', 'true');
            }

            function hidePopup() {
                popup.classList.remove('visible');
                document.body.style.overflow = '';
            }

            // Show after a short delay so the page renders first
            setTimeout(showPopup, 600);

            // Close on X button
            closeBtn.addEventListener('click', hidePopup);

            // Close on backdrop click (only when clicking the backdrop itself, not its children)
            popup.addEventListener('click', function(e) {
                if (e.target === popup) hidePopup();
            });

            // Close on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && popup.classList.contains('visible')) {
                    hidePopup();
                }
            });
        })();
