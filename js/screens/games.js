import { html, useState, useEffect, useMemo, useRef } from '../vendor/preact-htm.js';
import { useStore, update, teacherEvent } from '../store.js';
import { ID_LESSONS } from '../data/indonesian.js';
import { EN_ALL, EN_BY_ID } from '../data/english.js';
import { SIMON_ACTIONS, CONVERSATIONS } from '../data/games.js';
import { Back, go, shuffle, sample, pick, AudioBtn, Confetti, FullscreenBtn } from '../ui.js';
import { Session, Match } from '../exercises.js';
import { quizFrom, uniquePairs, pictured } from '../gen.js';
import { isStudentUi, KIDS, T, B } from '../i18n.js';

export const GAMES = [
  { id: 'flashcards', icon: '🃏', name: 'Flashcards', fr: 'Cartes à retourner + révision espacée', who: 'moi' },
  { id: 'quiz', icon: '❓', name: 'Multiple Choice Quiz', fr: 'Quatre réponses, une seule bonne', who: 'tous' },
  { id: 'match', icon: '🔗', name: 'Match the Pairs', fr: 'Anglais ↔ indonésien, mot ↔ emoji…', who: 'tous' },
  { id: 'fill', icon: '✏️', name: 'Fill in the Blanks', fr: '« She ___ happy. »', who: 'tous' },
  { id: 'build', icon: '🧱', name: 'Build a Sentence', fr: 'Remettre les mots dans l\'ordre', who: 'tous' },
  { id: 'emotions', icon: '😊', name: 'Guess the Emotion', fr: 'Quiz d\'emojis ou mime en classe', who: 'classe' },
  { id: 'simon', icon: '🙋‍♀️', name: 'Simon Says', fr: 'Consignes aléatoires, avec ou sans « Simon says »', who: 'classe' },
  { id: 'memory', icon: '🧠', name: 'Memory Game', fr: 'Retrouver les paires, 3 niveaux', who: 'tous' },
  { id: 'conversation', icon: '💬', name: 'Conversation Practice', fr: 'Dialogues à trous à jouer à deux', who: 'classe' },
  { id: 'touch', icon: '👆', name: 'Touch it!', fr: 'Touche la main, le nez, la porte… sur un dessin', who: 'multi' },
  { id: 'team', icon: '🏆', name: 'Team Challenge', fr: 'Équipes, points, minuteur, podium', who: 'multi' },
  { id: 'duel', icon: '⚔️', name: 'Quiz Duel', fr: 'Face à face sur un seul téléphone : la plus rapide gagne', who: 'multi' },
  { id: 'hangman', icon: '🎈', name: 'Hangman (le pendu)', fr: 'Deviner le mot lettre par lettre, en équipes', who: 'multi' },
  { id: 'charades', icon: '🎭', name: 'What am I doing?', fr: 'Mimer un verbe, deviner « She is swimming! »', who: 'multi' },
];

export function GamesHome() {
  const tile = (g) => html`<button class="game-tile" onClick=${() => go(g.id === 'flashcards' ? '/flashcards' : '/games/' + g.id)}>
      <span class="game-icon">${g.icon}</span><b>${g.name}</b><span class="muted small">${g.fr}</span>${g.who === 'classe' && html`<span class="tag">🏫 classe</span>`}
    </button>`;
  return html`<div class="page">
    <h1>🎲 Jeux</h1>
    <h2>👯 À plusieurs : duel et équipes</h2>
    <p class="muted">Contre une copine sur le même téléphone, ou toute la classe en équipes. Thèmes au choix : anglais, verbes ou indonésien.</p>
    <div class="game-grid">${GAMES.filter((g) => g.who === 'multi').map(tile)}</div>
    <h2>🎯 Pour apprendre et animer</h2>
    <p class="muted">Tous ces jeux marchent pour l'indonésien (toi) et l'anglais (la classe). 🏫 = conçu pour jouer devant les élèves.</p>
    <div class="game-grid">${GAMES.filter((g) => g.who !== 'multi').map(tile)}</div>
  </div>`;
}

const SOURCES = () => [
  ...EN_ALL.map((l) => ({ id: l.id, label: l.title, icon: l.icon, lang: 'en' })),
  ...ID_LESSONS.map((l) => ({ id: l.id, label: l.title, icon: l.icon, lang: 'id' })),
];

