/* P2 English Revision — Cloudy's Sky School. Vanilla JS, iPad-friendly, natural recorded voice + device voice fallback */
'use strict';

/* ---------------- helpers ---------------- */
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const $ = s => document.querySelector(s);
const LET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = t => esc(t).replace(/_{2,}/g, '<span class="blank"></span>');
/* must match the manifest builder used to make the audio clips */
const clean = s => String(s).replace(/<[^>]+>/g, '').replace(/_{2,}/g, 'blank').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/✓/g, ' yes').replace(/✗/g, ' no').replace(/—/g, ',').replace(/\s+/g, ' ').trim();

const ALL = {};
UNITS.forEach(u => { u.kind = 'unit'; ALL[u.id] = u; });
READING.forEach(r => { r.kind = 'reading'; r.col = 'c-peach'; ALL[r.id] = r; });

/* extra auto questions from word lists */
const WORDS = UNITS.flatMap(u => (u.words || []).map(w => ({ w: w[0], e: w[1], ex: w[2], u: u.id })));
function listenQ(pool) {
  const x = pick(pool);
  const wrong = shuffle(pool.filter(y => y.w !== x.w)).slice(0, 3);
  return { type: 'mc', listen: x.w, text: 'Listen. Which word do you hear?', answer: `${x.e} ${x.w}`, wrong: wrong.map(y => `${y.e} ${y.w}`), explain: `${x.w}: ${x.ex}`, tag: 'Listening', topic: x.u };
}
function bank(id) {
  const t = ALL[id];
  return t.qs.map(q => ({ ...q, topic: id }));
}



/* ---------------- state ---------------- */
const STORE = 'p2eng-v1';
let _saved = {}; try { _saved = JSON.parse(window['local' + 'Storage'].getItem(STORE) || '{}'); } catch (e) { }
const S = Object.assign({ stars: 0, best: {}, mistakes: [], sound: true, slow: false, cards: {} }, _saved);
const save = () => { try { window['local' + 'Storage'].setItem(STORE, JSON.stringify(S)); } catch (e) { } };
const STICKERS = ['☁️', '🧁', '🍓', '🌈', '🎀', '🐶', '🍰', '🌸', '⭐', '🍭', '🦄', '🐳', '🍩', '💙', '🎈', '🐻', '🍒', '🌙', '🐹', '🍦', '🦋', '🌷', '🐼', '👑'];
const stickerAt = i => (i + 1) * 5;

/* ---------------- sound & speech ---------------- */
let AC;
function tone(seq) { if (!S.sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); let t = AC.currentTime; for (const [f, d] of seq) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); t += d * .7; } } catch (e) { } }
const sGood = () => tone([[784, .12], [988, .12], [1319, .25]]);
const sBad = () => tone([[330, .18], [262, .25]]);
const sTap = () => tone([[660, .05]]);

let VOICE = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const pref = [/premium|enhanced|natural/i, /Serena|Kate|Stephanie|Martha|Daniel/i, /Samantha|Karen|Moira|Tessa/i, /Google UK English Female|Google US English/i];
    for (const p of pref) { const v = vs.find(v => p.test(v.name) && /GB|UK/i.test(v.lang + v.name)) || vs.find(v => p.test(v.name)); if (v) { VOICE = v; return; } }
    VOICE = vs.find(v => /en-GB/i.test(v.lang)) || vs[0] || null;
  } catch (e) { }
}
const player = new Audio(); player.preload = 'auto';
let endCb = null;
function stopSay() { try { player.onended = player.onerror = null; player.pause(); } catch (e) { } try { speechSynthesis.cancel(); } catch (e) { } }
function synth(text, onend) {
  try {
    if (!('speechSynthesis' in window)) { onend && onend(); return; }
    const u = new SpeechSynthesisUtterance(clean(text).replace(/\bblank\b/g, '...'));
    u.lang = 'en-GB'; if (!VOICE) pickVoice(); if (VOICE) u.voice = VOICE;
    u.rate = S.slow ? .7 : .92;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
  } catch (e) { onend && onend(); }
}
/* say(): uses the recorded natural voice clip when available */
function say(text, onend) {
  stopSay();
  const id = AUDIO[clean(text)];
  if (id) {
    player.src = 'audio/' + id + '.mp3';
    player.playbackRate = S.slow ? .8 : 1;
    try { player.preservesPitch = true; player.webkitPreservesPitch = true; } catch (e) { }
    let fired = false; const done = () => { if (fired) return; fired = true; onend && onend(); };
    player.onended = done;
    player.onerror = () => { if (fired) return; fired = true; synth(text, onend); };
    const p = player.play(); if (p && p.catch) p.catch(() => { if (!fired) { fired = true; synth(text, onend); } });
    return;
  }
  synth(text, onend);
}

