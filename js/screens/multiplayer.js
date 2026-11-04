// Jeux à plusieurs : Quiz Duel, Hangman (pendu), What am I doing? (mime).
import { html, useState, useMemo, useEffect } from '../vendor/preact-htm.js';
import { teacherEvent, getState, PHOTO_DECK } from '../store.js';
import { ID_LESSONS } from '../data/indonesian.js';
import { EN_ALL, EN_BY_ID } from '../data/english.js';
import { VERBS } from '../data/grammar.js';
import { shuffle, sample, AudioBtn, Confetti } from '../ui.js';
import { distractors, pictured } from '../gen.js';
import { GamePage, TEAM_PRESET } from './games.js';
import { KIDS, T, B } from '../i18n.js';

// ---------- Sources de questions ----------
function duelSources() {
  return [
    { id: 'verbs-past', label: T('⏪ Verbes : prétérit (go → went)', '⏪ Past tense (go → went)'), group: 'Verbes' },
    { id: 'verbs-ing', label: T('⏳ Verbes : forme -ing (swim → swimming)', '⏳ -ing (swim → swimming)'), group: 'Verbes' },
    { id: 'verbs-he', label: T('🔁 Verbes : he / she (go → goes)', '🔁 he / she (go → goes)'), group: 'Verbes' },
    { id: 'verbs-id', label: T('📗 Verbes : indonésien → anglais', '📗 Kata kerja (Verbs): Indonesia → English'), group: 'Verbes' },
    { id: 'grammar', label: T('✏️ Grammaire : am / is / are, do / does…', '✏️ Tata bahasa (Grammar): am / is / are…'), group: 'Verbes' },
    ...(photoPool().length >= 4 ? [{ id: 'photos', label: '📸 Mes photos', group: 'Anglais' }] : []),
    ...EN_ALL.filter((l) => pictured(l.vocab).length >= 4 && l.id !== 'en-verbs').map((l) => ({ id: l.id, label: `${l.icon} ${l.title}`, group: 'Anglais' })),
    ...(KIDS ? [] : ID_LESSONS.map((l) => ({ id: l.id, label: `${l.icon} ${l.title}`, group: 'Indonésien' }))),
  ];
}

const photoPool = () => getState().custom.cards.filter((c) => c.deckId === PHOTO_DECK && c.image);

// Formes fautives plausibles, pour des distracteurs instructifs.
const naivePast = (b) => b + (b.endsWith('e') ? 'd' : 'ed');
const naiveIng = (b) => b + 'ing';

export function duelQuestions(src, n) {
  const pick4 = (a, wrong, pool) => {
    const opts = [...new Set([a, ...wrong.filter((x) => x && x !== a)])].slice(0, 3);
    return shuffle([...opts, ...distractors(pool, a, 4 - opts.length).filter((x) => !opts.includes(x))]).slice(0, 4);
  };
  const verbs = VERBS.filter((v) => v.base !== 'be');
  let qs = [];
  if (src === 'verbs-past') qs = verbs.map((v) => ({ emoji: v.emoji, prompt: `${v.base} → past ?`, a: v.past, options: pick4(v.past, [naivePast(v.base), v.ing], verbs.map((x) => x.past)) }));
  else if (src === 'verbs-ing') qs = verbs.map((v) => ({ emoji: v.emoji, prompt: `${v.base} → -ing ?`, a: v.ing, options: pick4(v.ing, [naiveIng(v.base), v.he, v.past], verbs.map((x) => x.ing)) }));
  else if (src === 'verbs-he') qs = verbs.map((v) => ({ emoji: v.emoji, prompt: `She ___ (${v.base})`, a: v.he, options: pick4(v.he, [v.base, v.base + 's', v.ing], verbs.map((x) => x.he)) }));
  else if (src === 'verbs-id') qs = VERBS.map((v) => ({ emoji: v.emoji, prompt: v.id, a: v.base, options: pick4(v.base, [], VERBS.map((x) => x.base)) }));
  else if (src === 'photos') {
    const p = photoPool();
    qs = p.map((c) => ({ img: c.image, prompt: 'What is it?', a: c.front, options: pick4(c.front, [], p.map((x) => x.front)) }));
  } else if (src === 'grammar') qs = EN_ALL.flatMap((l) => (l.exercises || []).filter((e) => e.type === 'fill')).map((e) => ({ prompt: e.s, a: e.a, options: shuffle(e.opts) }));
  else if (EN_BY_ID[src]) {
    const v = pictured(EN_BY_ID[src].vocab);
    qs = v.map((w) => ({ emoji: w.emoji, prompt: 'What is it?', a: w.en, options: pick4(w.en, [], v.map((x) => x.en)) }));
  } else {
    const l = ID_LESSONS.find((x) => x.id === src);
    qs = l.words.map((w) => ({ prompt: w.id, a: w.fr, options: pick4(w.fr, [], l.words.map((x) => x.fr)) }));
  }
  return sample(qs, Math.min(n, qs.length));
}

