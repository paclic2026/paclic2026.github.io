/**
 * PACLIC 40 — Floating Chat Widget
 *
 * GOOGLE SHEETS LOGGING:
 * Sheet columns: Timestamp | Question | Answer | Page | Language | Topic | Session
 * To add/remove logged fields later: just edit this file and push to GitHub Pages.
 */

/* ── Helpers ─────────────────────────────────────────────────────────── */

// Unique ID for this browser session — groups all questions from one visit
const SESSION_ID = (crypto.randomUUID ? crypto.randomUUID()
                   : Math.random().toString(36).slice(2)).slice(0, 8);

// Detect language from the question text using Unicode character ranges
function detectLanguage(text) {
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'Japanese';
  if (/[\uac00-\ud7af]/.test(text)) return 'Korean';
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return 'Chinese';
  const lang = (navigator.language || 'en').toLowerCase();
  if (lang.startsWith('vi')) return 'Vietnamese';
  if (lang.startsWith('fil') || lang.startsWith('tl')) return 'Filipino';
  return 'English';
}

// Guess topic from keywords in the question
function detectTopic(text) {
  const q = text.toLowerCase();
  if (/deadline|submit|submission|paper|abstract|author|review|format|template|cmt|double.blind/.test(q)) return 'Submission';
  if (/speaker|keynote|invited|talk|presenter/.test(q)) return 'Speakers';
  if (/visa|passport|entry|immigration|invitation letter/.test(q)) return 'Visa & Entry';
  if (/venue|location|building|room|campus|ntu|national taiwan/.test(q)) return 'Venue';
  if (/hotel|accommodation|stay|hostel|airbnb/.test(q)) return 'Accommodation';
  if (/travel|flight|airport|mrt|taxi|transport|bus|train/.test(q)) return 'Transport';
  if (/register|registration|fee|payment|attend/.test(q)) return 'Registration';
  if (/program|schedule|session|workshop|poster|oral/.test(q)) return 'Program';
  if (/publish|proceedings|scopus|acl|anthology|index|citation/.test(q)) return 'Publication';
  if (/food|eat|restaurant|night market|taipei|sightseeing|weather/.test(q)) return 'Local Info';
  return 'General';
}
const CHATBOT_URL = 'https://paclic-chatbot-demo.netlify.app';
const SHEETS_URL  = 'https://script.google.com/macros/s/AKfycbwaif5hB6X_uO8tivaV0J9m3BrkruRpv5v7VE2jmXF7T7nZRMKmmSxsyYM4shtGJ1Vn/exec';

