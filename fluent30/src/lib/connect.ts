"use client";
// Connections between features: a mistake, a game question or a forgotten word
// always points to the lesson that explains it (new course first, legacy pages as fallback).
import { getDb } from "./db";
import { lessonForTag, getLesson, type Lesson } from "./curriculum";
import { getGrammarLesson } from "./data/grammar";
import { getPronLesson } from "./data/pronunciation";
import { COURSES } from "./data/courses";
import type { Mistake } from "./types";

export interface CourseLink {
  href: string;
  title: string;
  /** true when it points to the new structured course (/cours/<id>) */
  isCourse: boolean;
  lesson?: Lesson;
}

export interface WeakConcept {
  tag: string;
  label: string;
  score: number; // recency-weighted weight
  count: number;
  lastAt: number;
  link: CourseLink | null;
}

// Game conjugation drills (lib/data/game-content CONJ templates) → concept tags.
const CONJ_TAGS: Record<string, string> = {
  ps3: "present-simple",
  q: "questions",
  past: "past-simple",
  cont: "present-continuous",
  pp: "present-perfect",
  neg: "negatives",
  ppc: "present-perfect-continuous",
  pastperf: "past-perfect",
};

const TAG_LABELS: Record<string, string> = {
  "irregular-verbs": "Verbes irréguliers",
  "phrasal-verbs": "Phrasal verbs",
  "french-mistakes": "Erreurs typiques des francophones",
  "present-simple": "Present simple",
  "present-continuous": "Present continuous",
  "past-simple": "Prétérit (past simple)",
  "present-perfect": "Present perfect",
  "present-perfect-continuous": "Present perfect continuous",
  "past-perfect": "Past perfect",
  questions: "Poser une question",
  negatives: "La négation",
};

/** Concept tag behind a mistake id, or null when it is pure vocabulary (handled by flashcards). */
export function tagForMistakeId(id: string): string | null {
  const [kind, a, b] = id.split(":");
  switch (kind) {
    case "lesson":
      return b || a || null;
    case "grammar":
      if (a === "err") return "french-mistakes";
      return a || null;
    case "conj":
      return CONJ_TAGS[a] ?? "conjugation";
    case "conjugation":
      return "conjugation";
    case "irregular":
      return "irregular-verbs";
    case "phrasal":
      return "phrasal-verbs";
    case "pron":
      return `pron:${a}`;
    case "basics":
      return `basics:${a}`;
    default:
      return null; // vocab:, spelling:, syn: → word review, not a course
  }
}

function courseLink(lesson: Lesson): CourseLink {
  return { href: `/cours/${lesson.id}`, title: lesson.title, isCourse: true, lesson };
}

/** Best place to (re)learn a concept tag: structured course first, then legacy pages. */
export function courseForTag(tag: string): CourseLink | null {
  if (!tag) return null;
  const direct = getLesson(tag) ?? lessonForTag(tag);
  if (direct) return courseLink(direct);
  const [kind, rest] = tag.includes(":") ? tag.split(":") : ["", tag];
  if (kind === "pron") {
    const p = getPronLesson(rest);
    return p ? { href: `/pronunciation/${p.id}`, title: p.title, isCourse: false } : { href: "/pronunciation", title: "Prononciation", isCourse: false };
  }
  if (kind === "basics") return { href: `/basics/${rest}`, title: "Les bases", isCourse: false };
  if (rest === "irregular-verbs") return { href: "/verbs/irregular", title: TAG_LABELS[rest], isCourse: false };
  if (rest === "conjugation") return { href: "/verbs", title: "Conjugaison", isCourse: false };
  const g = getGrammarLesson(rest);
  if (g) return { href: `/grammar/${g.id}`, title: g.title, isCourse: false };
  const c = COURSES.find((x) => x.grammarId === rest || x.slug === rest || x.grammarId?.includes(rest) || x.slug.includes(rest));
  if (c) return { href: `/courses/${c.slug}`, title: c.title, isCourse: false };
  if (rest === "phrasal-verbs") return { href: "/courses", title: TAG_LABELS[rest], isCourse: false };
  if (rest === "french-mistakes") return { href: "/courses", title: TAG_LABELS[rest], isCourse: false };
  return null;
}

/** Lesson to revisit after a recorded mistake (null for plain vocabulary). */
export function lessonHrefForMistake(m: Pick<Mistake, "id">): string | null {
  const [kind, lessonId, tag] = m.id.split(":");
  if (kind === "lesson" && lessonId && getLesson(lessonId)) {
    // A mistake made inside a lesson: a more specific lesson on that tag, else the lesson itself.
    const specific = tag ? lessonForTag(tag) : undefined;
    return `/cours/${(specific ?? getLesson(lessonId))!.id}`;
  }
  if (kind === "conjugation" && lessonId) return `/verbs/${encodeURIComponent(lessonId)}`;
  const t = tagForMistakeId(m.id);
  return t ? courseForTag(t)?.href ?? null : null;
}

/** Short "why" + course link for a game question answered wrongly. */
export function explainForGameItem(item: { explanation?: string; mistake?: { id: string; label?: string; detail?: string; example?: string } }): { why: string | null; link: CourseLink | null } {
  const why = item.explanation || item.mistake?.detail || null;
  const tag = item.mistake ? tagForMistakeId(item.mistake.id) : null;
  return { why, link: tag ? courseForTag(tag) : null };
}

/** Course for a flashcard theme / word (e.g. a forgotten word in review). */
export function courseForWord(themes: string[] | undefined, kind?: string): CourseLink | null {
  if (kind === "phrasal") return courseForTag("phrasal-verbs");
  for (const th of themes ?? []) {
    const l = lessonForTag(th);
    if (l) return courseLink(l);
  }
  return null;
}

const HALF_LIFE_DAYS = 10;

/** Concepts the learner struggles with, most urgent first (recent + frequent mistakes, weak lesson tags). */
export async function weakConcepts(limit = 5): Promise<WeakConcept[]> {
  const db = getDb();
  const [mistakes, lessons] = await Promise.all([db.mistakes.toArray(), db.lessons.toArray()]);
  const now = Date.now();
  const acc = new Map<string, WeakConcept>();
  const add = (tag: string, label: string, weight: number, count: number, lastAt: number) => {
    const cur = acc.get(tag);
    if (cur) {
      cur.score += weight;
      cur.count += count;
      cur.lastAt = Math.max(cur.lastAt, lastAt);
    } else acc.set(tag, { tag, label, score: weight, count, lastAt, link: null });
  };
  for (const m of mistakes) {
    const tag = tagForMistakeId(m.id);
    if (!tag) continue;
    const ageDays = Math.max(0, (now - m.lastAt) / 86400000);
    if (ageDays > 60) continue;
    const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    add(tag, TAG_LABELS[tag] ?? m.label, Math.sqrt(m.count) * decay, m.count, m.lastAt);
  }
  for (const p of lessons) {
    if (!p.weakTags?.length) continue;
    const ageDays = Math.max(0, (now - p.lastAt) / 86400000);
    if (ageDays > 60) continue;
    const decay = Math.pow(0.5, ageDays / HALF_LIFE_DAYS) * (1 - Math.min(1, p.lastScore));
    for (const t of p.weakTags) add(t, TAG_LABELS[t] ?? getLesson(p.id)?.title ?? t, 0.5 + decay, 0, p.lastAt);
  }
  return [...acc.values()]
    .map((c) => ({ ...c, link: courseForTag(c.tag) }))
    .filter((c) => c.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
