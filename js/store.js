import { useState, useEffect } from './vendor/preact-htm.js';
import { schedule, newCard } from './fsrs.js';
import { notify } from './dialog.js';

const KEY = 'language-quest-v1';

export const WIH_DECK = 'deck-heard-today';
export const PHOTO_DECK = 'deck-photo';
const PHOTO_DECK_DEF = { id: PHOTO_DECK, name: 'My Photo Words', lang: 'en', special: 'photo' };

const defaults = () => ({
  version: 1,
  xp: 0,
  streak: { count: 0, last: null },
  days: {},            // 'AAAA-MM-JJ' -> { reviews, correct, answered, ms }
  cards: {},           // id carte -> état FSRS
  log: [],             // historique des révisions [{ id, g, t }]
  favorites: {},
  lessons: {},         // id leçon -> { best, date }
  badges: {},
  teacher: { sessions: 0, games: 0 },
  custom: {
    decks: [{ id: WIH_DECK, name: 'Words I Heard Today', lang: 'id', special: true }, PHOTO_DECK_DEF],
    cards: [],
  },
  teams: null,
  path: { done: {}, days: {} },  // niveau -> étoiles ; jour -> niveaux finis
  wordbank: {},  // mot (base) -> { id, d, src, line, added } : mots touchés en lisant
  reads: {},     // texte -> date de lecture complète
  settings: { newPerDay: 10, rate: 0.82, pitch: 1.05, voices: {}, unlockAll: false, showPron: true },
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const d = defaults();
    const s = JSON.parse(raw);
    const out = { ...d, ...s, settings: { ...d.settings, ...s.settings }, custom: { ...d.custom, ...s.custom } };
    if (!out.custom.decks.some((x) => x.id === PHOTO_DECK)) out.custom.decks.push(PHOTO_DECK_DEF);
    return out;
  } catch {
    return defaults();
  }
}

let state = load();
const subs = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { notify("Stockage plein : supprime quelques photos ou images de cartes personnelles."); }
}

export const getState = () => state;

export function update(fn) {
  const draft = structuredClone(state);
  const res = fn(draft);
  state = res || draft;
  persist();
  subs.forEach((f) => f(state));
}

export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

// ---------- Données personnelles de l'élève (sauvegardées en ligne) ----------
// L'île, les mots enregistrés (et leur révision) et les lectures suivent l'élève, pas le téléphone.
export function personal(s = state) {
  const cards = Object.fromEntries(Object.entries(s.cards).filter(([k]) => k.startsWith('w:')));
  return { path: s.path || { done: {}, days: {} }, words: s.wordbank || {}, cards, reads: s.reads || {} };
}

// Remplace (autre élève sur ce téléphone) ou fusionne (même élève, autre appareil).
export function applyPersonal(remote, uid, mode) {
  update((s) => {
    const r = { path: { done: {}, days: {} }, words: {}, cards: {}, reads: {}, ...(remote || {}) };
    if (mode === 'replace') {
      Object.keys(s.cards).filter((k) => k.startsWith('w:')).forEach((k) => delete s.cards[k]);
      s.path = { done: { ...r.path.done }, days: { ...r.path.days } };
      s.wordbank = { ...r.words };
      s.reads = { ...r.reads };
      Object.assign(s.cards, r.cards);
    } else {
      s.path = s.path || { done: {}, days: {} };
      Object.entries(r.path.done || {}).forEach(([n, st]) => { s.path.done[n] = Math.max(st, s.path.done[n] || 0); });
      Object.entries(r.path.days || {}).forEach(([d, c]) => { s.path.days[d] = Math.max(c, s.path.days[d] || 0); });
      s.wordbank = { ...r.words, ...(s.wordbank || {}) };
      s.reads = { ...r.reads, ...(s.reads || {}) };
      Object.entries(r.cards || {}).forEach(([k, c]) => { if (!s.cards[k] || (c.last || 0) > (s.cards[k].last || 0)) s.cards[k] = c; });
    }
    s.owner = uid;
  });
}

// Déconnexion : le téléphone redevient neutre pour la prochaine élève.
export function clearPersonal() {
  applyPersonal(null, null, 'replace');
}

export function useStore() {
  const [s, set] = useState(state);
  useEffect(() => { subs.add(set); return () => subs.delete(set); }, []);
  return s;
}

export const today = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

function touchDay(s) {
  const t = today();
  if (!s.days[t]) s.days[t] = { reviews: 0, correct: 0, answered: 0, ms: 0, newCards: 0 };
  if (s.streak.last !== t) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.streak.count = s.streak.last === today(y) ? s.streak.count + 1 : 1;
    s.streak.last = t;
  }
  return s.days[t];
}

