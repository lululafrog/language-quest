// FSRS-4.5 (Free Spaced Repetition Scheduler), d'après la spécification publique :
// https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
// Notes : 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367,
  1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const RETENTION = 0.9;
const MAX_IVL = 365 * 3;
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export const RATINGS = [
  { g: 1, label: 'Again', fr: 'À revoir', cls: 'again' },
  { g: 2, label: 'Hard', fr: 'Difficile', cls: 'hard' },
  { g: 3, label: 'Good', fr: 'Bien', cls: 'good' },
  { g: 4, label: 'Easy', fr: 'Facile', cls: 'easy' },
];

const clampD = (d) => Math.min(10, Math.max(1, d));
const initS = (g) => Math.max(0.1, W[g - 1]);
const initD = (g) => clampD(W[4] - (g - 3) * W[5]);
const retrievability = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
const interval = (s) => Math.min(MAX_IVL, Math.max(1, Math.round((s / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1))));

function nextD(d, g) {
  const d2 = d - W[6] * (g - 3);
  return clampD(W[7] * initD(3) + (1 - W[7]) * d2);
}
function recallS(d, s, r, g) {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
}
function forgetS(d, s, r) {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]));
}

export function newCard() {
  return { state: 'new', due: 0, s: 0, d: 0, reps: 0, lapses: 0, last: 0 };
}

// Renvoie le nouvel état de la carte après une note g, à l'instant now.
export function schedule(card, g, now = Date.now()) {
  const c = { ...(card || newCard()) };
  const elapsed = c.last ? Math.max(0, (now - c.last) / DAY) : 0;
  if (c.state === 'new') {
    c.s = initS(g);
    c.d = initD(g);
    if (g === 1) { c.state = 'learning'; c.due = now + MIN; }
    else if (g === 2) { c.state = 'learning'; c.due = now + 5 * MIN; }
    else if (g === 3) { c.state = 'learning'; c.due = now + 10 * MIN; }
    else { c.state = 'review'; c.due = now + interval(c.s) * DAY; }
  } else if (c.state === 'learning' || c.state === 'relearning') {
    // Étapes courtes : la stabilité évolue peu dans la journée.
    c.d = nextD(c.d, g);
    if (g === 1) { c.due = now + MIN; }
    else if (g === 2) { c.due = now + 5 * MIN; }
    else {
      if (g === 4) c.s = c.s * W[16];
      c.state = 'review';
      c.due = now + interval(c.s) * DAY;
    }
  } else {
    const r = retrievability(elapsed, c.s);
    c.d = nextD(c.d, g);
    if (g === 1) {
      c.s = forgetS(c.d, c.s, r);
      c.lapses += 1;
      c.state = 'relearning';
      c.due = now + 10 * MIN;
    } else {
      c.s = recallS(c.d, c.s, r, g);
      let ivl = interval(c.s);
      if (g === 2) ivl = Math.max(1, Math.min(ivl, Math.round(c.s)));
      c.due = now + ivl * DAY;
    }
  }
  c.reps += 1;
  c.last = now;
  return c;
}

export function previewLabel(card, g, now = Date.now()) {
  const n = schedule(card, g, now);
  const ms = n.due - now;
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))} min`;
  if (ms < DAY) return `${Math.round(ms / (60 * MIN))} h`;
  const d = Math.round(ms / DAY);
  if (d < 31) return `${d} j`;
  if (d < 365) return `${Math.round(d / 30)} mois`;
  return `${(d / 365).toFixed(1)} an`;
}

// Maîtrise 0..4 pour l'affichage (pastilles).
export function mastery(card) {
  if (!card || card.state === 'new') return 0;
  if (card.state !== 'review') return 1;
  if (card.s < 3) return 2;
  if (card.s < 21) return 3;
  return 4;
}

export const isDue = (card, now = Date.now()) => card && card.state !== 'new' && card.due <= now;
