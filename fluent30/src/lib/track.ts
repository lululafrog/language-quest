"use client";
import { getDb, todayKey } from "./db";
import type { DayActivity, Mistake } from "./types";

function emptyDay(date: string): DayActivity {
  return { date, seconds: 0, newWords: 0, reviews: 0, correct: 0, games: 0, readingWords: 0, chatMessages: 0, grammarExercises: 0, xp: 0, updatedAt: Date.now() };
}

export async function trackActivity(delta: Partial<Omit<DayActivity, "date" | "updatedAt">>) {
  const db = getDb();
  const date = todayKey();
  await db.transaction("rw", db.activity, async () => {
    const cur = (await db.activity.get(date)) ?? emptyDay(date);
    const next = { ...cur };
    for (const [k, v] of Object.entries(delta)) {
      const key = k as keyof Omit<DayActivity, "date" | "updatedAt">;
      next[key] = (cur[key] ?? 0) + (v ?? 0);
    }
    await db.activity.put(next);
  });
}

export async function recordMistake(m: Omit<Mistake, "count" | "lastAt" | "updatedAt">) {
  const db = getDb();
  const cur = await db.mistakes.get(m.id);
  await db.mistakes.put({ ...m, count: (cur?.count ?? 0) + 1, lastAt: Date.now(), updatedAt: Date.now() });
}

/** Consecutive days with any activity, ending today (or yesterday if nothing yet today). */
export function computeStreak(days: DayActivity[]): number {
  const active = new Set(days.filter((d) => d.seconds > 30 || d.reviews > 0 || d.newWords > 0 || d.xp > 0).map((d) => d.date));
  let streak = 0;
  const d = new Date();
  if (!active.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (active.has(todayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
