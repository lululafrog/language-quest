// Résolution des cartes et constitution des files de révision.
import { ID_LESSONS, ID_WORD_BY_KEY } from './data/indonesian.js';
import { EN_ALL } from './data/english.js';
import { getState, today, WIH_DECK } from './store.js';
import { isDue } from './fsrs.js';

const EN_WORD = Object.fromEntries(EN_ALL.flatMap((l) => l.vocab.map((w) => [w.key, w])));

export function cardContent(key, s = getState()) {
  if (key.startsWith('c:')) {
    const c = s.custom.cards.find((x) => 'c:' + x.id === key);
    if (!c) return null;
    return { key, front: c.front, back: c.back, ex: c.example, image: c.image, lang: c.lang || 'id', pron: c.pron };
  }
  if (key.startsWith('id-')) {
    const w = ID_WORD_BY_KEY[key];
    if (!w) return null;
    return { key, front: w.id, back: w.fr, pron: w.pron, ex: w.ex, exFr: w.exFr, lang: 'id' };
  }
  if (key.startsWith('en-')) {
    const w = EN_WORD[key];
    if (!w) return null;
    return { key, front: w.en, back: `${w.id} · ${w.fr}`, emoji: w.abstract ? null : w.emoji, ex: w.forms?.replace(/ · /g, ', '), lang: 'en' };
  }
  return null;
}

export function unlockedIdLessons(s = getState()) {
  if (s.settings.unlockAll) return ID_LESSONS;
  const out = [];
  for (const l of ID_LESSONS) {
    out.push(l);
    if (!s.lessons[l.id]) break;
  }
  return out;
}

export function isLessonUnlocked(id, s = getState()) {
  return unlockedIdLessons(s).some((l) => l.id === id);
}

export function deckList(s = getState()) {
  const decks = [
    { id: 'id-all', name: 'Indonésien : toutes mes leçons', icon: '🇮🇩', lang: 'id' },
    { id: 'fav', name: 'Mes favoris', icon: '⭐', lang: 'id' },
    ...ID_LESSONS.map((l) => ({ id: l.id, name: l.title, icon: l.icon, lang: 'id', lesson: true })),
    ...s.custom.decks.map((d) => ({ id: d.id, name: d.name, icon: d.special === 'photo' ? '📸' : d.special ? '👂' : '🗂️', lang: d.lang, custom: true, special: d.special })),
    ...EN_ALL.map((l) => ({ id: l.id, name: `English · ${l.title}`, icon: l.icon, lang: 'en', en: true })),
  ];
  return decks;
}

export function deckKeys(deckId, s = getState()) {
  if (deckId === 'id-all') return unlockedIdLessons(s).flatMap((l) => l.words.map((w) => w.key));
  if (deckId === 'all') return [...deckKeys('id-all', s), ...s.custom.cards.map((c) => 'c:' + c.id), ...Object.keys(s.cards).filter((k) => k.startsWith('en-'))];
  if (deckId === 'fav') return Object.keys(s.favorites);
  const idl = ID_LESSONS.find((l) => l.id === deckId);
  if (idl) return idl.words.map((w) => w.key);
  const enl = EN_ALL.find((l) => l.id === deckId);
  if (enl) return enl.vocab.map((w) => w.key);
  return s.custom.cards.filter((c) => c.deckId === deckId).map((c) => 'c:' + c.id);
}

export function deckStats(deckId, s = getState()) {
  const keys = deckKeys(deckId, s);
  const now = Date.now();
  let due = 0, fresh = 0, learned = 0;
  keys.forEach((k) => {
    const c = s.cards[k];
    if (!c || c.state === 'new') fresh++;
    else { if (isDue(c, now)) due++; if (c.state === 'review') learned++; }
  });
  return { total: keys.length, due, fresh, learned };
}

export function newLeftToday(s = getState()) {
  const used = s.days[today()]?.newCards || 0;
  return Math.max(0, (s.settings.newPerDay || 10) - used);
}

// File : cartes dues (les plus en retard d'abord) puis nouvelles cartes dans la limite du jour.
export function buildQueue(deckId, { max = 50, extraNew = 0 } = {}, s = getState()) {
  const keys = deckKeys(deckId, s).filter((k) => cardContent(k, s));
  const now = Date.now();
  const due = keys.filter((k) => isDue(s.cards[k], now)).sort((a, b) => s.cards[a].due - s.cards[b].due);
  // Les mots ajoutés à la main sont prioritaires parmi les nouveaux.
  const fresh = keys.filter((k) => !s.cards[k] || s.cards[k].state === 'new')
    .sort((a, b) => (b.startsWith('c:') - a.startsWith('c:')));
  const nNew = Math.min(fresh.length, newLeftToday(s) + extraNew);
  return [...due, ...fresh.slice(0, nNew)].slice(0, max);
}

export function totals(s = getState()) {
  const vals = Object.entries(s.cards);
  const now = Date.now();
  const learned = vals.filter(([, c]) => c.state === 'review').length;
  const due = vals.filter(([, c]) => isDue(c, now)).length;
  const days = Object.values(s.days);
  const answered = days.reduce((a, d) => a + d.answered, 0);
  const correct = days.reduce((a, d) => a + d.correct, 0);
  const ms = days.reduce((a, d) => a + d.ms, 0);
  return {
    learned, due, answered, correct, ms,
    pct: answered ? Math.round((correct / answered) * 100) : 0,
    lessonsDone: Object.keys(s.lessons).length,
    level: Math.floor(s.xp / 150) + 1,
  };
}

export { WIH_DECK };
