// Le chemin de l'île : 100 niveaux, de la plage de Kuta au sommet du Rinjani (3 726 m).
// 10 zones × 10 niveaux. Chaque niveau est une petite leçon de ~5 minutes générée à partir du contenu existant.
import { EN_BY_ID } from './english.js';
import { SCENES } from './scenes.js';
import { duelQuestions } from '../screens/multiplayer.js';
import { shuffle, sample } from '../ui.js';
import { distractors } from '../gen.js';
import { B } from '../i18n.js';

export const SUMMIT_M = 3726;
export const LEVELS_N = 100;
export const altitude = (n) => Math.round((SUMMIT_M * n) / LEVELS_N);

export const ZONES = [
  { name: 'Pantai Kuta', en: 'Kuta Beach', icon: '🏖️', color: '#fde9b8', ink: '#8a5a1f', lessons: ['en-intro', 'en-numbers'], grammar: 'en-intro' },
  { name: 'Desa Sasak', en: 'Sasak Village', icon: '🛖', color: '#f8dcc4', ink: '#8a4a26', lessons: ['en-family', 'en-pronouns'], grammar: 'en-pronouns', scene: 'family' },
  { name: 'Pasar', en: 'Market', icon: '🧺', color: '#ffe0d6', ink: '#9a3b26', lessons: ['en-food', 'en-colors'], scene: 'food', scene2: 'colors' },
  { name: 'Sekolah', en: 'School', icon: '🏫', color: '#e6e1fb', ink: '#4c3a99', lessons: ['en-school', 'en-feelings'], grammar: 'en-feelings', scene: 'classroom' },
  { name: 'Sawah', en: 'Rice Fields', icon: '🌾', color: '#e1f3c8', ink: '#3f6b16', lessons: ['en-animals', 'en-hobbies'], grammar: 'en-hobbies', scene: 'animals' },
  { name: 'Hutan', en: 'Forest', icon: '🌳', color: '#cdebd3', ink: '#1d6b3a', lessons: ['en-body'], scene: 'body', scene2: 'face' },
  { name: 'Air Terjun Sendang Gile', en: 'Waterfall', icon: '💦', color: '#cfeaf6', ink: '#1b5e80', lessons: ['en-present', 'verbs:0-25'], grammar: 'en-present', drill: 'verbs-he' },
  { name: 'Pos Pendakian', en: 'Base Camp', icon: '⛺', color: '#dfe6ee', ink: '#334155', lessons: ['en-continuous', 'verbs:25-50'], grammar: 'en-continuous', drill: 'verbs-ing' },
  { name: 'Danau Segara Anak', en: 'Crater Lake', icon: '🏞️', color: '#d3e3f7', ink: '#23468a', lessons: ['en-past'], grammar: 'en-past', drill: 'verbs-past' },
  { name: 'Puncak Rinjani', en: 'Rinjani Summit', icon: '🌋', color: '#eadfd6', ink: '#5b3a2a', lessons: ['en-future'], grammar: 'en-future', drill: 'verbs-past', final: true },
];

// Mots de chaque zone, sans doublon d'une zone à l'autre.
const ZONE_WORDS = (() => {
  const seen = new Set();
  return ZONES.map((z) => z.lessons.flatMap((id) => {
    if (id.startsWith('verbs:')) {
      const [a, b] = id.slice(6).split('-').map(Number);
      return EN_BY_ID['en-verbs'].vocab.slice(a, b);
    }
    return EN_BY_ID[id].vocab;
  }).filter((w) => (seen.has(w.en) ? false : seen.add(w.en))));
})();

export const zoneOf = (n) => Math.ceil(n / 10) - 1;

// Type de chaque niveau dans une zone (positions 1 à 10).
const TEMPLATE = ['new', 'new', 'practice', 'new', 'touch', 'new', 'grammar', 'new', 'review', 'boss'];
const LABEL = {
  new: B('Kata baru', 'New words'), practice: B('Latihan', 'Practice'), touch: B('Sentuh gambar', 'Touch the picture'),
  grammar: B('Tata bahasa', 'Grammar'), sentences: B('Kalimat', 'Sentences'), review: B('Ulangan', 'Review'), boss: B('Gerbang', 'Gate'),
};
const ICON = { new: '✨', practice: '🎯', touch: '👆', grammar: '🧩', sentences: '💬', review: '🔁', boss: '🚩' };