function confetti() { const fx = $('#fx'); const cols = ['#8EC9F5', '#FFB3CB', '#B8A6F0', '#9FE0C4', '#FFE08A', '#5AA9E6']; for (let i = 0; i < 28; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.left = R(0, 100) + 'vw'; c.style.background = pick(cols); c.style.animationDelay = (Math.random() * .3) + 's'; if (Math.random() < .4) c.style.borderRadius = '50%'; fx.appendChild(c); setTimeout(() => c.remove(), 1900); } }
function popText(t) { const p = document.createElement('div'); p.className = 'pop'; p.textContent = t; $('#fx').appendChild(p); setTimeout(() => p.remove(), 1000); }
function updStars(bump) { $('#starCount').textContent = S.stars; if (bump) { const p = $('#starPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); } }

/* ================= SCREENS ================= */
const app = $('#app');
function view(html) { stopSay(); app.innerHTML = html; window.scrollTo({ top: 0 }); }
function starsOf(id) { const b = S.best[id]; if (b == null) return '☆☆☆'; return b >= 9 ? '★★★' : b >= 7 ? '★★☆' : b >= 4 ? '★☆☆' : '☆☆☆'; }
function daysLeft() { const exam = new Date(2026, 10, 13); const now = new Date(); now.setHours(0, 0, 0, 0); return Math.round((exam - now) / 864e5); }
const card = (t, tag, sub, extra = '') => `<button class="topic-card ${t.col}" data-topic="${t.id}"><div><span class="tag">${tag}</span><h3>${t.title}</h3><p>${sub}</p></div><div class="stars">${extra || starsOf(t.id)}</div><span class="pic emo-badge">${t.emo}</span></button>`;
const CLOUDS = `<div class="sky" aria-hidden="true"><span class="c1">${MASCOT.cloud}</span><span class="c2">${MASCOT.cloud}</span><span class="c3">${MASCOT.cloud}</span></div>`;

function home() {
  const d = daysLeft();
  view(`
  <section class="hero">${CLOUDS}
    <div class="hero-pup bob">${MASCOT.happy}</div>
    <div class="hero-txt">
      <h1>P.2 English Revision</h1>
      <p class="sub">Read, listen, play and practise with Cloudy the puppy</p>
      ${d >= 0 ? `<div class="countdown">English exam: <b>Friday 13 November</b> · <span>${d}</span> days to go</div>` : '<div class="countdown">You can do it!</div>'}
      <div class="voice-note">🔈 Tap any sentence to hear a natural English voice.</div>
    </div>
  </section>
  <div class="section-title"><span class="dot"></span>P.L.E. textbook &amp; Workbook</div>
  <div class="grid">${UNITS.filter(u => u.group === 'ple').map(u => card(u, u.tag, u.id === 'rev1' ? 'Places, rules and what people say' : 'Read · Words · Learn · Quiz')).join('')}</div>
  <div class="section-title"><span class="dot"></span>Grammar Time</div>
  <div class="grid">${UNITS.filter(u => u.group === 'grammar').map(u => card(u, u.tag, u.sub)).join('')}</div>
  <div class="section-title"><span class="dot"></span>Comprehension</div>
  <div class="grid">${READING.map(r => card(r, r.tag, `${r.type} · Skill: ${r.skill}`)).join('')}</div>
  <div class="section-title"><span class="dot"></span>Writing</div>
  <div class="grid">
    <button class="topic-card c-lav" data-w="w1"><div><span class="tag">Writing 1 · Part A</span><h3>Part 1: Plan my ideas</h3><p>My Favourite Place at School · 5 questions + feelings</p></div><div class="stars">${starsOf('w1')}</div><span class="pic emo-badge">📝</span></button>
    <button class="topic-card c-sky" data-w="w2"><div><span class="tag">Writing 1 · Parts B–C</span><h3>Part 2: Write the paragraph</h3><p>Six sentences · format · Fix it!</p></div><div class="stars">${starsOf('w2')}</div><span class="pic emo-badge">✏️</span></button>
    <button class="topic-card c-mint" data-w="w3"><div><span class="tag">Module 2 · Part C</span><h3>Part 3: Places like home</h3><p>Three places · two rules + reasons · checklist</p></div><div class="stars">${starsOf('w3')}</div><span class="pic emo-badge">🏡</span></button>
  </div>
  <div class="section-title"><span class="dot"></span>Challenges</div>
  <div class="grid">
    <button class="topic-card c-butter" id="mockBtn"><div><span class="tag">25 questions</span><h3>Mock exam</h3><p>Everything mixed together</p></div><div class="stars">${S.best.mock != null ? 'Best: ' + S.best.mock + ' / 25' : ''}</div><span class="pic emo-badge">🏆</span></button>
    <button class="topic-card c-sky" id="spellBtn"><div><span class="tag">10 words</span><h3>Spelling bee</h3><p>Listen, then spell with letter tiles</p></div><div class="stars">${S.best.spell != null ? 'Best: ' + S.best.spell + ' / 10' : ''}</div><span class="pic emo-badge">🐝</span></button>
    <button class="topic-card c-pink" id="listenBtn"><div><span class="tag">10 questions</span><h3>Listen &amp; choose</h3><p>Hear a word, pick the right one</p></div><div class="stars">${S.best.listen != null ? 'Best: ' + S.best.listen + ' / 10' : ''}</div><span class="pic emo-badge">👂</span></button>
    <button class="topic-card c-lav" id="mistakeBtn"><div><span class="tag">${S.mistakes.length} question${S.mistakes.length === 1 ? '' : 's'}</span><h3>Mistake book</h3><p>Try your mistakes again</p></div><span class="pic emo-badge">📒</span></button>
  </div>
  <p class="foot">Made for revision at home · Cloudy is an original character inspired by soft pastel cartoon style.</p>`);
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => { sTap(); topic(b.dataset.topic); });
  app.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { sTap(); WPAGES[b.dataset.w](); });
  $('#mockBtn').onclick = () => startQuiz('mock');
  $('#spellBtn').onclick = () => spelling();
  $('#listenBtn').onclick = () => startQuiz('listen');
  $('#mistakeBtn').onclick = () => S.mistakes.length ? startQuiz('mistakes') : (popText('Your mistake book is empty!'), sGood());
}

function head(t, sub) { return `<button class="back" id="bk">← Home</button><div class="topic-head"><div class="badge ${t.col}"><span class="emo-big">${t.emo}</span></div><div><p>${sub}</p><h2>${t.title}</h2></div></div>`; }

function topic(id, mode) {
  const t = ALL[id];
  if (t.kind === 'reading') return readingPage(t);
  const modes = [];
  if (t.texts) modes.push(['text', '📖 Read', 'c-sky']);
  if (t.words) modes.push(['cards', '🃏 Words', 'c-mint']);
  modes.push(['learn', '💡 Learn', 'c-butter']);
  modes.push(['quiz', '✏️ Quiz', 'c-pink']);
  if (t.words) modes.push(['spell', '🐝 Spell', 'c-lav']);
  mode = mode || modes[0][0];
  view(`${head(t, t.tag)}
  <div class="mode-row" style="--n:${modes.length}">${modes.map(([k, l, c]) => `<button class="mode-btn ${c} ${mode === k ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</div>
  <div id="tbody"></div>`);
  $('#bk').onclick = home;
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sTap(); const m = b.dataset.m; m === 'quiz' ? startQuiz(id) : m === 'spell' ? spelling(id) : topic(id, m); });
  const body = $('#tbody');
  if (mode === 'text') textMode(t, body);
  else if (mode === 'cards') cardMode(t, body);
  else learnMode(t, body);
}

function learnMode(t, body) {
  body.innerHTML = t.learn.map((c, i) => `<div class="learn-card"><h4><span class="n">${i + 1}</span>${c[0]}</h4><div class="lc">${c[1]}</div></div>`).join('') +
    `<p class="reader-tip center">Tip: tap any example sentence to hear it.</p><div class="center"><button class="pill next" id="goQ">I'm ready, start the quiz →</button></div>`;
  body.querySelectorAll('.lc .eg').forEach(eg => {
    // split examples into tappable sentences
    eg.innerHTML = eg.innerHTML.split(/<br\s*\/?>/).map(line => line.split('·').map(s => s.trim()).filter(Boolean).map(s => `<span class="tap">${s}</span>`).join(' · ')).join('<br>');
  });
  body.querySelectorAll('.tap, .lc td, .preps > div').forEach(el => el.onclick = () => { body.querySelectorAll('.on').forEach(x => x.classList.remove('on')); el.classList.add('on'); say(el.textContent.replace(/^[A-B]:\s*/, '')); });
  $('#goQ').onclick = () => startQuiz(t.id);
}

/* ---- Read with highlight ---- */
function readerHTML(blocks) {
  let k = 0; const segs = [];
  const html = blocks.map(b => `<div class="ptext ${/Poem/.test(b.type || '') ? 'poem' : ''}">
    <div class="ptype">${b.type || ''}</div><h3>${esc(b.title)}${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</h3>
    ${b.lines.map(s => { segs.push(s); return `<p class="pl"><span class="seg" data-k="${k++}">${esc(s)}</span></p>`; }).join('')}</div>`).join('');
  return { html, segs };
}
function wireReader(root, segs) {
  let playing = false;
  const hl = i => root.querySelectorAll('.seg').forEach(e => e.classList.toggle('on', +e.dataset.k === i));
  const playFrom = i => { if (!playing || i >= segs.length) { playing = false; hl(-1); return; } hl(i); const el = root.querySelector(`.seg[data-k="${i}"]`); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); say(segs[i], () => setTimeout(() => playFrom(i + 1), 300)); };
  root.querySelectorAll('.seg').forEach(e => e.onclick = () => { playing = false; const i = +e.dataset.k; hl(i); say(segs[i], () => { if (!playing) hl(-1); }); });
  $('#playAll').onclick = () => { playing = true; playFrom(0); };
  $('#stopAll').onclick = () => { playing = false; stopSay(); hl(-1); };
  const sb = $('#slowBtn'); if (sb) sb.onclick = () => { S.slow = !S.slow; save(); sb.textContent = S.slow ? '🐢 Slow' : '🐇 Normal'; };
}
const readerBar = () => `<div class="reader-bar"><button class="pill next" id="playAll">▶ Read all</button><button class="pill" id="stopAll">■ Stop</button><button class="pill" id="slowBtn">${S.slow ? '🐢 Slow' : '🐇 Normal'}</button></div>`;
function textMode(t, body) {
  const { html, segs } = readerHTML(t.texts);
  body.innerHTML = `<div class="reader">${readerBar()}<p class="reader-tip">Tap a sentence to hear it. Tap <b>Read all</b> to listen to everything.</p>${html}</div>
  <div class="center"><button class="pill next" id="goC">Next: word cards →</button></div>`;
  wireReader(body, segs);
  $('#goC').onclick = () => topic(t.id, 'cards');
}

/* ---- Word cards ---- */
function cardMode(t, body) {
  const ws = t.words; let i = 0, flipped = false;
  const known = S.cards[t.id] = S.cards[t.id] || [];
  const draw = () => {
    const [w, e, ex] = ws[i];
    body.innerHTML = `<div class="cards">
      <div class="card-top"><span class="cnt">${i + 1} / ${ws.length} · I know ${known.length}</span></div>
      <button class="flash ${flipped ? 'flip' : ''}" id="flash" aria-label="Flip the card">
        <div class="face front"><div class="femo">${e}</div><div class="fw">${esc(w)}</div><div class="ftip">Tap to flip</div></div>
        <div class="face back"><div class="femo sm">${e}</div><div class="fw sm">${esc(w)}</div><div class="fm">${esc(ex).replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), m => `<span class="hl">${m}</span>`)}</div></div>
      </button>
      <div class="card-ctrl">
        <button class="pill" id="prev">◀ Back</button>
        <button class="pill c-sky" id="hear">🔈 Hear</button>
        <button class="pill ${known.includes(w) ? 'c-mint' : ''}" id="know">${known.includes(w) ? '✓ I know it' : 'I know it'}</button>
        <button class="pill next" id="nxt">Next ▶</button>
      </div>
      <div class="word-strip">${ws.map(([x], k) => `<button class="wchip ${k === i ? 'on' : ''} ${known.includes(x) ? 'ok' : ''}" data-k="${k}">${esc(x)}</button>`).join('')}</div>
    </div>
    <div class="center"><button class="pill next" id="goQ">Start the quiz →</button></div>`;
    $('#flash').onclick = () => { flipped = !flipped; $('#flash').classList.toggle('flip', flipped); sTap(); say(flipped ? ex : w); };
    $('#hear').onclick = () => say(w);
    $('#prev').onclick = () => { i = (i - 1 + ws.length) % ws.length; flipped = false; draw(); say(ws[i][0]); };
    $('#nxt').onclick = () => { i = (i + 1) % ws.length; flipped = false; draw(); say(ws[i][0]); };
    $('#know').onclick = () => { const k = known.indexOf(w); if (k >= 0) known.splice(k, 1); else { known.push(w); sGood(); popText('Great!'); } save(); draw(); };
    body.querySelectorAll('.wchip').forEach(b => b.onclick = () => { i = +b.dataset.k; flipped = false; draw(); say(ws[i][0]); });
    $('#goQ').onclick = () => startQuiz(t.id);
  };
  draw();
}

/* ---- Comprehension ---- */
function readingPage(t) {
  const { html, segs } = readerHTML([{ title: t.title, type: t.type, lines: t.text }]);
  view(`${head(t, t.tag)}
  <div class="skill"><b>Exam skill: ${t.skill}</b><p>${t.tip}</p></div>
  <div class="reader">${readerBar()}<p class="reader-tip">Read carefully first. You can open the text again while you answer.</p>${html}</div>
  <div class="center"><button class="pill next" id="goQ">Answer the questions (${t.qs.length}) →</button></div>`);
  $('#bk').onclick = home;
  wireReader(app, segs);
  $('#goQ').onclick = () => startQuiz(t.id);
}

/* ================= WRITING ================= */
/* ================= WRITING (3 parts) ================= */
const W1S = S.w1 = Object.assign({ place: null, floor: null, acts: [], teach: 0, why: 0, feel: null }, S.w1 || {});
const W3S = S.w3 = Object.assign({ places: [], feel: null, rules: {}, checks: {} }, S.w3 || {});
const WPAGES = { w1: () => writingPlan(), w2: () => writingPara(), w3: () => writingHome() };
const W1 = WRITING.t1, W2 = WRITING.t2;
const teachOpts = P => [W1.teach[P], 'help us when we have problems', 'tell us to follow the rules'];
const whyOpts = P => [W1.why[P], 'it is fun and I can learn a lot', 'I can be with my good friends'];
function planAnswers() {
  const P = W1S.place; if (!P) return [];
  const a = W1S.acts;
  return [
    `My favourite place at school is ${P}.`,
    `It is on ${W1S.floor || '___'}.`,
    a.length >= 2 ? `My classmates and I ${a[0]}. We also ${a[1]} together.` : `My classmates and I ${a[0] || '___'}.`,
    `My teachers ${teachOpts(P)[W1S.teach] || teachOpts(P)[0]}.`,
    `I like ${P} because ${whyOpts(P)[W1S.why] || whyOpts(P)[0]}.`,
    `I feel ${W1S.feel || '___'} when I am there.`,
  ];
}
const wHead = (emo, col, sub, title) => head({ title, emo, col }, sub);
const partNav = cur => `<div class="part-nav">${[['w1', 'Part 1', 'Plan'], ['w2', 'Part 2', 'Paragraph'], ['w3', 'Part 3', 'Places like home']].map(([k, p, n]) => `<button class="mode-btn ${k === 'w1' ? 'c-lav' : k === 'w2' ? 'c-sky' : 'c-mint'} ${k === cur ? 'on' : ''}" data-w="${k}"><span><small>${p}</small><br>${n}</span></button>`).join('')}</div>`;
function wireNav() { app.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { sTap(); WPAGES[b.dataset.w](); }); }

