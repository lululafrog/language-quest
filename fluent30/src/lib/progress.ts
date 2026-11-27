"use client";
// Aggregated progress metrics for the dashboard, statistics and CEFR estimate.
import { getDb, todayKey } from "./db";
import { computeStreak } from "./track";
import { DURABLE_DAYS, State } from "./srs";
import type { Card, DayActivity, SrsState, TestResult, SkillArea } from "./types";

export interface Overview {
  totalCards: number;
  newToday: number;
  dueNow: number;
  dueToday: number;
  memorized: number; // durable recognition
  learning: number;
  discovered: number;
  verbsMastered: number;
  verbsStudied: number;
  grammarDone: number;
  streak: number;
  todaySeconds: number;
  weekSeconds: number;
  totalSeconds: number;
  successRate: number; // last 30 days
  topMistakes: { id: string; label: string; detail?: string; count: number; type: string }[];
  currentBook?: { id: string; title: string; progress: number };
  days: DayActivity[];
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export async function computeOverview(): Promise<Overview> {
  const db = getDb();
  const [cards, srs, days, mistakes, grammar, books, logs] = await Promise.all([
    db.cards.toArray(), db.srs.toArray(), db.activity.toArray(), db.mistakes.orderBy("count").reverse().limit(30).toArray(),
    db.grammar.toArray(), db.books.orderBy("lastOpenedAt").reverse().limit(1).toArray(),
    db.reviewLogs.where("at").above(Date.now() - 30 * 86400000).toArray(),
  ]);
  const active = new Set(cards.filter((c) => !c.suspended).map((c) => c.id));
  const now = Date.now();
  const eod = endOfToday();
  const rec = srs.filter((s) => s.skill === "recognition" && active.has(s.cardId));
  const memorized = rec.filter((s) => s.state === State.Review && s.stability >= DURABLE_DAYS).length;
  const learning = rec.filter((s) => s.state !== State.New && !(s.state === State.Review && s.stability >= DURABLE_DAYS)).length;
  const activeSrs = srs.filter((s) => active.has(s.cardId));
  const verbCards = cards.filter((c) => c.kind === "verb" || c.source === "verbs");
  const recById = new Map(rec.map((s) => [s.cardId, s]));
  const verbsMastered = verbCards.filter((c) => {
    const s = recById.get(c.id);
    return s && s.state === State.Review && s.stability >= DURABLE_DAYS;
  }).length;
  const today = todayKey();
  const todayAct = days.find((d) => d.date === today);
  const weekAgo = todayKey(new Date(now - 6 * 86400000));
  const recent = mistakes.filter((m) => m.lastAt > now - 30 * 86400000).sort((a, b) => b.count - a.count).slice(0, 5);
  const book = books[0];
  return {
    totalCards: active.size,
    newToday: todayAct?.newWords ?? 0,
    dueNow: activeSrs.filter((s) => s.due <= now).length,
    dueToday: activeSrs.filter((s) => s.due <= eod).length,
    memorized,
    learning,
    discovered: cards.length,
    verbsMastered,
    verbsStudied: verbCards.length,
    grammarDone: grammar.filter((g) => g.status === "done").length,
    streak: computeStreak(days),
    todaySeconds: todayAct?.seconds ?? 0,
    weekSeconds: days.filter((d) => d.date >= weekAgo).reduce((a, d) => a + d.seconds, 0),
    totalSeconds: days.reduce((a, d) => a + d.seconds, 0),
    successRate: logs.length ? logs.filter((l) => l.rating >= 3).length / logs.length : 0,
    topMistakes: recent.map((m) => ({ id: m.id, label: m.label, detail: m.detail, count: m.count, type: m.type })),
    currentBook: book ? { id: book.id, title: book.title, progress: book.progress } : undefined,
    days: days.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function formatDuration(sec: number, immersion = false): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return immersion ? `${h} h ${r ? `${r} min` : ""}` : `${h} h ${r ? String(r).padStart(2, "0") : ""}`;
}

// ---------- Skill scores & prudent CEFR estimate ----------

export interface SkillScores {
  scores: Partial<Record<SkillArea, number>>; // 0..1 — only skills with evidence
  evidence: Partial<Record<SkillArea, number>>; // number of data points
  cefr: string | null; // e.g. "A2" or "A2–B1"; null if not enough evidence
  confidence: "faible" | "moyenne" | "bonne";
  vocabSize: number; // durable + known from placement
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export async function computeSkillScores(): Promise<SkillScores> {
  const db = getDb();
  const [srs, known, grammar, games, tests, convs, logs] = await Promise.all([
    db.srs.toArray(), db.known.count(), db.grammar.toArray(), db.games.toArray(), db.tests.orderBy("at").reverse().toArray(),
    db.conversations.toArray(), db.reviewLogs.where("at").above(Date.now() - 60 * 86400000).toArray(),
  ]);
  const scores: SkillScores["scores"] = {};
  const evidence: SkillScores["evidence"] = {};
  const durable = srs.filter((s) => s.skill === "recognition" && s.state === State.Review && s.stability >= DURABLE_DAYS).length;
  const vocabSize = durable + known;

  // Vocabulary: map vocabulary size onto a 0..1 scale (3000 words ≈ 0.75, 5000+ ≈ 1).
  scores.vocabulary = Math.min(1, vocabSize / 5000);
  evidence.vocabulary = srs.length + known;

  const latest = (t: TestResult[], area: SkillArea) => t.find((x) => x.scores[area] !== undefined)?.scores[area];
  // Grammar: lessons completed weighted by score, blended with tests.
  if (grammar.length) {
    const g = grammar.reduce((a, x) => a + x.bestScore, 0) / Math.max(12, grammar.length);
    scores.grammar = blend(Math.min(1, g), latest(tests, "grammar"));
    evidence.grammar = grammar.length;
  } else if (latest(tests, "grammar") !== undefined) {
    scores.grammar = latest(tests, "grammar");
    evidence.grammar = 1;
  }
  // Listening: listening-skill reviews + listening games + tests.
  const listenLogs = logs.filter((l) => l.skill === "listening");
  const listenGames = games.filter((g) => g.gameId.startsWith("listen:") || ["dictation", "listening"].some((k) => g.gameId.includes(k)));
  const lt = latest(tests, "listening");
  if (listenLogs.length + listenGames.length > 0 || lt !== undefined) {
    const rate = listenLogs.length ? listenLogs.filter((l) => l.rating >= 3).length / listenLogs.length : undefined;
    const gameRate = listenGames.length ? listenGames.reduce((a, g) => a + g.score / Math.max(1, g.total), 0) / listenGames.length : undefined;
    scores.listening = blend(avg([rate, gameRate].filter((x): x is number => x !== undefined)) * Math.min(1, vocabSize / 3000 + 0.3), lt);
    evidence.listening = listenLogs.length + listenGames.length;
  }
  // Reading: tests (reading comprehension) + vocabulary coverage.
  const rt = latest(tests, "reading");
  if (rt !== undefined) {
    scores.reading = blend(Math.min(1, vocabSize / 4000), rt);
    evidence.reading = 1;
  }
  // Writing/speaking: production-skill reviews + conversations with reports.
  const prodLogs = logs.filter((l) => l.skill === "production");
  const reports = convs.filter((c) => c.report);
  if (prodLogs.length || reports.length) {
    const prodRate = prodLogs.length ? prodLogs.filter((l) => l.rating >= 3).length / prodLogs.length : 0.5;
    const errPerMsg = reports.length
      ? reports.reduce((a, c) => a + (c.report!.errors.length / Math.max(1, c.messages.filter((m) => m.role === "user").length)), 0) / reports.length
      : 0.5;
    scores.writing = blend(Math.min(1, (prodRate * 0.5 + (1 - Math.min(1, errPerMsg)) * 0.5) * Math.min(1, vocabSize / 3000 + 0.2)), latest(tests, "writing"));
    evidence.writing = prodLogs.length + reports.length;
  }
  const sp = latest(tests, "speaking");
  const pronGames = games.filter((g) => g.gameId.includes("pronunciation") || g.gameId.includes("speak"));
  if (sp !== undefined || pronGames.length) {
    const r = pronGames.length ? pronGames.reduce((a, g) => a + g.score / Math.max(1, g.total), 0) / pronGames.length : undefined;
    scores.speaking = blend((r ?? 0.4) * Math.min(1, vocabSize / 3000 + 0.2), sp);
    evidence.speaking = pronGames.length + (sp !== undefined ? 1 : 0);
  }

  const areas = Object.keys(scores) as SkillArea[];
  const withEvidence = areas.filter((a) => (evidence[a] ?? 0) > 0);
  if (withEvidence.length < 2 || vocabSize < 50) return { scores, evidence, cefr: null, confidence: "faible", vocabSize };
  // Conservative: the estimate is driven by the weakest skills (mean of the two lowest).
  const sorted = withEvidence.map((a) => scores[a]!).sort((a, b) => a - b);
  const conservative = (sorted[0] + (sorted[1] ?? sorted[0])) / 2;
  const idx = Math.min(5, Math.floor(conservative * 6));
  const frac = conservative * 6 - idx;
  const cefr = frac > 0.7 && idx < 5 ? `${LEVELS[idx]}–${LEVELS[idx + 1]}` : LEVELS[idx];
  const confidence = withEvidence.length >= 5 && tests.length >= 2 ? "bonne" : withEvidence.length >= 3 ? "moyenne" : "faible";
  return { scores, evidence, cefr, confidence, vocabSize };
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function blend(a: number, b: number | undefined) {
  return b === undefined ? a : a * 0.4 + b * 0.6;
}

/** Simplified level used to adapt content (AI chat, games): based on the latest estimate. */
export async function currentLevel(): Promise<string> {
  const s = await computeSkillScores();
  return s.cefr?.split("–")[0] ?? (s.vocabSize > 2000 ? "B1" : s.vocabSize > 700 ? "A2" : "A1");
}

export function srsSummary(states: SrsState[]) {
  const by = { new: 0, learning: 0, review: 0, durable: 0 };
  for (const s of states) {
    if (s.state === State.New) by.new++;
    else if (s.state === State.Review && s.stability >= DURABLE_DAYS) by.durable++;
    else if (s.state === State.Review) by.review++;
    else by.learning++;
  }
  return by;
}

export type { Card };
