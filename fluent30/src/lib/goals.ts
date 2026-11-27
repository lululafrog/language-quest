"use client";
// Weekly & monthly reading goals, and a forgiving streak (one free "joker" day per week). Never punitive.
import { getDb, todayKey } from "./db";
import type { DayActivity, Settings } from "./types";

export const DEFAULT_READING_GOALS: NonNullable<Settings["readingGoals"]> = { minutesPerWeek: 90, wordsPerWeek: 4000, booksPerMonth: 1 };

function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export interface GoalsProgress {
  minutes: number;
  words: number;
  books: number;
  goals: NonNullable<Settings["readingGoals"]>;
  daysLeftWeek: number;
  daysLeftMonth: number;
}

export async function goalsProgress(goals = DEFAULT_READING_GOALS): Promise<GoalsProgress> {
  const db = getDb();
  const ws = todayKey(weekStart());
  const days = await db.activity.where("date").aboveOrEqual(ws).toArray();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const books = await db.collection.where("finishedAt").aboveOrEqual(monthStart).count();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    minutes: Math.round(days.reduce((a, d) => a + d.seconds, 0) / 60),
    words: days.reduce((a, d) => a + (d.readingWords ?? 0), 0),
    books,
    goals,
    daysLeftWeek: 7 - ((now.getDay() + 6) % 7) - 1,
    daysLeftMonth: lastDay - now.getDate(),
  };
}

/** Streak where one missed day per (Monday-based) week is automatically covered by a free joker. */
export function gentleStreak(days: DayActivity[]): { streak: number; jokersUsed: number; activeToday: boolean } {
  const active = new Set(days.filter((d) => d.seconds > 30 || d.reviews > 0 || d.newWords > 0 || d.xp > 0).map((d) => d.date));
  const d = new Date();
  const activeToday = active.has(todayKey(d));
  if (!activeToday) d.setDate(d.getDate() - 1); // today isn't over yet: never break the streak for it
  let streak = 0;
  let jokersUsed = 0;
  const jokerWeeks = new Set<string>();
  for (let i = 0; i < 400; i++) {
    const k = todayKey(d);
    if (active.has(k)) streak++;
    else {
      const wk = todayKey(weekStart(d));
      if (jokerWeeks.has(wk) || streak === 0) break;
      jokerWeeks.add(wk);
      jokersUsed++;
    }
    d.setDate(d.getDate() - 1);
  }
  return { streak, jokersUsed, activeToday };
}

export function gentleMessage(p: GoalsProgress, streak: { streak: number; activeToday: boolean }): string {
  const ratio = (p.minutes / Math.max(1, p.goals.minutesPerWeek) + p.words / Math.max(1, p.goals.wordsPerWeek)) / 2;
  if (ratio >= 1) return "Objectifs de la semaine atteints. Tout ce que tu lis maintenant, c'est du bonus 🎉";
  if (!streak.activeToday && streak.streak > 0) return `Ta série de ${streak.streak} jours t'attend : quelques pages suffisent aujourd'hui.`;
  if (ratio >= 0.5) return "Déjà plus de la moitié de tes objectifs : continue à ton rythme.";
  if (p.daysLeftWeek >= 3) return "La semaine est encore longue : un chapitre par jour et c'est gagné.";
  return "Pas de pression : chaque page lue compte, même une seule.";
}