/* ---- Part 1: plan ---- */
function writingPlan() {
  view(`${wHead('📝', 'c-lav', 'Writing 1 · Part A · Module 1: Being a Good Child', 'My Favourite Place at School')}
  ${partNav('w1')}
  <div class="skill"><b>Part 1: Plan your ideas</b><p>Choose your favourite place at school and answer the five questions (plus your teacher's extra question). Tap a question to hear it.</p></div>
  <div id="planBox"></div>
  <div class="learn-card"><h4><span class="n">★</span>What the teacher's red pen teaches us</h4>${W1.teacherTips.map(([t, e]) => `<div class="rule"><b>${t}:</b> <span class="tap">${e}</span></div>`).join('')}</div>
  <div class="center btn-row"><button class="pill next" id="goQ">Plan quiz (10) →</button><button class="pill c-sky" id="goP2">Next: Part 2, write the paragraph →</button></div>`);
  $('#bk').onclick = home; wireNav();
  app.querySelectorAll('.rule .tap').forEach(el => el.onclick = () => say(el.textContent));
  const draw = () => {
    const P = W1S.place, ans = planAnswers();
    const chips = (k, list, cur, multi) => `<div class="chips">${list.map((v, i) => { const val = Array.isArray(v) ? v[0] : v, lab = Array.isArray(v) ? `${v[1]} ${v[0]}` : v; const on = multi ? cur.includes(val) : (typeof cur === 'number' ? cur === i : cur === val); return `<button class="chip ${on ? 'on' : ''}" data-k="${k}" data-v="${esc(val)}" data-i="${i}">${esc(lab)}</button>`; }).join('')}</div>`;
    const body = [
      chips('place', W1.places, P),
      chips('floor', W1.floors, W1S.floor),
      P ? chips('acts', W1.acts[P], W1S.acts, true) : '<span class="muted">Choose a place first.</span>',
      P ? chips('teach', teachOpts(P), W1S.teach) : '<span class="muted">Choose a place first.</span>',
      P ? chips('why', whyOpts(P), W1S.why) : '<span class="muted">Choose a place first.</span>',
      chips('feel', W1.feels, W1S.feel),
    ];
    $('#planBox').innerHTML = W1.planQs.map((x, i) => `<div class="learn-card plan">
      <h4><span class="n">${i + 1}</span><span class="tap q">${esc(x.q)}</span>${i === 5 ? '<span class="red-pen">teacher added</span>' : ''}</h4>
      ${body[i]}
      <div class="frame">${ans[i] ? fmt(ans[i]) : `<span class="muted">${esc(x.frame)} ___</span>`}</div>
      <p class="ptip">💡 ${x.tip}</p></div>`).join('');
    app.querySelectorAll('.plan .q').forEach(el => el.onclick = () => say(el.textContent));
    app.querySelectorAll('#planBox .chip').forEach(c => c.onclick = () => {
      sTap(); const k = c.dataset.k, v = c.dataset.v, i = +c.dataset.i;
      if (k === 'place') { if (W1S.place !== v) { W1S.place = v; W1S.acts = []; W1S.teach = 0; W1S.why = 0; } }
      else if (k === 'acts') { const j = W1S.acts.indexOf(v); if (j >= 0) W1S.acts.splice(j, 1); else { W1S.acts.push(v); if (W1S.acts.length > 2) W1S.acts.shift(); } }
      else if (k === 'teach' || k === 'why') W1S[k] = i;
      else W1S[k] = v;
      save(); draw();
      const f = c.closest('.plan').querySelector('.frame'); if (f) synth(f.textContent);
    });
  };
  draw();
  $('#goQ').onclick = () => startQuiz('w1');
  $('#goP2').onclick = writingPara;
}

