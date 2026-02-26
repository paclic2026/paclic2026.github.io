/* ============================================================
   PACLIC 40 — main.js
   Sections tracked: home, program, speakers, cfp, registration,
                     venue, committee, faq, sponsors
   ============================================================ */
(function () {
  'use strict';

  /* ── Countdown targets ─────────────────────────────────────── */
  const DEADLINES = {
    submission: new Date('2026-08-01T23:59:00'),
    earlybird:  new Date('2026-11-20T23:59:00'),
    conference: new Date('2026-12-10T09:00:00'),
  };

  let activeCd = 'submission';
  let cdTimer  = null;
  const CIRC   = 2 * Math.PI * 52; // stroke-dasharray for r=52

  /* ── DOM cache ─────────────────────────────────────────────── */
  const els = {};

  function cacheEls() {
    els.cdDays    = document.getElementById('cdDays');
    els.cdHours   = document.getElementById('cdHours');
    els.cdMins    = document.getElementById('cdMins');
    els.cdSecs    = document.getElementById('cdSecs');
    els.ringDays  = document.getElementById('ringDays');
    els.ringHours = document.getElementById('ringHours');
    els.ringMins  = document.getElementById('ringMins');
    els.ringSecs  = document.getElementById('ringSecs');
    els.cdTabs    = document.querySelectorAll('.cd-tab');
    els.dayTabs   = document.querySelectorAll('.day-tab');
    els.dayPanels = document.querySelectorAll('.day-panel');
    els.navLinks  = document.querySelectorAll('.nav-link');
    // All nine tracked sections
    els.sections  = document.querySelectorAll(
      'section#home, section#program, section#speakers, section#cfp, ' +
      'section#registration, section#venue, section#committee, ' +
      'section#faq, section#sponsors'
    );
    els.reveals   = document.querySelectorAll('.reveal');
    els.backTop   = document.getElementById('backToTop');
    els.sidebar   = document.getElementById('sidebar');
    els.overlay   = document.getElementById('sidebarOverlay');
    els.toggle    = document.getElementById('mobileToggle');
    els.starsLayer= document.getElementById('starsLayer');
    els.faqItems  = document.querySelectorAll('.faq-item');
  }

  /* ── Star field ──────────────────────────────────────────── */
  function createStars() {
    if (!els.starsLayer) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 120; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2.2 + .5;
      const x    = Math.random() * 100;
      const y    = Math.random() * 75;
      const dur  = (Math.random() * 4 + 2).toFixed(1);
      const del  = (Math.random() * 5).toFixed(1);
      const op   = (Math.random() * .6 + .2).toFixed(2);
      s.style.cssText = `width:${size}px;height:${size}px;left:${x}%;top:${y}%;--dur:${dur}s;--del:${del}s;--op:${op};`;
      frag.appendChild(s);
    }
    els.starsLayer.appendChild(frag);
  }

  /* ── Countdown rings ─────────────────────────────────────── */
  function setRing(el, value, max) {
    if (!el) return;
    const progress = Math.max(0, Math.min(1, value / max));
    el.style.strokeDasharray  = CIRC;
    el.style.strokeDashoffset = CIRC * (1 - progress);
  }

  function updateCountdown() {
    const diff = Math.max(0, DEADLINES[activeCd].getTime() - Date.now());
    const totalDays = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    if (els.cdDays)  els.cdDays.textContent  = String(totalDays).padStart(3, '0');
    if (els.cdHours) els.cdHours.textContent = String(hours).padStart(2, '0');
    if (els.cdMins)  els.cdMins.textContent  = String(mins).padStart(2, '0');
    if (els.cdSecs)  els.cdSecs.textContent  = String(secs).padStart(2, '0');

    setRing(els.ringDays,  totalDays, 365);
    setRing(els.ringHours, hours, 24);
    setRing(els.ringMins,  mins, 60);
    setRing(els.ringSecs,  secs, 60);
  }

  function startCountdown() {
    clearInterval(cdTimer);
    updateCountdown();
    cdTimer = setInterval(updateCountdown, 1000);
  }

  function initCdTabs() {
    els.cdTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        els.cdTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCd = tab.dataset.cd;
        startCountdown();
      });
    });
  }

  /* ── Day-tab schedule ────────────────────────────────────── */
  function initDayTabs() {
    els.dayTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        els.dayTabs.forEach(t => t.classList.remove('active'));
        els.dayPanels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(tab.dataset.day);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ── Scroll-spy ──────────────────────────────────────────── */
  function initScrollSpy() {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            els.navLinks.forEach(link => {
              link.classList.toggle('active', link.dataset.target === id);
            });
          }
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );
    els.sections.forEach(s => io.observe(s));

    // Smooth scroll from sidebar links
    els.navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          closeSidebar();
        }
      });
    });

    // Footer nav links
    document.querySelectorAll('.footer-nav-links a').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  /* ── Scroll-reveal ───────────────────────────────────────── */
  function initReveal() {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    els.reveals.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
      io.observe(el);
    });
  }

  /* ── FAQ accordion ───────────────────────────────────────── */
  function initFaq() {
    els.faqItems.forEach(item => {
      const btn = item.querySelector('.faq-q');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close all
        els.faqItems.forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-q')?.classList.remove('open');
        });
        // Toggle clicked
        if (!isOpen) {
          item.classList.add('open');
          btn.classList.add('open');
        }
      });
    });
  }

  /* ── Back to top ─────────────────────────────────────────── */
  function initBackToTop() {
    if (!els.backTop) return;
    window.addEventListener('scroll', () => {
      els.backTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    els.backTop.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Mobile sidebar ──────────────────────────────────────── */
  function openSidebar() {
    els.sidebar.classList.add('open');
    els.overlay.classList.add('open');
    els.toggle.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    els.sidebar.classList.remove('open');
    els.overlay.classList.remove('open');
    if (els.toggle) els.toggle.classList.remove('open');
    document.body.style.overflow = '';
  }
  function initMobileMenu() {
    if (!els.toggle) return;
    els.toggle.addEventListener('click', () => {
      els.sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    els.overlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });
  }

  /* ── Hero parallax ───────────────────────────────────────── */
  function initHeroParallax() {
    const building = document.querySelector('.hero-building');
    if (!building) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        building.style.transform = `translateY(${window.scrollY * 0.08}px)`;
      }
    }, { passive: true });
  }

  /* ── CTA button smooth scroll ────────────────────────────── */
  function initBtnScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      if (a.classList.contains('nav-link') || a.classList.contains('back-to-top')) return;
      a.addEventListener('click', e => {
        const href   = a.getAttribute('href');
        const target = href && href !== '#' ? document.querySelector(href) : null;
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    cacheEls();
    createStars();
    startCountdown();
    initCdTabs();
    initDayTabs();
    initScrollSpy();
    initReveal();
    initFaq();
    initBackToTop();
    initMobileMenu();
    initHeroParallax();
    initBtnScroll();

    // Trigger reveals already in viewport on load
    setTimeout(() => {
      els.reveals.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
      });
    }, 200);
  });

})();
