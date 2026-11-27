"use client";
// Spaced repetition with FSRS (ts-fsrs). One FSRS state per card × skill
// (recognition EN→FR, production FR→EN, listening audio→meaning).
import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Card as FCard, type Grade as FGrade } from "ts-fsrs";
import { getDb, uid } from "./db";
import { trackActivity, recordMistake } from "./track";
import type { Card, Grade, ReviewLog, Skill, SrsState } from "./types";

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true, request_retention: 0.9, maximum_interval: 3650 }));

export const DURABLE_DAYS = 21; // stability threshold to count a word as "durably memorised"

function toFsrs(s: SrsState): FCard {
  return {
    due: new Date(s.due), stability: s.stability, difficulty: s.difficulty, elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days, learning_steps: s.learning_steps, reps: s.reps, lapses: s.lapses,
    state: s.state as State, last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

function fromFsrs(base: Pick<SrsState, "id" | "cardId" | "skill">, c: FCard): SrsState {
  return {
    ...base, due: c.due.getTime(), stability: c.stability, difficulty: c.difficulty, elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days, learning_steps: c.learning_steps, reps: c.reps, lapses: c.lapses,
    state: c.state, last_review: c.last_review?.getTime(), updatedAt: Date.now(),
  };
}

export function newSrs(cardId: string, skill: Skill, dueOffsetMs = 0): SrsState {
  const now = new Date(Date.now() + dueOffsetMs);
  return fromFsrs({ id: `${cardId}:${skill}`, cardId, skill }, createEmptyCard(now));
}

/** Create the three skill states for a newly learned card (production/listening start a day later). */
export async function scheduleNewCard(cardId: string) {
  const db = getDb();
  const day = 24 * 3600 * 1000;
  const states = [newSrs(cardId, "recognition"), newSrs(cardId, "production", day), newSrs(cardId, "listening", 2 * day)];
  for (const s of states) {
    const exists = await db.srs.get(s.id);
    if (!exists) await db.srs.put(s);
  }
}

/** Human-readable next intervals for the four answer buttons. */
export function previewIntervals(s: SrsState, now = new Date()): Record<Grade, string> {
  const prev = scheduler.repeat(toFsrs(s), now);
  const out = {} as Record<Grade, string>;
  for (const g of [1, 2, 3, 4] as Grade[]) {
    const due = prev[g as unknown as FGrade].card.due.getTime();
    out[g] = formatInterval(due - now.getTime());
  }
  return out;
}

export function formatInterval(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} j`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mois`;
  return `${(d / 365).toFixed(1)} an${d >= 730 ? "s" : ""}`;
}

/** Apply a review. Returns the updated state. */
export async function gradeCard(cardId: string, skill: Skill, grade: Grade, opts: { ms?: number; context?: ReviewLog["context"] } = {}) {
  const db = getDb();
  const id = `${cardId}:${skill}`;
  const cur = (await db.srs.get(id)) ?? newSrs(cardId, skill);
  const now = new Date();
  const res = scheduler.next(toFsrs(cur), now, grade as unknown as FGrade);
  const next = fromFsrs({ id, cardId, skill }, res.card);
  await db.transaction("rw", db.srs, db.reviewLogs, async () => {
    await db.srs.put(next);
    await db.reviewLogs.put({ id: uid("rv"), cardId, skill, rating: grade, at: now.getTime(), ms: opts.ms, context: opts.context ?? "review", updatedAt: Date.now() });
  });
  await trackActivity({ reviews: 1, correct: grade >= 3 ? 1 : 0, xp: grade >= 3 ? 2 : 1 });
  if (grade === 1) {
    const card = await db.cards.get(cardId);
    if (card) await recordMistake({ id: `vocab:${cardId}`, type: "vocab", label: card.term, detail: card.fr });
  }
  return next;
}

/** Lightweight signal from games: correct answers count as "Good", wrong as "Again" but only when due-ish,
 * so that games reinforce memory without wrecking the schedule. */
export async function gameSignal(cardId: string, correct: boolean, skill: Skill = "recognition") {
  const db = getDb();
  const s = await db.srs.get(`${cardId}:${skill}`);
  if (!s) return;
  const now = Date.now();
  const halfway = s.last_review ? s.last_review + (s.due - s.last_review) / 2 : 0;
  if (!correct) {
    // A miss in a game brings the card forward (reviewed again soon) and is logged as a mistake.
    await db.srs.update(s.id, { due: Math.min(s.due, now + 10 * 60 * 1000) });
    const card = await db.cards.get(cardId);
    if (card) await recordMistake({ id: `vocab:${cardId}`, type: "vocab", label: card.term, detail: card.fr });
  } else if (now >= halfway) {
    await gradeCard(cardId, skill, 3, { context: "game" });
  }
}

export interface QueueItem {
  state: SrsState;
  card: Card;
}

/** Due reviews, prioritised: most overdue relative to interval, frequent lapses, high conversational utility. */
export async function getDueQueue(limit = 100, skills?: Skill[]): Promise<QueueItem[]> {
  const db = getDb();
  const now = Date.now();
  const due = await db.srs.where("due").belowOrEqual(now).toArray();
  const filtered = due.filter((s) => !skills || skills.includes(s.skill));
  const cards = await db.cards.bulkGet([...new Set(filtered.map((s) => s.cardId))]);
  const byId = new Map(cards.filter(Boolean).map((c) => [c!.id, c!]));
  const items: (QueueItem & { score: number })[] = [];
  for (const s of filtered) {
    const card = byId.get(s.cardId);
    if (!card || card.suspended) continue;
    const interval = Math.max(1, s.scheduled_days) * 86400000;
    const overdue = (now - s.due) / interval;
    const utility = card.frequencyRank ? Math.max(0, 1 - card.frequencyRank / 3000) : 0.3;
    const score = overdue + s.lapses * 0.5 + utility + (s.skill === "recognition" ? 0.2 : 0);
    items.push({ state: s, card, score });
  }
  items.sort((a, b) => b.score - a.score);
  // Avoid showing the same card twice in a row with different skills.
  const out: QueueItem[] = [];
  const seenRecently: string[] = [];
  const pending = [...items];
  while (pending.length && out.length < limit) {
    let idx = pending.findIndex((p) => !seenRecently.includes(p.card.id));
    if (idx < 0) idx = 0;
    const [it] = pending.splice(idx, 1);
    out.push({ state: it.state, card: it.card });
    seenRecently.push(it.card.id);
    if (seenRecently.length > 3) seenRecently.shift();
  }
  return out;
}

export function isNew(s: SrsState) {
  return s.state === State.New;
}
export function isDurable(s: SrsState) {
  return s.state === State.Review && s.stability >= DURABLE_DAYS;
}
export { Rating, State };