function SourcePicker({ onPick, filter = () => true, title = T('Choisis un thème', B('Pilih tema', 'Choose a topic')) }) {
  const src = SOURCES().filter(filter).filter((x) => !KIDS || x.lang === 'en');
  const en = src.filter((x) => x.lang === 'en'), id = src.filter((x) => x.lang === 'id');
  return html`<div>
    <h2>${title}</h2>
    ${en.length > 0 && html`<h3>🇬🇧 ${T('Anglais (classe)', B('Bahasa Inggris', 'English'))}</h3><div class="src-grid">${en.map((x) => html`<button class="src" onClick=${() => onPick(x)}>${x.icon} ${x.label}</button>`)}</div>`}
    ${id.length > 0 && html`<h3>🇮🇩 Indonésien (moi)</h3><div class="src-grid">${id.map((x) => html`<button class="src" onClick=${() => onPick(x)}>${x.icon} ${x.label}</button>`)}</div>`}
  </div>`;
}

export function GamePage({ title, icon, children, wide }) {
  return html`<div class=${'page' + (wide ? '' : ' narrow')}><div class="row between"><${Back} to=${isStudentUi() ? '/s/play' : '/games'} label=${isStudentUi() ? B('Main', 'Play') : 'Jeux'} /><${FullscreenBtn} /></div><h1>${icon} ${title}</h1>${children}</div>`;
}

function itemsFor(src) {
  if (src.lang === 'en') return EN_BY_ID[src.id].vocab.map((w) => ({ q: w.en, a: w.id, emoji: w.abstract ? null : w.emoji, audio: { text: w.en, lang: 'en' }, why: KIDS ? `${w.en} = ${w.id}` : `${w.en} = ${w.id} · ${w.fr}` }));
  return ID_LESSONS.find((l) => l.id === src.id).words.map((w) => ({ q: w.id, a: w.fr, audio: { text: w.id, lang: 'id' }, why: `🗣️ ${w.pron}` }));
}

export function QuizGame() {
  const [src, setSrc] = useState(null);
  const [round, setRound] = useState(0);
  const items = useMemo(() => {
    if (!src) return [];
    if (src.lang === 'en') {
      const v = EN_BY_ID[src.id].vocab;
      return [
        ...quizFrom(pictured(v).map((w) => ({ q: '', emoji: w.emoji, a: w.en, audio: { text: w.en, lang: 'en' }, why: KIDS ? `${w.en} = ${w.id}` : `${w.en} = ${w.id} (${w.fr})` })), { n: 5, kindLabel: T('What is it?', 'Apa ini? (What is it?)') }),
        ...quizFrom(v.map((w) => ({ q: w.id, a: w.en, sub: 'In English?', why: `${w.id} = ${w.en}` })), { n: 5, kindLabel: 'Bahasa Inggrisnya apa?' }),
      ];
    }
    return quizFrom(itemsFor(src), { n: 10 });
  }, [src, round]);
  return html`<${GamePage} title="Multiple Choice Quiz" icon="❓">
    ${!src ? html`<${SourcePicker} onPick=${setSrc} />`
      : html`<${Session} key=${round} items=${items} onExit=${() => setSrc(null)} finishLabel=${T('Rejouer un autre quiz', B('Kuis lain', 'Another quiz'))}
          onFinish=${() => { setRound(round + 1); setSrc(null); }} />`}
  </${GamePage}>`;
}