export function levelInfo(n) {
  const zi = zoneOf(n);
  const z = ZONES[zi];
  const words = ZONE_WORDS[zi];
  const newSlots = TEMPLATE.map((t, i) => (t === 'new' ? i : -1)).filter((i) => i >= 0);
  const size = Math.max(3, Math.ceil(words.length / newSlots.length));
  const chunks = [];
  for (let i = 0; i < words.length; i += size) chunks.push(words.slice(i, i + size));
  const pos = (n - 1) % 10;
  let type = TEMPLATE[pos];
  let chunk = null;
  if (type === 'new') {
    const k = newSlots.indexOf(pos);
    chunk = chunks[k] || null;
    if (!chunk) type = k % 2 ? 'sentences' : 'practice';
  }
  if (type === 'touch' && !z.scene) type = 'practice';
  if (type === 'grammar' && !z.grammar) type = 'practice';
  if (type === 'sentences' && !z.lessons.some((id) => EN_BY_ID[id]?.sentences)) type = 'practice';
  // Mots déjà rencontrés à ce niveau (pour les révisions).
  const k = newSlots.filter((i) => i <= pos).length;
  const known = chunks.slice(0, Math.max(1, k)).flat();
  const prevZones = ZONE_WORDS.slice(0, zi).flat();
  return { n, zi, zone: z, type, label: LABEL[type], icon: ICON[type], chunk, known, zoneWords: words, prevZones, alt: altitude(n) };
}

// ---------- Générateurs d'exercices ----------
const pic = (w) => !w.abstract && w.emoji;
const short = (w) => /^[a-z]+$/i.test(w.en) && w.en.length <= 9;
const sub = (w) => `🇮🇩 ${w.id}`;

function mcqPic(w, pool) {
  const opts = [w.en, ...distractors(pool.filter(pic).map((x) => x.en), w.en)];
  return { kind: 'mcq', emoji: w.emoji, prompt: '', kindLabel: B('Apa ini?', 'What is it?'), options: opts, answer: w.en, why: `${w.en} = ${w.id}` };
}
function mcqId(w, pool) {
  return { kind: 'mcq', prompt: w.id, kindLabel: B('Bahasa Inggrisnya?', 'In English?'), options: [w.en, ...distractors(pool.map((x) => x.en), w.en)], answer: w.en, why: `${w.id} = ${w.en}` };
}
function mcqEn(w, pool) {
  return { kind: 'mcq', prompt: w.en, audio: { text: w.en, lang: 'en' }, kindLabel: B('Artinya?', 'What does it mean?'), options: [w.id, ...distractors(pool.map((x) => x.id), w.id)], answer: w.id, why: `${w.en} = ${w.id}` };
}
function listen(w, pool) {
  const usePic = pic(w) && pool.filter(pic).length >= 4;
  const key = (x) => (usePic ? x.emoji : x.id);
  return { kind: 'listen', prompt: '', audio: { text: w.en, lang: 'en' }, options: [key(w), ...distractors(pool.filter((x) => !usePic || pic(x)).map(key), key(w))], answer: key(w), why: `${w.en} = ${w.id}` };
}
const spell = (w) => ({ kind: 'translate', kindLabel: B('Tulis dalam bahasa Inggris', 'Write in English'), fr: `${pic(w) ? w.emoji + ' ' : ''}${w.id}`, a: [w.en] });
const recog = (w, pool) => (pic(w) ? mcqPic(w, pool) : mcqId(w, pool));
const matchOf = (words) => ({ kind: 'match', pairs: words.slice(0, 5).map((w) => [w.en, pic(w) ? w.emoji : w.id]), big: words.slice(0, 5).every(pic) });
const mix = (w, pool, i) => [recog, mcqEn, listen, mcqId][i % 4](w, pool);