function SourceList({ value, onChange }) {
  const src = duelSources();
  const GROUP = { Verbes: T('Verbes', B('Kata kerja', 'Verbs')), Anglais: T('Anglais', B('Kosakata', 'Vocabulary')), Indonésien: 'Indonésien' };
  return html`${['Verbes', 'Anglais', 'Indonésien'].filter((g) => src.some((s) => s.group === g)).map((g) => html`<h3>${GROUP[g]}</h3><div class="row wrap">${src.filter((s) => s.group === g).map((s) =>
    html`<button class=${'chip' + (value === s.id ? ' on' : '')} onClick=${() => onChange(s.id)}>${s.label}</button>`)}</div>`)}`;
}

// ---------- QUIZ DUEL ----------
export function DuelGame() {
  const [names, setNames] = useState([T('Joueuse 1', 'Pemain 1'), T('Joueuse 2', 'Pemain 2')]);
  const [src, setSrc] = useState('verbs-past');
  const [rounds, setRounds] = useState(10);
  const [game, setGame] = useState(null);
  const start = () => { setGame({ qs: duelQuestions(src, rounds), key: Date.now() }); teacherEvent('games'); };
  if (game) return html`<${DuelPlay} key=${game.key} qs=${game.qs} names=${names} onAgain=${start} onExit=${() => setGame(null)} />`;
  return html`<${GamePage} title="Quiz Duel" icon="⚔️">
    <p class="muted">${T('Posez le téléphone à plat entre vous deux : chacune a sa moitié d\'écran. La première qui touche la bonne réponse gagne le point. Une erreur bloque ta moitié pour cette question.', 'Taruh HP di tengah. Setiap pemain punya setengah layar. Yang pertama menjawab benar dapat poin! (Put the phone between you. First right answer wins the point!)')}</p>
    <div class="card">
      <h3>${T('Joueuses', B('Pemain', 'Players'))}</h3>
      <div class="row">${names.map((n, i) => html`<input id=${'duel-name-' + i} class="input" value=${n} onInput=${(e) => { const x = [...names]; x[i] = e.target.value; setNames(x); }} />`)}</div>
      <p class="muted small">${T('Ça marche aussi équipe contre équipe : écris le nom des équipes.', B('Bisa juga tim lawan tim', 'Also team vs team'))}</p>
    </div>
    <div class="card"><h3>${T('Thème', B('Tema', 'Topic'))}</h3><${SourceList} value=${src} onChange=${setSrc} /></div>
    <div class="card row wrap"><b>${T('Questions', B('Soal', 'Questions'))} :</b>${[5, 10, 15, 20].map((n) => html`<button class=${'chip' + (rounds === n ? ' on' : '')} onClick=${() => setRounds(n)}>${n}</button>`)}</div>
    <button class="btn primary lg block" onClick=${start}>⚔️ ${T('Commencer le duel', B('Mulai duel', 'Start duel'))}</button>
  </${GamePage}>`;
}

