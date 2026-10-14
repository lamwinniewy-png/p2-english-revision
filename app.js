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

/* writing mini-quizzes */
const W1Q = [
  O('Put the words in order.', ['My', 'favourite', 'place', 'at', 'school', 'is', 'the', 'library.']),
  O('Put the words in order.', ['It', 'is', 'on', 'the', 'second', 'floor.']),
  O('Put the words in order.', ['My', 'teachers', 'teach', 'us', 'how', 'to', 'draw.']),
  O('Put the words in order.', ['I', 'feel', 'happy', 'when', 'I', 'am', 'there.']),
  M('Which sentence tells us WHY you like the place?', 'I like it because it is quiet.', ['It is on the first floor.', 'My favourite place is the library.', 'We read books there.']),
  M('Which sentence tells us how you FEEL?', 'I feel relaxed when I am there.', ['It is on the third floor.', 'We sing songs there.', 'Our teachers teach us.']),
  M('My teachers teach us ___ to sing songs.', 'how', ['what', 'who', 'where']),
  M('We draw pictures ___ computers.', 'using', ['use', 'uses', 'used']),
  M('How many sentences must you write?', 'at least six', ['one', 'two', 'three']),
  M('Choose the correct sentence.', 'It is on the ground floor.', ['It is in the ground floor.', 'It is at ground floor.', 'It on the ground floor.']),
];

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
    <button class="topic-card c-lav" id="w1Btn"><div><span class="tag">Writing Task 1</span><h3>My Favourite Place at School</h3><p>Build your paragraph · model · tips</p></div><div class="stars">${starsOf('w1')}</div><span class="pic emo-badge">✏️</span></button>
    <button class="topic-card c-mint" id="w2Btn"><div><span class="tag">Writing Task 2</span><h3>Places like Home: Rules</h3><p>Rules + reasons · checklist</p></div><div class="stars">${starsOf('w2')}</div><span class="pic emo-badge">🏡</span></button>
  </div>
  <div class="section-title"><span class="dot"></span>Challenges</div>
  <div class="grid">
    <button class="topic-card c-butter" id="mockBtn"><div><span class="tag">25 questions</span><h3>Mock exam</h3><p>Everything mixed together</p></div><div class="stars">${S.best.mock != null ? 'Best: ' + S.best.mock + ' / 25' : ''}</div><span class="pic emo-badge">🏆</span></button>
    <button class="topic-card c-sky" id="spellBtn"><div><span class="tag">10 words</span><h3>Spelling bee</h3><p>Listen, then spell with letter tiles</p></div><div class="stars">${S.best.spell != null ? 'Best: ' + S.best.spell + ' / 10' : ''}</div><span class="pic emo-badge">🐝</span></button>
    <button class="topic-card c-pink" id="listenBtn"><div><span class="tag">10 questions</span><h3>Listen &amp; choose</h3><p>Hear a word, pick the right one</p></div><div class="stars">${S.best.listen != null ? 'Best: ' + S.best.listen + ' / 10' : ''}</div><span class="pic emo-badge">👂</span></button>
    <button class="topic-card c-lav" id="mistakeBtn"><div><span class="tag">${S.mistakes.length} questions</span><h3>Mistake book</h3><p>Try your mistakes again</p></div><span class="pic emo-badge">📒</span></button>
  </div>
  <p class="foot">Made for revision at home · Cloudy is an original character inspired by soft pastel cartoon style.</p>`);
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => { sTap(); topic(b.dataset.topic); });
  $('#w1Btn').onclick = () => writing1();
  $('#w2Btn').onclick = () => writing2();
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
function writing1() {
  const W = WRITING.t1;
  const st = { place: null, floor: null, acts: [], feel: null };
  const t = { title: 'My Favourite Place at School', emo: '✏️', col: 'c-lav' };
  const { html: mhtml, segs } = readerHTML([{ title: 'My Favourite Place at School', type: "Teacher's model", lines: W.model }]);
  view(`${head(t, 'Writing Task 1 · ' + W.module)}
  <div class="learn-card"><h4><span class="n">1</span>Answer these questions first</h4><ol class="qlist">${W.qs.map(q => `<li class="tap">${esc(q)}</li>`).join('')}</ol></div>
  <div class="learn-card"><h4><span class="n">2</span>Build your paragraph</h4>
    <div class="step"><b>Which place?</b><div class="chips" id="cPlace">${W.places.map(([p, e]) => `<button class="chip" data-v="${p}">${e} ${p}</button>`).join('')}</div></div>
    <div class="step"><b>Which floor?</b><div class="chips" id="cFloor">${W.floors.map(f => `<button class="chip" data-v="${f}">${f}</button>`).join('')}</div></div>
    <div class="step"><b>What do you and your classmates do there? (choose two)</b><div class="chips" id="cActs"><span class="muted">Choose a place first.</span></div></div>
    <div class="step"><b>How do you feel there?</b><div class="chips" id="cFeel">${W.feels.map(f => `<button class="chip" data-v="${f}">${f}</button>`).join('')}</div></div>
    <div class="out" id="out"><span class="muted">Your paragraph will appear here.</span></div>
    <div class="center"><button class="pill next" id="readOut">🔈 Read my paragraph</button></div>
  </div>
  <div class="learn-card"><h4><span class="n">3</span>Teacher's model</h4><div class="reader">${readerBar()}${mhtml}</div></div>
  <div class="learn-card"><h4><span class="n">4</span>Writing tips</h4><ul class="tips">${W.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  <div class="center"><button class="pill next" id="goQ">Writing quiz (10) →</button></div>`);
  $('#bk').onclick = home;
  wireReader(app, segs);
  app.querySelectorAll('.qlist .tap').forEach(el => el.onclick = () => say(el.textContent));
  const para = () => {
    if (!st.place) return '';
    const P = st.place, s = [];
    s.push(`My favourite place at school is ${P}.`);
    s.push(`It is on ${st.floor || '___'}.`);
    s.push(st.acts.length === 2 ? `My classmates and I ${st.acts[0]} and ${st.acts[1]} there.` : `My classmates and I ${st.acts[0] || '___'} there.`);
    s.push(`Our teachers ${W.teach[P]}.`);
    s.push(`I like ${P.replace(/^the /, 'the ')} because ${W.why[P]}.`);
    s.push(`I feel ${st.feel || '___'} when I am there.`);
    return s.join(' ');
  };
  const draw = () => {
    const sel = (id, vals) => app.querySelectorAll(`#${id} .chip`).forEach(c => c.classList.toggle('on', vals.includes(c.dataset.v)));
    sel('cPlace', [st.place]); sel('cFloor', [st.floor]); sel('cFeel', [st.feel]); sel('cActs', st.acts);
    const p = para();
    $('#out').innerHTML = p ? `<p>${fmt(p)}</p><small>${p.split(/(?<=\.)\s/).length} sentences ✓ · Copy it into your book in your own handwriting.</small>` : '<span class="muted">Your paragraph will appear here.</span>';
  };
  const wire = (id, fn) => app.querySelectorAll(`#${id} .chip`).forEach(c => c.onclick = () => { sTap(); fn(c.dataset.v); draw(); });
  wire('cPlace', v => {
    st.place = v; st.acts = [];
    $('#cActs').innerHTML = W.acts[v].map(a => `<button class="chip" data-v="${a}">${a}</button>`).join('');
    wire('cActs', a => { const k = st.acts.indexOf(a); if (k >= 0) st.acts.splice(k, 1); else { st.acts.push(a); if (st.acts.length > 2) st.acts.shift(); } });
  });
  wire('cFloor', v => st.floor = v); wire('cFeel', v => st.feel = v);
  $('#readOut').onclick = () => { const p = para(); p ? synth(p) : popText('Choose a place first!'); };
  $('#goQ').onclick = () => startQuiz('w1');
}

