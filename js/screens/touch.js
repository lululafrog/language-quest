// « Touch it! » : on lit / entend un mot, on touche la bonne partie du schéma.
// Modes : explorer, défi solo, duel face à face, équipes. Aussi utilisé en mode classe.
import { html, useState, useMemo, useEffect, useRef } from '../vendor/preact-htm.js';
import { SCENES, SCENE_BY_ID, sceneWords, sceneSVG, sayTouch } from '../data/scenes.js';
import { recordAnswer, teacherEvent } from '../store.js';
import { speak } from '../speech.js';
import { shuffle, AudioBtn, Confetti, go } from '../ui.js';
import { GamePage, TEAM_PRESET } from './games.js';
import { T, isStudentUi, progress, KIDS } from '../i18n.js';

const FLAG = { en: '🇬🇧', id: '🇮🇩' };

export function Scene({ sc, marks = {}, labels = [], lang = 'en', onTap, cls = '' }) {
  const words = useMemo(() => sceneWords(sc), [sc]);
  const svg = useMemo(() => sceneSVG(sc, { marks, labels, labelOf: (w) => words[w][lang] }), [sc, marks, labels, lang]);
  const tap = (e) => {
    const g = e.target.closest && e.target.closest('[data-w]');
    if (g && onTap) onTap(g.getAttribute('data-w'));
  };
  return html`<div class=${'scene ' + cls} onClick=${tap} dangerouslySetInnerHTML=${{ __html: svg }}></div>`;
}

const sayIt = (sc, w, lang) => speak(sayTouch(sc, w, lang), lang);
const ID_TITLES = { body: 'Tubuh', face: 'Wajah', classroom: 'Kelas', family: 'Keluarga', animals: 'Binatang', food: 'Makanan', colors: 'Warna & bentuk' };
const sceneWordsLabel = (s) => ID_TITLES[s.id] || s.title;

// Logique d'une manche : cible, marques, erreurs.
function useRound(sc, target, lang, { onRight, onWrong, autoSay = true, rk = 0 } = {}) {
  const [marks, setMarks] = useState({});
  const [labels, setLabels] = useState([]);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const t0 = useRef(Date.now());
  useEffect(() => {
    setMarks({}); setLabels([]); setErrors(0); setDone(false); t0.current = Date.now();
    if (target && autoSay) sayIt(sc, target, lang);
  }, [sc, target, rk]);
  const tap = (w) => {
    if (done || !target) return;
    if (w === target) {
      setDone(true);
      setMarks({ [w]: 'ok' }); setLabels([w]);
      onRight && onRight({ errors, ms: Date.now() - t0.current });
    } else {
      const e = errors + 1;
      setErrors(e);
      setMarks({ [w]: 'ko', ...(e >= 2 ? { [target]: 'hint' } : {}) });
      setLabels([w]);
      onWrong && onWrong(w, e);
    }
  };
  return { marks, labels, errors, done, tap };
}