export function MatchGame() {
  const [mode, setMode] = useState(null);
  const [round, setRound] = useState(0);
  const [win, setWin] = useState(null);
  const modes = [
    { id: 'en-id', label: T('🇬🇧 Anglais ↔ 🇮🇩 Indonésien', '🇬🇧 Inggris ↔ 🇮🇩 Indonesia (English ↔ Indonesian)'), make: () => uniquePairs(EN_ALL.flatMap((l) => l.vocab).map((w) => [w.en, w.id]), 6) },
    { id: 'fr-id', label: '🇫🇷 Français ↔ 🇮🇩 Indonésien', make: () => uniquePairs(ID_LESSONS.flatMap((l) => l.words).filter((w) => w.id.length < 22).map((w) => [w.fr, w.id]), 6) },
    { id: 'word-pic', label: T('🔤 Mot ↔ 🖼️ Image', '🔤 Kata ↔ 🖼️ Gambar (Word ↔ Picture)'), big: true, make: () => uniquePairs(EN_ALL.filter((l) => l.id !== 'en-feelings').flatMap((l) => pictured(l.vocab)).map((w) => [w.en, w.emoji]), 6) },
    { id: 'emo', label: T('😊 Émotion ↔ Emoji', '😊 Perasaan ↔ Emoji (Feeling ↔ Emoji)'), big: true, make: () => uniquePairs(EN_BY_ID['en-feelings'].vocab.map((w) => [w.en, w.emoji]), 6) },
  ].filter((m) => !KIDS || m.id !== 'fr-id');
  const pairs = useMemo(() => (mode ? mode.make() : []), [mode, round]);
  return html`<${GamePage} title="Match the Pairs" icon="🔗">
    ${!mode && html`<div class="choices">${modes.map((m) => html`<button class="choice" onClick=${() => { setMode(m); setWin(null); }}>${m.label}</button>`)}</div>`}
    ${mode && !win && html`<${Match} key=${round} pairs=${pairs} bigRight=${mode.big} onDone=${(perfect, errors) => setWin({ errors })} />`}
    ${mode && win && html`<div class="ex result"><${Confetti} /><div class="result-emoji">🎉</div><h2>${T('Toutes les paires trouvées !', B('Semua pasangan ketemu!', 'All pairs found!'))}</h2>
      <p class="muted">${win.errors} ${T('erreur(s)', B('salah', 'mistakes'))}</p>
      <button class="btn primary block" onClick=${() => { setRound(round + 1); setWin(null); }}>🔁 ${T('Nouvelle partie', B('Main lagi', 'Play again'))}</button>
      <button class="btn ghost block" onClick=${() => setMode(null)}>${T('Changer de mode', B('Ganti mode', 'Change mode'))}</button></div>`}
  </${GamePage}>`;
}

function exercisesOf(type) {
  const en = EN_ALL.filter((l) => l.exercises).flatMap((l) => l.exercises.filter((e) => e.type === type).map((e) => type === 'fill'
    ? { kind: 'fill', s: e.s, opts: e.opts, a: e.a, why: KIDS ? `🇮🇩 ${e.why.id} (${e.why.en})` : e.why.fr + ' · 🇮🇩 ' + e.why.id }
    : KIDS ? { kind: 'build', a: e.a, fr: '🇮🇩 ' + e.id, lang: 'en' } : { kind: 'build', a: e.a, fr: e.fr, sub: '🇮🇩 ' + e.id, lang: 'en' }));
  const id = ID_LESSONS.flatMap((l) => (type === 'fill' ? l.fill : l.build).map((e) => ({ kind: type, ...e })));
  return { en, id };
}

function DrillGame({ type, title, icon }) {
  const [lang, setLang] = useState(KIDS ? 'en' : null);
  const [round, setRound] = useState(0);
  const items = useMemo(() => (lang ? sample(exercisesOf(type)[lang], 8) : []), [lang, round]);
  return html`<${GamePage} title=${title} icon=${icon}>
    ${!lang ? html`<div class="choices big">
        <button class="choice" onClick=${() => setLang('en')}>🇬🇧 Anglais : TO BE, like, can…</button>
        <button class="choice" onClick=${() => setLang('id')}>🇮🇩 Indonésien : mes leçons</button></div>`
      : html`<${Session} key=${round} items=${items} onExit=${() => (KIDS ? history.back() : setLang(null))} finishLabel=${T('🔁 Nouvelle série', '🔁 ' + B('Soal baru', 'New set'))} onFinish=${() => setRound(round + 1)} />`}
  </${GamePage}>`;
}
export const FillGame = () => html`<${DrillGame} type="fill" title="Fill in the Blanks" icon="✏️" />`;
export const BuildGame = () => html`<${DrillGame} type="build" title="Build a Sentence" icon="🧱" />`;