(function () {
  if (!CHATBOT_URL) return;

  /* ── Styles ──────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Toggle button ── */
    #pw-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 88px;          /* sits left of the back-to-top button */
      height: 46px;
      padding: 0 18px 0 13px;
      border-radius: 23px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #C41020;
      color: #fff;
      font-size: 13.5px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.02em;
      white-space: nowrap;
      box-shadow: 0 4px 18px rgba(196,16,32,.45), 0 1px 4px rgba(0,0,0,.15);
      z-index: 600;
      transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
      user-select: none;
    }
    #pw-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(196,16,32,.5), 0 2px 8px rgba(0,0,0,.15);
    }
    #pw-chat-btn:active { transform: scale(.97); }

    #pw-chat-btn .pw-icon {
      width: 18px; height: 18px;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    #pw-chat-btn .pw-icon svg { width: 18px; height: 18px; }
    #pw-chat-btn .pw-label { line-height: 1; }

    /* Open state: navy */
    #pw-chat-btn.pw-open-btn {
      background: #0d1f3c;
    }
    #pw-chat-btn.pw-open-btn:hover {
      box-shadow: 0 8px 28px rgba(13,31,60,.4), 0 2px 8px rgba(0,0,0,.15);
    }

    /* ── Chat panel ── */
    #pw-chat-panel {
      position: fixed;
      bottom: 82px;               /* just above button */
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 32px);   /* never overflow on narrow screens */
      height: 560px;
      max-height: calc(100vh - 110px);
      background: #fff;
      border-radius: 14px;
      box-shadow:
        0 24px 80px rgba(0,0,0,.22),
        0 4px 16px rgba(0,0,0,.1),
        0 0 0 1px rgba(0,0,0,.06);
      z-index: 599;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transform: scale(.93) translateY(20px);
      transform-origin: bottom right;
      transition: transform .28s cubic-bezier(.22,.68,0,1.15), opacity .22s ease;
    }
    #pw-chat-panel.pw-open {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1) translateY(0);
    }
    #pw-chat-panel iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    /* ── Mobile: full-screen ── */
    @media (max-width: 600px) {
      #pw-chat-panel {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        max-width: 100%;
        border-radius: 0;
        transform-origin: bottom center;
      }
      #pw-chat-btn {
        bottom: 20px;
        right: 16px;
      }
      /* On mobile, hide floating button when chat is open */
      #pw-chat-btn.pw-open-btn {
        display: none;
      }
      /* Mobile close button inside panel */
      #pw-mobile-close {
        display: flex;
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 601;
        height: 36px;
        padding: 0 14px 0 10px;
        gap: 6px;
        border-radius: 18px;
        border: none;
        background: rgba(0,0,0,.25);
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        letter-spacing: 0.01em;
      }
    }
  `;
  document.head.appendChild(style);

  /* ── Icons ───────────────────────────────────────────────────────── */
  const ICON_AI = `<svg viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM2 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 2 10ZM15 10a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 15 10ZM4.4 4.4a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06L4.4 5.46a.75.75 0 0 1 0-1.06ZM13.48 13.48a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM4.4 15.6a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06L5.46 15.6a.75.75 0 0 1-1.06 0ZM13.48 6.52a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0Z"/>
  </svg>`;

  const ICON_CLOSE = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
    <line x1="5" y1="5" x2="15" y2="15"/>
    <line x1="15" y1="5" x2="5" y2="15"/>
  </svg>`;

  /* ── Build DOM ───────────────────────────────────────────────────── */
  const btn = document.createElement('button');
  btn.id = 'pw-chat-btn';
  btn.setAttribute('aria-label', 'Open PACLIC 40 AI Assistant');
  btn.innerHTML = `<span class="pw-icon">${ICON_AI}</span><span class="pw-label">Ask AI</span>`;

  const panel = document.createElement('div');
  panel.id = 'pw-chat-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'PACLIC 40 AI Assistant');

  const mobileClose = document.createElement('button');
  mobileClose.id = 'pw-mobile-close';
  mobileClose.setAttribute('aria-label', 'Close chat');
  mobileClose.innerHTML = '✕ Close';
  mobileClose.style.display = 'none'; // hidden on desktop
  panel.appendChild(mobileClose);

  document.body.appendChild(panel);
  document.body.appendChild(btn);

  /* ── Logic ───────────────────────────────────────────────────────── */
  let isOpen = false;
  let iframeLoaded = false;

  const isMobile = () => window.innerWidth <= 600;

  function openChat() {
    if (!iframeLoaded) {
      const iframe = document.createElement('iframe');
      iframe.src = `${CHATBOT_URL}?embed=1`;
      iframe.title = 'PACLIC 40 AI Assistant';
      iframe.allow = 'autoplay';
      panel.appendChild(iframe);
      iframeLoaded = true;
    }
    isOpen = true;
    panel.classList.add('pw-open');
    btn.classList.add('pw-open-btn');
    btn.setAttribute('aria-label', 'Close AI Assistant');
    btn.innerHTML = `<span class="pw-icon">${ICON_CLOSE}</span><span class="pw-label">Close</span>`;
    if (isMobile()) {
      mobileClose.style.display = 'flex';
      const navToggle = document.getElementById('mobileToggle');
      if (navToggle) navToggle.style.visibility = 'hidden';
    }
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('pw-open');
    btn.classList.remove('pw-open-btn');
    btn.setAttribute('aria-label', 'Open PACLIC 40 AI Assistant');
    btn.innerHTML = `<span class="pw-icon">${ICON_AI}</span><span class="pw-label">Ask AI</span>`;
    mobileClose.style.display = 'none';
    const navToggle = document.getElementById('mobileToggle');
    if (navToggle) navToggle.style.visibility = 'visible';
  }

  mobileClose.addEventListener('click', closeChat);

  btn.addEventListener('click', () => isOpen ? closeChat() : openChat());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

  /* ── Google Sheets logging ───────────────────────────────────────── */
  // Receives Q&A from the chatbot iframe via postMessage, then logs to Sheets.
  // To add more fields: just add them to the fetch body below and push to GitHub Pages.
  window.addEventListener('message', function (event) {
    // Only accept messages from the chatbot iframe
    if (event.origin !== new URL(CHATBOT_URL).origin) return;
    if (!event.data || event.data.type !== 'paclic_qa') return;
    if (!SHEETS_URL) return; // logging disabled until URL is set

    const { question, answer } = event.data;

    // ── Fields sent to Google Sheets ──────────────────────────────────
    // To add more columns: add fields here AND update sheets-logger.gs + Sheet headers.
    const payload = {
      timestamp : new Date().toISOString(),
      question  : question  || '',
      answer    : answer    || '',
      page      : window.location.href,
      language  : detectLanguage(question || ''),
      topic     : detectTopic(question || ''),
      session   : SESSION_ID,
    };
    // ─────────────────────────────────────────────────────────────────

    // Fire-and-forget — logging never blocks or breaks the chat
    fetch(SHEETS_URL, {
      method : 'POST',
      mode   : 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body   : JSON.stringify(payload),
    }).catch(() => {});
  });
})();