// ---------- ÉCRAN PRINCIPAL ----------
export function TouchGame({ arg, arg2 }) {
  const [scId, setScId] = useState(SCENE_BY_ID[arg] ? arg : 'body');
  const [lang, setLang] = useState(arg2 === 'id' ? 'id' : 'en');
  const [mode, setMode] = useState(null);
  const [names, setNames] = useState([T('Joueuse 1', 'Pemain 1 (Player 1)'), T('Joueuse 2', 'Pemain 2 (Player 2)')]);
  const [nTeams, setNTeams] = useState(2);
  const [key, setKey] = useState(0);
  const sc = SCENE_BY_ID[scId];
  const play = (m) => { setMode(m); setKey(Date.now()); if (m !== 'explore') teacherEvent('games'); };
  const exit = () => setMode(null);

  if (mode === 'explore') return html`<${Explore} sc=${sc} lang=${lang} onExit=${exit} onPlay=${() => play('solo')} />`;
  if (mode === 'solo') return html`<${Solo} key=${key} sc=${sc} lang=${lang} onExit=${exit} onAgain=${() => play('solo')} />`;
  if (mode === 'duel') return html`<${Duel} key=${key} sc=${sc} lang=${lang} names=${names} onExit=${exit} onAgain=${() => play('duel')} />`;
  if (mode === 'teams') return html`<${Teams} key=${key} sc=${sc} lang=${lang} teams=${TEAM_PRESET.slice(0, nTeams)} onExit=${exit} />`;

  return html`<${GamePage} title="Touch it!" icon="👆">
    <p class="muted">${T('Un mot s\'affiche et se fait entendre : touche la bonne partie du dessin. Pour apprendre le corps, la classe, la famille… en jouant.', 'Dengar dan baca kata bahasa Inggris, lalu sentuh bagian gambar yang benar! (Listen, read, then touch the right part of the picture!)')}</p>
    <h2>${T('1. Le dessin', '1. Pilih gambar (Choose a picture)')}</h2>
    <div class="scene-pick">${SCENES.map((s) => html`<button class=${'scene-tile' + (s.id === scId ? ' on' : '')} onClick=${() => setScId(s.id)}>
      <span class="scene-thumb" dangerouslySetInnerHTML=${{ __html: sceneSVG(s) }}></span><b>${s.icon} ${s.title}</b><span class="small muted">${T(s.fr, sceneWordsLabel(s))} · ${s.zones.length} ${T('mots', 'kata (words)')}</span></button>`)}</div>
    ${!isStudentUi() && html`<h2>2. La langue</h2>
    <div class="row wrap">
      <button class=${'chip' + (lang === 'en' ? ' on' : '')} onClick=${() => setLang('en')}>🇬🇧 Anglais (pour la classe)</button>
      <button class=${'chip' + (lang === 'id' ? ' on' : '')} onClick=${() => setLang('id')}>🇮🇩 Indonésien (pour moi)</button>
    </div>`}
    <h2>${T('3. Le jeu', '2. Pilih permainan (Choose a game)')}</h2>
    <div class="mode-list">
      <button class="todo" onClick=${() => play('explore')}><span class="todo-ic">👀</span><span class="grow"><b>${T('Découvrir', 'Belajar (Learn)')}</b><span class="muted small block">${T('Touche une partie : tu vois et tu entends le mot. Pour apprendre avant de jouer.', 'Sentuh gambar: lihat dan dengar katanya. (Touch to see and hear the word.)')}</span></span><span class="go">▶</span></button>
      <button class="todo" onClick=${() => play('solo')}><span class="todo-ic">🎯</span><span class="grow"><b>${T('Défi solo', 'Tantangan solo (Solo challenge)')}</b><span class="muted small block">${T('Tous les mots, le plus vite possible. Combos, points et étoiles.', 'Semua kata, secepat mungkin! (All the words, as fast as you can!)')}</span></span><span class="go">▶</span></button>
      <div class="todo col-start">
        <div class="row"><span class="todo-ic">⚔️</span><span class="grow"><b>${T('Duel face à face', 'Duel berhadapan (Face-to-face duel)')}</b><span class="muted small block">${T('Téléphone posé à plat entre deux copines : la première qui touche gagne le point.', 'Satu HP di tengah, dua pemain berhadapan. Yang paling cepat dapat poin! (Fastest gets the point!)')}</span></span></div>
        <div class="row">${names.map((n, i) => html`<input id=${'touch-name-' + i} class="input" value=${n} onInput=${(e) => { const x = [...names]; x[i] = e.target.value; setNames(x); }} />`)}</div>
        <button class="btn primary block" onClick=${() => play('duel')}>⚔️ ${T('Lancer le duel', 'Mulai duel (Start duel)')}</button>
      </div>
      <div class="todo col-start">
        <div class="row"><span class="todo-ic">🏆</span><span class="grow"><b>${T('Équipes', 'Tim (Teams)')}</b><span class="muted small block">${T('Chaque équipe envoie une élève toucher le mot sur l\'écran (10 s). Idéal projeté au tableau.', 'Setiap tim bergiliran menyentuh kata, 10 detik. (Teams take turns, 10 seconds.)')}</span></span></div>
        <div class="row wrap">${[2, 3, 4].map((n) => html`<button class=${'chip' + (nTeams === n ? ' on' : '')} onClick=${() => setNTeams(n)}>${n} ${T('équipes', 'tim (teams)')}</button>`)}</div>
        <button class="btn primary block" onClick=${() => play('teams')}>🏆 ${T('Lancer en équipes', 'Mulai main tim (Start team game)')}</button>
      </div>
    </div>
    ${!isStudentUi() && html`<p class="muted small">Astuce timides : en « Découvrir », faites d'abord toucher la partie sur son propre corps (« Touch your nose! »), puis sur l'écran.</p>`}
  </${GamePage}>`;
}

