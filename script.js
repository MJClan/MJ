(() => {
    'use strict';

    const REDUCE_MOTION_STORAGE_KEY = 'mj-clan-reduce-motion';
    const THEME_STORAGE_KEY = 'mj-clan-theme';

    const readReduceMotionPreference = () => {
        try {
            return window.localStorage.getItem(REDUCE_MOTION_STORAGE_KEY) === 'true';
        } catch (error) {
            return false;
        }
    };

    const saveReduceMotionPreference = (enabled) => {
        try {
            window.localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(enabled));
        } catch (error) {
            // localStorage may be unavailable; the current page still works in memory.
        }
    };

    const readThemePreference = () => {
        try {
            return window.localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
        } catch (error) {
            return 'dark';
        }
    };

    const saveThemePreference = (theme) => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            // localStorage may be unavailable; the current page still works in memory.
        }
    };

    const DISCORD_INVITE_API_URL = 'https://discord.com/api/v10/invites/nswjg7DrZT?with_counts=true';
    const DISCORD_GUILD_ID = '1461686776144986165';
    const DISCORD_EPOCH = 1420070400000;

    const getDiscordCreatedAt = () => {
        try {
            const timestamp = Number((BigInt(DISCORD_GUILD_ID) >> 22n)) + DISCORD_EPOCH;
            return new Date(timestamp);
        } catch (error) {
            return null;
        }
    };

    const formatDateTime = (date) => {
        if (!date || Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date).replace(/\//g, '/');
    };

    const formatServerAge = (createdAt, now = new Date()) => {
        if (!createdAt || Number.isNaN(createdAt.getTime())) return '—';

        const elapsedMilliseconds = Math.max(0, now.getTime() - createdAt.getTime());
        const elapsedDays = Math.floor(elapsedMilliseconds / 86400000);
        return `${new Intl.NumberFormat('zh-TW').format(elapsedDays)} 天`;
    };

    const initStatistics = () => {
        const memberElement = document.querySelector('#discord-member-count');
        if (!memberElement) return;

        const onlineElement = document.querySelector('#discord-online-count');
        const memberStatus = document.querySelector('#discord-member-status');
        const createdElement = document.querySelector('#discord-created-at');
        const ageElement = document.querySelector('#discord-server-age');
        const updatedElement = document.querySelector('#discord-updated-at');
        const fetchStatusElement = document.querySelector('#statistics-fetch-status');
        const refreshButton = document.querySelector('#statistics-refresh');
        const createdAt = getDiscordCreatedAt();

        if (createdElement && createdAt) {
            createdElement.textContent = formatDateTime(createdAt).split(' ')[0];
            createdElement.dateTime = createdAt.toISOString();
        }
        if (ageElement && createdAt) ageElement.textContent = formatServerAge(createdAt);

        const setLoading = (loading) => {
            if (!refreshButton) return;
            refreshButton.disabled = loading;
            refreshButton.setAttribute('aria-busy', String(loading));
        };

        const fetchStats = async () => {
            setLoading(true);
            if (memberStatus) memberStatus.textContent = '正在取得 Discord 資料…';
            if (fetchStatusElement) fetchStatusElement.textContent = '正在更新 Discord 統計…';

            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 8000);

            try {
                const response = await fetch(DISCORD_INVITE_API_URL, {
                    cache: 'no-store',
                    signal: controller.signal
                });
                if (!response.ok) throw new Error(`Discord API ${response.status}`);

                const data = await response.json();
                const memberCount = data.approximate_member_count ?? data.profile?.member_count;
                const onlineCount = data.approximate_presence_count ?? data.profile?.online_count;
                if (!Number.isFinite(memberCount)) throw new Error('Discord member count unavailable');

                memberElement.textContent = new Intl.NumberFormat('zh-TW').format(memberCount);
                if (onlineElement) {
                    onlineElement.textContent = Number.isFinite(onlineCount)
                        ? new Intl.NumberFormat('zh-TW').format(onlineCount)
                        : '—';
                }
                if (memberStatus) memberStatus.textContent = 'Discord 約略成員數';
                if (updatedElement) updatedElement.textContent = formatDateTime(new Date());
                if (fetchStatusElement) fetchStatusElement.textContent = '資料已更新；Discord 數字會隨社群狀態變動。';
            } catch (error) {
                memberElement.textContent = '—';
                if (onlineElement) onlineElement.textContent = '—';
                if (memberStatus) memberStatus.textContent = '暫時無法取得 Discord 資料';
                if (fetchStatusElement) fetchStatusElement.textContent = '目前無法連線 Discord，請稍後再試。';
            } finally {
                window.clearTimeout(timeout);
                setLoading(false);
            }
        };

        if (refreshButton) refreshButton.addEventListener('click', fetchStats);
        fetchStats();
    };

    const createPreferenceControls = () => {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer || navContainer.querySelector('.site-preferences')) return null;

        const controls = document.createElement('div');
        controls.className = 'site-preferences';
        controls.setAttribute('aria-label', '網站偏好設定');
        controls.innerHTML = `
            <div class="preference-button-wrap">
                <button
                    type="button"
                    class="preference-toggle motion-toggle"
                    aria-label="啟用減少動態效果"
                    aria-describedby="motion-preference-tooltip"
                    aria-pressed="false"
                >
                    <span class="cssgg-icon gg-play-pause" aria-hidden="true"></span>
                    <span class="sr-only">減少動態效果</span>
                </button>
                <span class="preference-tooltip" id="motion-preference-tooltip" role="tooltip">
                    減少動態效果：降低背景動畫、頁面淡入與卡片傾斜，預設關閉。
                </span>
            </div>
            <div class="preference-button-wrap">
                <button
                    type="button"
                    class="preference-toggle theme-toggle"
                    aria-label="切換至淺色模式"
                    aria-describedby="theme-preference-tooltip"
                    aria-pressed="false"
                >
                    <span class="cssgg-icon gg-sun" aria-hidden="true"></span>
                    <span class="sr-only">切換淺色或深色模式</span>
                </button>
                <span class="preference-tooltip" id="theme-preference-tooltip" role="tooltip">
                    色彩模式：目前為深色，可切換至淺色。
                </span>
            </div>
        `;
        navContainer.appendChild(controls);

        return {
            controls,
            motionButton: controls.querySelector('.motion-toggle'),
            motionTooltip: controls.querySelector('#motion-preference-tooltip'),
            themeButton: controls.querySelector('.theme-toggle'),
            themeTooltip: controls.querySelector('#theme-preference-tooltip')
        };
    };

    const init = () => {
        const preferences = createPreferenceControls();
        let reduceMotionEnabled = readReduceMotionPreference();
        let activeTheme = readThemePreference();
        let revealObserver = null;
        let themeTransitionTimer = 0;

        const applyReduceMotion = (enabled, persist = false) => {
            reduceMotionEnabled = Boolean(enabled);
            document.documentElement.classList.toggle('reduce-motion', reduceMotionEnabled);

            if (preferences && preferences.motionButton) {
                preferences.motionButton.setAttribute('aria-pressed', String(reduceMotionEnabled));
                preferences.motionButton.setAttribute(
                    'aria-label',
                    reduceMotionEnabled ? '關閉減少動態效果' : '啟用減少動態效果'
                );
            }

            if (preferences && preferences.motionTooltip) {
                preferences.motionTooltip.textContent = reduceMotionEnabled
                    ? '減少動態效果已開啟：降低背景動畫、頁面淡入與卡片傾斜。'
                    : '減少動態效果：降低背景動畫、頁面淡入與卡片傾斜，預設關閉。';
            }

            if (persist) saveReduceMotionPreference(reduceMotionEnabled);

            if (reduceMotionEnabled) {
                if (revealObserver) revealObserver.disconnect();
                document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
            }
        };

        const applyTheme = (theme, persist = false) => {
            activeTheme = theme === 'light' ? 'light' : 'dark';
            const isLightTheme = activeTheme === 'light';

            if (persist) {
                document.documentElement.classList.add('theme-transitioning');
                if (themeTransitionTimer) window.clearTimeout(themeTransitionTimer);
                themeTransitionTimer = window.setTimeout(() => {
                    document.documentElement.classList.remove('theme-transitioning');
                    themeTransitionTimer = 0;
                }, 520);
            }

            document.documentElement.classList.toggle('theme-light', isLightTheme);

            if (preferences && preferences.themeButton) {
                preferences.themeButton.setAttribute('aria-pressed', String(isLightTheme));
                preferences.themeButton.setAttribute(
                    'aria-label',
                    isLightTheme ? '切換至深色模式' : '切換至淺色模式'
                );
                const themeIcon = preferences.themeButton.querySelector('.cssgg-icon');
                if (themeIcon) themeIcon.className = 'cssgg-icon gg-sun';
            }

            if (preferences && preferences.themeTooltip) {
                preferences.themeTooltip.textContent = isLightTheme
                    ? '色彩模式：目前為淺色，可切換至深色。'
                    : '色彩模式：目前為深色，可切換至淺色。';
            }

            if (persist) saveThemePreference(activeTheme);
        };

        applyReduceMotion(reduceMotionEnabled);
        applyTheme(activeTheme);

        if (preferences && preferences.motionButton && preferences.themeButton) {
            preferences.motionButton.addEventListener('click', () => {
                applyReduceMotion(!reduceMotionEnabled, true);
            });

            preferences.themeButton.addEventListener('click', () => {
                applyTheme(activeTheme === 'light' ? 'dark' : 'light', true);
            });
        }

        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileBtn && navLinks) {
            if (!navLinks.id) navLinks.id = 'primary-navigation';
            mobileBtn.setAttribute('aria-controls', navLinks.id);

            const closeMenu = () => {
                navLinks.classList.remove('active');
                mobileBtn.setAttribute('aria-expanded', 'false');
                mobileBtn.setAttribute('aria-label', '開啟選單');
            };

            mobileBtn.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('active');
                mobileBtn.setAttribute('aria-expanded', String(isOpen));
                mobileBtn.setAttribute('aria-label', isOpen ? '關閉選單' : '開啟選單');
            });

            navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

            document.addEventListener('click', (event) => {
                if (!navLinks.contains(event.target) && !mobileBtn.contains(event.target)) {
                    closeMenu();
                }
            }, { passive: true });

            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape' || !navLinks.classList.contains('active')) return;
                closeMenu();
                event.stopPropagation();
            });
        }

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        initStatistics();

        const revealItems = document.querySelectorAll('.bento-item, .section-title');
        revealItems.forEach((element) => element.classList.add('reveal'));

        if (!reduceMotionEnabled && 'IntersectionObserver' in window) {
            revealObserver = new IntersectionObserver((entries, instance) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        instance.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            revealItems.forEach((element) => revealObserver.observe(element));
        } else {
            revealItems.forEach((element) => element.classList.add('visible'));
        }

        window.requestAnimationFrame(() => {
            window.setTimeout(() => document.body.classList.add('is-loaded'), reduceMotionEnabled ? 80 : 140);
        });

        let pointerFrame = 0;
        let pointerX = 0;
        let pointerY = 0;

        // One pointer update per rendered frame avoids flooding the main thread.
        document.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'touch') return;
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (pointerFrame) return;

            pointerFrame = window.requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--pointer-x', `${pointerX}px`);
                document.documentElement.style.setProperty('--pointer-y', `${pointerY}px`);
                pointerFrame = 0;
            });
        }, { passive: true });

        const syncPageVisibility = () => {
            document.documentElement.classList.toggle('page-hidden', document.hidden);
        };
        syncPageVisibility();
        document.addEventListener('visibilitychange', syncPageVisibility, { passive: true });

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
                card.classList.remove('is-tilting');
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            };

            card.addEventListener('pointerenter', (event) => {
                if (event.pointerType === 'touch') return;
                card.classList.add('is-tilting');
                rect = card.getBoundingClientRect();
            }, { passive: true });

            card.addEventListener('pointermove', (event) => {
                if (event.pointerType === 'touch') return;
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
                    const tiltStrength = reduceMotionEnabled ? 2.5 : 5;
                    card.style.setProperty('--card-x', `${x * 100}%`);
                    card.style.setProperty('--card-y', `${y * 100}%`);
                    card.style.setProperty('--tilt-x', `${(0.5 - y) * tiltStrength}deg`);
                    card.style.setProperty('--tilt-y', `${(x - 0.5) * tiltStrength}deg`);
                    tiltFrame = 0;
                });
            }, { passive: true });

            card.addEventListener('pointerleave', resetTilt, { passive: true });
            card.addEventListener('pointercancel', resetTilt, { passive: true });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