/* ---- Part 2: paragraph ---- */
function writingPara() {
  const ans = planAnswers(); const ready = W1S.place && W1S.floor && W1S.acts.length === 2 && W1S.feel;
  const { html: mhtml, segs } = readerHTML([{ title: 'My Favourite Place at School', type: "Teacher's model", lines: W1.model }]);
  const d = new Date(); const date = `${d.getDate()}${[, 'st', 'nd', 'rd'][d.getDate() % 10 > 3 || [11, 12, 13].includes(d.getDate()) ? 0 : d.getDate() % 10] || 'th'} ${d.toLocaleString('en-GB', { month: 'long' })}, ${d.getFullYear()}`;
  view(`${wHead('✏️', 'c-sky', 'Writing 1 · Parts B–C · Module 1: Being a Good Child', 'Write the Paragraph')}
  ${partNav('w2')}
  <div class="skill"><b>Part 2: Write a paragraph with at least six sentences</b><p>Use your answers from Part 1. Follow the format of your teacher's example and write it on writing paper.</p></div>
  <div class="learn-card"><h4><span class="n">1</span>My paragraph</h4>
    ${ans.length ? `<div class="paper"><div class="pdate">${date}</div><div class="ptitle">My Favourite Place at School</div><p class="pbody">${ans.map((s, i) => `<span class="seg" data-k="${i}">${fmt(s)}</span>`).join(' ')}</p></div>
      <p class="ok-line">${ready ? `✓ ${ans.length} sentences · date · title · indent` : '⚠️ Some answers are missing. Go back to Part 1 to finish them.'}</p>
      <div class="center btn-row"><button class="pill next" id="readP">🔈 Read my paragraph</button><button class="pill" id="toP1">✎ Change my answers</button></div>`
      : `<p class="muted">You haven't planned yet.</p><div class="center"><button class="pill next" id="toP1">Go to Part 1: Plan →</button></div>`}
  </div>
  <div class="learn-card"><h4><span class="n">2</span>Format checklist</h4>${W1.format.map((x, i) => `<label class="check"><input type="checkbox" data-c="${i}"><span>${esc(x)}</span></label>`).join('')}
    <p class="ptip">Your teacher marks: ${W1.marks.map(m => `<b>${m}</b>`).join(' · ')}</p></div>
  <div class="learn-card" id="modelCard"><h4><span class="n">3</span>Teacher's model</h4><div class="reader">${readerBar()}${mhtml}</div>
    <p class="ptip">💡 The teacher's example has 6 sentences. Look at the underlined parts in your worksheet: those are the parts you change for your own place.</p></div>
  <div class="learn-card"><h4><span class="n">4</span>Fix it! Find the mistakes</h4><p>Good writers check their work. Can you find the wrong word in each sentence?</p>
    <div class="center"><button class="pill next" id="goFix">Play Fix it! (12) →</button></div></div>
  <div class="center btn-row"><button class="pill next" id="goQ">Paragraph quiz (10) →</button><button class="pill c-mint" id="goP3">Next: Part 3, places like home →</button></div>`);
  $('#bk').onclick = home; wireNav();
  if (ans.length) {
    let playing = false;
    const hl = i => app.querySelectorAll('.pbody .seg').forEach(e => e.classList.toggle('on', +e.dataset.k === i));
    const run = i => { if (!playing || i >= ans.length) { playing = false; hl(-1); return; } hl(i); synth(ans[i], () => setTimeout(() => run(i + 1), 250)); };
    app.querySelectorAll('.pbody .seg').forEach(e => e.onclick = () => { playing = false; hl(+e.dataset.k); synth(ans[+e.dataset.k], () => hl(-1)); });
    $('#readP').onclick = () => { stopSay(); playing = true; run(0); };
  }
  $('#toP1').onclick = writingPlan;
  wireReader($('#modelCard'), segs);
  $('#goFix').onclick = () => startQuiz('w2fix');
  $('#goQ').onclick = () => startQuiz('w2');
  $('#goP3').onclick = writingHome;
}

/* ---- Part 3: places like home ---- */
function writingHome() {
  view(`${wHead('🏡', 'c-mint', W2.module, W2.title)}
  ${partNav('w3')}
  <div class="skill"><p class="tap" id="intro">${esc(W2.intro)}</p></div>
  <div class="learn-card"><h4><span class="n">1</span><span class="tap q">Name three places which you see as your 'home'.</span></h4>
    <div class="chips" id="cP"></div><div class="frame" id="threeOut"></div>
    <p class="ptip">💡 Remember to write <b>the</b>: <b>the</b> school, <b>the</b> library, <b>the</b> park.</p></div>
  <div class="learn-card"><h4><span class="n">2</span><span class="tap q">How do you feel when you are away from home?</span></h4>
    <div class="chips" id="cF">${W2.feels.map(([f, e]) => `<button class="chip" data-v="${f}">${e} ${f}</button>`).join('')}</div>
    <div class="frame" id="feelOut"></div><p class="ptip">🖍️ Draw a picture of it in your book.</p></div>
  <div class="learn-card"><h4><span class="n">3</span>Action time! Write TWO rules and the reasons</h4>
    <p class="ptip">💡 ${esc(W2.ruleTip)}</p>
    <table class="tbl rules-tbl"><tr><th>Places like home</th><th>Rules</th></tr>
      <tr><td>e.g. 🌳 the park</td><td>${W2.example.map(e => `<div class="rl"><span class="tap">${esc(e[2])}</span> <small>(rule)</small><br><span class="tap rsn">${esc(e[3])}</span> <small>(reason)</small></div>`).join('')}</td></tr>
      <tbody id="ruleRows"></tbody></table>
    <div class="center btn-row"><button class="pill next" id="readR">🔈 Read my rules</button></div></div>
  <div class="learn-card"><h4><span class="n">4</span>Checklist for revising and editing</h4><p>Tick ✓ or cross ✗. Correct your mistakes if there are any.</p>
    <div id="chk"></div><p class="ptip">Your teacher marks: <b>Content /15</b> · <b>Language /15</b> · <b>Total /30</b></p></div>
  <div class="center btn-row"><button class="pill next" id="goQ">Rules quiz (10) →</button><button class="pill c-sky" id="goFix">Fix it! (12) →</button></div>`);
  $('#bk').onclick = home; wireNav();
  app.querySelectorAll('.tap').forEach(el => el.onclick = () => say(el.textContent));
  const placeBy = n => W2.places.find(x => x.p === n);
  const sentence = (pl, r) => `We ${r[0]} ${r[1]} ${pl.prep} ${pl.p}.`;
  const draw = () => {
    $('#cP').innerHTML = W2.places.map(pl => `<button class="chip ${W3S.places.includes(pl.p) ? 'on' : ''}" data-v="${pl.p}">${pl.e} ${pl.p}</button>`).join('');
    $('#threeOut').innerHTML = ['(a)', '(b)', '(c)'].map((l, i) => `<div>${l} ${W3S.places[i] ? `<b>${esc(W3S.places[i])}</b>` : '<span class="blank"></span>'}</div>`).join('');
    app.querySelectorAll('#cF .chip').forEach(c => c.classList.toggle('on', c.dataset.v === W3S.feel));
    $('#feelOut').innerHTML = W3S.feel ? (W3S.feel === 'I miss my family' ? 'When I am away from home, I miss my family.' : `When I am away from home, I feel ${W3S.feel}.`) : '<span class="muted">When I am away from home, I feel ___.</span>';
    $('#ruleRows').innerHTML = W3S.places.length ? W3S.places.map((n, i) => { const pl = placeBy(n); const ch = W3S.rules[n] || [];
      return `<tr><td><b>${i + 1}</b> ${pl.e} ${esc(n)}</td><td><div class="chips col">${pl.rules.map((r, k) => `<button class="chip sm ${ch.includes(k) ? 'on' : ''}" data-pl="${esc(n)}" data-k="${k}">${r[0] === 'must' ? '✅' : '🚫'} ${esc(sentence(pl, r))}</button>`).join('')}</div>
        ${ch.map(k => `<div class="rl"><span>${esc(sentence(pl, pl.rules[k]))}</span> <small>(rule)</small><br><span class="rsn">${esc(pl.rules[k][2])}</span> <small>(reason)</small></div>`).join('')}</td></tr>`; }).join('')
      : '<tr><td colspan="2"><span class="muted">Choose three places in question 1 first.</span></td></tr>';
    $('#chk').innerHTML = W2.checklist.map(([q, eg], i) => `<div class="check2"><div><b>${esc(q)}</b><br><small>e.g. ${esc(eg)}</small></div><div class="tx"><button class="tick ${W3S.checks[i] === 1 ? 'on' : ''}" data-i="${i}" data-v="1">✓</button><button class="tick x ${W3S.checks[i] === 0 ? 'on' : ''}" data-i="${i}" data-v="0">✗</button></div></div>`).join('');
    app.querySelectorAll('#cP .chip').forEach(c => c.onclick = () => { sTap(); const v = c.dataset.v, j = W3S.places.indexOf(v); if (j >= 0) W3S.places.splice(j, 1); else { if (W3S.places.length >= 3) return popText('Only three places!'); W3S.places.push(v); } save(); draw(); });
    app.querySelectorAll('#ruleRows .chip').forEach(c => c.onclick = () => { sTap(); const n = c.dataset.pl, k = +c.dataset.k; const ch = W3S.rules[n] = W3S.rules[n] || []; const j = ch.indexOf(k); if (j >= 0) ch.splice(j, 1); else { ch.push(k); if (ch.length > 2) ch.shift(); } save(); draw(); const pl = placeBy(n); if (j < 0) synth(sentence(pl, pl.rules[k]) + ' ' + pl.rules[k][2]); });
    app.querySelectorAll('.tick').forEach(b => b.onclick = () => { sTap(); W3S.checks[+b.dataset.i] = +b.dataset.v; save(); draw(); if (+b.dataset.v === 0) popText('Fix it and tick again!'); });
  };
  app.querySelectorAll('#cF .chip').forEach(c => c.onclick = () => { sTap(); W3S.feel = c.dataset.v; save(); draw(); synth($('#feelOut').textContent); });
  draw();
  $('#readR').onclick = () => { const out = []; W3S.places.forEach(n => { const pl = placeBy(n); (W3S.rules[n] || []).forEach(k => out.push(`${sentence(pl, pl.rules[k])} ${pl.rules[k][2]}`)); }); out.length ? synth(out.join(' ')) : popText('Choose your rules first!'); };
  $('#goQ').onclick = () => startQuiz('w3');
  $('#goFix').onclick = () => startQuiz('w3fix');
}


/* ================= SPELLING BEE ================= */
const SPELL_POOL = () => WORDS.filter(x => /^[a-z]{3,9}$/i.test(x.w));
function spelling(unit) {
  let pool = SPELL_POOL(); if (unit) pool = pool.filter(x => x.u === unit);
  const list = shuffle(pool).slice(0, 10);
  const G = { list, i: 0, score: 0, unit };
  const show = () => {
    const x = G.list[G.i]; const word = x.w.toLowerCase();
    const extra = shuffle('aeioustrnlm'.split('').filter(c => !word.includes(c))).slice(0, 2);
    const tiles = shuffle([...word.split(''), ...extra].map((c, k) => ({ c, k })));
    let built = [], tries = 0, done = false;
    view(`<div class="quiz-top"><button class="back" id="qx">✕ Spelling bee</button><div class="progress"><i style="width:${G.i / G.list.length * 100}%"></i></div><div class="qcount">${G.i + 1}/${G.list.length}</div></div>
    <div class="qcard">
      <span class="qtag">🐝 Listen and spell</span>
      <div class="qvis"><button class="big-ear" id="ear">🔈<small>Hear it again</small></button><div class="spell-pic">${x.e}</div></div>
      <div class="build spell" id="build"></div>
      <div class="tiles" id="tiles"></div>
      <div id="fb"></div>
      <div class="qbar"><button class="pill" id="sent">💬 Hear a sentence</button><button class="pill" id="clr">↺ Clear</button><button class="pill next" id="ok">Check</button><button class="pill next" id="nx" style="display:none">Next →</button></div>
    </div>`);
    const drawT = () => {
      $('#build').innerHTML = word.split('').map((_, k) => built[k] ? `<button class="tile in" data-b="${k}">${built[k].c}</button>` : '<span class="slot"></span>').join('');
      $('#tiles').innerHTML = tiles.map((o, k) => built.includes(o) ? `<span class="tile ghost">${o.c}</span>` : `<button class="tile" data-p="${k}">${o.c}</button>`).join('');
      app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (done || built.length >= word.length) return; sTap(); built.push(tiles[+b.dataset.p]); drawT(); });
      app.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (done) return; built.splice(+b.dataset.b, 1); drawT(); });
    };
    drawT();
    $('#qx').onclick = () => unit ? topic(unit) : home();
    $('#ear').onclick = () => say(x.w);
    $('#sent').onclick = () => say(x.ex);
    $('#clr').onclick = () => { if (done) return; built = []; drawT(); };
    setTimeout(() => say(x.w), 350);
    $('#ok').onclick = () => {
      if (done) return;
      if (built.length < word.length) return popText('Use more letters!');
      const s = built.map(o => o.c).join(''); tries++;
      if (s === word) {
        done = true; if (tries === 1) { G.score++; S.stars++; updStars(true); confetti(); checkSticker(); save(); }
        sGood(); popText(pick(['Brilliant!', 'Well done!', 'Super!', 'Great job!']));
        $('#build').classList.add('right');
        $('#fb').innerHTML = `<div class="feedback good">${MASCOT.wink}<div>${tries === 1 ? 'Correct! +1 ★' : 'Correct!'}<div class="exp">${esc(x.ex)}</div></div></div>`;
        say(x.ex);
        $('#ok').style.display = 'none'; $('#nx').style.display = '';
      } else {
        sBad(); const b = $('#build'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        if (tries >= 2) {
          done = true;
          $('#fb').innerHTML = `<div class="feedback bad">${MASCOT.sad}<div>The spelling is <span class="hl">${word}</span>. Let's practise it again later!<div class="exp">${esc(x.ex)}</div></div></div>`;
          say(x.w);
          $('#ok').style.display = 'none'; $('#nx').style.display = '';
        } else {
          const firstWrong = s.split('').findIndex((c, k) => c !== word[k]);
          $('#fb').innerHTML = `<div class="feedback hint">${MASCOT.happy}<div>Nearly! Try again.<div class="exp">Hint: it starts with <b>${word.slice(0, Math.max(1, firstWrong))}</b>…</div></div></div>`;
          setTimeout(() => { built = []; drawT(); $('#build').classList.remove('wrong'); }, 700);
        }
      }
    };
    $('#nx').onclick = () => { G.i++; if (G.i >= G.list.length) { if (!unit) S.best.spell = Math.max(S.best.spell || 0, G.score); save(); spellResult(G); } else show(); };
  };
  show();
}
function spellResult(G) {
  const r = G.score / G.list.length;
  view(`<div class="result"><div class="center"><span class="bob res-pup">${r >= .7 ? MASCOT.star : MASCOT.happy}</span></div>
  <h2>${r >= .9 ? 'Super speller!' : r >= .7 ? 'Well done!' : 'Good try! Keep practising!'}</h2><div class="score">${G.score} / ${G.list.length}</div>
  <div class="review"><h3>Words to remember:</h3><div class="wlist">${G.list.map(x => `<button class="wchip tapw" data-w="${esc(x.w)}">${x.e} ${esc(x.w)}</button>`).join('')}</div></div>
  <div class="btns"><button class="pill next" id="again">Play again</button><button class="pill" id="hm">Home</button></div></div>`);
  if (r >= .7) { confetti(); sGood(); }
  app.querySelectorAll('.tapw').forEach(b => b.onclick = () => say(b.dataset.w));
  $('#again').onclick = () => spelling(G.unit); $('#hm').onclick = home;
}