function Head({ sc, onExit, right }) {
  return html`<div class="row between"><button class="btn ghost sm" onClick=${onExit}>← ${sc.icon} ${sc.title}</button>${right}</div>`;
}

// ---------- DÉCOUVRIR ----------
function Explore({ sc, lang, onExit, onPlay }) {
  const words = sceneWords(sc);
  const [seen, setSeen] = useState([]);
  const [cur, setCur] = useState(null);
  const [all, setAll] = useState(false);
  const tap = (w) => { setCur(w); if (!seen.includes(w)) setSeen([...seen, w]); speak(words[w][lang], lang); };
  const marks = cur ? { [cur]: 'ok' } : {};
  const w = cur && words[cur];
  return html`<div class="page narrow touch">
    <${Head} sc=${sc} onExit=${onExit} right=${html`<button class="btn ghost sm" onClick=${() => setAll(!all)}>${all ? T('🙈 Cacher', '🙈 Sembunyikan (Hide)') : T('🏷️ Tout afficher', '🏷️ Tampilkan semua (Show all)')}</button>`} />
    <h1>👀 ${T('Touche pour découvrir', 'Sentuh untuk belajar (Touch to learn)')}</h1>
    <${Scene} sc=${sc} marks=${marks} labels=${all ? sc.zones.map((z) => z.w) : cur ? [cur] : []} lang=${lang} onTap=${tap} />
    <div class="card explore-info">${w
      ? html`<div class="row between"><div><b class="huge-ish">${w[lang]}</b> <${AudioBtn} text=${w[lang]} lang=${lang} /></div><span class="muted">${seen.length}/${sc.zones.length}</span></div>
        <div class="muted">${lang === 'en' ? `🇮🇩 ${w.id}` : `🇬🇧 ${w.en}`}${KIDS ? '' : ` · 🇫🇷 ${w.fr}`}</div>`
      : html`<span class="muted">${T('Touche une partie du dessin 👆', 'Sentuh bagian gambar (Touch the picture) 👆')}</span>`}</div>
    <button class="btn coral lg block" onClick=${onPlay}>🎯 ${T('Je suis prête : défi !', 'Aku siap! (I\'m ready!)')}</button>
  </div>`;
}