export function EmotionsGame() {
  const [mode, setMode] = useState(null);
  const feelings = EN_BY_ID['en-feelings'].vocab;
  const [round, setRound] = useState(0);
  const items = useMemo(() => {
    if (mode === 'choose') return quizFrom(feelings.map((w) => ({ q: '', emoji: w.emoji, a: w.en, audio: { text: w.en, lang: 'en' }, why: `${w.emoji} ${w.en} = ${w.id} (${w.fr})` })), { n: 10, kindLabel: 'How does she feel?' });
    if (mode === 'type') return sample(feelings, 8).map((w) => ({ kind: 'translate', kindLabel: 'Write the feeling in English', fr: html`<div class="ex-emoji">${w.emoji}</div>`, a: [w.en] }));
    return [];
  }, [mode, round]);
  return html`<${GamePage} title="Guess the Emotion" icon="😊">
    ${!mode && html`<div class="choices big">
      <button class="choice" onClick=${() => setMode('choose')}>👆 Choisir l'émotion (quiz)</button>
      <button class="choice" onClick=${() => setMode('type')}>⌨️ Écrire l'émotion</button>
      <button class="choice" onClick=${() => { setMode('mime'); teacherEvent('games'); }}>🎭 Mode mime (en classe)</button></div>`}
    ${(mode === 'choose' || mode === 'type') && html`<${Session} key=${round} items=${items} onExit=${() => setMode(null)} finishLabel="🔁 Rejouer" onFinish=${() => setRound(round + 1)} />`}
    ${mode === 'mime' && html`<${Mime} feelings=${feelings} onExit=${() => setMode(null)} />`}
  </${GamePage}>`;
}

function Mime({ feelings, onExit }) {
  const [order] = useState(() => shuffle(feelings));
  const [i, setI] = useState(0);
  const [peek, setPeek] = useState(false);
  const [shown, setShown] = useState(false);
  const w = order[i % order.length];
  const next = () => { setI(i + 1); setPeek(false); setShown(false); };
  return html`<div class="stage">
    <p class="muted center">1. Montre la carte à l'élève qui mime 👀 · 2. Elle mime · 3. La classe devine · 4. « Show Answer »</p>
    <div class=${'big-card' + (peek || shown ? '' : ' covered')} onClick=${() => setPeek(!peek)}>
      ${peek || shown ? html`<div class="giant">${w.emoji}</div><div class="huge">${w.en}</div>` : html`<div class="giant">🎭</div><div class="huge">?</div><div class="muted">Touche pour voir (élève qui mime)</div>`}
      ${shown && html`<div class="trans">🇮🇩 ${w.id} · 🇫🇷 ${w.fr}</div>`}
    </div>
    <div class="row center wrap">
      ${!shown ? html`<button class="btn coral xl" onClick=${() => setShown(true)}>Show Answer</button>` : html`<${AudioBtn} text=${'I am ' + w.en} lang="en" big />`}
      <button class="btn primary xl" onClick=${next}>Next →</button>
    </div>
    <button class="btn link" onClick=${onExit}>Changer de mode</button>
  </div>`;
}

export function SimonGame() {
  const [cur, setCur] = useState(null);
  const [showTr, setShowTr] = useState(true);
  const [ratio, setRatio] = useState(0.65);
  const [count, setCount] = useState(0);
  useEffect(() => { teacherEvent('games'); }, []);
  const next = () => {
    let a;
    do { a = pick(SIMON_ACTIONS); } while (cur && a.en === cur.a.en);
    setCur({ a, simon: Math.random() < ratio });
    setCount(count + 1);
  };
  const say = (c) => `${c.simon ? 'Simon says, ' : ''}${c.a.en.toLowerCase()}!`;
  return html`<${GamePage} title="Simon Says" icon="🙋‍♀️" wide>
    <div class="card small-rules">
      <b>Règle :</b> on fait le geste seulement si la consigne commence par « Simon says ». Sinon, on ne bouge pas ! 🇮🇩 <i>Lakukan hanya jika ada kata "Simon says".</i>
    </div>
    <div class="stage">
      ${cur ? html`<div class=${'big-card simon ' + (cur.simon ? 'yes' : 'no')}>
          <div class="giant">${cur.a.emoji}</div>
          <div class="huge">${cur.simon && html`<span class="simon-says">Simon says…</span>`}${cur.a.en}!</div>
          ${showTr && html`<div class="trans">🇮🇩 ${cur.a.id} · 🇫🇷 ${cur.a.fr}</div>`}
          <div class=${'verdict ' + (cur.simon ? 'yes' : 'no')}>${cur.simon ? '✅ On bouge !' : '🚫 Piège : on ne bouge pas !'}</div>
        </div>`
        : html`<div class="big-card"><div class="giant">🙋‍♀️</div><div class="huge">Ready?</div><div class="muted">🇮🇩 Siap?</div></div>`}
      <div class="row center wrap">
        ${cur && html`<${AudioBtn} text=${say(cur)} lang="en" big />`}
        <button class="btn primary xl" onClick=${next}>${cur ? 'Next →' : '▶ Start'}</button>
      </div>
      <div class="row center wrap small">
        <label class="check"><input type="checkbox" checked=${showTr} onChange=${(e) => setShowTr(e.target.checked)} /> Afficher les traductions</label>
        <label class="check">Pièges : <select value=${ratio} onChange=${(e) => setRatio(+e.target.value)}><option value="0.8">peu</option><option value="0.65">moyen</option><option value="0.5">beaucoup</option></select></label>
        <span class="muted">Consigne n° ${count}</span>
      </div>
    </div>
  </${GamePage}>`;
}

