"use client";
// Shared game logic: adaptive difficulty, result saving, mistakes.
import { getDb, uid } from "../db";
import { trackActivity, recordMistake } from "../track";
import { gameSignal } from "../srs";
import type { Mistake, Skill } from "../types";

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
  let level: Level = deck >= 150 ? 2 : 1;
  if (acc !== null) {
    if (acc >= 0.85 && recent.length >= 2) level = (Math.min(3, level + 1) as Level);
    if (acc < 0.5) level = 1;
  }
  return { level, accuracy: acc, deck };
}

/** Called after each answer: feeds the SRS for the learner's own cards and logs mistakes. */
export async function reportAnswer(opts: { correct: boolean; cardId?: string; skill?: Skill; mistake?: MistakeInfo }) {
  if (opts.cardId) await gameSignal(opts.cardId, opts.correct, opts.skill ?? "recognition").catch(() => {});
  if (!opts.correct && opts.mistake && !opts.cardId) await recordMistake(opts.mistake).catch(() => {});
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