function DuelPlay({ qs, names, onAgain, onExit }) {
  const [i, setI] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [locked, setLocked] = useState([false, false]);
  const [winner, setWinner] = useState(null);
  const q = qs[i];
  const over = i >= qs.length;
  const next = () => { setI((x) => x + 1); setLocked([false, false]); setWinner(null); };
  const tap = (p, opt) => {
    if (winner !== null || locked[p]) return;
    if (opt === q.a) {
      setWinner(p);
      setScores((s) => s.map((v, k) => (k === p ? v + 1 : v)));
      setTimeout(next, 1300);
    } else {
      const l = locked.map((v, k) => (k === p ? true : v));
      setLocked(l);
      if (l[0] && l[1]) { setWinner(-1); setTimeout(next, 1800); }
    }
  };
  if (over) {
    const w = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
    return html`<div class="duel-end page center-page"><${Confetti} />
      <div class="giant">${w === null ? '🤝' : '🏆'}</div>
      <h1>${w === null ? T('Égalité !', B('Seri', 'Draw') + '!') : `${names[w]} ${T('gagne !', B('menang', 'wins') + '!')}`}</h1>
      <p class="huge-ish">${names[0]} ${scores[0]} – ${scores[1]} ${names[1]}</p>
      <button class="btn primary lg" onClick=${onAgain}>🔁 ${T('Revanche', B('Main lagi', 'Rematch'))}</button>
      <button class="btn ghost" onClick=${onExit}>${T('Changer de thème', B('Ganti tema', 'Change topic'))}</button>
    </div>`;
  }
  const half = (p) => html`<div class=${'duel-half p' + p + (locked[p] ? ' locked' : '') + (winner === p ? ' won' : '')}>
    <div class="duel-head"><b>${names[p]}</b><span class="duel-score">${scores[p]}</span></div>
    <div class="duel-q">${q.img && html`<img class="duel-img" src=${q.img} alt="" />`}${q.emoji && html`<span class="duel-emoji">${q.emoji}</span>`}<span>${q.prompt}</span></div>
    <div class="duel-opts">${q.options.map((o) => {
      let c = 'duel-opt';
      if (winner !== null && o === q.a) c += ' right';
      return html`<button class=${c} disabled=${locked[p] || winner !== null} onClick=${() => tap(p, o)}>${o}</button>`;
    })}</div>
    <div class="duel-status">${winner === p ? T('✨ Point !', B('✨ Poin', 'Point') + '!') : locked[p] ? T('✗ Raté, attends la suivante', B('✗ Salah, tunggu soal berikutnya', 'Wrong, wait for the next one')) : winner === -1 ? `${T('Réponse', B('Jawaban', 'Answer'))} : ${q.a}` : ''}</div>
  </div>`;
  return html`<div class="duel">
    ${half(0)}
    <div class="duel-mid"><button class="btn ghost sm" onClick=${onExit}>✕</button><span>${T('Question', 'Soal')} ${i + 1} / ${qs.length}</span><button class="btn ghost sm" onClick=${next}>${T('Passer', 'Lewati (Skip)')} ⏭</button></div>
    ${half(1)}
  </div>`;
}

// ---------- HANGMAN ----------
const LIVES = 7;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function hangmanWords(src) {
  let list;
  if (src.startsWith('verbs')) list = VERBS.map((v) => ({ word: v.base, hint: KIDS ? `${v.emoji} ${v.id}` : `${v.emoji} ${v.id} · ${v.fr}`, lang: 'en' }));
  else if (EN_BY_ID[src]) list = EN_BY_ID[src].vocab.map((w) => ({ word: w.en.replace(/\s*\(.*\)/, ''), hint: KIDS ? `${w.abstract ? '' : w.emoji} ${w.id}` : `${w.abstract ? '' : w.emoji} ${w.id} · ${w.fr}`, lang: 'en' }));
  else list = ID_LESSONS.find((l) => l.id === src).words.map((w) => ({ word: w.id.replace(/[?!.…]/g, '').trim(), hint: w.fr, lang: 'id' }));
  return shuffle(list.filter((w) => /^[a-z ]{3,14}$/i.test(w.word) && w.word.split(' ').length <= 2));
}

