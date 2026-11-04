import { sample, shuffle } from './ui.js';
import { ALL_ID_WORDS } from './data/indonesian.js';
import { canDoListening, canDoSpeaking } from './exercises.js';

// Distracteurs : uniques et différents de la bonne réponse.
export function distractors(pool, answer, n = 3) {
  const uniq = [...new Set(pool.filter((x) => x && x !== answer))];
  return sample(uniq, n);
}

// Exercices d'une leçon d'indonésien (≈ 14 items, mélangés mais progressifs).
export function idLessonExercises(lesson) {
  const words = lesson.words;
  const allFr = ALL_ID_WORDS.map((w) => w.fr);
  const allId = ALL_ID_WORDS.map((w) => w.id);
  const lessonFr = words.map((w) => w.fr);
  const lessonId = words.map((w) => w.id);
  const pool = (local, global) => [...local, ...local, ...global];
  const ex = [];

  sample(words, 4).forEach((w) => ex.push({
    kind: 'mcq', prompt: w.id, audio: { text: w.id, lang: 'id' }, sub: 'Que signifie…',
    options: [w.fr, ...distractors(pool(lessonFr, allFr), w.fr)], answer: w.fr, why: `${w.id} = ${w.fr} · 🗣️ ${w.pron}`,
  }));
  sample(words, 3).forEach((w) => ex.push({
    kind: 'mcq', prompt: w.fr, sub: 'Comment dit-on en indonésien ?',
    options: [w.id, ...distractors(pool(lessonId, allId), w.id)], answer: w.id, why: `Exemple : ${w.ex} (${w.exFr})`,
  }));
  if (canDoListening()) sample(words, 2).forEach((w) => ex.push({
    kind: 'listen', prompt: '', audio: { text: w.id, lang: 'id' },
    options: [w.fr, ...distractors(lessonFr, w.fr)], answer: w.fr, why: `${w.id} = ${w.fr}`,
  }));
  sample(lesson.fill, 3).forEach((f) => ex.push({ kind: 'fill', ...f }));
  sample(lesson.build, 2).forEach((b) => ex.push({ kind: 'build', ...b }));
  sample(lesson.translate, 2).forEach((t) => ex.push({ kind: 'translate', ...t }));
  if (canDoSpeaking()) sample(words, 1).forEach((w) => ex.push({ kind: 'speak', text: w.id, fr: w.fr, pron: w.pron, lang: 'id' }));

  // Reconnaissance d'abord, production ensuite.
  const order = { mcq: 0, listen: 1, fill: 2, build: 3, translate: 4, speak: 5 };
  return shuffle(ex).sort((a, b) => order[a.kind] - order[b.kind]);
}

// Quiz de vocabulaire générique : items = [{ q, a, emoji?, audio?, why? }]
export function quizFrom(items, { n = 10, kindLabel } = {}) {
  const answers = items.map((i) => i.a);
  return sample(items, Math.min(n, items.length)).map((i) => ({
    kind: 'mcq', prompt: i.q, emoji: i.emoji, audio: i.audio, kindLabel, sub: i.sub,
    options: [i.a, ...distractors(answers, i.a)], answer: i.a, why: i.why,
  }));
}

export function enLessonExercises(lesson, lang = 'fr') {
  const v = lesson.vocab;
  const ex = quizFrom(pictured(v).map((w) => ({ q: '', emoji: w.emoji, a: w.en, why: `${w.emoji} ${w.en} = ${w.id} (${w.fr})`, audio: { text: w.en, lang: 'en' } })), { n: 5, kindLabel: 'What is it?' });
  (lesson.exercises || []).forEach((e) => {
    if (e.type === 'fill') ex.push({ kind: 'fill', s: e.s, opts: e.opts, a: e.a, why: e.why?.[lang] || e.why?.en });
    if (e.type === 'build') ex.push({ kind: 'build', a: e.a, fr: e[lang] || e.fr, sub: lang === 'fr' ? e.id : e.fr });
  });
  if (!lesson.exercises) {
    ex.push(...quizFrom(v.map((w) => ({ q: w.en, a: w.id, audio: { text: w.en, lang: 'en' } })), { n: 4, kindLabel: 'Bahasa Indonesia?' }));
  }
  return ex;
}

// Mots qu'un emoji illustre vraiment (exclut « my », « yesterday »…).
export const pictured = (vocab) => vocab.filter((w) => !w.abstract);

// Paires uniques des deux côtés (ex. « foot » et « leg » = « kaki »).
export function uniquePairs(pairs, n) {
  const seenL = new Set(), seenR = new Set();
  const out = [];
  for (const p of shuffle(pairs)) {
    if (seenL.has(p[0]) || seenR.has(p[1])) continue;
    seenL.add(p[0]); seenR.add(p[1]); out.push(p);
    if (out.length === n) break;
  }
  return out;
}