/* ================= QUIZ ENGINE ================= */
let Q = null;
function prep(q) {
  q = { ...q };
  if (q.type === 'mc') q.choices = shuffle([q.answer, ...q.wrong.filter(x => x !== q.answer)].slice(0, 4));
  if (q.type === 'multi') q.choices = shuffle([...q.answers, ...q.wrong]);
  if (q.type === 'order') { let s; let g = 0; do { s = shuffle(q.tiles.map((x, i) => ({ x, i }))); } while (g++ < 10 && s.map(o => o.x).join(' ') === q.answer); q.pool = s; }
  return q;
}
const keyOf = q => (q.listen ? 'L:' + q.listen : q.text + '|' + (q.answer || ''));
const QSETS = { w1: WRITING.t1.planQuiz, w2: [...WRITING.t1.paraQuiz, ...WRITING.t1.planQuiz.slice(0, 4), ...shuffle(WRITING.t1.fix).slice(0, 3)], w2fix: WRITING.t1.fix, w3: WRITING.t2.qs, w3fix: WRITING.t2.fix };
function buildSet(mode) {
  const qs = []; const seen = new Set();
  const push = q => { if (!q) return false; const k = keyOf(q); if (seen.has(k)) return false; seen.add(k); qs.push(q); return true; };
  if (mode === 'mock') {
    UNITS.forEach(u => shuffle(bank(u.id)).slice(0, u.group === 'ple' ? 3 : 2).forEach(push));
    READING.forEach(r => shuffle(bank(r.id)).slice(0, 1).forEach(push));
    shuffle(WRITING.t2.qs).slice(0, 1).forEach(q => push({ ...q, topic: 'w3' }));
    shuffle(WRITING.t1.planQuiz).slice(0, 1).forEach(q => push({ ...q, topic: 'w1' }));
    shuffle([...WRITING.t1.fix, ...WRITING.t2.fix]).slice(0, 1).forEach(q => push({ ...q, topic: 'w2fix' }));
    let g = 0; while (qs.length < 25 && g++ < 80) push(shuffle(bank(pick(UNITS).id))[0]);
    return shuffle(qs).slice(0, 25).map(prep);
  }
  if (mode === 'listen') { let g = 0; while (qs.length < 10 && g++ < 200) push(listenQ(WORDS)); return qs.map(prep); }
  if (mode === 'mistakes') return shuffle(S.mistakes).slice(0, 10).map(q => prep({ ...q, fromMist: 1 }));
  if (QSETS[mode]) return shuffle(QSETS[mode]).slice(0, /fix/.test(mode) ? 12 : 10).map(q => prep({ ...q, topic: mode }));
  const t = ALL[mode];
  if (t.kind === 'reading') return bank(mode).map(prep);
  const b = shuffle(bank(mode));
  b.slice(0, t.words ? 9 : 10).forEach(push);
  if (t.words) push(listenQ(WORDS.filter(x => x.u === mode)));
  return qs.map(prep);
}
const WT = { w1: 'Writing Part 1: Plan', w2: 'Writing Part 2: Paragraph', w2fix: 'Fix it! (Writing 1)', w3: 'Writing Part 3: Places like home', w3fix: 'Fix it! (Places like home)' };
const topicTitle = id => WT[id] || (ALL[id] ? ALL[id].title : '');
const wBack = id => WPAGES[id.replace('fix', '')];
function title(mode) { return mode === 'mock' ? 'Mock exam' : mode === 'listen' ? 'Listen & choose' : mode === 'mistakes' ? 'Mistake book' : topicTitle(mode); }