export function rateCard(id, g) {
  update((s) => {
    const day = touchDay(s);
    const prev = s.cards[id];
    if (!prev || prev.state === 'new') day.newCards += 1;
    s.cards[id] = schedule(prev || newCard(), g);
    s.log.push({ id, g, t: Date.now() });
    if (s.log.length > 5000) s.log = s.log.slice(-5000);
    day.reviews += 1;
    day.answered += 1;
    if (g > 1) day.correct += 1;
    s.xp += g > 1 ? 2 : 1;
    checkBadges(s);
  });
}

export function recordAnswer(ok, xp = 0) {
  update((s) => {
    const day = touchDay(s);
    day.answered += 1;
    if (ok) day.correct += 1;
    s.xp += xp || (ok ? 3 : 0);
  });
}

export function addStudyTime(ms) {
  if (ms < 2000) return;
  update((s) => { touchDay(s).ms += Math.min(ms, 30 * 60 * 1000); });
}

export function finishLesson(id, score, cardIds = []) {
  update((s) => {
    touchDay(s);
    const prev = s.lessons[id];
    s.lessons[id] = { best: Math.max(score, prev?.best || 0), date: Date.now() };
    s.xp += 20 + Math.round(score / 5);
    // Les mots de la leçon entrent dans la file de révision.
    cardIds.forEach((c) => { if (!s.cards[c]) s.cards[c] = newCard(); });
    checkBadges(s);
  });
}

export function toggleFav(id) {
  update((s) => { if (s.favorites[id]) delete s.favorites[id]; else s.favorites[id] = true; });
}

export function teacherEvent(kind) {
  update((s) => { s.teacher[kind] = (s.teacher[kind] || 0) + 1; s.xp += 5; checkBadges(s); });
}

export const BADGES = [
  { id: 'first10', icon: '🌱', name: 'First 10 Words', desc: '10 mots en révision régulière' },
  { id: 'explorer', icon: '🧭', name: 'Indonesian Explorer', desc: 'Terminer 3 leçons d\'indonésien' },
  { id: 'grammar', icon: '🦸', name: 'Grammar Hero', desc: 'Terminer la leçon des verbes essentiels' },
  { id: 'streak7', icon: '🔥', name: '7-Day Streak', desc: '7 jours d\'apprentissage d\'affilée' },
  { id: 'champion', icon: '🏆', name: 'Classroom Champion', desc: 'Animer 5 jeux ou séances en classe' },
  { id: 'words50', icon: '🌺', name: '50 Words', desc: '50 mots appris' },
];

function checkBadges(s) {
  const learned = Object.values(s.cards).filter((c) => c.state === 'review').length;
  const doneId = Object.keys(s.lessons).filter((k) => k.startsWith('id-')).length;
  const give = (b) => { if (!s.badges[b]) s.badges[b] = Date.now(); };
  if (learned >= 10) give('first10');
  if (learned >= 50) give('words50');
  if (doneId >= 3) give('explorer');
  if (s.lessons['id-2-verbs']) give('grammar');
  if (s.streak.count >= 7) give('streak7');
  if ((s.teacher.sessions || 0) + (s.teacher.games || 0) >= 5) give('champion');
}

export function exportBackup() {
  return JSON.stringify(state, null, 2);
}
export function importBackup(json) {
  const s = JSON.parse(json);
  if (!s || s.version !== 1) throw new Error('Fichier non reconnu');
  update(() => ({ ...defaults(), ...s }));
}
export function resetAll() {
  update(() => defaults());
}

export function saveWord(base, info) {
  update((s) => {
    s.wordbank = s.wordbank || {};
    if (!s.wordbank[base]) s.wordbank[base] = { ...info, added: Date.now() };
  });
}
export function removeWord(base) {
  update((s) => { delete s.wordbank?.[base]; delete s.cards['w:' + base]; });
}
export function markRead(id) {
  update((s) => { s.reads = s.reads || {}; s.reads[id] = today(); s.xp += 10; });
}

export function completeLevel(n, stars) {
  update((s) => {
    touchDay(s);
    s.path = s.path || { done: {}, days: {} };
    s.path.done[n] = Math.max(stars, s.path.done[n] || 0);
    s.path.days[today()] = (s.path.days[today()] || 0) + 1;
    s.xp += 10 + stars * 5;
  });
}

export const uid = () => Math.random().toString(36).slice(2, 10);