export function HangmanGame() {
  const [nTeams, setNTeams] = useState(2);
  const [names, setNames] = useState(TEAM_PRESET.map((t) => t.name));
  const [src, setSrc] = useState('en-feelings');
  const [game, setGame] = useState(null);
  const sources = duelSources().filter((s) => !['verbs-ing', 'verbs-he', 'verbs-id', 'grammar'].includes(s.id));
  if (game) return html`<${HangmanPlay} key=${game.key} words=${game.words} teams=${TEAM_PRESET.slice(0, nTeams).map((t, i) => ({ ...t, name: names[i] || t.name }))} onExit=${() => setGame(null)} />`;
  return html`<${GamePage} title=${T("Hangman (le pendu)", "Hangman")} icon="🎈">
    <p class="muted">${T('Chaque équipe propose une lettre à son tour. Bonne lettre = 1 point par lettre trouvée. Mauvaise lettre = un ballon éclate. L\'équipe qui complète le mot gagne 3 points de bonus.', 'Setiap tim bergiliran memilih huruf. Huruf benar = 1 poin. Huruf salah = 1 balon meletus 💥. Tim yang menyelesaikan kata dapat bonus 3 poin. (Each team picks a letter. Wrong letter = a balloon pops!)')}</p>
    <div class="card"><h3>${T('Équipes', B('Tim', 'Teams'))}</h3>
      <div class="row wrap">${[2, 3, 4].map((n) => html`<button class=${'chip' + (nTeams === n ? ' on' : '')} onClick=${() => setNTeams(n)}>${n}</button>`)}</div>
      <div class="row wrap" style="margin-top:.6rem">${TEAM_PRESET.slice(0, nTeams).map((t, i) => html`<label class="grow">${t.icon}<input id=${'hm-team-' + i} class="input" value=${names[i]} onInput=${(e) => { const x = [...names]; x[i] = e.target.value; setNames(x); }} /></label>`)}</div>
    </div>
    <div class="card"><h3>${T('Mots', B('Kata', 'Words'))}</h3><div class="row wrap">${sources.map((s) => html`<button class=${'chip' + (src === s.id ? ' on' : '')} onClick=${() => setSrc(s.id)}>${s.id === 'verbs-past' ? T('📗 Les 50 verbes', '📗 50 verbs') : s.label}</button>`)}</div></div>
    <button class="btn primary lg block" onClick=${() => { setGame({ words: hangmanWords(src), key: Date.now() }); teacherEvent('games'); }}>🎈 ${T('Commencer', B('Mulai', 'Start'))}</button>
  </${GamePage}>`;
}

