// Pure logic of the vocabulary engine (no database): CEFR levels, grading of an answer, mastery states and
// the estimation of the learner's real vocabulary level. Shared by every game; unit-tested in tests/vocab.test.ts.
import type { Cefr, Grade, SrsState } from "../types";

export const CEFR_LEVELS: Cefr[] = ["A1", "A2", "B1", "B2", "C1"];
export const DAY = 86_400_000;

export function cefrIndex(l: Cefr): number {
  return CEFR_LEVELS.indexOf(l);
}
export function isCefr(x: unknown): x is Cefr {
  return typeof x === "string" && (CEFR_LEVELS as string[]).includes(x);
}
export function nextLevel(l: Cefr): Cefr | null {
  return CEFR_LEVELS[cefrIndex(l) + 1] ?? null;
}
export function prevLevel(l: Cefr): Cefr | null {
  return CEFR_LEVELS[cefrIndex(l) - 1] ?? null;
}

/** Level of a lexicon word without an editorial level: estimated from its spoken-frequency rank. */
export function cefrFromRank(rank: number): Cefr {
  if (rank <= 600) return "A1";
  if (rank <= 1500) return "A2";
  if (rank <= 2700) return "B1";
  return "B2";
}

/** Level of a card created by AI enrichment (difficulty 1–5) when the word isn't in the shared lexicon. */
export function cefrFromDifficulty(d?: number): Cefr {
  return CEFR_LEVELS[Math.min(4, Math.max(0, Math.round(d ?? 3) - 1))];
}

// ---------- Grading one answer ----------

export interface Outcome {
  correct: boolean;
  /** accepted with a small spelling mistake */
  approximate?: boolean;
  /** the learner asked for a hint / revealed letters */
  hint?: boolean;
  /** response time */
  ms?: number;
  /** typed answer (production) rather than a choice */
  typed?: boolean;
}

export const SLOW_MS = { choice: 9000, typed: 16000 };
export const FAST_MS = { choice: 3500, typed: 7000 };

export function isSlow(o: Outcome): boolean {
  return o.ms !== undefined && o.ms > (o.typed ? SLOW_MS.typed : SLOW_MS.choice);
}

/**
 * FSRS grade for a game answer:
 *  wrong → Again (1) · correct but with a hint, a spelling slip or too slow → Hard (2)
 *  correct → Good (3) · a word never studied before, found immediately and quickly → Easy (4): the learner
 *  already knew it, so it is "provisionally mastered" and only checked again days later.
 */
export function gradeOf(o: Outcome, firstEncounter: boolean): Grade {
  if (!o.correct) return 1;
  if (o.approximate || o.hint || isSlow(o)) return 2;
  const fast = o.ms !== undefined && o.ms < (o.typed ? FAST_MS.typed : FAST_MS.choice);
  if (firstEncounter && fast) return 4;
  return 3;
}

/** Score of a graded answer for level estimation: Again 0, Hard 0.5, Good/Easy 1. */
export function answerScore(g: Grade): number {
  return g === 1 ? 0 : g === 2 ? 0.5 : 1;
}

// ---------- Mastery states ----------

export type WordStatus = "new" | "learning" | "review" | "good" | "durable";
export const STATUS_ORDER: WordStatus[] = ["review", "new", "learning", "good", "durable"];
export const STATUS_INFO: Record<WordStatus, { label: string; short: string; desc: string; tone: "gray" | "sun" | "coral" | "ink" | "mint" }> = {
  new: { label: "Nouveau", short: "Nouveaux", desc: "Pas encore travaillé en jeu ou en révision.", tone: "gray" },
  learning: { label: "En cours d'apprentissage", short: "En cours", desc: "Réussi récemment, la mémoire n'est pas encore stable.", tone: "ink" },
  review: { label: "À réviser", short: "À réviser", desc: "Raté, trouvé avec un indice, trop lentement, ou date de révision passée.", tone: "coral" },
  good: { label: "Bien maîtrisé", short: "Bien maîtrisés", desc: "Retrouvé sans aide ; il reviendra dans quelques jours pour vérifier.", tone: "mint" },
  durable: { label: "Maîtrisé durablement", short: "Durables", desc: "Réussi plusieurs fois sur plusieurs semaines.", tone: "mint" },
};

const REVIEW_STATE = 2;
const RELEARNING = 3;
export const GOOD_DAYS = 7;
export const DURABLE_DAYS = 21;

/**
 * Status of a word from its FSRS states (one per skill) and its answer history.
 * A word found once is at best "Bien maîtrisé": "Maîtrisé durablement" needs ≥ 3 successes and a memory
 * stability of 3 weeks or more, i.e. answers spread over time.
 */
export function statusOf(states: SrsState[], history: { last?: { rating: Grade; at: number }; successes: number }, now = Date.now()): WordStatus {
  const done = states.filter((s) => s.reps > 0);
  if (!done.length) return "new";
  if (done.some((s) => s.state === RELEARNING)) return "review";
  if (history.last && history.last.rating <= 2) return "review";
  if (done.some((s) => s.state === REVIEW_STATE && s.due <= now)) return "review";
  const stab = Math.max(...done.map((s) => s.stability));
  if (stab >= DURABLE_DAYS && history.successes >= 3) return "durable";
  if (stab >= GOOD_DAYS) return "good";
  return "learning";
}