function startQuiz(mode) {
  sTap();
  Q = { mode, qs: buildSet(mode), i: 0, score: 0, tries: 0, log: [], exam: mode === 'mock' };
  if (!Q.qs.length) return home();
  showQ();
}
const HINT = q => q.type === 'fix' ? 'Read it aloud slowly. Look for a spelling mistake or a wrong small word (in / on / at, -s, -ing, a capital letter).' : q.type === 'order' ? 'Start with the person or "Don\'t". A sentence starts with a capital letter and ends with a full stop.' : q.type === 'multi' ? 'There is more than one answer.' : 'Put each answer into the sentence and read it aloud. Which one sounds right?';

function showQ() {
  const q = Q.qs[Q.i]; Q.tries = 0; Q.done = false; Q.sel = new Set(); Q.built = [];
  const rd = ALL[q.topic] && ALL[q.topic].kind === 'reading' ? ALL[q.topic] : null;
  const long = q.choices && q.choices.some(c => c.length > 22);
  let area = '';
  if (q.type === 'mc') area = `${q.listen ? `<div class="qvis"><button class="big-ear" id="ear">🔈<small>Hear it again</small></button></div>` : ''}<div class="choices ${long ? 'long' : ''}">${q.choices.map((c, i) => `<button class="choice" data-c="${i}"><span class="lt">${LET[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
  if (q.type === 'multi') area = `<p class="multi-tip">Choose ALL the right answers, then tap Check.</p><div class="choices multi ${long ? 'long' : ''}">${q.choices.map((c, i) => `<button class="choice" data-c="${i}"><span class="lt">${LET[i]}</span><span>${esc(c)}</span></button>`).join('')}</div><div class="qbar"><button class="pill next" id="okMulti">Check</button></div>`;
  if (q.type === 'order') area = `<p class="multi-tip">Tap the word cards in the right order. Tap a card at the top to put it back.</p><div class="build" id="build"></div><div class="tiles" id="tiles"></div><div class="qbar"><button class="pill" id="clr">↺ Clear</button><button class="pill next" id="okOrder">Check</button></div>`;
  if (q.type === 'fix') area = `<p class="multi-tip">Read the sentence. One word is wrong. Tap it!</p><div class="fixrow" id="fixrow">${q.words.map((w, i) => `<button class="fword" data-f="${i}">${esc(w)}</button>`).join('')}</div>`;
  view(`
  <div class="quiz-top"><button class="back" id="qx">✕ ${title(Q.mode)}</button><div class="progress"><i style="width:${(Q.i / Q.qs.length) * 100}%"></i></div><div class="qcount">${Q.i + 1}/${Q.qs.length}</div></div>
  <div class="qcard">
    <span class="qtag">${topicTitle(q.topic)}${q.tag ? ' · ' + q.tag : ''}</span>
    ${rd ? `<details class="passage"><summary>📄 Look at the text: ${esc(rd.title)}</summary>${rd.text.map(s => `<p>${esc(s)}</p>`).join('')}</details>` : ''}
    <div class="qhead">${q.pic ? `<div class="qpic">${q.pic}</div>` : ''}<div class="qtext">${fmt(q.text)}</div><button class="speak" id="spk" aria-label="Hear the question">🔈</button></div>
    ${area}
    <div id="fb"></div>
    <div class="qbar">${!Q.exam ? '<button class="pill" id="hintBtn">💡 Hint</button>' : ''}<button class="pill next" id="nextBtn" style="display:none">Next →</button></div>
  </div>`);
  $('#qx').onclick = () => (ALL[Q.mode] ? topic(Q.mode) : WT[Q.mode] ? wBack(Q.mode)() : home());
  $('#spk').onclick = () => q.listen ? say(q.listen) : say(q.text);
  if (q.listen) { $('#ear').onclick = () => say(q.listen); setTimeout(() => say(q.listen), 350); }
  if ($('#hintBtn')) $('#hintBtn').onclick = () => { $('#fb').innerHTML = `<div class="feedback hint">${MASCOT.happy}<div>Hint: ${q.hint || HINT(q)}</div></div>`; };
  $('#nextBtn').onclick = next;
  if (q.type === 'mc') app.querySelectorAll('.choice').forEach(b => b.onclick = () => answer(q.choices[+b.dataset.c] === q.answer, b, q.choices[+b.dataset.c]));
  if (q.type === 'multi') {
    app.querySelectorAll('.choice').forEach(b => b.onclick = () => { if (Q.done) return; sTap(); const i = +b.dataset.c; Q.sel.has(i) ? Q.sel.delete(i) : Q.sel.add(i); b.classList.toggle('sel'); });
    $('#okMulti').onclick = () => { if (Q.done || !Q.sel.size) return; const picked = [...Q.sel].map(i => q.choices[i]); const ok = picked.length === q.answers.length && picked.every(p => q.answers.includes(p)); answer(ok, null, picked.join(', ')); };
  }
  if (q.type === 'fix') app.querySelectorAll('.fword').forEach(b => b.onclick = () => { if (Q.done || b.disabled) return; answer(+b.dataset.f === q.bad, b, b.textContent); });
  if (q.type === 'order') {
    const drawT = () => {
      $('#build').innerHTML = Q.built.length ? Q.built.map((o, k) => `<button class="tile in" data-b="${k}">${esc(o.x)}</button>`).join('') : '<span class="ph">Tap the word cards below…</span>';
      $('#tiles').innerHTML = q.pool.map((o, k) => Q.built.includes(o) ? `<span class="tile ghost">${esc(o.x)}</span>` : `<button class="tile" data-p="${k}">${esc(o.x)}</button>`).join('');
      app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { if (Q.done) return; sTap(); Q.built.push(q.pool[+b.dataset.p]); drawT(); });
      app.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { if (Q.done) return; Q.built.splice(+b.dataset.b, 1); drawT(); });
    };
    drawT();
    $('#clr').onclick = () => { if (Q.done) return; Q.built = []; drawT(); };
    $('#okOrder').onclick = () => { if (Q.done) return; if (Q.built.length < q.tiles.length) { popText('Use all the cards!'); return; } const s = Q.built.map(o => o.x).join(' '); answer(s === q.answer, null, s); };
  }
}
function showFixed(q) {
  app.querySelectorAll('.fword').forEach(b => { b.disabled = true; if (+b.dataset.f === q.bad) { b.classList.remove('wrong'); b.classList.add('right'); b.innerHTML = `<s>${esc(q.words[q.bad])}</s> ${esc(q.fix)}`; } });
  const r = $('#fixrow'); r && r.insertAdjacentHTML('afterend', `<p class="fixed">✓ ${q.words.map((w, i) => i === q.bad ? `<mark>${esc(q.fix)}</mark>` : esc(w)).join(' ')}</p>`);
  if (!Q.exam) synth(q.answer);
}
const correctText = q => q.type === 'multi' ? q.answers.join(', ') : q.answer;

