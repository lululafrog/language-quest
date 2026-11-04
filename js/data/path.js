// Le chemin de l'île : 100 niveaux, de la plage de Kuta au sommet du Rinjani (3 726 m).
// 10 zones × 10 niveaux. Chaque niveau est une petite leçon de ~5 minutes générée à partir du contenu existant.
import { EN_BY_ID } from './english.js';
import { SCENES } from './scenes.js';
import { duelQuestions } from '../screens/multiplayer.js';
import { shuffle, sample } from '../ui.js';
import { distractors } from '../gen.js';
import { B } from '../i18n.js';
import { today, getState } from '../store.js';

export const SUMMIT_M = 3726;
export const LEVELS_N = 100;
export const altitude = (n) => Math.round((SUMMIT_M * n) / LEVELS_N);

// Progression : se présenter → moi et ma famille → l'école → le marché → animaux et loisirs → le corps
// → ma journée (présent) → maintenant (-ing) → hier (passé) → demain (futur) et grande révision.
export const ZONES = [
  { name: 'Pantai Kuta', en: 'Kuta Beach', icon: '🏖️', color: '#fff1cf', ink: '#8a5a1f', theme: 'Halo, namaku… (Hello, my name is…)', guard: '🦀', guardName: 'Kepiting (Crab)',
    lessons: ['en-intro', 'en-numbers'], grammar: 'en-intro', deco: [['palm', 7, 12, 92], ['sun', 93, 34, 64], ['starfish', 93, 44, 52], ['shell', 7, 52, 44], ['palm', 93, 72, 80], ['sparkle', 30, 30, 20]], hill: ['#8fd3ea', '#c4ecf7'] },
  { name: 'Desa Sasak', en: 'Sasak Village', icon: '🛖', color: '#ffe6d3', ink: '#8a4a26', theme: 'Aku dan keluargaku (Me and my family)', guard: '🐓', guardName: 'Ayam jago (Rooster)',
    lessons: ['en-pronouns', 'en-family'], grammar: 'en-pronouns', scene: 'family', deco: [['lumbung', 7, 14, 92], ['flower', 93, 30, 50], ['lumbung', 93, 62, 80], ['flower', 7, 74, 44], ['sparkle', 70, 18, 18]], hill: ['#a8dea0', '#cdeec6'] },
  { name: 'Sekolah', en: 'School', icon: '🏫', color: '#ece8ff', ink: '#4c3a99', theme: 'Di sekolah (At school)', guard: '🦉', guardName: 'Burung hantu (Owl)',
    lessons: ['en-school', 'en-feelings'], grammar: 'en-feelings', scene: 'classroom', deco: [['book', 7, 16, 74], ['pencil', 93, 32, 66], ['heart', 7, 56, 34], ['cloud', 93, 70, 76], ['sparkle', 28, 84, 20]], hill: ['#c9bff5', '#ddd6fb'] },
  { name: 'Pasar', en: 'Market', icon: '🧺', color: '#ffe3ea', ink: '#9a3b26', theme: 'Di pasar (At the market)', guard: '🦜', guardName: 'Burung beo (Parrot)',
    lessons: ['en-food', 'en-colors'], scene: 'food', scene2: 'colors', deco: [['mango', 7, 16, 64], ['coconut', 93, 30, 62], ['flower', 7, 58, 44], ['mango', 93, 70, 52], ['heart', 93, 12, 26]], hill: ['#ffc2cf', '#ffd9e1'] },
  { name: 'Sawah', en: 'Rice Fields', icon: '🌾', color: '#e8f7d4', ink: '#3f6b16', theme: 'Binatang & hobiku (Animals & my hobbies)', guard: '🐃', guardName: 'Kerbau (Buffalo)',
    lessons: ['en-animals', 'en-hobbies'], grammar: 'en-hobbies', scene: 'animals', deco: [['rice', 7, 12, 72], ['buffalo', 93, 30, 82], ['rice', 93, 64, 70], ['frog', 7, 68, 52], ['rice', 7, 88, 50]], hill: ['#9fd67e', '#c6eaa9'] },
  { name: 'Hutan', en: 'Forest', icon: '🌳', color: '#d9f2de', ink: '#1d6b3a', theme: 'Tubuhku (My body)', guard: '🐒', guardName: 'Monyet (Monkey)',
    lessons: ['en-body'], scene: 'body', scene2: 'face', deco: [['tree', 7, 12, 96], ['mushroom', 93, 30, 56], ['tree', 93, 60, 90], ['mushroom', 7, 76, 44], ['sparkle', 30, 44, 18]], hill: ['#7cc98c', '#a8dfb3'] },
  { name: 'Air Terjun Sendang Gile', en: 'Waterfall', icon: '💦', color: '#dbf1fb', ink: '#1b5e80', theme: 'Hari-hariku (My day)', guard: '🐸', guardName: 'Katak (Frog)',
    lessons: ['en-present', 'verbs:0-25'], grammar: 'en-present', drill: 'verbs-he', deco: [['waterfall', 7, 16, 96], ['rock', 93, 34, 60], ['frog', 93, 68, 54], ['flower', 7, 80, 40], ['sparkle', 72, 14, 20]], hill: ['#8fd3ea', '#bfe7f5'] },
  { name: 'Pos Pendakian', en: 'Base Camp', icon: '⛺', color: '#e6edf5', ink: '#334155', theme: 'Sekarang aku sedang… (Right now I am…)', guard: '🦅', guardName: 'Elang (Eagle)',
    lessons: ['en-continuous', 'verbs:25-50'], grammar: 'en-continuous', drill: 'verbs-ing', deco: [['tent', 7, 18, 84], ['fire', 93, 36, 56], ['tree', 93, 68, 80], ['cloud', 7, 80, 80], ['sparkle', 30, 10, 18]], hill: ['#b9c6d6', '#d4dde8'] },
  { name: 'Danau Segara Anak', en: 'Crater Lake', icon: '🏞️', color: '#dde9fb', ink: '#23468a', theme: 'Kemarin (Yesterday)', guard: '🐉', guardName: 'Naga danau (Lake dragon)',
    lessons: ['en-past'], grammar: 'en-past', drill: 'verbs-past', deco: [['cloud', 7, 12, 84], ['lake', 93, 30, 96], ['rock', 7, 60, 54], ['cloud', 93, 80, 80], ['sparkle', 60, 20, 20]], hill: ['#a9c4ee', '#c7d9f5'] },
  { name: 'Puncak Rinjani', en: 'Rinjani Summit', icon: '🌋', color: '#f1e8e1', ink: '#5b3a2a', theme: 'Besok & mimpiku (Tomorrow & my dreams)', guard: '🧚‍♀️', guardName: 'Dewi Anjani',
    lessons: ['en-future'], grammar: 'en-future', drill: 'verbs-past', final: true, deco: [['cloud', 7, 10, 86], ['sparkle', 70, 24, 22], ['cloud', 93, 66, 90], ['sparkle', 26, 58, 18], ['sparkle', 40, 30, 20]], hill: ['#d9c6ba', '#e8dbd2'] },
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
const micOk = () => typeof window !== 'undefined' && !!getState().settings.mic && !!(window.SpeechRecognition || window.webkitSpeechRecognition) && window.top === window;
const say = (w) => ({ kind: 'say', w });

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
    if (micOk()) items.push(say(chunk[chunk.length - 1]));
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
    items = [...ws.slice(0, 6).map((w, i) => mix(w, pool, i)), ...ws.filter(short).slice(0, 3).map(spell), ...drill(zone, 2), ...sample(lessonExercises(zone), 1), ...(micOk() ? [say(ws[0])] : [])];
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

// ---------- Progression ----------
export function pathState(s) {
  const done = s.path?.done || {};
  let cur = 1;
  while (cur <= LEVELS_N && done[cur]) cur++;
  const days = s.path?.days || {};
  let streak = 0;
  const d = new Date();
  if (!days[today(d)]) d.setDate(d.getDate() - 1);
  while (days[today(d)]) { streak++; d.setDate(d.getDate() - 1); }
  const stars = Object.values(done).reduce((a, b) => a + b, 0);
  return { done, cur: Math.min(cur, LEVELS_N), finished: cur > LEVELS_N, streak, todayDone: days[today()] || 0, stars, top: cur - 1 };
}

