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

        function toggleJobDetails(btn) {
            var card = btn.closest('.job-card');
            card.classList.toggle('expanded');
            var isExpanded = card.classList.contains('expanded');
            btn.setAttribute('aria-expanded', isExpanded);
            btn.querySelector('.toggle-text').textContent = isExpanded ? 'Hide details' : 'View full details';
        }

        var scrollBtn = document.getElementById('scrollTop');
        window.addEventListener('scroll', function() {
            if (window.scrollY > 400) { scrollBtn.classList.add('visible'); } else { scrollBtn.classList.remove('visible'); }
        });
        scrollBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

        document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                var target = document.querySelector(this.getAttribute('href'));
                if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            });
        });

        var fadeEls = document.querySelectorAll('.fade-up');
        if (fadeEls.length) {
            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
            fadeEls.forEach(function(el) { observer.observe(el); });
        }