// ---------- DÉFI SOLO ----------
function Solo({ sc, lang, onExit, onAgain, only }) {
  const words = sceneWords(sc);
  const [queue, setQueue] = useState(() => shuffle(only || sc.zones.map((z) => z.w)));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missed, setMissed] = useState([]);
  const [pop, setPop] = useState(null);
  const start = useRef(Date.now());
  const target = queue[i];
  const r = useRound(sc, target, lang, {
    onRight: ({ errors, ms }) => {
      const first = errors === 0;
      const pts = first ? 10 + combo * 2 + (ms < 3000 ? 5 : 0) : 3;
      setScore((s) => s + pts);
      setCombo(first ? combo + 1 : 0);
      setPop(`+${pts}${first && ms < 3000 ? ' ⚡' : ''}`);
      if (!first) setMissed((m) => [...m, target]);
      recordAnswer(first, first ? 3 : 0);
      setTimeout(() => { setPop(null); setI((x) => x + 1); }, 1100);
    },
    onWrong: () => setCombo(0),
    rk: i,
  });

  useEffect(() => { if (i >= queue.length && queue.length >= 5) progress('touch'); }, [i >= queue.length]);
  if (i >= queue.length) {
    const good = queue.length - missed.length;
    const stars = good / queue.length >= 0.9 ? 3 : good / queue.length >= 0.6 ? 2 : 1;
    const secs = Math.round((Date.now() - start.current) / 1000);
    return html`<div class="page narrow center-page">${stars === 3 && html`<${Confetti} />`}
      <div class="giant">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <h1>${score} points</h1>
      <p class="muted">${good}/${queue.length} ${T('du premier coup', 'benar langsung (right first time)')} · ${secs} ${T('s', 'detik (sec)')}</p>
      ${missed.length > 0 && html`<p>${T('À revoir', 'Ulangi (Review)')} : <b>${missed.map((w) => words[w][lang]).join(', ')}</b></p>
        <button class="btn coral" onClick=${() => { setQueue(shuffle(missed)); setMissed([]); setI(0); setScore(0); setCombo(0); start.current = Date.now(); }}>🔁 ${T('Rejouer mes erreurs', 'Ulangi yang salah (Replay mistakes)')}</button>`}
      <button class="btn primary lg" onClick=${onAgain}>🎯 ${T('Rejouer', 'Main lagi (Play again)')}</button>
      <button class="btn ghost" onClick=${onExit}>${T('Changer de jeu', 'Ganti permainan (Change game)')}</button>
    </div>`;
  }

  const w = words[target];
  return html`<div class="page narrow touch">
    <${Head} sc=${sc} onExit=${onExit} right=${html`<span class="pill">⭐ ${score}${combo >= 2 ? ` · 🔥×${combo}` : ''}</span>`} />
    <div class="bar"><i style=${`width:${(i / queue.length) * 100}%`}></i></div>
    <div class="touch-prompt">
      <span>${sayTouch(sc, target, lang)}</span>
      <button class="btn ghost sm" onClick=${() => sayIt(sc, target, lang)} aria-label="Réécouter">🔊</button>
      ${pop && html`<span class="pop">${pop}</span>`}
    </div>
    <${Scene} sc=${sc} marks=${r.marks} labels=${r.labels} lang=${lang} onTap=${r.tap} />
    <div class="touch-help">${r.done ? html`✨ <b>${w[lang]}</b> = ${lang === 'en' ? w.id : w.en}${KIDS ? '' : ` · ${w.fr}`}`
      : r.errors ? html`${T('Ça, c\'est', 'Itu (That\'s)')} <b>${words[r.labels[0]]?.[lang]}</b>. ${r.errors >= 2 ? T('Regarde ce qui clignote 👀', 'Lihat yang berkedip (Look at the blinking one) 👀') : T('Essaie encore !', 'Coba lagi! (Try again!)')}`
      : html`<span class="muted">${i + 1} / ${queue.length} · ${lang === 'en' ? '🇮🇩 ' + w.id : ''}</span>`}</div>
  </div>`;
}

// ---------- DUEL ----------
function DuelHalf({ p, sc, target, lang, name, score, state, onTap, marks }) {
  return html`<div class=${'duel-half touch-half p' + p + (state === 'won' ? ' won' : state === 'locked' ? ' locked' : '')}>
    <div class="duel-head"><b>${name}</b><span class="touch-word">${sayTouch(sc, target, lang)}</span><span class="duel-score">${score}</span></div>
    <${Scene} sc=${sc} marks=${marks} labels=${Object.keys(marks)} lang=${lang} onTap=${(w) => onTap(p, w)} cls="fill" />
    <div class="duel-status">${state === 'won' ? T('✨ Point !', '✨ Poin! (Point!)') : state === 'locked' ? T('✗ Raté ! Attends le prochain mot', '✗ Salah! Tunggu kata berikutnya (Wrong! Wait for the next word)') : ''}</div>
  </div>`;
}

