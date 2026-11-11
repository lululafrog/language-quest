// Puzzle : chaque pièce se gagne avec une bonne réponse en anglais, puis on la pose au bon endroit.
// Les mots ratés reviennent plus tard. L'image finie dit son nom en anglais et débloque le puzzle suivant.
import { html, useState, useEffect, useMemo } from '../vendor/preact-htm.js';
import { useStore, update, recordAnswer } from '../store.js';
import { go, shuffle, Confetti, AudioBtn } from '../ui.js';
import { speak } from '../speech.js';
import { MCQ, Translate, chime } from '../exercises.js';
import { distractors } from '../gen.js';
import { STICKER_ART } from '../data/stickers.js';
import { levelInfo, pathState } from '../data/path.js';
import { B } from '../i18n.js';

const SIDE = 3;
const PIECES = SIDE * SIDE;
const FREE = 3; // puzzles ouverts dès le début

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const pieceStyle = (art, k) => `background-image:${svgUrl(art.svg)};background-size:${SIDE * 100}% ${SIDE * 100}%;background-position:${(k % SIDE) * 50}% ${Math.floor(k / SIDE) * 50}%`;

// Mots déjà rencontrés sur l'île ; au début, ceux de la plage.
function puzzleWords(s) {
  const info = levelInfo(pathState(s).cur);
  const seen = [...info.prevZones, ...info.known];
  return seen.length >= 8 ? seen : [...seen, ...info.zoneWords];
}

const short = (w) => /^[a-z]+$/i.test(w.en) && w.en.length <= 9;

// Une question par pièce, en alternant les sens ; une sur trois est à écrire.
function question(w, pool, i) {
  if (i % 3 === 2 && short(w)) return { kind: 'write', kindLabel: B('Tulis dalam bahasa Inggris', 'Write in English'), fr: w.id, a: [w.en] };
  if (i % 2) return { kind: 'mcq', prompt: w.en, audio: { text: w.en, lang: 'en' }, kindLabel: B('Artinya?', 'What does it mean?'), options: [w.id, ...distractors(pool.map((x) => x.id), w.id)], answer: w.id, why: `${w.en} = ${w.id}` };
  return { kind: 'mcq', prompt: w.id, kindLabel: B('Bahasa Inggrisnya?', 'In English?'), options: [w.en, ...distractors(pool.map((x) => x.en), w.en)], answer: w.en, why: `${w.id} = ${w.en}` };
}

const doneSet = (s) => s.puzzles || {};
const isOpen = (s, i) => i < FREE + Object.keys(doneSet(s)).length;

// ---------- Album des puzzles ----------
export function PuzzleHome() {
  const s = useStore();
  const done = doneSet(s);
  return html`<div class="page narrow student">
    <h1>Puzzle</h1>
    <p class="muted">${B('Jawab dalam bahasa Inggris untuk mendapat potongan, lalu taruh di tempatnya.', 'Answer in English to win a piece, then put it in its place.')}</p>
    <p class="small"><b>${Object.keys(done).length} / ${STICKER_ART.length}</b> ${B('gambar selesai', 'pictures done')}</p>
    <div class="pz-album">${STICKER_ART.map((a, i) => {
      const open = isOpen(s, i);
      return html`<button class=${'pz-tile' + (done[i] ? ' done' : '') + (open ? '' : ' locked')} disabled=${!open} onClick=${() => go('/s/puzzle/' + i)}>
        <span class="pz-thumb" dangerouslySetInnerHTML=${{ __html: a.svg }}></span>
        <small>${done[i] ? a.en : open ? B('Mulai', 'Start') : B('Terkunci', 'Locked')}</small>
      </button>`;
    })}</div>
    <p class="muted small center">${B('Setiap gambar selesai membuka gambar baru.', 'Each finished picture opens a new one.')}</p>
  </div>`;
}

