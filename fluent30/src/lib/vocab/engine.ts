"use client";
// Central vocabulary engine shared by ALL games (and by missions, tests and exercises via gameSignal):
//   selectWords()      → which words to ask, for "new words" or "review" mode, at the learner's real level
//   recordWordAnswer() → one answer updates the learner's single vocabulary base (cards + FSRS + stats), persistently
//   updateLevel()      → re-estimates the real vocabulary level from answers (A1 → C1, one step at a time)
// There is ONE personal vocabulary base: the `cards` table (deduplicated by lemma), with FSRS states in `srs` and the
// answer history in `reviewLogs`. Words met in books, lessons, photos, captures, missions or games all land there.
import { getDb, getSettings, saveSettings, todayKey, uid } from "../db";
import { cardFromSeed, classifyCard, findDuplicate, lemmaOf } from "../cards";
import { gradeCard } from "../srs";
import { trackActivity } from "../track";
import { shuffle } from "../text";
import type { PoolItem } from "../pool";
import type { Card, Cefr, Grade, ReviewLog, Skill, SrsState } from "../types";
import { CEFR_LEVELS, cefrIndex, estimateLevel, gradeOf, levelMix, statusOf, type LevelEstimate, type LevelState, type Outcome, type WordStatus } from "./core";
import { cardLevel, inGroup, lexWord, themeGroup, type LexWord } from "./words";
import { loadFullLexicon } from "./lexicon-full";

export type WordMode = "new" | "review";

const startOfToday = () => new Date().setHours(0, 0, 0, 0);
const SKIP_POS = new Set(["det", "pron", "conj", "prep", "num", "interj"]);

export function itemFromLex(w: LexWord): PoolItem {
  return {
    key: `seed:${w.rank}`, en: w.en, fr: w.fr, pos: w.pos, example: w.ex, exampleFr: w.exFr, ipa: w.ipa, def: w.def,
    synonyms: w.synonym ? [w.synonym] : undefined, cefr: w.level, themes: w.themes, isNew: true, rank: w.rank, weakness: 0.5,
  };
}

export function itemFromCard(c: Card, weakness = 0.5): PoolItem {
  const lex = lexWord(c.lemma);
  return {
    key: c.id, cardId: c.id, en: c.term, fr: c.fr, pos: c.pos, example: c.example ?? lex?.ex, exampleFr: c.exampleFr ?? (c.example ? undefined : lex?.exFr),
    imageKey: c.imageKey, synonyms: c.synonyms?.length ? c.synonyms : lex?.synonym ? [lex.synonym] : undefined, ipa: c.ipa ?? lex?.ipa,
    def: c.definition ?? lex?.def, cefr: cardLevel(c), themes: c.themes, isNew: false, rank: c.frequencyRank, weakness,
  };
}

// ---------- learner data ----------

export interface WordData {
  card: Card;
  states: SrsState[];
  logs: ReviewLog[];
  status: WordStatus;
}

export async function loadWords(): Promise<WordData[]> {
  const db = getDb();
  const [cards, srs, logs] = await Promise.all([db.cards.toArray(), db.srs.toArray(), db.reviewLogs.toArray()]);
  const st = new Map<string, SrsState[]>();
  for (const s of srs) (st.get(s.cardId) ?? st.set(s.cardId, []).get(s.cardId)!).push(s);
  const lg = new Map<string, ReviewLog[]>();
  for (const l of logs) (lg.get(l.cardId) ?? lg.set(l.cardId, []).get(l.cardId)!).push(l);
  const now = Date.now();
  return cards
    .filter((c) => !c.suspended && c.fr)
    .map((card) => {
      const states = st.get(card.id) ?? [];
      const l = (lg.get(card.id) ?? []).sort((a, b) => a.at - b.at);
      return { card, states, logs: l, status: statusOf(states, historyOf(l), now) };
    });
}

export function historyOf(logs: ReviewLog[]) {
  const last = logs[logs.length - 1];
  return { last: last ? { rating: last.rating, at: last.at } : undefined, successes: logs.filter((l) => l.rating >= 3).length };
}

export async function wordStatuses(): Promise<Map<string, WordStatus>> {
  return new Map((await loadWords()).map((w) => [w.card.id, w.status]));
}

// ---------- level ----------

export async function getLevelState(): Promise<LevelState> {
  const s = await getSettings();
  return s.vocabLevel ? { level: s.vocabLevel.level, down: s.vocabLevel.down } : { level: s.pathLevel ?? "A1" };
}