function answer(ok, btn, given) {
  if (Q.done) return;
  const q = Q.qs[Q.i]; Q.tries++;
  const fb = $('#fb');
  setTimeout(() => { const f = $('#fb'); if (f && f.firstChild) f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
  if (ok) {
    Q.done = true; const first = Q.tries === 1;
    if (first) { Q.score++; S.stars++; updStars(true); }
    if (btn) btn.classList.add('right');
    if (q.type === 'mc') app.querySelectorAll('.choice').forEach(c => { if (c !== btn) c.classList.add('dim'); });
    if (q.type === 'multi') app.querySelectorAll('.choice').forEach(c => c.classList.add(q.answers.includes(q.choices[+c.dataset.c]) ? 'right' : 'dim'));
    if (q.type === 'order') $('#build').classList.add('right');
    if (q.type === 'fix') showFixed(q);
    sGood(); if (first) confetti();
    popText(pick(['Well done!', 'Great job!', 'Super!', 'Brilliant!', 'Correct!']));
    fb.innerHTML = Q.exam ? '' : `<div class="feedback good">${MASCOT.wink}<div>${first ? 'Correct! +1 ★' : 'Correct! Next time, first try!'}${q.explain ? `<div class="exp">${esc(q.explain)}</div>` : ''}</div></div>`;
    if (!Q.exam && q.type === 'order') synth(q.answer);
    Q.log.push({ q, ok: first });
    if (q.fromMist && first) S.mistakes = S.mistakes.filter(m => keyOf(m) !== keyOf(q));
    checkSticker(); save();
    if (Q.exam) setTimeout(next, 900); else $('#nextBtn').style.display = '';
  } else {
    sBad();
    if (btn) btn.classList.add('wrong');
    if (q.type === 'order') { const b = $('#build'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); }
    if (Q.exam || Q.tries >= 2) {
      Q.done = true;
      if (!q.fromMist && !S.mistakes.some(m => keyOf(m) === keyOf(q))) { const { fromMist, choices, pool, ...c } = q; S.mistakes.push(c); if (S.mistakes.length > 80) S.mistakes.shift(); }
      save();
      Q.log.push({ q, ok: false, given });
      if (Q.exam) { setTimeout(next, 700); return; }
      if (q.type === 'mc') app.querySelectorAll('.choice').forEach(c => { if (q.choices[+c.dataset.c] === q.answer) c.classList.add('right'); else if (c !== btn) c.classList.add('dim'); });
      if (q.type === 'multi') app.querySelectorAll('.choice').forEach(c => { c.classList.remove('sel'); c.classList.add(q.answers.includes(q.choices[+c.dataset.c]) ? 'right' : 'dim'); });
      if (q.type === 'fix') showFixed(q);
      fb.innerHTML = `<div class="feedback bad">${MASCOT.sad}<div>The answer is <span class="hl">${esc(correctText(q))}</span>${/[.!?]$/.test(correctText(q)) ? '' : '.'} It's in your mistake book now, so you can try again later!${q.explain ? `<div class="exp">${esc(q.explain)}</div>` : ''}</div></div>`;
      $('#nextBtn').style.display = '';
    } else {
      fb.innerHTML = `<div class="feedback hint">${MASCOT.happy}<div>Nearly! Try again.<div class="exp">Hint: ${q.hint || HINT(q)}</div></div></div>`;
      if (btn) btn.disabled = true;
      if (q.type === 'multi') { Q.sel.clear(); app.querySelectorAll('.choice').forEach(c => c.classList.remove('sel')); }
      if (q.type === 'order') setTimeout(() => { const c = $('#clr'); c && c.onclick(); const b = $('#build'); b && b.classList.remove('wrong'); }, 700);
    }
  }
}
function next() { Q.i++; if (Q.i >= Q.qs.length) result(); else showQ(); }
function checkSticker() { const n = STICKERS.findIndex((_, i) => S.stars === stickerAt(i)); if (n >= 0) setTimeout(() => { popText('New sticker! ' + STICKERS[n]); tone([[523, .1], [659, .1], [784, .1], [1047, .3]]); }, 900); }

function result() {
  const total = Q.qs.length, sc = Q.score;
  if (ALL[Q.mode] || QSETS[Q.mode]) S.best[Q.mode] = Math.max(S.best[Q.mode] || 0, Math.round(sc / total * 10));
  if (Q.mode === 'mock') S.best.mock = Math.max(S.best.mock || 0, sc);
  if (Q.mode === 'listen') S.best.listen = Math.max(S.best.listen || 0, sc);
  save();
  const ratio = sc / total; const st = ratio >= .9 ? '★★★' : ratio >= .7 ? '★★☆' : ratio >= .4 ? '★☆☆' : '☆☆☆';
  const wrong = Q.log.filter(l => !l.ok);
  let breakdown = '';
  if (Q.mode === 'mock') { const by = {}; Q.log.forEach(l => { const t = topicTitle(l.q.topic); by[t] = by[t] || [0, 0]; by[t][1]++; if (l.ok) by[t][0]++; }); breakdown = `<div class="topic-break">${Object.entries(by).map(([t, [a, b]]) => `<div>${a === b ? '🌟' : '💪'} ${t}: ${a}/${b}</div>`).join('')}</div>`; }
  view(`<div class="result">
    <div class="center"><span class="bob res-pup">${ratio >= .7 ? MASCOT.star : MASCOT.happy}</span></div>
    <h2>${ratio >= .9 ? 'Amazing!' : ratio >= .7 ? 'Well done!' : ratio >= .4 ? 'Good work! Keep going!' : 'Take your time and try again!'}</h2>
    <div class="score">${sc} / ${total}</div><div class="bigstars">${st}</div>
    ${breakdown}
    ${wrong.length ? `<div class="review"><h3>Let's look at the mistakes:</h3>${wrong.map(l => `<div class="item">${l.q.listen ? '🔈 ' + esc(l.q.listen) : fmt(l.q.text)}<br>Answer: <b>${esc(correctText(l.q))}</b>${l.q.explain ? ' — ' + esc(l.q.explain) : ''}</div>`).join('')}</div>` : ''}
    <div class="btns"><button class="pill next" id="again">Try again</button><button class="pill" id="hm">Home</button>${ALL[Q.mode] || QSETS[Q.mode] ? '<button class="pill" id="lrn">📖 Back to the topic</button>' : ''}</div>
  </div>`);
  if (ratio >= .7) { confetti(); setTimeout(confetti, 500); sGood(); }
  $('#again').onclick = () => startQuiz(Q.mode);
  $('#hm').onclick = home;
  if ($('#lrn')) $('#lrn').onclick = () => WT[Q.mode] ? wBack(Q.mode)() : topic(Q.mode);
}

function stickers() {
  view(`<button class="back" id="bk">← Home</button>
  <div class="topic-head"><div class="badge c-sky">${MASCOT.star}</div><div><p>Get a sticker for every 5 stars (first-try answers)</p><h2>My sticker book</h2></div></div>
  <p class="bold">You have <span class="hl">${S.stars}</span> stars ★</p>
  <div class="sticker-grid">${STICKERS.map((s, i) => S.stars >= stickerAt(i) ? `<div class="sticker">${s}</div>` : `<div class="sticker lock">🔒<small>${stickerAt(i)} ★</small></div>`).join('')}</div>
  <div class="center"><button class="pill" id="rst">Reset progress</button></div>`);
  $('#bk').onclick = home;
  let armed = false; $('#rst').onclick = () => { if (!armed) { armed = true; $('#rst').textContent = 'Tap again to clear everything'; return; } S.stars = 0; S.best = {}; S.mistakes = []; S.cards = {}; save(); updStars(); stickers(); };
}

/* ---------------- boot ---------------- */
$('#homeBtn').onclick = home;
$('#stickerBtn').onclick = stickers;
const sb = $('#soundBtn'); const setSB = () => sb.textContent = S.sound ? '🔊' : '🔇'; setSB();
sb.onclick = () => { S.sound = !S.sound; save(); setSB(); };
updStars();
if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = pickVoice; }
home();
window.__en = { ALL, bank, buildSet, prep, clean, preview: (id, i) => { const b = QSETS[id] ? QSETS[id].map(q => ({ ...q, topic: id })) : bank(id); Q = { mode: id, qs: [prep(b[i])], i: 0, score: 0, log: [], exam: false }; showQ(); } };