/** Mastery score 0–100 shown on a word (stability on a log scale, penalised by recent failures). */
export function masteryScore(states: SrsState[], status: WordStatus): number {
  const done = states.filter((s) => s.reps > 0);
  if (!done.length) return 0;
  const stab = Math.max(...done.map((s) => s.stability));
  const base = Math.min(100, Math.round((Math.log1p(stab) / Math.log1p(60)) * 100));
  return status === "review" ? Math.min(base, 35) : base;
}

// ---------- Real vocabulary level ----------

export interface LevelAnswer {
  cefr: Cefr;
  grade: Grade;
  at: number;
}

export interface LevelState {
  level: Cefr;
  /** temporarily working one level below after difficulties */
  down?: boolean;
}

export interface LevelStats {
  n: number;
  acc: number;
}

export const PROMOTE = { minAnswers: 20, acc: 0.85, nextMin: 8, nextAcc: 0.65 };
export const STRUGGLE = { minAnswers: 12, acc: 0.55 };
export const RECOVER = { minAnswers: 10, acc: 0.8 };
const WINDOW = 30;

/** Accuracy per level over the most recent WINDOW answers of each level. */
export function levelStats(answers: LevelAnswer[]): Record<Cefr, LevelStats> {
  const out = Object.fromEntries(CEFR_LEVELS.map((l) => [l, { n: 0, acc: 0 }])) as Record<Cefr, LevelStats>;
  const sorted = [...answers].sort((a, b) => b.at - a.at);
  const sums = Object.fromEntries(CEFR_LEVELS.map((l) => [l, 0])) as Record<Cefr, number>;
  for (const a of sorted) {
    const s = out[a.cefr];
    if (!s || s.n >= WINDOW) continue;
    s.n++;
    sums[a.cefr] += answerScore(a.grade);
  }
  for (const l of CEFR_LEVELS) out[l].acc = out[l].n ? sums[l] / out[l].n : 0;
  return out;
}

export interface LevelEstimate {
  state: LevelState;
  change: "up" | "down" | "back" | "recovered" | null;
  stats: Record<Cefr, LevelStats>;
  /** 0..1 progress toward the next level */
  progress: number;
}

/**
 * Adjusts the vocabulary level one step at a time, from real answers (never only from the declared level):
 *  - up: ≥ 85 % over the last 20+ answers of the level, and the next level isn't clearly too hard
 *  - temporarily down: < 55 % over 12+ answers → work one level below
 *  - recovered: back to the level after ≥ 80 % on 10+ answers of the level below
 *  - back: still struggling one level below → that lower level becomes the level
 */
export function estimateLevel(answers: LevelAnswer[], current: LevelState): LevelEstimate {
  const stats = levelStats(answers);
  const L = current.level;
  const s = stats[L];
  const up = nextLevel(L);
  const below = prevLevel(L);
  let state: LevelState = { ...current };
  let change: LevelEstimate["change"] = null;

  if (current.down && below) {
    const b = stats[below];
    if (b.n >= RECOVER.minAnswers && b.acc >= RECOVER.acc) {
      state = { level: L, down: false };
      change = "recovered";
    } else if (b.n >= STRUGGLE.minAnswers && b.acc < STRUGGLE.acc) {
      state = { level: below, down: false };
      change = "back";
    }
  } else if (s.n >= PROMOTE.minAnswers && s.acc >= PROMOTE.acc && up) {
    const n = stats[up];
    if (n.n < PROMOTE.nextMin || n.acc >= PROMOTE.nextAcc) {
      state = { level: up, down: false };
      change = "up";
    }
  } else if (s.n >= STRUGGLE.minAnswers && s.acc < STRUGGLE.acc && below) {
    state = { level: L, down: true };
    change = "down";
  }

  const cur = stats[state.level];
  const progress = !nextLevel(state.level)
    ? Math.min(1, cur.acc)
    : Math.max(0, Math.min(1, Math.min(1, cur.n / PROMOTE.minAnswers) * 0.4 + Math.max(0, Math.min(1, (cur.acc - 0.5) / (PROMOTE.acc - 0.5))) * 0.6));
  return { state, change, stats, progress: change === "up" ? 0 : progress };
}

/** Share of each level in the words proposed in "new words" mode. */
export function levelMix(state: LevelState): { level: Cefr; share: number }[] {
  const main = state.down ? (prevLevel(state.level) ?? state.level) : state.level;
  const up = nextLevel(main);
  const below = prevLevel(main);
  const mix = [{ level: main, share: 0.7 }];
  if (up) mix.push({ level: up, share: state.down ? 0.3 : 0.2 });
  if (below && !state.down) mix.push({ level: below, share: 0.1 });
  const total = mix.reduce((a, m) => a + m.share, 0);
  return mix.map((m) => ({ ...m, share: m.share / total }));
}

/** "Niveau actuel : B1 – En route vers B2" */
export function levelLabel(state: LevelState): string {
  const up = nextLevel(state.level);
  if (state.down) return `Niveau actuel : ${state.level} – on consolide le ${prevLevel(state.level)}`;
  return up ? `Niveau actuel : ${state.level} – En route vers ${up}` : `Niveau actuel : ${state.level} – Niveau avancé`;
}
