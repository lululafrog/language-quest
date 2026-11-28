"use client";
// Shared game logic: adaptive difficulty, result saving, mistakes.
import { getDb, getSettings, uid } from "../db";
import { trackActivity, recordMistake } from "../track";
import { gameSignal } from "../srs";
import type { Mistake, Skill } from "../types";
import type { PoolItem } from "../pool";
import { recordWordAnswer, type AnswerResult } from "../vocab/engine";
import type { Outcome } from "../vocab/core";

export type Level = 1 | 2 | 3;

export interface MissedItem {
  en: string;
  fr: string;
  cardId?: string;
  note?: string;
}

export interface MistakeInfo {
  id: string;
  type: Mistake["type"];
  label: string;
  detail?: string;
  example?: string;
}

/** Level from recent results of this game and the size of the learner's deck. */
export async function computeLevel(gameId: string): Promise<{ level: Level; accuracy: number | null; deck: number }> {
  const db = getDb();
  const recent = (await db.games.where("gameId").equals(gameId).sortBy("at")).slice(-5);
  const deck = await db.cards.count();
  const acc = recent.length ? recent.reduce((a, r) => a + (r.total ? r.score / r.total : 0), 0) / recent.length : null;
  // format difficulty (choices vs typing, number of questions) follows the real vocabulary level, then results
  const vl = (await getSettings()).vocabLevel?.level;
  let level: Level = vl ? (vl === "A1" || vl === "A2" ? 1 : vl === "C1" ? 3 : 2) : deck >= 150 ? 2 : 1;
  if (acc !== null) {
    if (acc >= 0.85 && recent.length >= 2) level = (Math.min(3, level + 1) as Level);
    if (acc < 0.5) level = 1;
  }
  return { level, accuracy: acc, deck };
}

/** Answers recorded during the current game (for the end screen: new words, reviewed words, words to review). */
export const sessionLog: (AnswerResult & { en: string })[] = [];
const pending = new Set<Promise<unknown>>();
export function resetSessionLog() {
  sessionLog.length = 0;
}
/** Waits for answers still being saved (called before showing the end screen). */
export async function flushAnswers() {
  await Promise.allSettled([...pending]);
}

/**
 * Called after each answer. Vocabulary answers (`word` + `gameId`) go through the central vocabulary engine
 * (card created if needed, FSRS, counters, level); other items (grammar, verbs) keep the lighter signal.
 */
export async function reportAnswer(opts: {
  correct: boolean; cardId?: string; skill?: Skill; mistake?: MistakeInfo;
  word?: PoolItem; gameId?: string; approximate?: boolean; hint?: boolean; ms?: number; typed?: boolean; retry?: boolean;
}): Promise<AnswerResult | undefined> {
  if (opts.word && opts.gameId) {
    const outcome: Outcome = { correct: opts.correct, approximate: opts.approximate, hint: opts.hint, ms: opts.ms, typed: opts.typed };
    const p = recordWordAnswer(opts.word, outcome, { gameId: opts.gameId, skill: opts.skill }).catch((e) => {
      console.warn("vocab answer not saved", e);
      return undefined;
    });
    pending.add(p);
    const r = await p;
    pending.delete(p);
    if (r && !opts.retry) sessionLog.push({ ...r, en: opts.word.en });
    return r;
  }
  if (opts.cardId) await gameSignal(opts.cardId, opts.correct, opts.skill ?? "recognition", "game").catch(() => {});
  if (!opts.correct && opts.mistake && !opts.cardId) await recordMistake(opts.mistake).catch(() => {});
  return undefined;
}

/** Saves the game result; XP rewards accuracy first (speed never gives more than a small bonus). */
export async function saveResult(gameId: string, score: number, total: number, durationSec: number): Promise<number> {
  const db = getDb();
  const accuracy = total ? score / total : 0;
  const xp = Math.round(score * 2 + (accuracy >= 0.9 ? 10 : accuracy >= 0.75 ? 5 : 0));
  await db.games.put({ id: uid("g"), gameId, score, total, durationSec: Math.round(durationSec), at: Date.now(), updatedAt: Date.now() });
  await trackActivity({ games: 1, xp });
  return xp;
}

/** Loads cached illustrations for the given image keys. */
export async function loadImages(keys: string[]): Promise<Map<string, string>> {
  const db = getDb();
  const rows = await db.images.bulkGet([...new Set(keys)]);
  const out = new Map<string, string>();
  for (const r of rows) if (r) out.set(r.key, r.data);
  return out;
}

/** Milliseconds since `t` (helper for answer timing in event handlers). */
export function elapsedSince(t: number): number {
  return Date.now() - t;
}
