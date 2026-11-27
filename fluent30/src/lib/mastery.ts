"use client";
// Central mastery model: what the learner REALLY knows, derived from spaced-repetition performance
// (FSRS state per skill + review history) — never from the number of times a word was viewed.
//
//   découvert : added / seen, but no solid successful review yet
//   reconnu   : understood when read or heard (recognition/listening stable)
//   employé   : produced from French (production skill stable) — the learner can use it
//   oublié    : recently forgotten (lapse in relearning) or very overdue
import { getDb } from "./db";
import type { Card, ReviewLog, Skill, SrsState } from "./types";

export type MasteryLevel = "oublie" | "decouvert" | "reconnu" | "employe";
export const MASTERY_ORDER: MasteryLevel[] = ["employe", "reconnu", "decouvert", "oublie"];

export const MASTERY_INFO: Record<MasteryLevel, { label: string; short: string; desc: string }> = {
  employe: { label: "Employé", short: "Maîtrisés", desc: "Tu sais le retrouver toi-même à partir du français, de façon durable." },
  reconnu: { label: "Reconnu", short: "En cours", desc: "Tu le comprends quand tu le lis ou l'entends, mais tu ne le produis pas encore." },
  decouvert: { label: "Découvert", short: "Découverts", desc: "Ajouté à tes mots, pas encore réussi en révision." },
  oublie: { label: "Oublié", short: "Oubliés", desc: "Raté récemment ou pas révisé depuis trop longtemps : à reprendre." },
};

const DAY = 86_400_000;
const REVIEW = 2; // ts-fsrs State.Review
const RELEARNING = 3;

/** Successful answers (rating ≥ 3) per skill, and last rating per skill. */
export interface LogSummary {
  success: Partial<Record<Skill, number>>;
  last?: { rating: number; at: number };
}

export function summarizeLogs(logs: ReviewLog[]): LogSummary {
  const out: LogSummary = { success: {} };
  for (const l of logs) {
    if (l.rating >= 3) out.success[l.skill] = (out.success[l.skill] ?? 0) + 1;
    if (!out.last || l.at > out.last.at) out.last = { rating: l.rating, at: l.at };
  }
  return out;
}

function isForgotten(s: SrsState, now: number): boolean {
  if (s.reps === 0) return false;
  if (s.state === RELEARNING) return true;
  // very overdue: more than max(7 days, 2× the planned interval) past due
  const planned = Math.max(1, s.scheduled_days) * DAY;
  return s.state === REVIEW && now - s.due > Math.max(7 * DAY, 2 * planned);
}

/** Mastery of one card from its SRS states (any skills) and optional review-log summary. */
export function masteryOf(_card: Pick<Card, "id">, states: SrsState[], logs?: LogSummary, now = Date.now()): MasteryLevel {
  const by = new Map(states.map((s) => [s.skill, s]));
  const rec = by.get("recognition");
  const prod = by.get("production");
  const lis = by.get("listening");

  if (states.some((s) => isForgotten(s, now))) return "oublie";
  if (logs?.last && logs.last.rating === 1 && now - logs.last.at < 3 * DAY && !states.some((s) => s.state === REVIEW && s.stability >= 7)) return "oublie";

  const stable = (s: SrsState | undefined, days: number) => !!s && s.state === REVIEW && s.stability >= days;
  if (stable(prod, 7)) return "employe";

  const recSuccess = (logs?.success.recognition ?? 0) + (logs?.success.listening ?? 0);
  if (stable(rec, 3) || stable(lis, 3) || recSuccess >= 2 || stable(prod, 2)) return "reconnu";
  return "decouvert";
}

/** Mastery level of every (non-suspended) card. */
export async function masteryMap(now = Date.now()): Promise<Map<string, MasteryLevel>> {
  const db = getDb();
  const [cards, srs, logs] = await Promise.all([db.cards.toArray(), db.srs.toArray(), db.reviewLogs.toArray()]);
  const states = new Map<string, SrsState[]>();
  for (const s of srs) (states.get(s.cardId) ?? states.set(s.cardId, []).get(s.cardId)!).push(s);
  const logsBy = new Map<string, ReviewLog[]>();
  for (const l of logs) (logsBy.get(l.cardId) ?? logsBy.set(l.cardId, []).get(l.cardId)!).push(l);
  const out = new Map<string, MasteryLevel>();
  for (const c of cards) {
    if (c.suspended) continue;
    out.set(c.id, masteryOf(c, states.get(c.id) ?? [], summarizeLogs(logsBy.get(c.id) ?? []), now));
  }
  return out;
}

export type MasteryCounts = Record<MasteryLevel, number> & { total: number };

export function countLevels(levels: Iterable<MasteryLevel>): MasteryCounts {
  const c: MasteryCounts = { employe: 0, reconnu: 0, decouvert: 0, oublie: 0, total: 0 };
  for (const l of levels) {
    c[l]++;
    c.total++;
  }
  return c;
}

/** Global summary (for stats / hubs). */
export async function masterySummary(): Promise<MasteryCounts> {
  return countLevels((await masteryMap()).values());
}