/** First answer per word and per day (retries in the same session don't count twice), last 90 days. */
async function levelAnswers(words?: WordData[]) {
  const ws = words ?? (await loadWords());
  const since = Date.now() - 90 * 86_400_000;
  const out: { cefr: Cefr; grade: Grade; at: number }[] = [];
  for (const w of ws) {
    const lvl = cardLevel(w.card);
    const days = new Set<string>();
    for (const l of w.logs) {
      if (l.at < since) continue;
      const d = todayKey(new Date(l.at));
      if (days.has(d)) continue;
      days.add(d);
      out.push({ cefr: lvl, grade: l.rating, at: l.at });
    }
  }
  return out;
}

/** Re-estimates the level from the learner's answers and saves it when it changes. */
export async function updateLevel(): Promise<LevelEstimate> {
  const cur = await getLevelState();
  const est = estimateLevel(await levelAnswers(), cur);
  const s = await getSettings();
  if (est.change || !s.vocabLevel) await saveSettings({ vocabLevel: { level: est.state.level, down: est.state.down, at: Date.now() } });
  return est;
}

export async function levelOverview(): Promise<LevelEstimate> {
  return estimateLevel(await levelAnswers(), await getLevelState());
}

// ---------- selection ----------

export interface SelectOpts {
  mode: WordMode;
  n: number;
  theme?: string;
  /** game constraint (length, needs an example…) */
  filter?: (p: PoolItem) => boolean;
  /** keys already used in this session */
  exclude?: Set<string>;
}

export interface Selection {
  items: PoolItem[];
  /** review mode: how many new words completed the list (not enough words to review) */
  filledWithNew: number;
  level: LevelState;
}

function weightedTake<T>(items: { v: T; w: number }[], n: number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((a, p) => a + p.w, 0);
    let r = Math.random() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= pool[i].w;
      if (r <= 0) break;
    }
    out.push(pool.splice(i, 1)[0].v);
  }
  return out;
}

/** Priority of a word in review mode (0 = don't ask today). */
export function reviewPriority(w: WordData, now = Date.now()): number {
  const today = startOfToday();
  const last = w.logs[w.logs.length - 1];
  if (last && last.at >= today && last.rating >= 3) return 0; // already found today
  const lapses = w.states.reduce((a, s) => a + s.lapses, 0);
  const wrong = w.card.gameStats?.wrong ?? 0;
  const due = Math.min(...w.states.filter((s) => s.reps > 0).map((s) => s.due), Infinity);
  const overdue = due === Infinity ? 0 : Math.max(0, Math.min(3, (now - due) / 86_400_000 / 3));
  switch (w.status) {
    case "review":
      return 5 + Math.min(3, lapses * 0.5 + wrong * 0.3) + overdue;
    case "new":
      return w.card.source === "seed" ? 2.5 : 3.5; // words the learner added or met but never practised
    case "learning":
      return due <= now ? 3 + overdue : 1;
    case "good":
      return due <= now ? 2 + overdue : 0;
    case "durable":
      return due <= now ? 1.5 : 0;
  }
}

async function selectNew(n: number, opts: SelectOpts, level: LevelState, known: Set<string>): Promise<PoolItem[]> {
  const group = themeGroup(opts.theme);
  const usable = (w: LexWord, withTheme: boolean) =>
    !known.has(w.lemma) && !SKIP_POS.has(w.pos) && !opts.exclude?.has(`seed:${w.rank}`) && (!withTheme || inGroup([...(w.themes ?? []), ...(w.subs ?? [])], group)) && (!opts.filter || opts.filter(itemFromLex(w)));
  const lex: LexWord[] = await loadFullLexicon();
  const picked: LexWord[] = [];
  const take = (cands: LexWord[], k: number) => {
    // frequent words first: random sample among the most frequent remaining words of the level (progressive)
    const sorted = cands.filter((w) => !picked.includes(w)).sort((a, b) => a.rank - b.rank);
    picked.push(...shuffle(sorted.slice(0, Math.max(k * 4, 30))).slice(0, k));
  };
  const mix = levelMix(level);
  let left = n;
  mix.forEach((m, i) => {
    const k = i === mix.length - 1 ? left : Math.round(n * m.share);
    take(lex.filter((w) => w.level === m.level && usable(w, true)), k);
    left = n - picked.length;
  });
  // Not enough words of that theme at these levels: widen to neighbouring levels, then to every theme.
  if (picked.length < n) {
    const main = cefrIndex(mix[0].level);
    const near = [...CEFR_LEVELS].sort((a, b) => Math.abs(cefrIndex(a) - main) - Math.abs(cefrIndex(b) - main));
    for (const withTheme of [true, false])
      for (const l of near) if (picked.length < n) take(lex.filter((w) => w.level === l && usable(w, withTheme)), n - picked.length);
  }
  return picked.map(itemFromLex);
}