export function MemoryGame() {
  const [cfg, setCfg] = useState(null);
  const [cards, setCards] = useState([]);
  const [open, setOpen] = useState([]);
  const [found, setFound] = useState([]);
  const [moves, setMoves] = useState(0);
  const levels = [{ n: 4, label: T('🌱 Facile (4 paires)', '🌱 Mudah (Easy) · 4') }, { n: 6, label: T('🌿 Moyen (6 paires)', '🌿 Sedang (Medium) · 6') }, { n: 8, label: T('🌳 Difficile (8 paires)', '🌳 Sulit (Hard) · 8') }];
  const kinds = [
    { id: 'pic', label: T('🔤 Mot ↔ 🖼️ Image', '🔤 Kata ↔ 🖼️ Gambar (Word ↔ Picture)'), make: (n) => uniquePairs(EN_ALL.flatMap((l) => pictured(l.vocab)).map((w) => [w.en, w.emoji]), n) },
    { id: 'enid', label: '🇬🇧 ↔ 🇮🇩', make: (n) => uniquePairs(EN_ALL.flatMap((l) => l.vocab).map((w) => [w.en, w.id]), n) },
    { id: 'idfr', label: '🇮🇩 ↔ 🇫🇷', make: (n) => uniquePairs(ID_LESSONS.flatMap((l) => l.words).filter((w) => w.id.length < 18).map((w) => [w.id, w.fr]), n) },
  ].filter((k) => !KIDS || k.id !== 'idfr');
  const [kind, setKind] = useState(kinds[0]);
  const start = (lv) => {
    const pairs = kind.make(lv.n);
    setCards(shuffle(pairs.flatMap((p, i) => [{ t: p[0], i, k: i + 'a' }, { t: p[1], i, k: i + 'b', alt: true }])));
    setOpen([]); setFound([]); setMoves(0); setCfg(lv);
  };
  const flip = (idx) => {
    if (open.length === 2 || open.includes(idx) || found.includes(cards[idx].i)) return;
    const o = [...open, idx];
    setOpen(o);
    if (o.length === 2) {
      setMoves(moves + 1);
      if (cards[o[0]].i === cards[o[1]].i) { setTimeout(() => { setFound((f) => [...f, cards[o[0]].i]); setOpen([]); }, 450); }
      else setTimeout(() => setOpen([]), 1000);
    }
  };
  const won = cfg && found.length === cfg.n;
  return html`<${GamePage} title="Memory Game" icon="🧠" wide>
    ${!cfg && html`<h3>${T('Type de paires', B('Jenis pasangan', 'Pair type'))}</h3><div class="row wrap">${kinds.map((k) => html`<button class=${'chip' + (k.id === kind.id ? ' on' : '')} onClick=${() => setKind(k)}>${k.label}</button>`)}</div>
      <h3>${T('Difficulté', B('Tingkat', 'Level'))}</h3><div class="choices big">${levels.map((lv) => html`<button class="choice" onClick=${() => start(lv)}>${lv.label}</button>`)}</div>`}
    ${cfg && html`<div class="row between"><span class="pill">${T('Coups', B('Langkah', 'Moves'))} : ${moves}</span><span class="pill ok">${found.length}/${cfg.n}</span><button class="btn ghost sm" onClick=${() => setCfg(null)}>${T('Réglages', B('Pengaturan', 'Settings'))}</button></div>
      <div class=${'memory n' + cfg.n}>${cards.map((c, idx) => {
        const up = open.includes(idx) || found.includes(c.i);
        return html`<button class=${'mem' + (up ? ' up' : '') + (found.includes(c.i) ? ' found' : '')} onClick=${() => flip(idx)}>
          <span class="mem-in">${up ? html`<span class=${/\p{Extended_Pictographic}/u.test(c.t) && c.t.length <= 8 ? 'emoji-face' : ''}>${c.t}</span>` : '🌴'}</span></button>`;
      })}</div>
      ${won && html`<div class="ex result"><${Confetti} /><h2>🎉 ${T(`Bravo ! ${moves} coups`, `${B('Hebat', 'Great')}! ${moves} ${B('langkah', 'moves')}`)}</h2><button class="btn primary" onClick=${() => start(cfg)}>🔁 ${T('Rejouer', B('Main lagi', 'Play again'))}</button></div>`}`}
  </${GamePage}>`;
}