// ---------- Une partie ----------
export function PuzzlePlay({ arg }) {
  const i = Math.max(0, Math.min(STICKER_ART.length - 1, Number(arg) || 0));
  const art = STICKER_ART[i];
  const s = useStore();
  const pool = useMemo(() => puzzleWords(s), []);
  const order = useMemo(() => shuffle([...Array(PIECES).keys()]), [i]);
  const [queue, setQueue] = useState(() => shuffle(pool));
  const [asked, setAsked] = useState(0);
  const [placed, setPlaced] = useState([]);   // pièces posées
  const [holding, setHolding] = useState(false); // pièce gagnée, à poser
  const [miss, setMiss] = useState(0);        // mauvaises cases pour cette pièce
  const [shake, setShake] = useState(null);

  const piece = order[placed.length];
  const finished = placed.length === PIECES;
  const w = queue[0];
  const ex = useMemo(() => w && question(w, pool, asked), [w, asked]);

  useEffect(() => {
    if (!finished) return;
    update((st) => { st.puzzles = { ...(st.puzzles || {}), [i]: true }; st.xp += 15; });
    setTimeout(() => speak(art.en, 'en'), 500);
  }, [finished]);

  if (!isOpen(s, i) && !finished) return html`<div class="page narrow center-page"><p>${B('Gambar ini masih terkunci', 'This picture is still locked')}</p><button class="btn primary" onClick=${() => go('/s/puzzle')}>Puzzle</button></div>`;

  const answered = (ok) => {
    recordAnswer(ok, ok ? 3 : 0);
    // Un mot raté revient trois questions plus tard ; un mot réussi repart en fin de file.
    const [cur, ...rest] = queue;
    setQueue(ok ? [...rest, cur] : [...rest.slice(0, 3), cur, ...rest.slice(3)]);
    setAsked(asked + 1);
    if (ok) { setHolding(true); setMiss(0); }
  };

  const drop = (k) => {
    if (!holding || placed.includes(k)) return;
    if (k === piece) { chime(true); setPlaced([...placed, k]); setHolding(false); }
    else { setMiss(miss + 1); setShake(k); setTimeout(() => setShake(null), 400); }
  };

  const next = STICKER_ART[i + 1];
  return html`<div class="page narrow pz-page">
    <div class="progress-top">
      <button class="x" onClick=${() => go('/s/puzzle')} aria-label="Exit">✕</button>
      <div class="bar"><i style=${`width:${(placed.length / PIECES) * 100}%`}></i></div>
      <span class="muted">${placed.length}/${PIECES}</span>
    </div>

    <div class=${'pz-board' + (finished ? ' complete' : '')}>
      <span class="pz-ghost" dangerouslySetInnerHTML=${{ __html: art.svg }}></span>
      ${[...Array(PIECES).keys()].map((k) => html`<button class=${'pz-slot' + (placed.includes(k) ? ' filled' : '') + (holding && !placed.includes(k) ? ' target' : '') + (shake === k ? ' shake' : '') + (holding && miss >= 2 && k === piece ? ' hint' : '')}
        aria-label=${'Slot ' + (k + 1)} disabled=${!holding || placed.includes(k)} onClick=${() => drop(k)}
        style=${placed.includes(k) ? pieceStyle(art, k) : ''}></button>`)}
    </div>

    ${finished ? html`<div class="ex result">
        <${Confetti} />
        <h2>${art.en} <${AudioBtn} text=${art.en} lang="en" /></h2>
        <p class="muted">${art.id}</p>
        <p>${B('Gambar selesai! Kamu mendapat 15 XP.', 'Picture done! You got 15 XP.')}</p>
        ${next && html`<button class="btn coral lg block" onClick=${() => go('/s/puzzle/' + (i + 1))}>${B('Puzzle berikutnya', 'Next puzzle')} →</button>`}
        <button class="btn ghost block" onClick=${() => go('/s/puzzle')}>${B('Semua puzzle', 'All puzzles')}</button>
      </div>`
    : holding ? html`<div class="pz-hold">
        <span class="pz-piece" style=${pieceStyle(art, piece)}></span>
        <p><b>${B('Taruh potongan ini di tempatnya!', 'Put this piece in its place!')}</b><br /><span class="muted small">${miss >= 2 ? B('Lihat kotak yang berkedip.', 'Look at the blinking square.') : B('Sentuh kotak yang benar.', 'Tap the right square.')}</span></p>
      </div>`
    : html`<div class="pz-ask">
        <div class="pz-ask-head"><span class="pz-piece locked"></span><b>${B('Jawab untuk mendapat potongan', 'Answer to win a piece')}</b></div>
        ${ex.kind === 'write'
          ? html`<${Translate} key=${asked} ex=${ex} onDone=${answered} />`
          : html`<${MCQ} key=${asked} ex=${ex} onDone=${answered} />`}
      </div>`}
  </div>`;
}