function lessonExercises(zone) {
  const L = EN_BY_ID[zone.grammar];
  return (L?.exercises || []).map((e) => (e.type === 'fill'
    ? { kind: 'fill', s: e.s, opts: e.opts, a: e.a, why: `🇮🇩 ${e.why.id} (${e.why.en})` }
    : { kind: 'build', a: e.a, fr: '🇮🇩 ' + e.id }));
}
function sentenceItems(zone, n) {
  const all = zone.lessons.flatMap((id) => EN_BY_ID[id]?.sentences || []);
  return sample(all, n).map((s) => ({ kind: 'build', a: s.en.replace(/[.!?]$/, ''), fr: '🇮🇩 ' + s.id }));
}
function drill(zone, n) {
  if (!zone.drill) return [];
  return duelQuestions(zone.drill, n).map((q) => ({ kind: 'mcq', emoji: q.emoji, prompt: q.prompt, options: q.options, answer: q.a, kindLabel: B('Kata kerja', 'Verbs') }));
}
function touchItems(zone, known, n) {
  const ids = [zone.scene, zone.scene2].filter(Boolean);
  const scs = SCENES.filter((s) => ids.includes(s.id));
  const items = scs.flatMap((sc) => {
    const inScene = sc.zones.map((z) => z.w);
    const pick = known.map((w) => w.en).filter((w) => inScene.includes(w));
    return (pick.length >= 3 ? pick : inScene).map((w) => ({ kind: 'touch', scene: sc.id, target: w }));
  });
  return sample(items, n);
}

export function buildLevel(n) {
  const L = levelInfo(n);
  const { type, chunk, known, zoneWords, prevZones, zone } = L;
  const pool = zoneWords.length >= 4 ? zoneWords : [...zoneWords, ...prevZones];
  let items = [];
  if (type === 'new') {
    items.push(...chunk.map((w) => ({ kind: 'intro', w })));
    items.push(...shuffle(chunk).map((w, i) => mix(w, pool, i)));
    if (chunk.length >= 3) items.push(matchOf(shuffle(chunk)));
    const sp = chunk.filter(short);
    if (sp.length) items.push(spell(sp[0]));
    const old = known.filter((w) => !chunk.includes(w)).concat(sample(prevZones, 2));
    items.push(...sample(old, chunk.length < 3 ? 5 : 2).map((w, i) => mix(w, pool, i + 1)));
  } else if (type === 'practice') {
    const ws = sample(known.length >= 4 ? known : pool, 8);
    items = [matchOf(ws.slice(0, 4)), ...ws.slice(0, 6).map((w, i) => mix(w, pool, i)), ...ws.filter(short).slice(0, 2).map(spell), ...drill(zone, 2)];
  } else if (type === 'touch') {
    items = [...touchItems(zone, known, 7), ...sample(known, 2).map((w) => recog(w, pool))];
  } else if (type === 'grammar') {
    items = [{ kind: 'rule', lesson: zone.grammar }, ...lessonExercises(zone).slice(0, 8), ...sentenceItems(zone, 1)];
  } else if (type === 'sentences') {
    items = [...sentenceItems(zone, 4), ...sample(known, 4).map((w, i) => mix(w, pool, i + 2))];
  } else if (type === 'review') {
    const ws = sample(zoneWords, 10);
    items = [...ws.slice(0, 6).map((w, i) => mix(w, pool, i)), ...ws.filter(short).slice(0, 3).map(spell), ...drill(zone, 2), ...sample(lessonExercises(zone), 1)];
  } else {
    // Gerbang : un peu de tout. Au sommet : révision de toute l'île.
    const big = zone.final ? [...prevZones, ...zoneWords] : zoneWords;
    const ws = sample(big, 9);
    items = [...ws.slice(0, 6).map((w, i) => mix(w, big, i)), ...ws.filter(short).slice(0, 2).map(spell), ...sample(lessonExercises(zone), 2), ...drill(zone, 2)];
  }
  // Les intros restent en tête ; le reste est mélangé légèrement.
  const intros = items.filter((x) => x.kind === 'intro' || x.kind === 'rule');
  const rest = items.filter((x) => x.kind !== 'intro' && x.kind !== 'rule');
  return { ...L, items: [...intros, ...(type === 'new' ? rest : shuffle(rest))] };
}

export const PASS = { boss: 70 };
export const starsFor = (pct) => (pct >= 90 ? 3 : pct >= 70 ? 2 : 1);
