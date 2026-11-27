// Scoring for the full CEFR test: adaptive per-skill levels and a conservative overall profile.
import { LEVELS, type Level } from "./data/cefr-test";

export type SkillKey = "gv" | "reading" | "listening" | "writing" | "speaking";
export const SKILL_LABELS: Record<SkillKey, { fr: string; en: string; area: "grammar" | "reading" | "listening" | "writing" | "speaking" }> = {
  gv: { fr: "Grammaire & vocabulaire", en: "Grammar & vocabulary", area: "grammar" },
  reading: { fr: "Compréhension écrite", en: "Reading", area: "reading" },
  listening: { fr: "Compréhension orale", en: "Listening", area: "listening" },
  writing: { fr: "Expression écrite", en: "Writing", area: "writing" },
  speaking: { fr: "Expression orale", en: "Speaking", area: "speaking" },
};

/** Pass thresholds (stated to the learner): 4/5 for grammar blocks (80 %), 2/3 for reading/listening (≈67 %). */
export function passed(correct: number, total: number, skill: SkillKey): boolean {
  if (skill === "gv") return correct >= Math.ceil(total * 0.8);
  return correct >= Math.ceil(total * 0.67);
}

export interface Adaptive {
  current: number; // level index being tested
  passed: number[];
  failed: number[];
  done: boolean;
  history: { level: number; correct: number; total: number }[];
}

export function startAdaptive(start = 1): Adaptive {
  return { current: start, passed: [], failed: [], done: false, history: [] };
}

/** Moves up after a pass, down after an early fail, stops when the boundary between two levels is found. */
export function stepAdaptive(s: Adaptive, correct: number, total: number, skill: SkillKey): Adaptive {
  const L = s.current;
  const ok = passed(correct, total, skill);
  const next: Adaptive = { ...s, passed: [...s.passed], failed: [...s.failed], history: [...s.history, { level: L, correct, total }] };
  if (ok) {
    next.passed.push(L);
    if (L >= LEVELS.length - 1 || next.failed.includes(L + 1)) next.done = true;
    else next.current = L + 1;
  } else {
    next.failed.push(L);
    if (L === 0 || next.passed.includes(L - 1) || next.passed.length > 0) next.done = true;
    else next.current = L - 1;
  }
  return next;
}

/** Highest level passed; -1 = below A1. */
export function adaptiveResult(s: Adaptive): number {
  return s.passed.length ? Math.max(...s.passed) : -1;
}

export function levelName(i: number): string {
  return i < 0 ? "Pré-A1" : LEVELS[Math.min(i, LEVELS.length - 1)];
}

/** Self-assessment: highest level for which every statement of that level and all levels below is ticked. */
export function selfAssessedLevel(ticked: Record<string, boolean>, grid: Record<Level, string[]>): number {
  let lvl = -1;
  for (let i = 0; i < LEVELS.length; i++) {
    const all = grid[LEVELS[i]].every((_, k) => ticked[`${LEVELS[i]}:${k}`]);
    if (!all) break;
    lvl = i;
  }
  return lvl;
}

export interface SkillResult {
  level: number; // -1..5
  method: "test" | "ai" | "self";
}

/**
 * Overall level: median of the skill levels, capped at one level above the weakest receptive skill
 * (reading / listening) — profiles are reported per skill, as in real CEFR assessment.
 */
export function overallLevel(results: Partial<Record<SkillKey, SkillResult>>): number | null {
  const vals = Object.values(results).filter(Boolean).map((r) => r!.level);
  if (vals.length < 2) return null;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  // Lower median (conservative) when the number of skills is even.
  let median = sorted.length % 2 ? sorted[Math.floor(mid)] : sorted[mid - 1];
  const receptive = [results.reading?.level, results.listening?.level].filter((x): x is number => x !== undefined);
  if (receptive.length) median = Math.min(median, Math.min(...receptive) + 1);
  return median;
}

/** Level index → 0..1 score stored for statistics. */
export function levelToScore(i: number): number {
  return i < 0 ? 0.08 : (i + 1) / 6;
}