export function ConversationGame() {
  const [c, setC] = useState(null);
  const [showId, setShowId] = useState(false);
  const [hints, setHints] = useState(false);
  return html`<${GamePage} title="Conversation Practice" icon="💬" wide>
    ${!c ? html`<div class="choices big">${CONVERSATIONS.map((x) => html`<button class="choice" onClick=${() => { setC(x); teacherEvent('games'); }}>${x.icon} ${x.title}</button>`)}</div>`
      : html`<div>
        <div class="row wrap"><button class="btn ghost sm" onClick=${() => setC(null)}>← Autres dialogues</button>
          <label class="check"><input type="checkbox" checked=${showId} onChange=${(e) => setShowId(e.target.checked)} /> 🇮🇩 Traduction</label>
          <label class="check"><input type="checkbox" checked=${hints} onChange=${(e) => setHints(e.target.checked)} /> 💡 Idées de réponses</label></div>
        <h2>${c.icon} ${c.title}</h2>
        <div class="dialog">${c.lines.map((l) => html`<div class=${'bubble ' + l.who}>
          <span class="who">${l.who}</span>
          <div><div class="huge-ish">${l.en.split('____').map((p, i) => i ? html`<span class="blank">${hints && l.hint ? l.hint : '______'}</span>${p}` : p)}</div>
          ${showId && html`<div class="muted">🇮🇩 ${l.id}</div>`}</div>
          <${AudioBtn} text=${l.en.replace(/____/g, '')} lang="en" />
        </div>`)}</div>
        <p class="muted small">Astuce : faites jouer A par toute la classe et B par une élève, puis inversez.</p>
      </div>`}
  </${GamePage}>`;
}

// ---------- TEAM CHALLENGE ----------
export const TEAM_PRESET = [
  { name: 'Turtles', icon: '🐢', color: '#14b8a6' },
  { name: 'Monkeys', icon: '🐒', color: '#f59e0b' },
  { name: 'Butterflies', icon: '🦋', color: '#8b5cf6' },
  { name: 'Dolphins', icon: '🐬', color: '#38bdf8' },
];

function defaultTeams(n = 3, total = 13) {
  const base = Math.floor(total / n), extra = total % n;
  let k = 1;
  return TEAM_PRESET.slice(0, n).map((t, i) => {
    const size = base + (i >= n - extra ? 1 : 0);
    return { ...t, score: 0, turn: 0, students: Array.from({ length: size }, () => `Student ${k++}`) };
  });
}

function teamQuestions(themeIds) {
  const qs = [];
  themeIds.forEach((id) => {
    const l = EN_BY_ID[id];
    l.vocab.forEach((w) => {
      if (!w.abstract) qs.push({ emoji: w.emoji, q: 'What is it?', qid: 'Apa ini dalam bahasa Inggris?', a: w.en, extra: `${w.id} · ${w.fr}` });
      if (w.verb) qs.push({ emoji: w.emoji, q: `${w.verb.base} → past?`, qid: 'Bentuk lampaunya apa?', a: w.verb.past, extra: w.forms });
      qs.push({ q: `How do you say “${w.id}” in English?`, qid: `Bahasa Inggrisnya “${w.id}” apa?`, a: w.en, extra: w.fr });
    });
    (l.exercises || []).filter((e) => e.type === 'fill').forEach((e) => qs.push({ q: e.s, qid: 'Pilih: ' + e.opts.join(' / '), a: e.s.replace('___', e.a), extra: e.why.id }));
  });
  return shuffle(qs);
}