export async function selectWords(opts: SelectOpts): Promise<Selection> {
  const level = await getLevelState();
  const words = await loadWords();
  const known = new Set<string>();
  for (const w of words) {
    known.add(w.card.lemma);
    known.add(lemmaOf(w.card.term));
  }
  // suspended cards are known too (never proposed as "new")
  for (const c of await getDb().cards.toArray()) if (c.suspended) known.add(c.lemma);

  if (opts.mode === "new") return { items: shuffle(await selectNew(opts.n, opts, level, known)), filledWithNew: 0, level };

  const group = themeGroup(opts.theme);
  const now = Date.now();
  const cands = words
    .filter((w) => !opts.exclude?.has(w.card.id) && inGroup([...w.card.themes, ...(w.card.subs ?? [])], group))
    .map((w) => ({ w, p: reviewPriority(w, now), item: itemFromCard(w.card, w.status === "review" ? 0.9 : 0.5) }))
    .filter((x) => x.p > 0 && (!opts.filter || opts.filter(x.item)));
  // the most urgent first, with some variety among words of similar priority
  const ordered = weightedTake(cands.sort((a, b) => b.p - a.p).slice(0, opts.n * 3).map((x) => ({ v: x.item, w: x.p ** 2 })), opts.n);
  let filledWithNew = 0;
  if (ordered.length < opts.n) {
    const extra = await selectNew(opts.n - ordered.length, opts, level, known);
    filledWithNew = extra.length;
    ordered.push(...extra);
  }
  // priority order (most urgent first): games keep the first words they need
  return { items: ordered, filledWithNew, level };
}

/** Number of words waiting for review (for the mode screen). */
export async function reviewCount(theme?: string): Promise<{ toReview: number; total: number }> {
  const words = await loadWords();
  const group = themeGroup(theme);
  const now = Date.now();
  const inTheme = words.filter((w) => inGroup([...w.card.themes, ...(w.card.subs ?? [])], group));
  return { toReview: inTheme.filter((w) => reviewPriority(w, now) >= 2).length, total: inTheme.length };
}

// ---------- answers ----------

export interface AnswerResult {
  cardId: string;
  grade: Grade;
  createdCard: boolean;
  status: WordStatus;
}

/** Creates (or finds) the learner's card for a lexicon word met in a game. One word = one card (dedup by lemma). */
export async function ensureCard(item: PoolItem, source: Card["source"] = "game"): Promise<{ card: Card; created: boolean }> {
  const db = getDb();
  if (item.cardId) {
    const c = await db.cards.get(item.cardId);
    if (c) return { card: c, created: false };
  }
  const dup = await findDuplicate(item.en);
  if (dup) return { card: dup, created: false };
  const lex = lexWord(item.en);
  const now = Date.now();
  const card: Card = lex
    ? { ...cardFromSeed(lex, source), cefr: lex.level, synonyms: lex.synonym ? [lex.synonym] : undefined }
    : {
        id: uid("c"), term: item.en, lemma: lemmaOf(item.en), kind: "word", fr: item.fr, pos: item.pos, example: item.example, exampleFr: item.exampleFr,
        ipa: item.ipa, definition: item.def, synonyms: item.synonyms, themes: item.themes ?? ["daily"], cefr: item.cefr, source, enriched: true, createdAt: now, updatedAt: now,
      };
  const classified = classifyCard(card);
  await db.cards.put(classified);
  await trackActivity({ newWords: 1 });
  return { card: classified, created: true };
}

/**
 * Records one answer in a game: creates the card for a new word, grades it in FSRS (long-term steps), updates
 * its counters and where it was met. A word already graded today is not re-graded on success (a second correct
 * answer the same day proves nothing about long-term memory); a miss always brings it back.
 */
let queue: Promise<unknown> = Promise.resolve();
export function recordWordAnswer(item: PoolItem, outcome: Outcome, ctx: { gameId: string; skill?: Skill }): Promise<AnswerResult> {
  // answers are saved one after the other: two quick answers on the same new word must not create two cards
  const run = queue.then(() => recordOne(item, outcome, ctx));
  queue = run.catch(() => undefined);
  return run;
}