function HangmanPlay({ words, teams, onExit }) {
  const [idx, setIdx] = useState(0);
  const [guessed, setGuessed] = useState([]);
  const [lives, setLives] = useState(LIVES);
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState(teams.map(() => 0));
  const [status, setStatus] = useState('play');
  const [hint, setHint] = useState(false);
  const [claim, setClaim] = useState(false);
  const [end, setEnd] = useState(false);
  const w = words[idx % words.length];
  const letters = w.word.toLowerCase().split('');
  const add = (t, n) => setScores((s) => s.map((v, k) => (k === t ? v + n : v)));

  const guess = (ch) => {
    if (status !== 'play' || guessed.includes(ch)) return;
    const g = [...guessed, ch];
    setGuessed(g);
    const count = letters.filter((l) => l === ch).length;
    if (count) {
      add(turn, count);
      if (letters.every((l) => l === ' ' || g.includes(l))) { add(turn, 3); setStatus('won'); return; }
    } else {
      const left = lives - 1;
      setLives(left);
      if (!left) { setStatus('lost'); return; }
    }
    setTurn((turn + 1) % teams.length);
  };
  useEffect(() => {
    const k = (e) => { if (/^[a-z]$/i.test(e.key)) guess(e.key.toLowerCase()); };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
  const nextWord = () => { setIdx(idx + 1); setGuessed([]); setLives(LIVES); setStatus('play'); setHint(false); setClaim(false); setTurn((turn + 1) % teams.length); };

  if (end) {
    const ranked = teams.map((t, i) => ({ ...t, score: scores[i] })).sort((a, b) => b.score - a.score);
    return html`<div class="page center-page"><${Confetti} />
      <div class="giant">${ranked[0].icon}</div>
      <h1>${ranked[0].score === ranked[1].score ? T('Égalité !', B('Seri', 'Draw') + '!') : `${ranked[0].name} ${T('gagne !', B('menang', 'wins') + '!')}`}</h1>
      <div class="rank">${ranked.map((t, i) => html`<div class="rank-row" style=${`--c:${t.color}`}><span>${['🥇', '🥈', '🥉', '🎖️'][i]} ${t.icon} ${t.name}</span><b>${t.score}</b></div>`)}</div>
      <button class="btn primary" onClick=${onExit}>${T('Nouvelle partie', B('Main lagi', 'Play again'))}</button>
    </div>`;
  }

  const team = teams[turn];
  return html`<div class="page hangman">
    <div class="row between"><button class="btn ghost sm" onClick=${onExit}>← ${T('Réglages', B('Pengaturan', 'Settings'))}</button><button class="btn primary sm" onClick=${() => setEnd(true)}>🏁 ${T('Terminer', B('Selesai', 'Finish'))}</button></div>
    <div class="scoreboard">${teams.map((t, i) => html`<div class=${'score' + (i === turn && status === 'play' ? ' active' : '')} style=${`--c:${t.color}`}>
      <span class="team-ic">${t.icon}</span><b class="pts">${scores[i]}</b><span class="tname">${t.name}</span></div>`)}</div>
    ${status === 'play' && html`<div class="turn" style=${`--c:${team.color}`}>${team.icon} ${T('À', B('Giliran', 'Turn'))} <b>${team.name}</b>${T(' de proposer une lettre', ': ' + B('pilih huruf', 'pick a letter'))}</div>`}
    <div class="balloons" aria-label=${`${lives} balloons`}>${Array.from({ length: LIVES }, (_, i) => html`<span class=${i < lives ? '' : 'popped'}>${i < lives ? '🎈' : '💥'}</span>`)}</div>
    <div class="hm-word">${letters.map((l) => (l === ' ' ? html`<span class="hm-space"></span>` : html`<span class=${'hm-letter' + (status === 'lost' && !guessed.includes(l) ? ' missed' : '')}>${guessed.includes(l) || status !== 'play' ? l.toUpperCase() : ''}</span>`))}</div>
    ${status === 'play' ? html`
      <div class="row center wrap">
        <button class="btn ghost sm" onClick=${() => setHint(!hint)}>💡 ${hint ? T('Cacher', B('Sembunyikan', 'Hide')) : T('Indice', B('Petunjuk', 'Hint'))}</button>
        <button class="btn ghost sm" onClick=${() => setClaim(!claim)}>🗣️ ${T('Une équipe a deviné le mot', B('Satu tim menebak katanya', 'A team guessed the word'))}</button>
      </div>
      ${hint && html`<div class="trans center">${w.hint}</div>`}
      ${claim && html`<div class="row center wrap">${teams.map((t, i) => html`<button class="btn sm" style=${`background:${t.color};color:#fff`} onClick=${() => { add(i, 5); setStatus('won'); }}>${t.icon} ${t.name} +5</button>`)}</div>`}
      <div class="keyboard">${ALPHABET.map((ch) => html`<button class=${'key' + (guessed.includes(ch) ? (letters.includes(ch) ? ' hit' : ' miss') : '')} disabled=${guessed.includes(ch)} onClick=${() => guess(ch)}>${ch.toUpperCase()}</button>`)}</div>`
    : html`<div class=${'feedback ' + (status === 'won' ? 'ok' : 'ko')}>
        <div class="fb-title">${status === 'won' ? T('🎉 Mot trouvé !', '🎉 ' + B('Kata ditemukan', 'Word found') + '!') : T('💥 Plus de ballons !', '💥 ' + B('Balon habis', 'No more balloons') + '!')}</div>
        <div class="row"><b class="huge-ish">${w.word}</b><${AudioBtn} text=${w.word} lang=${w.lang} /></div>
        <div class="muted">${w.hint}</div>
        <button class="btn primary block" onClick=${nextWord}>${T('Mot suivant →', B('Kata berikutnya', 'Next word') + ' →')}</button>
      </div>`}
  </div>`;
}

// ---------- WHAT AM I DOING? (mime) ----------
const deFr = (v) => (/^[aeiouéèêh]/i.test(v) ? 'd\'' + v : 'de ' + v);
function charadeCards() {
  const fromVerbs = VERBS.filter((v) => v.mime).map((v) => ({
    emoji: v.emoji, en: `She is ${v.ing}!`, ing: v.ing,
    id: `Dia sedang ${v.id.replace(/\s*\(.*\)/, '').split(',')[0].trim()}`,
    fr: `Elle est en train ${deFr(v.fr.replace(/\s*\(.*\)/, '').split(',')[0].trim())}`,
  }));
  const fromLesson = EN_BY_ID['en-continuous'].vocab.map((w) => ({ emoji: w.emoji, en: `She is ${w.en}!`, ing: w.en, id: `Dia ${w.id}`, fr: `Elle est ${w.fr}` }));
  const seen = new Set();
  return shuffle([...fromLesson, ...fromVerbs].filter((c) => (seen.has(c.ing) ? false : seen.add(c.ing))));
}

export function CharadesGame() {
  const cards = useMemo(charadeCards, []);
  const [i, setI] = useState(0);
  const [peek, setPeek] = useState(false);
  const [shown, setShown] = useState(false);
  const [pts, setPts] = useState([0, 0]);
  const [teams] = useState(TEAM_PRESET.slice(0, 2));
  useEffect(() => { teacherEvent('games'); }, []);
  const c = cards[i % cards.length];
  const next = () => { setI(i + 1); setPeek(false); setShown(false); };
  return html`<${GamePage} title="What am I doing?" icon="🎭" wide>
    <p class="muted center">1. L'élève qui mime regarde la carte 👀 · 2. Elle mime · 3. Les autres disent « She is …ing! » · 4. Show Answer</p>
    <div class="stage">
      <div class=${'big-card' + (peek || shown ? '' : ' covered')} onClick=${() => setPeek(!peek)}>
        ${peek || shown ? html`<div class="giant">${c.emoji}</div><div class="huge">${c.ing}</div>` : html`<div class="giant">🎭</div><div class="huge">?</div><div class="muted">Touche pour voir (élève qui mime)</div>`}
        ${shown && html`<div class="answer">${c.en}</div><div class="trans">🇮🇩 ${c.id} · 🇫🇷 ${c.fr}</div>`}
      </div>
      <div class="row center wrap">
        ${!shown ? html`<button class="btn coral xl" onClick=${() => { setShown(true); setPeek(false); }}>Show Answer</button>` : html`<${AudioBtn} text=${c.en} lang="en" big />`}
        <button class="btn primary xl" onClick=${next}>Next →</button>
      </div>
      <div class="row center wrap">${teams.map((t, k) => html`<button class="btn ghost" onClick=${() => setPts(pts.map((v, j) => (j === k ? v + 1 : v)))}>${t.icon} ${t.name} : <b>${pts[k]}</b> ＋</button>`)}</div>
      <p class="muted small center">Les points sont facultatifs : un point à l'équipe qui devine la phrase complète.</p>
    </div>
  </${GamePage}>`;
}

export const MULTI_SCREENS = { duel: DuelGame, hangman: HangmanGame, charades: CharadesGame };
