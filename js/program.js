/**
 * PACLIC 40 — Program page: day tabs, paper search, filters, "My schedule" (+ calendar file).
 * Data comes from js/program-data.js (window.PACLIC_PROGRAM). Nothing is sent anywhere:
 * bookmarks stay in this browser's localStorage.
 */
(function () {
  'use strict';
  var DATA = window.PACLIC_PROGRAM;
  if (!DATA) return;

  var $ = function (id) { return document.getElementById(id); };
  var out = $('pgOut'), daysEl = $('pgDays'), qEl = $('pgQ'), clearBtn = $('pgClear'), resetBtn = $('pgReset'),
      statusEl = $('pgStatus'), topicEl = $('pgTopic'), mineBtn = $('pgMine'), mineCnt = $('pgMineCnt');
  var STORE = 'paclic40-my-schedule';
  var SHOW_SESSION_CODES = false;   // session codes such as 1M / 3A / 3B (internal shorthand): true to show them
  var SHOW_BOARDS = false;   // poster board numbers (P1-01, W-01 ...): set to true once boards are assigned

  /* ── state ─────────────────────────────────────────────────── */
  var state = { day: 1, type: 'all', query: '', mine: false, topic: '' };
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e) { saved = []; }
  var mineSet = {};
  saved.forEach(function (id) { mineSet[id] = true; });
  function saveMine() { try { localStorage.setItem(STORE, JSON.stringify(Object.keys(mineSet))); } catch (e) {} }

  /* ── helpers ───────────────────────────────────────────────── */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fold(ch) { return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function norm(s) { var o = ''; for (var i = 0; i < s.length; i++) o += fold(s[i]); return o.replace(/\s+/g, ' ').trim(); }

  // Highlight query tokens in text (accent- and case-insensitive)
  function highlight(text, tokens) {
    text = String(text);
    if (!tokens.length) return esc(text);
    var n = '', map = [];
    for (var i = 0; i < text.length; i++) { var f = fold(text[i]); for (var k = 0; k < f.length; k++) { n += f[k]; map.push(i); } }
    var marks = new Array(text.length + 1).fill(false);
    tokens.forEach(function (t) {
      if (!t) return;
      var at = n.indexOf(t);
      while (at !== -1) { for (var j = at; j < at + t.length; j++) marks[map[j]] = true; at = n.indexOf(t, at + 1); }
    });
    var res = '', open = false;
    for (var p = 0; p < text.length; p++) {
      if (marks[p] && !open) { res += '<mark>'; open = true; }
      if (!marks[p] && open) { res += '</mark>'; open = false; }
      res += esc(text[p]);
    }
    return res + (open ? '</mark>' : '');
  }

  function dayOf(id) { return DATA.days.filter(function (d) { return d.id === id; })[0]; }
  function spkAnchor(n) { return { 'Wei Lu': 'lu', 'Marie-Catherine de Marneffe': 'marneffe', 'Kathleen Rastle': 'rastle', 'Sanghoun Song': 'song' }[n] || ''; }
  function typeLabel(t) { return { oral: 'Oral', poster: 'Poster', 'jwllp-oral': 'JWLLP oral', 'jwllp-poster': 'JWLLP poster', keynote: 'Keynote' }[t]; }

  /* ── build a flat index of every paper ─────────────────────── */
  var papers = [], topics = [], kcount = 0;
  DATA.days.forEach(function (d) {
    d.slots.forEach(function (s, si) {
      if (s.kind === 'keynote') {
        s.kid = 'K' + (++kcount);
        papers.push({ id: s.kid, title: 'Keynote: ' + s.speaker, authors: s.affiliation, type: 'keynote', day: d.id, slot: si,
          start: s.start, end: s.end, room: s.room, session: s.title });
      }
      (s.sessions || []).forEach(function (se) {
        se.papers.forEach(function (p) {
          papers.push({ id: p.id, title: p.title, authors: p.authors, type: 'oral', day: d.id, slot: si, start: s.start, end: s.end,
            room: se.room, session: SHOW_SESSION_CODES ? 'Session ' + se.code + ': ' + se.title : se.title, code: se.code, topic: 'S:' + se.code });
        });
        if (se.papers.length) topics.push({ key: 'S:' + se.code, label: se.title, group: d.label + ' \u00b7 Oral sessions' });
      });
      (s.posters || []).forEach(function (p) {
        papers.push({ id: p.id, title: p.title, authors: p.authors, type: 'poster', day: d.id, slot: si, start: s.start, end: s.end,
          room: s.room, session: s.title + ': ' + s.theme, board: p.board, topic: 'P:' + s.title });
      });
      if (s.posters && s.posters.length) topics.push({ key: 'P:' + s.title, label: s.theme, group: d.label + ' \u00b7 Poster session' });
      (s.parts || []).forEach(function (part) {
        (part.papers || []).forEach(function (p) {
          papers.push({ id: p.id, title: p.title, authors: p.authors, type: 'jwllp-oral', day: d.id, slot: si, start: part.start, end: part.end,
            room: s.room, session: 'JWLLP 36 Workshop: oral presentations' });
        });
        (part.posters || []).forEach(function (p) {
          papers.push({ id: p.id, title: p.title, authors: p.authors, type: 'jwllp-poster', day: d.id, slot: si, start: part.start, end: part.end,
            room: s.room, session: 'JWLLP 36 Workshop: poster session', board: p.board });
        });
      });
    });
  });
  papers.forEach(function (p, i) { p.idx = i; });   // position in the program = the order shown on the web
  var byId = {};
  papers.forEach(function (p) {
    p.hay = norm([showId(p.id) ? p.id : '', p.title, p.authors, SHOW_BOARDS ? (p.board || '') : '', SHOW_SESSION_CODES ? (p.code || '') : ''].join(' | '));
    byId[p.id] = p;
  });

  /* ── topic dropdown ───────────────────────────────────────── */
  (function () {
    var groups = {}, order = [];
    topics.forEach(function (t) {
      if (!groups[t.group]) { groups[t.group] = document.createElement('optgroup'); groups[t.group].label = t.group; order.push(t.group); }
      var o = document.createElement('option'); o.value = t.key; o.textContent = t.label; groups[t.group].appendChild(o);
    });
    order.forEach(function (g) { topicEl.appendChild(groups[g]); });
  })();

  /* ── filtering ─────────────────────────────────────────────── */
  function typeOk(p) {
    var t = state.type;
    if (t === 'all') return true;
    if (t === 'oral') return p.type === 'oral';
    if (t === 'poster') return p.type === 'poster';
    return p.type.indexOf('jwllp') === 0;
  }
  function tokens() { return norm(state.query).split(' ').filter(Boolean); }
  function search() {
    var q = norm(state.query), toks = tokens();
    var digitsOnly = /^\d+$/.test(q);
    var list = papers.filter(function (p) {
      if (!typeOk(p)) return false;
      if (state.topic && p.topic !== state.topic) return false;
      if (!q) return true;
      if (digitsOnly) return p.id === q;                       // "12" finds paper 12 only
      return toks.every(function (t) { return p.hay.indexOf(t) !== -1; });
    });
    if (digitsOnly && !list.length && q.length >= 4) {          // long numbers (e.g. a year) can be text
      list = papers.filter(function (p) { return typeOk(p) && (!state.topic || p.topic === state.topic) && p.hay.indexOf(q) !== -1; });
    }
    return list;
  }

  /* ── rendering: pieces ─────────────────────────────────────── */
  function timeBlock(s) { return '<div class="pg-time">' + s.start + ' \u2013 ' + s.end + '</div>'; }
  function showId(id) { return SHOW_BOARDS || !/^W-/.test(id); }
  function pidChip(p, toks) { return showId(p.id) ? '<span class="pg-pid">' + (/^\d+$/.test(p.id) ? '#' : '') + highlight(p.id, toks) + '</span>' : ''; }

  function paperLi(p, toks, opts) {
    opts = opts || {};
    var on = mineSet[p.id] ? ' on' : '';
    return '<li class="pg-paper" id="p-' + esc(p.id) + '">' +
      '<div class="pg-ptitle">' + pidChip(p, toks) + highlight(p.title, toks) + '</div>' +
      '<div class="pg-pauth">' + (SHOW_BOARDS && p.board ? '<span class="pg-board">Board ' + highlight(p.board, toks) + '</span>' : '') + highlight(p.authors, toks) + '</div>' +
      '<button type="button" class="pg-star' + on + '" data-star="' + esc(p.id) + '" aria-label="' + (on ? 'Remove from my schedule' : 'Add to my schedule') + '" title="' + (on ? 'Remove from my schedule' : 'Add to my schedule') + '">' + (on ? '&#9733;' : '&#9734;') + '</button>' +
      '</li>';
  }

  function sessionCard(se, toks, day, si) {
    var typeFilter = state.type;
    if (typeFilter === 'poster' || typeFilter === 'jwllp') return '';
    var list = se.papers;
    var body = list.length ? '<ul class="pg-papers">' + list.map(function (p) {
      return paperLi({ id: p.id, title: p.title, authors: p.authors }, toks);
    }).join('') + '</ul>' : '<p class="pg-meta">' + esc(se.note || '') + '</p>';
    return '<div class="pg-sess"><div class="pg-sess-head"><div class="pg-sess-top"><span class="pg-room">' + esc(se.room) + '</span>' +
'</div>' +
      '<h4>' + (SHOW_SESSION_CODES && se.code ? esc(se.code) + ' &middot; ' : '') + esc(se.title) + '</h4></div>' + body + '</div>';
  }

  function postersBlock(items, key, toks) {
    var open = !!state.query || state.type === 'poster';
    var vis = items.map(function (p) { return paperLi(p, toks); }).join('');
    return '<ul class="pg-papers" data-posters="' + key + '"' + (open ? '' : ' hidden') + '>' + vis + '</ul>' +
      '<button type="button" class="pg-toggle" data-toggle="' + key + '">' + (open ? 'Hide' : 'Show') + ' all ' + items.length + ' posters</button>';
  }

  function slotHtml(d, s, si, toks) {
    var cls = 'pg-slot k-' + s.kind;
    var id = 's-' + d.id + '-' + si;
    var head = '<div class="' + cls + '" id="' + id + '" data-start="' + s.start + '" data-end="' + s.end + '" data-day="' + d.id + '">' + timeBlock(s);
    var tail = '</div>';
    if (s.kind === 'sessions') {
      var cards = s.sessions.map(function (se) { return sessionCard(se, toks, d, si); }).join('');
      if (!cards) return '';
      return head + '<div><div class="pg-grid" data-n="' + s.sessions.length + '">' + cards + '</div></div>' + tail;
    }
    if (s.kind === 'posters') {
      if (state.type === 'oral' || state.type === 'jwllp') return '';
      return head + '<div class="pg-card"><h3>' + esc(s.title) + '<span class="pg-meta"> &middot; ' + esc(s.theme) + '</span></h3>' +
        '<div class="pg-meta">' + esc(s.room) + ' &middot; ' + s.posters.length + ' posters</div>' + postersBlock(s.posters, id, toks) + '</div>' + tail;
    }
    if (s.kind === 'workshop') {
      if (state.type === 'oral' || state.type === 'poster') return '';
      var parts = s.parts.map(function (pt) {
        var inner = '';
        if (pt.papers) inner = '<ul class="pg-papers">' + pt.papers.map(function (p) { return paperLi(p, toks); }).join('') + '</ul>';
        if (pt.posters) inner = postersBlock(pt.posters, id + '-' + pt.start, toks);
        return '<div class="pg-part"><h5><small>' + pt.start + ' &ndash; ' + pt.end + '</small>' + esc(pt.title) + '</h5>' +
          (pt.subtitle ? '<div class="pg-meta">' + esc(pt.subtitle) + '</div>' : '') + inner + '</div>';
      }).join('');
      return head + '<div class="pg-card"><h3><span class="pg-tag">Workshop</span><a class="pg-link" href="workshop.html">JWLLP 36 Workshop</a>' + esc(s.title.replace(/^JWLLP 36 Workshop/, '')) + '</h3>' +
        '<div class="pg-meta">' + esc(s.room) + ' &middot; runs in parallel with PACLIC 40 sessions</div>' + parts + '</div>' + tail;
    }
    // simple events
    if (state.type !== 'all' || state.topic) return '';
    if (s.kind === 'keynote') {
      return head.replace('id="' + id + '"', 'id="' + id + '"') + '<div class="pg-card" id="p-' + esc(s.kid) + '"><h3><span class="pg-tag">Keynote</span><a class="pg-link" href="speakers.html#' + spkAnchor(s.speaker) + '">' + esc(s.speaker) + '</a></h3>' +
        '<div class="pg-meta">' + esc(s.affiliation) + '</div>' +
        '<div class="pg-meta"><em>Topic to be announced soon</em></div>' +
        (s.room ? '<div class="pg-meta">' + esc(s.room) + '</div>' : '') + '</div>' + tail;
    }
    var label = { ceremony: 'Ceremony', social: 'Social' }[s.kind];
    var place = esc(s.room || '');
    if (s.link && s.room && s.room.indexOf(s.link.text) === 0) {
      place = '<a class="pg-link" href="' + esc(s.link.url) + '" target="_blank" rel="noopener">' + esc(s.link.text) + '</a>' + esc(s.room.slice(s.link.text.length));
    }
    return head + '<div class="pg-card"><h3>' + (label ? '<span class="pg-tag">' + label + '</span>' : '') + esc(s.title) + '</h3>' + (place ? '<div class="pg-meta">' + place + '</div>' : '') + '</div>' + tail;
  }

  /* ── rendering: views ──────────────────────────────────────── */
  function renderDays(counts) {
    var now = taipeiNow(), todayId = null;
    DATA.days.forEach(function (d) { if (now && now.date === d.date) todayId = d.id; });
    daysEl.innerHTML = DATA.days.map(function (d) {
      var empty = counts && !counts[d.id];
      return '<button type="button" class="pg-day' + (d.id === state.day ? ' active' : '') + (d.id === todayId ? ' today' : '') + (empty ? '" disabled data-x="' : '') + '" data-day="' + d.id + '" role="tab" aria-selected="' + (d.id === state.day) + '">' +
        '<span class="d1">' + esc(d.label) + '</span><span class="d2">' + esc(d.weekday) + ', ' + esc(d.dateLabel) + (d.id === todayId ? ' &middot; today' : '') + (counts ? ' &middot; ' + (counts[d.id] || 0) + (counts[d.id] === 1 ? ' paper' : ' papers') : '') + '</span></button>';
    }).join('');
  }

  function renderProgram() {
    var d = dayOf(state.day), toks = [];
    var html = d.slots.map(function (s, i) { return slotHtml(d, s, i, toks); }).join('');
    out.innerHTML = html || '<p class="pg-empty">Nothing to show for this filter on ' + esc(d.label) + '.</p>';
    statusEl.hidden = true;
    daysEl.hidden = false;
    markNow();
  }

  function whereLine(p) {
    var d = dayOf(p.day);
    return esc(d.label) + ' &middot; ' + esc(d.weekday) + ' ' + esc(d.dateLabel) + ' &middot; ' + p.start + ' &ndash; ' + p.end + ' &middot; ' + esc(p.room) +
      '<br>' + esc(p.session) + (SHOW_BOARDS && p.board ? ' &middot; Board ' + esc(p.board) : '');
  }

  function resultCard(p, toks) {
    return '<div class="pg-result" id="r-' + esc(p.id) + '">' +
      '<div class="pg-ptitle">' + pidChip(p, toks) + highlight(p.title, toks) + '</div>' +
      '<div class="pg-pauth">' + highlight(p.authors, toks) + ' <span class="pg-tag" style="margin:0 0 0 6px;">' + typeLabel(p.type) + '</span></div>' +
      '<div class="pg-where">' + whereLine(p) + '</div>' +
      '<button type="button" class="pg-go" data-go="' + esc(p.id) + '">Show in program</button>' +
      '<button type="button" class="pg-star' + (mineSet[p.id] ? ' on' : '') + '" data-star="' + esc(p.id) + '" aria-label="Add to my schedule" title="Add to my schedule">' + (mineSet[p.id] ? '&#9733;' : '&#9734;') + '</button></div>';
  }

  function renderResults() {
    var list = search(), toks = tokens();
    if (state.topic) {                                  // a topic lives on specific day(s): show those day tabs, grey out the rest
      var counts = {};
      list.forEach(function (p) { counts[p.day] = (counts[p.day] || 0) + 1; });
      if (!counts[state.day]) DATA.days.some(function (d) { if (counts[d.id]) { state.day = d.id; return true; } });
      renderDays(counts);
      daysEl.hidden = false;
      list = list.filter(function (p) { return p.day === state.day; });
    } else daysEl.hidden = true;
    statusEl.hidden = false;
    var tl = ''; topics.forEach(function (t) { if (t.key === state.topic) tl = t.label.split(' \u00b7 ')[0]; });
    statusEl.textContent = list.length + (list.length === 1 ? ' paper' : ' papers') + (tl ? ' in "' + tl + '"' : '') + (state.query.trim() ? ' matching "' + state.query.trim() + '"' : '');
    out.innerHTML = list.length ? list.map(function (p) { return resultCard(p, toks); }).join('')
      : '<p class="pg-empty">' + (/^\d+$/.test(state.query.trim()) ? 'No paper with ID ' + esc(state.query.trim()) + ' in the program.' : 'No paper found. Try a different spelling, or just a surname.') + '<br>If you cannot find your paper, please contact <a href="mailto:paclic2026@gmail.com">paclic2026@gmail.com</a>.</p>';
  }

  function renderMine() {
    var ids = Object.keys(mineSet).filter(function (id) { return byId[id]; });
    var list = ids.map(function (id) { return byId[id]; }).sort(function (a, b) { return a.day - b.day || a.start.localeCompare(b.start) || a.idx - b.idx; });
    daysEl.hidden = true;
    statusEl.hidden = false;
    statusEl.textContent = list.length ? list.length + ' saved on this device. To keep or open it elsewhere, use "Copy link" or download the calendar file.' : '';
    var bar = list.length ? '<p class="pg-minebar"><button type="button" class="pg-tool" id="pgIcs">Download calendar (.ics)</button> <button type="button" class="pg-tool" id="pgCopy">Copy link</button> <button type="button" class="pg-tool" id="pgClearMine">Clear all</button></p>' : '';
    out.innerHTML = bar + (list.length ? list.map(function (p) { return resultCard(p, []); }).join('')
      : '<p class="pg-empty">Your schedule is empty.<br>Tap the star &#9734; next to any paper to add it here. It is saved only on this device and browser.</p>');
  }

  function render() {
    qEl.value !== state.query && (qEl.value = state.query);
    topicEl.value = state.topic; topicEl.classList.toggle('on', !!state.topic);
    clearBtn.hidden = !state.query;
    resetBtn.hidden = !(state.query.trim() || state.topic || state.type !== 'all' || state.mine);
    mineBtn.style.background = state.mine ? 'var(--navy-light)' : '';
    mineBtn.style.color = state.mine ? '#fff' : '';
    var n = Object.keys(mineSet).length;
    mineCnt.hidden = !n; mineCnt.textContent = n;
    if (state.mine) renderMine();
    else if (state.query.trim() || state.topic) renderResults();
    else { renderDays(); renderProgram(); }
  }

  /* ── "happening now" (Taipei time, UTC+8) ──────────────────── */
  function taipeiNow() {
    var t = new Date(Date.now() + 8 * 3600 * 1000);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return { date: t.getUTCFullYear() + '-' + p(t.getUTCMonth() + 1) + '-' + p(t.getUTCDate()), time: p(t.getUTCHours()) + ':' + p(t.getUTCMinutes()) };
  }
  function markNow() {
    var now = taipeiNow(), d = dayOf(state.day);
    document.querySelectorAll('.pg-now').forEach(function (e) { e.classList.remove('pg-now'); });
    document.querySelectorAll('.pg-now-badge').forEach(function (e) { e.remove(); });
    if (!d || now.date !== d.date) return;
    document.querySelectorAll('.pg-slot').forEach(function (el) {
      if (el.getAttribute('data-start') <= now.time && now.time < el.getAttribute('data-end')) {
        var card = el.querySelector('.pg-card, .pg-grid') || el;
        card.classList.add('pg-now');
        var h = el.querySelector('h3, h4');
        if (h) h.insertAdjacentHTML('beforeend', '<span class="pg-now-badge">NOW</span>');
      }
    });
  }

  /* ── calendar file for "My schedule" ───────────────────────── */
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function fold75(line) { var o = '', i = 0; while (line.length - i > 73) { o += line.substr(i, 73) + '\r\n '; i += 73; } return o + line.substr(i); }
  function utc(date, hhmm, sec) {                               // Taipei local -> UTC
    var d = date.split('-'), h = hhmm.split(':');
    var t = new Date(Date.UTC(+d[0], +d[1] - 1, +d[2], +h[0] - 8, +h[1], sec || 0));
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return t.getUTCFullYear() + p(t.getUTCMonth() + 1) + p(t.getUTCDate()) + 'T' + p(t.getUTCHours()) + p(t.getUTCMinutes()) + p(t.getUTCSeconds()) + 'Z';
  }
  function downloadIcs() {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    // Same order as on the web. Papers in one session share a start time, so each gets a 1-second
    // offset (not visible in calendar apps) to keep that order when the app sorts by start time.
    var chosen = Object.keys(mineSet).filter(function (id) { return byId[id]; }).map(function (id) { return byId[id]; })
      .sort(function (a, b) { return a.day - b.day || a.start.localeCompare(b.start) || a.idx - b.idx; });
    var seen = {};
    var ev = chosen.map(function (p) {
      var d = dayOf(p.day), key = p.day + '|' + p.start;
      var sec = seen[key] = (seen[key] === undefined ? 0 : seen[key] + 1);
      return ['BEGIN:VEVENT', 'UID:' + icsEscape(p.id) + '@paclic2026.github.io', 'DTSTAMP:' + stamp,
        'DTSTART:' + utc(d.date, p.start, Math.min(sec, 59)), 'DTEND:' + utc(d.date, p.end),
        'SUMMARY:' + icsEscape((showId(p.id) ? '[' + p.id + '] ' : '') + p.title),
        'LOCATION:' + icsEscape(p.room + (SHOW_BOARDS && p.board ? ' (Board ' + p.board + ')' : '')),
        'DESCRIPTION:' + icsEscape(p.authors + '\n' + p.session), 'END:VEVENT'].map(fold75).join('\r\n');
    });
    var text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PACLIC 40//Program//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:PACLIC 40: my schedule']
      .concat(ev).concat(['END:VCALENDAR']).join('\r\n') + '\r\n';
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'PACLIC40-my-schedule.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ── actions ───────────────────────────────────────────────── */
  function toggleStar(id) {
    if (mineSet[id]) delete mineSet[id]; else mineSet[id] = true;
    saveMine();
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  function showInProgram(id) {
    var p = byId[id]; if (!p) return;
    state.query = ''; state.mine = false; state.type = 'all'; state.topic = ''; state.day = p.day;
    document.querySelectorAll('#pgFilters .pg-chip').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-type') === 'all'); });
    render();
    var li = $('p-' + id);
    if (li) {
      var box = li.closest('ul[data-posters]');
      if (box && box.hidden) { box.hidden = false; var tg = out.querySelector('[data-toggle="' + box.getAttribute('data-posters') + '"]'); if (tg) tg.textContent = 'Hide all ' + box.children.length + ' posters'; }
      li.scrollIntoView({ behavior: 'smooth', block: 'center' });
      li.classList.add('pg-hit');
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-star')) { toggleStar(t.getAttribute('data-star')); return; }
    if (t.hasAttribute('data-go')) { showInProgram(t.getAttribute('data-go')); return; }
    if (t.hasAttribute('data-day')) { state.day = +t.getAttribute('data-day'); render(); window.scrollTo({ top: 0 }); return; }
    if (t.hasAttribute('data-toggle')) {
      var key = t.getAttribute('data-toggle'), box = out.querySelector('[data-posters="' + key + '"]');
      box.hidden = !box.hidden;
      t.textContent = (box.hidden ? 'Show' : 'Hide') + ' all ' + box.children.length + ' posters';
      return;
    }
    if (t.id === 'pgIcs') { downloadIcs(); return; }
    if (t.id === 'pgCopy') {
      var link = location.origin + location.pathname + '?mine=' + Object.keys(mineSet).filter(function (id) { return byId[id]; }).join(',');
      var done = function () { t.textContent = 'Link copied'; setTimeout(function () { t.textContent = 'Copy link'; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { window.prompt('Copy this link:', link); });
      else window.prompt('Copy this link:', link);
      return;
    }
    if (t.id === 'pgClearMine') { if (confirm('Remove all papers from your schedule?')) { mineSet = {}; saveMine(); render(); } return; }
  });

  $('pgFilters').addEventListener('click', function (e) {
    var c = e.target.closest('.pg-chip'); if (!c) return;
    state.type = c.getAttribute('data-type');
    document.querySelectorAll('#pgFilters .pg-chip').forEach(function (x) { x.classList.toggle('on', x === c); });
    render();
  });
  var timer;
  qEl.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.query = qEl.value; state.mine = false; render(); }, 120);
  });
  topicEl.addEventListener('change', function () { state.topic = topicEl.value; state.mine = false; render(); });
  resetBtn.addEventListener('click', function () {
    state.query = ''; state.topic = ''; state.type = 'all'; state.mine = false; qEl.value = '';
    document.querySelectorAll('#pgFilters .pg-chip').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-type') === 'all'); });
    render();
  });
  clearBtn.addEventListener('click', function () { state.query = ''; qEl.value = ''; render(); qEl.focus(); });
  mineBtn.addEventListener('click', function () { state.mine = !state.mine; if (state.mine) { state.query = ''; qEl.value = ''; state.topic = ''; } render(); });
  var note = $('pgNote');
  if (note && DATA.updated) note.textContent += ' Last updated ' + DATA.updated + '.';

  /* ── start ─────────────────────────────────────────────────── */
  var now = taipeiNow();
  DATA.days.forEach(function (d) { if (d.date === now.date) state.day = d.id; });
  var params = new URLSearchParams(location.search);
  if (params.get('q')) state.query = params.get('q');
  var shared = (params.get('mine') || '').split(',').map(function (x) { return x.trim(); }).filter(function (id) { return byId[id]; });
  if (shared.length) { shared.forEach(function (id) { mineSet[id] = true; }); saveMine(); state.mine = true; }
  var dayParam = parseInt((location.hash.match(/day(\d)/) || [])[1], 10);
  if (dayParam && dayOf(dayParam)) state.day = dayParam;
  render();
  setInterval(function () { if (!state.query.trim() && !state.mine) markNow(); }, 60000);
})();