function writing2() {
  const W = WRITING.t2;
  const t = { title: 'Places like Home: Rules', emo: '🏡', col: 'c-mint' };
  let place = null; let chosen = [];
  view(`${head(t, 'Writing Task 2 · ' + W.module)}
  <div class="skill"><p>${esc(W.intro)}</p></div>
  <div class="learn-card"><h4><span class="n">1</span>Example: the park 🌳</h4>
    ${W.example.map((e, i) => `<div class="rule"><div><b>Rule ${i + 1}:</b> <span class="tap">${esc(e[2])}</span></div><div><b>Reason:</b> <span class="tap">${esc(e[3])}</span></div></div>`).join('')}</div>
  <div class="learn-card"><h4><span class="n">2</span>Make your own rules</h4>
    <div class="step"><b>Choose a place that feels like home:</b><div class="chips" id="cP">${W.places.map((p, i) => `<button class="chip" data-i="${i}">${p.e} ${p.p}</button>`).join('')}</div></div>
    <div class="step"><b>Choose TWO rules:</b><div class="chips col" id="cR"><span class="muted">Choose a place first.</span></div></div>
    <div class="out" id="out"><span class="muted">Your rules will appear here.</span></div>
    <div class="center"><button class="pill next" id="readOut">🔈 Read my rules</button></div>
  </div>
  <div class="learn-card"><h4><span class="n">3</span>Checklist</h4>${W.checklist.map(([q, eg]) => `<label class="check"><input type="checkbox"><span><b>${esc(q)}</b><br><small>${esc(eg)}</small></span></label>`).join('')}</div>
  <div class="center"><button class="pill next" id="goQ">Rules quiz (10) →</button></div>`);
  $('#bk').onclick = home;
  app.querySelectorAll('.rule .tap').forEach(el => el.onclick = () => say(el.textContent));
  const sentence = r => `We ${r[0]} ${r[1]} ${place.prep} ${place.p}.`;
  const draw = () => {
    app.querySelectorAll('#cP .chip').forEach(c => c.classList.toggle('on', place && W.places[+c.dataset.i] === place));
    app.querySelectorAll('#cR .chip').forEach(c => c.classList.toggle('on', chosen.includes(+c.dataset.i)));
    if (!place || !chosen.length) { $('#out').innerHTML = '<span class="muted">Your rules will appear here.</span>'; return; }
    $('#out').innerHTML = `<p><b>Place:</b> ${place.e} ${place.p}</p>` + chosen.map((k, n) => { const r = place.rules[k]; return `<div class="rule"><div><b>Rule ${n + 1}:</b> ${esc(sentence(r))}</div><div><b>Reason:</b> ${esc(r[2])}</div></div>`; }).join('') + `<small>Look: <b>${place.prep}</b> ${place.p} · <b>must</b> / <b>mustn't</b> · a reason for each rule ✓</small>`;
  };
  app.querySelectorAll('#cP .chip').forEach(c => c.onclick = () => {
    sTap(); place = W.places[+c.dataset.i]; chosen = [];
    $('#cR').innerHTML = place.rules.map((r, i) => `<button class="chip" data-i="${i}">${r[0] === 'must' ? '✅' : '🚫'} We <b>${r[0]}</b> ${esc(r[1])} ${place.prep} ${place.p}.</button>`).join('');
    app.querySelectorAll('#cR .chip').forEach(b => b.onclick = () => { sTap(); const i = +b.dataset.i; const k = chosen.indexOf(i); if (k >= 0) chosen.splice(k, 1); else { chosen.push(i); if (chosen.length > 2) chosen.shift(); } draw(); });
    draw();
  });
  $('#readOut').onclick = () => { if (!place || !chosen.length) return popText('Choose a place and rules!'); synth(chosen.map((k, n) => { const r = place.rules[k]; return `Rule ${n + 1}. ${sentence(r)} ${r[2]}`; }).join(' ')); };
  $('#goQ').onclick = () => startQuiz('w2');
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
const QSETS = { w1: W1Q, w2: WRITING.t2.qs };
function buildSet(mode) {
  const qs = []; const seen = new Set();
  const push = q => { if (!q) return false; const k = keyOf(q); if (seen.has(k)) return false; seen.add(k); qs.push(q); return true; };
  if (mode === 'mock') {
    UNITS.forEach(u => shuffle(bank(u.id)).slice(0, u.group === 'ple' ? 3 : 2).forEach(push));
    READING.forEach(r => shuffle(bank(r.id)).slice(0, 1).forEach(push));
    shuffle(WRITING.t2.qs).slice(0, 1).forEach(q => push({ ...q, topic: 'w2' }));
    let g = 0; while (qs.length < 25 && g++ < 80) push(shuffle(bank(pick(UNITS).id))[0]);
    return shuffle(qs).slice(0, 25).map(prep);
  }
  if (mode === 'listen') { let g = 0; while (qs.length < 10 && g++ < 200) push(listenQ(WORDS)); return qs.map(prep); }
  if (mode === 'mistakes') return shuffle(S.mistakes).slice(0, 10).map(q => prep({ ...q, fromMist: 1 }));
  if (QSETS[mode]) return shuffle(QSETS[mode]).slice(0, 10).map(q => prep({ ...q, topic: mode }));
  const t = ALL[mode];
  if (t.kind === 'reading') return bank(mode).map(prep);
  const b = shuffle(bank(mode));
  b.slice(0, t.words ? 9 : 10).forEach(push);
  if (t.words) push(listenQ(WORDS.filter(x => x.u === mode)));
  return qs.map(prep);
}
const topicTitle = id => id === 'w1' ? 'Writing Task 1' : id === 'w2' ? 'Writing Task 2' : ALL[id] ? ALL[id].title : '';
function title(mode) { return mode === 'mock' ? 'Mock exam' : mode === 'listen' ? 'Listen & choose' : mode === 'mistakes' ? 'Mistake book' : topicTitle(mode); }

function startQuiz(mode) {
  sTap();
  Q = { mode, qs: buildSet(mode), i: 0, score: 0, tries: 0, log: [], exam: mode === 'mock' };
  if (!Q.qs.length) return home();
  showQ();
}
const HINT = q => q.type === 'order' ? 'Start with the person or "Don\'t". A sentence starts with a capital letter and ends with a full stop.' : q.type === 'multi' ? 'There is more than one answer.' : 'Put each answer into the sentence and read it aloud. Which one sounds right?';

function showQ() {
  const q = Q.qs[Q.i]; Q.tries = 0; Q.done = false; Q.sel = new Set(); Q.built = [];
  const rd = ALL[q.topic] && ALL[q.topic].kind === 'reading' ? ALL[q.topic] : null;
  const long = q.choices && q.choices.some(c => c.length > 22);
  let area = '';
  if (q.type === 'mc') area = `${q.listen ? `<div class="qvis"><button class="big-ear" id="ear">🔈<small>Hear it again</small></button></div>` : ''}<div class="choices ${long ? 'long' : ''}">${q.choices.map((c, i) => `<button class="choice" data-c="${i}"><span class="lt">${LET[i]}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
  if (q.type === 'multi') area = `<p class="multi-tip">Choose ALL the right answers, then tap Check.</p><div class="choices multi ${long ? 'long' : ''}">${q.choices.map((c, i) => `<button class="choice" data-c="${i}"><span class="lt">${LET[i]}</span><span>${esc(c)}</span></button>`).join('')}</div><div class="qbar"><button class="pill next" id="okMulti">Check</button></div>`;
  if (q.type === 'order') area = `<p class="multi-tip">Tap the word cards in the right order. Tap a card at the top to put it back.</p><div class="build" id="build"></div><div class="tiles" id="tiles"></div><div class="qbar"><button class="pill" id="clr">↺ Clear</button><button class="pill next" id="okOrder">Check</button></div>`;
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
  $('#qx').onclick = () => (ALL[Q.mode] ? topic(Q.mode) : Q.mode === 'w1' ? writing1() : Q.mode === 'w2' ? writing2() : home());
  $('#spk').onclick = () => q.listen ? say(q.listen) : say(q.text);
  if (q.listen) { $('#ear').onclick = () => say(q.listen); setTimeout(() => say(q.listen), 350); }
  if ($('#hintBtn')) $('#hintBtn').onclick = () => { $('#fb').innerHTML = `<div class="feedback hint">${MASCOT.happy}<div>Hint: ${q.hint || HINT(q)}</div></div>`; };
  $('#nextBtn').onclick = next;
  if (q.type === 'mc') app.querySelectorAll('.choice').forEach(b => b.onclick = () => answer(q.choices[+b.dataset.c] === q.answer, b, q.choices[+b.dataset.c]));
  if (q.type === 'multi') {
    app.querySelectorAll('.choice').forEach(b => b.onclick = () => { if (Q.done) return; sTap(); const i = +b.dataset.c; Q.sel.has(i) ? Q.sel.delete(i) : Q.sel.add(i); b.classList.toggle('sel'); });
    $('#okMulti').onclick = () => { if (Q.done || !Q.sel.size) return; const picked = [...Q.sel].map(i => q.choices[i]); const ok = picked.length === q.answers.length && picked.every(p => q.answers.includes(p)); answer(ok, null, picked.join(', ')); };
  }
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
      fb.innerHTML = `<div class="feedback bad">${MASCOT.sad}<div>The answer is <span class="hl">${esc(correctText(q))}</span>. It's in your mistake book now, so you can try again later!${q.explain ? `<div class="exp">${esc(q.explain)}</div>` : ''}</div></div>`;
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
  if ($('#lrn')) $('#lrn').onclick = () => Q.mode === 'w1' ? writing1() : Q.mode === 'w2' ? writing2() : topic(Q.mode);
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