function Duel({ sc, lang, names, onExit, onAgain }) {
  const qs = useMemo(() => shuffle(sc.zones.map((z) => z.w)).slice(0, 10), [sc]);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [st, setSt] = useState(['', '']);
  const [mk, setMk] = useState([{}, {}]);
  const target = qs[i];
  useEffect(() => { if (target) sayIt(sc, target, lang); }, [i]);
  const next = () => { setI((x) => x + 1); setSt(['', '']); setMk([{}, {}]); };
  const tap = (p, w) => {
    if (st.includes('won') || st[p] === 'locked' || !target) return;
    if (w === target) {
      setScores((s) => s.map((v, k) => (k === p ? v + 1 : v)));
      setSt(st.map((v, k) => (k === p ? 'won' : v)));
      setMk([{ [w]: 'ok' }, { [w]: 'ok' }]);
      setTimeout(next, 1400);
    } else {
      const s2 = st.map((v, k) => (k === p ? 'locked' : v));
      setSt(s2);
      setMk(mk.map((m, k) => (k === p ? { [w]: 'ko' } : m)));
      if (s2[0] === 'locked' && s2[1] === 'locked') { setMk([{ [target]: 'ok' }, { [target]: 'ok' }]); setTimeout(next, 1800); }
    }
  };
  if (i >= qs.length) {
    const win = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
    return html`<div class="page center-page"><${Confetti} />
      <div class="giant">${win === null ? '🤝' : '🏆'}</div>
      <h1>${win === null ? T('Égalité !', 'Seri! (Draw!)') : `${names[win]} ${T('gagne !', 'menang! (wins!)')}`}</h1>
      <p class="huge-ish">${names[0]} ${scores[0]} – ${scores[1]} ${names[1]}</p>
      <button class="btn primary lg" onClick=${onAgain}>🔁 ${T('Revanche', 'Main lagi (Play again)')}</button>
      <button class="btn ghost" onClick=${onExit}>${T('Changer de dessin', 'Ganti gambar (Change picture)')}</button>
    </div>`;
  }
  return html`<div class="duel">
    <${DuelHalf} p=${0} sc=${sc} target=${target} lang=${lang} name=${names[0]} score=${scores[0]} state=${st[0]} marks=${mk[0]} onTap=${tap} />
    <div class="duel-mid"><button class="btn ghost sm" onClick=${onExit}>✕</button><span>${T('Mot', 'Kata (Word)')} ${i + 1} / ${qs.length}</span><button class="btn ghost sm" onClick=${() => sayIt(sc, target, lang)}>🔊</button></div>
    <${DuelHalf} p=${1} sc=${sc} target=${target} lang=${lang} name=${names[1]} score=${scores[1]} state=${st[1]} marks=${mk[1]} onTap=${tap} />
  </div>`;
}

