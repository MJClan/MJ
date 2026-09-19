(() => {
    'use strict';

    const init = () => {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(pointer: fine)').matches;
        const narrowScreen = window.matchMedia('(max-width: 900px)').matches;
        const cores = Number(navigator.hardwareConcurrency || 0);
        const memory = Number(navigator.deviceMemory || 0);
        const compactMode = reduceMotion || narrowScreen || !finePointer || (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4);
        const tiltStrength = compactMode ? 3.5 : 5;

        // Compact mode lowers visual intensity, but does not disable any effect.
        document.documentElement.classList.toggle('low-performance', compactMode);
        document.documentElement.classList.toggle('motion-reduced', reduceMotion);

        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileBtn && navLinks) {
            const closeMenu = () => {
                navLinks.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
            };

            mobileBtn.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('active');
                mobileBtn.setAttribute('aria-expanded', String(isOpen));
            });

            navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
            document.addEventListener('click', (event) => {
                if (!navLinks.contains(event.target) && !mobileBtn.contains(event.target)) closeMenu();
            }, { passive: true });
        }

        const revealItems = document.querySelectorAll('.bento-item, .section-title');
        const observer = 'IntersectionObserver' in window && !reduceMotion
            ? new IntersectionObserver((entries, instance) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        instance.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 })
            : null;

        revealItems.forEach((element) => {
            element.classList.add('reveal');
            if (observer) observer.observe(element);
            else element.classList.add('visible');
        });

        window.requestAnimationFrame(() => {
            window.setTimeout(() => document.body.classList.add('is-loaded'), compactMode ? 80 : 140);
        });

        let pointerFrame = 0;
        let pointerX = 0;
        let pointerY = 0;

        // One pointer update per rendered frame avoids flooding the main thread.
        document.addEventListener('pointermove', (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (pointerFrame) return;

            pointerFrame = window.requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
                document.documentElement.style.setProperty('--pointer-y', `${pointerY}px`);
                pointerFrame = 0;
            });
        }, { passive: true });

        document.querySelectorAll('[data-tilt]').forEach((card) => {
            let rect = null;
            let tiltFrame = 0;
            let pendingEvent = null;

            const resetTilt = () => {
                pendingEvent = null;
                rect = null;
                if (tiltFrame) {
                    window.cancelAnimationFrame(tiltFrame);
                    tiltFrame = 0;
                }
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            };

            card.addEventListener('pointerenter', () => {
                rect = card.getBoundingClientRect();
            }, { passive: true });

            card.addEventListener('pointermove', (event) => {
                if (!rect) rect = card.getBoundingClientRect();
                pendingEvent = event;
                if (tiltFrame) return;

                tiltFrame = window.requestAnimationFrame(() => {
                    if (!pendingEvent || !rect) {
                        tiltFrame = 0;
                        return;
                    }

                    const x = (pendingEvent.clientX - rect.left) / rect.width;
                    const y = (pendingEvent.clientY - rect.top) / rect.height;
                    card.style.setProperty('--card-x', `${x * 100}%`);
                    card.style.setProperty('--card-y', `${y * 100}%`);
                    card.style.setProperty('--tilt-x', `${(0.5 - y) * tiltStrength}deg`);
                    card.style.setProperty('--tilt-y', `${(x - 0.5) * tiltStrength}deg`);
                    tiltFrame = 0;
                });
            }, { passive: true });

            card.addEventListener('pointerleave', resetTilt, { passive: true });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