export function TeamGame() {
  const s = useStore();
  const saved = s.teams;
  const [phase, setPhase] = useState(saved?.playing ? 'play' : 'setup');
  const [teams, setTeams] = useState(saved?.teams || defaultTeams());
  const [themes, setThemes] = useState(saved?.themes || ['en-intro', 'en-feelings', 'en-hobbies']);
  const [timerOn, setTimerOn] = useState(saved?.timerOn ?? true);
  const [seconds, setSeconds] = useState(saved?.seconds || 30);

  if (phase === 'setup') {
    const setN = (n) => setTeams(defaultTeams(n));
    const total = teams.reduce((a, t) => a + t.students.length, 0);
    return html`<${GamePage} title="Team Challenge" icon="🏆" wide>
      <div class="card">
        <h3>1. Équipes</h3>
        <div class="row wrap">${[2, 3, 4].map((n) => html`<button class=${'chip' + (teams.length === n ? ' on' : '')} onClick=${() => setN(n)}>${n} équipes</button>`)}
          <span class="muted">${total} élèves</span></div>
        <div class="team-setup">${teams.map((t, i) => html`<div class="team-edit" style=${`--c:${t.color}`}>
          <div class="row"><span class="team-ic">${t.icon}</span><input class="input" value=${t.name} onInput=${(e) => { const x = [...teams]; x[i] = { ...t, name: e.target.value }; setTeams(x); }} /></div>
          <label class="small muted">Élèves (une par ligne) — ${t.students.length}</label>
          <textarea class="input" rows="5" value=${t.students.join('\n')} onInput=${(e) => { const x = [...teams]; x[i] = { ...t, students: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) }; setTeams(x); }}></textarea>
        </div>`)}</div>
        <p class="muted small">Écris les prénoms des filles : l'appli appelle chaque élève à tour de rôle, pour que ce ne soient pas toujours les mêmes qui répondent.</p>
      </div>
      <div class="card">
        <h3>2. Thèmes des questions</h3>
        <div class="row wrap">${EN_ALL.map((l) => html`<button class=${'chip' + (themes.includes(l.id) ? ' on' : '')} onClick=${() => setThemes(themes.includes(l.id) ? themes.filter((x) => x !== l.id) : [...themes, l.id])}>${l.icon} ${l.title}</button>`)}</div>
      </div>
      <div class="card">
        <h3>3. Minuteur</h3>
        <label class="check"><input type="checkbox" checked=${timerOn} onChange=${(e) => setTimerOn(e.target.checked)} /> Activer le minuteur</label>
        ${timerOn && html`<select class="input inline" value=${seconds} onChange=${(e) => setSeconds(+e.target.value)}>${[15, 20, 30, 45, 60].map((n) => html`<option value=${n}>${n} s</option>`)}</select>`}
      </div>
      <button class="btn primary lg block" disabled=${!themes.length || teams.some((t) => !t.students.length)}
        onClick=${() => { const fresh = teams.map((t) => ({ ...t, score: 0, turn: 0 })); setTeams(fresh); update((st) => { st.teams = { teams: fresh, themes, timerOn, seconds, playing: true, current: 0, qIndex: 0, order: null }; }); teacherEvent('games'); setPhase('play'); }}>▶ Lancer la partie</button>
    </${GamePage}>`;
  }
  return html`<${TeamPlay} onSetup=${() => { update((st) => { st.teams = { ...st.teams, playing: false }; }); setPhase('setup'); }} />`;
}