// ---------- ÉQUIPES ----------
const TURN_S = 10;
function Teams({ sc, lang, teams, onExit }) {
  const words = sceneWords(sc);
  const rounds = Math.max(teams.length * 3, Math.floor(sc.zones.length / teams.length) * teams.length);
  const qs = useMemo(() => { let q = []; while (q.length < rounds) q = [...q, ...shuffle(sc.zones.map((z) => z.w))]; return q.slice(0, rounds); }, [sc]);
  const [i, setI] = useState(0);
  const [scores, setScores] = useState(teams.map(() => 0));
  const [left, setLeft] = useState(TURN_S);
  const [res, setRes] = useState(null);
  const turn = i % teams.length;
  const target = qs[i];
  const r = useRound(sc, target, lang, {
    onRight: ({ ms }) => { const pts = ms < 4000 ? 2 : 1; setScores((s) => s.map((v, k) => (k === turn ? v + pts : v))); setRes({ ok: true, pts }); },
    onWrong: () => setRes({ ok: false }),
    rk: i,
  });
  useEffect(() => { setLeft(TURN_S); setRes(null); }, [i]);
  useEffect(() => {
    if (res || i >= qs.length) return;
    if (left <= 0) { setRes({ ok: false, timeout: true }); return; }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [left, res, i]);

  if (i >= qs.length) {
    const ranked = teams.map((t, k) => ({ ...t, score: scores[k] })).sort((a, b) => b.score - a.score);
    return html`<div class="page center-page"><${Confetti} />
      <div class="giant">${ranked[0].icon}</div>
      <h1>${ranked[0].score === ranked[1].score ? T('Égalité !', 'Seri! (Draw!)') : `${ranked[0].name} ${T('gagne !', 'menang! (wins!)')}`}</h1>
      <div class="rank">${ranked.map((t, k) => html`<div class="rank-row" style=${`--c:${t.color}`}><span>${['🥇', '🥈', '🥉', '🎖️'][k]} ${t.icon} ${t.name}</span><b>${t.score}</b></div>`)}</div>
      <button class="btn primary" onClick=${onExit}>${T('Nouvelle partie', 'Main lagi (Play again)')}</button>
    </div>`;
  }
  const team = teams[turn];
  const marks = res && !res.ok ? { ...r.marks, [target]: 'ok' } : r.marks;
  const labels = res && !res.ok ? [...new Set([...r.labels, target])] : r.labels;
  return html`<div class="page touch">
    <${Head} sc=${sc} onExit=${onExit} right=${html`<span class="muted">${i + 1}/${qs.length}</span>`} />
    <div class="scoreboard">${teams.map((t, k) => html`<div class=${'score' + (k === turn ? ' active' : '')} style=${`--c:${t.color}`}>
      <span class="team-ic">${t.icon}</span><b class="pts">${scores[k]}</b><span class="tname">${t.name}</span></div>`)}</div>
    <div class="touch-prompt" style=${`--c:${team.color}`}><span>${team.icon} ${sayTouch(sc, target, lang)}</span>
      <button class="btn ghost sm" onClick=${() => sayIt(sc, target, lang)}>🔊</button></div>
    ${!res && html`<div class=${'timer' + (left <= 3 ? ' hot' : '')}><div class="timer-bar" style=${`width:${(left / TURN_S) * 100}%`}></div><span>${left} s</span></div>`}
    <div class="touch-wide"><${Scene} sc=${sc} marks=${marks} labels=${labels} lang=${lang} onTap=${res ? null : r.tap} /></div>
    ${res && html`<div class=${'feedback ' + (res.ok ? 'ok' : 'ko')}>
      <div class="fb-title">${res.ok ? `🎉 +${res.pts} ${T('pour', 'untuk')} ${team.name}${res.pts === 2 ? T(' (rapide !)', ' (cepat! / fast!)') : ''}` : res.timeout ? T('⏰ Temps écoulé !', '⏰ Waktu habis! (Time\'s up!)') : T('💡 Presque !', '💡 Hampir! (Almost!)')}</div>
      <div><b>${words[target][lang]}</b> = ${lang === 'en' ? words[target].id : words[target].en}${KIDS ? '' : ` · ${words[target].fr}`}</div>
      <button class="btn primary block" onClick=${() => setI(i + 1)}>${T('Équipe suivante →', 'Tim berikutnya (Next team) →')}</button></div>`}
  </div>`;
}

// ---------- DIAPO DU MODE CLASSE ----------
export function TouchSlide({ sc, pool }) {
  const words = sceneWords(sc);
  const list = useMemo(() => {
    const inScene = (pool || []).filter((w) => words[w] && sc.zones.some((z) => z.w === w));
    return shuffle(inScene.length >= 3 ? inScene : sc.zones.map((z) => z.w));
  }, [sc]);
  const [i, setI] = useState(0);
  const target = list[i % list.length];
  const r = useRound(sc, target, 'en', { autoSay: false, rk: i });
  return html`<div class="touch-slide">
    <div class="huge">${sayTouch(sc, target, 'en')}</div>
    <div class="row center"><${AudioBtn} text=${sayTouch(sc, target, 'en')} lang="en" />
      <span class="trans">🇮🇩 Sentuh ${words[target].id}!</span></div>
    <div class="touch-wide"><${Scene} sc=${sc} marks=${r.marks} labels=${r.labels} onTap=${r.tap} /></div>
    <div class="row center wrap">
      ${r.done ? html`<b class="ok-text">✨ Yes! ${words[target].en}!</b>` : r.errors ? html`<b class="ko-text">That's the ${r.labels[0]}. Try again!</b>` : null}
      <button class=${'btn ' + (r.done ? 'coral' : 'ghost')} onClick=${() => setI(i + 1)}>Next word →</button>
      <button class="btn ghost" onClick=${() => go('/games/touch/' + sc.id)}>🎮 Jeu complet</button>
    </div>
  </div>`;
}
