"use client";
// Central course progress: lesson results, spaced review of lessons (FSRS), weak concepts.
import { fsrs, generatorParameters, createEmptyCard, type Card as FCard, type Grade, State } from "ts-fsrs";
import { getDb } from "../db";
import { recordMistake, trackActivity } from "../track";
import { ALL_LESSONS, PATH, getLesson, type CefrLevel, type Lesson } from "./index";
import type { LessonProgress } from "../types";

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9, maximum_interval: 365 }));

function toCard(p: LessonProgress): FCard {
  return { due: new Date(p.due), stability: p.stability, difficulty: p.difficulty, elapsed_days: 0, scheduled_days: 0, learning_steps: 0, reps: p.reps, lapses: p.lapses, state: p.state as State, last_review: new Date(p.lastAt) };
}

/** Save a lesson attempt. score 0..1; weakTags = concept tags of the exercises that were missed. */
export async function recordLessonResult(id: string, score: number, weakTags: string[] = []): Promise<LessonProgress> {
  const db = getDb();
  const now = new Date();
  const cur = await db.lessons.get(id);
  const card = cur ? toCard(cur) : createEmptyCard(now);
  const grade = (score >= 0.9 ? 4 : score >= 0.7 ? 3 : score >= 0.5 ? 2 : 1) as Grade;
  const next = scheduler.next(card, now, grade).card;
  const p: LessonProgress = {
    id,
    status: score >= 0.7 || cur?.status === "done" ? "done" : "started",
    bestScore: Math.max(score, cur?.bestScore ?? 0),
    lastScore: score,
    attempts: (cur?.attempts ?? 0) + 1,
    lastAt: now.getTime(),
    weakTags: [...new Set(weakTags)],
    due: next.due.getTime(),
    stability: next.stability,
    difficulty: next.difficulty,
    reps: next.reps,
    lapses: next.lapses,
    state: next.state,
    updatedAt: Date.now(),
  };
  await db.lessons.put(p);
  await trackActivity({ grammarExercises: 1, xp: Math.round(10 + score * 20) });
  const lesson = getLesson(id);
  for (const tag of p.weakTags) await recordMistake({ id: `lesson:${id}:${tag}`, type: "grammar", label: lesson?.title ?? id, detail: tag });
  return p;
}

export async function lessonProgressMap(): Promise<Map<string, LessonProgress>> {
  const all = await getDb().lessons.toArray();
  return new Map(all.map((p) => [p.id, p]));
}

/** Lessons whose review is due (most overdue first). */
export async function dueLessonReviews(limit = 5): Promise<Lesson[]> {
  const now = Date.now();
  const due = (await getDb().lessons.where("due").belowOrEqual(now).toArray()).filter((p) => p.status === "done" || p.attempts > 0);
  return due.sort((a, b) => a.due - b.due).map((p) => getLesson(p.id)).filter((l): l is Lesson => !!l).slice(0, limit);
}

/** Next lesson to study in the recommended path, starting from the learner's level. */
export async function nextPathLesson(level: CefrLevel = "A1"): Promise<Lesson | undefined> {
  const map = await lessonProgressMap();
  const start = PATH.findIndex((l) => l.level === level);
  const ordered = start > 0 ? [...PATH.slice(start), ...PATH.slice(0, start)] : PATH;
  return ordered.find((l) => map.get(l.id)?.status !== "done");
}

/** Last lesson the learner opened and did not finish (to "resume"). */
export async function lastStartedLesson(): Promise<Lesson | undefined> {
  const started = (await getDb().lessons.where("status").equals("started").toArray()).sort((a, b) => b.lastAt - a.lastAt)[0];
  return started ? getLesson(started.id) : undefined;
}

export async function levelProgress(): Promise<Record<CefrLevel, { done: number; total: number }>> {
  const map = await lessonProgressMap();
  const out = {} as Record<CefrLevel, { done: number; total: number }>;
  for (const l of PATH) {
    out[l.level] ??= { done: 0, total: 0 };
    out[l.level].total++;
    if (map.get(l.id)?.status === "done") out[l.level].done++;
  }
  return out;
}

export function lessonCount() {
  return ALL_LESSONS.length;
}
