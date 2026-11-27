"use client";
import { getDb, uid } from "@/lib/db";
import { recordMistake, trackActivity } from "@/lib/track";
import { getPronLesson, PRON_BILAN_KEY } from "@/lib/data/pronunciation";
import type { Answer } from "./questions";

/** Saves an exercise result for a lesson (db.games, gameId `pron:<lessonId>`). */
export async function saveLessonResult(lessonId: string, answers: { answer: Answer }[]) {
  const scored = answers.filter((a) => a.answer !== null);
  const score = scored.filter((a) => a.answer).length;
  const total = scored.length;
  await getDb().games.put({ id: uid("g"), gameId: `pron:${lessonId}`, score, total, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
  await trackActivity({ games: 1, xp: 3 + score });
  if (total && score / total < 0.7) {
    await recordMistake({ id: `pron:${lessonId}`, type: "pronunciation", label: getPronLesson(lessonId)?.title ?? lessonId });
  }
  return { score, total };
}

export interface BilanSummary {
  at: number;
  byLesson: Record<string, [number, number]>; // [correct, total]
}

export function readLastBilan(): BilanSummary | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(PRON_BILAN_KEY) ?? "null") as BilanSummary | null;
  } catch {
    return null;
  }
}

export async function saveBilan(answers: { lesson?: string; answer: Answer }[]): Promise<BilanSummary> {
  const byLesson: Record<string, [number, number]> = {};
  for (const a of answers) {
    if (!a.lesson || a.answer === null) continue;
    const cur = byLesson[a.lesson] ?? [0, 0];
    byLesson[a.lesson] = [cur[0] + (a.answer ? 1 : 0), cur[1] + 1];
  }
  const summary: BilanSummary = { at: Date.now(), byLesson };
  localStorage.setItem(PRON_BILAN_KEY, JSON.stringify(summary));
  const score = Object.values(byLesson).reduce((s, v) => s + v[0], 0);
  const total = Object.values(byLesson).reduce((s, v) => s + v[1], 0);
  await getDb().games.put({ id: uid("g"), gameId: "pronunciation-bilan", score, total, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
  await trackActivity({ games: 1, xp: 10 + score });
  for (const [lesson, [ok, n]] of Object.entries(byLesson)) {
    if (n && ok / n < 0.7) await recordMistake({ id: `pron:${lesson}`, type: "pronunciation", label: getPronLesson(lesson)?.title ?? lesson });
  }
  return summary;
}