async function recordOne(item: PoolItem, outcome: Outcome, ctx: { gameId: string; skill?: Skill }): Promise<AnswerResult> {
  const db = getDb();
  const skill = ctx.skill ?? "recognition";
  const { card, created } = await ensureCard(item);
  item.cardId = card.id;
  item.key = item.key.startsWith("seed:") ? item.key : card.id;
  const states = await db.srs.where("cardId").equals(card.id).toArray();
  const firstEncounter = !states.some((s) => s.reps > 0);
  const grade = gradeOf(outcome, firstEncounter);
  const today = startOfToday();
  const gradedToday = states.some((s) => (s.last_review ?? 0) >= today);
  if (grade <= 2 || !gradedToday) await gradeCard(card.id, skill, grade, { ms: outcome.ms, context: "game", longTerm: true });
  const gs = card.gameStats ?? { correct: 0, wrong: 0, hints: 0 };
  const next: Partial<Card> = {
    gameStats: { correct: gs.correct + (outcome.correct ? 1 : 0), wrong: gs.wrong + (outcome.correct ? 0 : 1), hints: gs.hints + (outcome.hint ? 1 : 0), lastAt: Date.now() },
    seenIn: [...new Set([...(card.seenIn ?? []), ctx.gameId])].slice(-12),
    cefr: card.cefr ?? cardLevel(card),
    updatedAt: Date.now(),
  };
  await db.cards.update(card.id, next);
  const [st, logs] = await Promise.all([db.srs.where("cardId").equals(card.id).toArray(), db.reviewLogs.where("cardId").equals(card.id).sortBy("at")]);
  return { cardId: card.id, grade, createdCard: created, status: statusOf(st, historyOf(logs)) };
}

/** Counters for answers coming from other activities (missions, tests, exercises) that grade cards themselves. */
export async function noteAnswer(cardId: string, correct: boolean, where: string) {
  const db = getDb();
  const c = await db.cards.get(cardId);
  if (!c) return;
  const gs = c.gameStats ?? { correct: 0, wrong: 0, hints: 0 };
  await db.cards.update(cardId, {
    gameStats: { ...gs, correct: gs.correct + (correct ? 1 : 0), wrong: gs.wrong + (correct ? 0 : 1), lastAt: Date.now() },
    seenIn: [...new Set([...(c.seenIn ?? []), where])].slice(-12),
    updatedAt: Date.now(),
  });
}

// ---------- dashboard ----------

export interface VocabDashboard {
  counts: Record<WordStatus, number> & { total: number; mastered: number };
  byLevel: Record<Cefr, { words: number; mastered: number }>;
  byTheme: { id: string; words: number; mastered: number }[];
  today: { learned: number; reviewed: number };
  words: { card: Card; status: WordStatus; level: Cefr; nextReview?: number; correct: number; wrong: number }[];
}

export async function vocabDashboard(): Promise<VocabDashboard> {
  const { groupOf, THEME_GROUPS } = await import("./words");
  const words = await loadWords();
  const counts = { new: 0, learning: 0, review: 0, good: 0, durable: 0, total: 0, mastered: 0 };
  const byLevel = Object.fromEntries(CEFR_LEVELS.map((l) => [l, { words: 0, mastered: 0 }])) as VocabDashboard["byLevel"];
  const theme = new Map(THEME_GROUPS.map((g) => [g.id, { id: g.id, words: 0, mastered: 0 }]));
  const today = startOfToday();
  let learned = 0;
  let reviewed = 0;
  const rows: VocabDashboard["words"] = [];
  for (const w of words) {
    const lvl = cardLevel(w.card);
    const mastered = w.status === "good" || w.status === "durable";
    counts[w.status]++;
    counts.total++;
    if (mastered) counts.mastered++;
    byLevel[lvl].words++;
    if (mastered) byLevel[lvl].mastered++;
    const g = groupOf(w.card.themes);
    if (g) {
      const t = theme.get(g.id)!;
      t.words++;
      if (mastered) t.mastered++;
    }
    const todayLogs = w.logs.filter((l) => l.at >= today);
    if (w.card.createdAt >= today) {
      if (todayLogs.some((l) => l.rating >= 3)) learned++;
    } else if (todayLogs.length) reviewed++;
    const due = Math.min(...w.states.filter((s) => s.reps > 0).map((s) => s.due), Infinity);
    rows.push({
      card: w.card, status: w.status, level: lvl, nextReview: due === Infinity ? undefined : due,
      correct: w.card.gameStats?.correct ?? w.logs.filter((l) => l.rating >= 3).length, wrong: w.card.gameStats?.wrong ?? w.logs.filter((l) => l.rating === 1).length,
    });
  }
  // daily snapshot of mastered words, for the "évolution" chart
  const db = getDb();
  const key = todayKey();
  const day = await db.activity.get(key);
  if (day) {
    if (day.masteredWords !== counts.mastered) await db.activity.update(key, { masteredWords: counts.mastered });
  } else await trackActivity({}).then(() => db.activity.update(key, { masteredWords: counts.mastered }));
  return { counts, byLevel, byTheme: [...theme.values()], today: { learned, reviewed }, words: rows };
}