function TeamPlay({ onSetup }) {
  const s = useStore();
  const g = s.teams;
  const questions = useMemo(() => teamQuestions(g.themes), [g.themes.join()]);
  const [reveal, setReveal] = useState(false);
  const [left, setLeft] = useState(g.seconds);
  const [running, setRunning] = useState(false);
  const [end, setEnd] = useState(false);
  const timer = useRef(null);
  const team = g.teams[g.current];
  const student = team.students[team.turn % team.students.length];
  const q = questions[g.qIndex % questions.length];

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setLeft((l) => {
      if (l <= 1) { clearInterval(timer.current); setRunning(false); beep(); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(timer.current);
  }, [running]);

  const set = (fn) => update((st) => { fn(st.teams); });
  const award = (pts, idx = g.current) => set((t) => { t.teams[idx].score = Math.max(0, t.teams[idx].score + pts); });
  const next = () => {
    set((t) => {
      t.teams[t.current].turn += 1;
      t.current = (t.current + 1) % t.teams.length;
      t.qIndex += 1;
    });
    setReveal(false); setLeft(g.seconds); setRunning(g.timerOn);
  };

  if (end) {
    const ranked = [...g.teams].sort((a, b) => b.score - a.score);
    const top = ranked[0].score;
    const winners = ranked.filter((t) => t.score === top);
    return html`<div class="page center-page"><${Confetti} />
      <div class="giant">${winners.map((w) => w.icon).join(' ')}</div>
      <h1>${winners.length > 1 ? 'Égalité ! It\'s a tie!' : `${winners[0].name} win!`}</h1>
      <div class="podium">${ranked.map((t, i) => html`<div class="pod" style=${`--c:${t.color};--h:${30 + (t.score / Math.max(1, top)) * 70}%`}><b>${t.score}</b><div class="pod-bar"></div><span>${['🥇', '🥈', '🥉', '🎖️'][i]} ${t.icon} ${t.name}</span></div>`)}</div>
      <p class="muted">Great job, everyone! 🇮🇩 Kerja bagus, semuanya!</p>
      <button class="btn primary" onClick=${() => { set((t) => { t.teams.forEach((x) => { x.score = 0; }); t.qIndex = 0; t.current = 0; }); setEnd(false); }}>🔁 Nouvelle partie</button>
      <button class="btn ghost" onClick=${onSetup}>Modifier les équipes</button>
    </div>`;
  }

  return html`<div class="page team-play">
    <div class="row between"><${Back} to="/games" label="Jeux" /><span class="row"><${FullscreenBtn} /><button class="btn ghost sm" onClick=${onSetup}>⚙️ Équipes</button></span></div>
    <div class="scoreboard">${g.teams.map((t, i) => html`<div class=${'score' + (i === g.current ? ' active' : '')} style=${`--c:${t.color}`} onClick=${() => set((x) => { x.current = i; })}>
      <span class="team-ic">${t.icon}</span><b class="pts">${t.score}</b><span class="tname">${t.name}</span>
      <span class="row mini"><button onClick=${(e) => { e.stopPropagation(); award(-1, i); }}>−</button><button onClick=${(e) => { e.stopPropagation(); award(1, i); }}>＋</button></span>
    </div>`)}</div>
    <div class="turn" style=${`--c:${team.color}`}>${team.icon} <b>${team.name}</b> · c'est au tour de <b class="student">${student}</b></div>
    <div class="big-card question">
      ${q.emoji && html`<div class="giant">${q.emoji}</div>`}
      <div class="huge">${q.q}</div>
      <div class="muted">🇮🇩 ${q.qid}</div>
      ${reveal ? html`<div class="answer">${q.a}</div><div class="trans">${q.extra}</div>` : null}
    </div>
    ${g.timerOn && html`<div class=${'timer' + (left <= 5 ? ' hot' : '')}><div class="timer-bar" style=${`width:${(left / g.seconds) * 100}%`}></div><span>${left} s</span>
      <button class="btn ghost sm" onClick=${() => setRunning(!running)}>${running ? '⏸' : '▶'}</button></div>`}
    <div class="row center wrap">
      ${!reveal ? html`<button class="btn coral xl" onClick=${() => { setReveal(true); setRunning(false); }}>Show Answer</button>`
        : html`<${AudioBtn} text=${q.a} lang="en" big />
          <button class="btn good xl" onClick=${() => { award(1); next(); }}>✓ +1 point</button>
          <button class="btn ghost xl" onClick=${next}>✗ Pas de point</button>`}
    </div>
    <div class="row center wrap">
      <button class="btn ghost sm" onClick=${() => set((t) => { t.qIndex += 1; })}>⏭ Autre question</button>
      <button class="btn ghost sm" onClick=${() => set((t) => { t.teams[t.current].turn += 1; })}>👤 Autre élève</button>
      <button class="btn primary sm" onClick=${() => setEnd(true)}>🏁 Terminer et voir le podium</button>
    </div>
  </div>`;
}

function beep() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(); const gn = ac.createGain();
    o.connect(gn); gn.connect(ac.destination); o.frequency.value = 660; gn.gain.value = 0.15;
    o.start(); o.stop(ac.currentTime + 0.4);
  } catch { /* pas de son disponible */ }
}

export const GAME_SCREENS = {
  quiz: QuizGame, match: MatchGame, fill: FillGame, build: BuildGame, emotions: EmotionsGame,
  simon: SimonGame, memory: MemoryGame, conversation: ConversationGame, team: TeamGame,
};
