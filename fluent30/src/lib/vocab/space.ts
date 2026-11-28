"use client";
// Vocabulary space: joins the shared lexicon (≈ 10,000 entries) with the learner's own words (cards + FSRS + history)
// to compute universe / sub-theme statistics, the garden, collections, the library and flashcard sessions.
import { getDb, getSettings, saveSettings } from "../db";
import { gradeCard } from "../srs";
import { shuffle } from "../text";
import type { PoolItem } from "../pool";
import type { Card, Cefr, Grade, Skill, SrsState } from "../types";
import { cefrIndex, levelMix, statusOf, skillMastery, type WordStatus } from "./core";
import { ensureCard, getLevelState, historyOf, itemFromCard, itemFromLex, loadWords, reviewPriority, type WordData } from "./engine";
import { loadFullLexicon, type LexEntry } from "./lexicon-full";
import { cardLevel } from "./words";
import { UNIVERSES, universesOf } from "./universes";
import { COLLECTIONS, collectionWords, collectionById, type VocabCollection } from "./collections";

export interface Space {
  lex: LexEntry[];
  words: WordData[];
  /** learner word by lemma (first sense) */
  byLemma: Map<string, WordData>;
  now: number;
}

export async function loadSpace(): Promise<Space> {
  const [lex, words] = await Promise.all([loadFullLexicon(), loadWords()]);
  const byLemma = new Map<string, WordData>();
  for (const w of words) if (!byLemma.has(w.card.lemma)) byLemma.set(w.card.lemma, w);
  return { lex, words, byLemma, now: Date.now() };
}

export const isConsolidated = (s: WordStatus) => s === "good" || s === "durable";

export function wordSubs(c: Card): string[] {
  return c.subs?.length ? c.subs : [];
}
export function wordUnis(c: Card): string[] {
  return universesOf(c.themes, c.subs);
}

// ---------- universes, sub-themes, garden ----------

export interface Counts {
  /** entries available in the shared lexicon + the learner's own words not in it */
  total: number;
  discovered: number;
  consolidated: number;
  toReview: number;
  toDiscover: number;
}

const empty = (): Counts => ({ total: 0, discovered: 0, consolidated: 0, toReview: 0, toDiscover: 0 });

export interface SpaceStats {
  universes: Record<string, Counts & { subs: Record<string, Counts> }>;
  all: Counts;
}

export function spaceStats(sp: Space): SpaceStats {
  const universes: SpaceStats["universes"] = {};
  for (const u of UNIVERSES) universes[u.id] = { ...empty(), subs: Object.fromEntries(u.subs.map((s) => [s.id, empty()])) };
  const all = empty();
  const add = (c: Counts, w?: WordData) => {
    c.total++;
    if (!w) return c.toDiscover++;
    c.discovered++;
    if (isConsolidated(w.status)) c.consolidated++;
    if (reviewPriority(w, sp.now) >= 2 && w.status !== "new") c.toReview++;
  };
  const counted = new Set<string>();
  for (const e of sp.lex) {
    const w = sp.byLemma.get(e.lemma);
    if (w) counted.add(w.card.id);
    add(all, w);
    for (const u of e.unis) if (universes[u]) add(universes[u], w);
    for (const s of e.subs) {
      const u = universes[s.split(".")[0]];
      if (u?.subs[s]) add(u.subs[s], w);
    }
  }
  // learner's own words that are not in the shared lexicon (book words, photos, personal lists…)
  for (const w of sp.words) {
    if (counted.has(w.card.id)) continue;
    add(all, w);
    for (const u of wordUnis(w.card)) if (universes[u]) add(universes[u], w);
    for (const s of wordSubs(w.card)) {
      const u = universes[s.split(".")[0]];
      if (u?.subs[s]) add(u.subs[s], w);
    }
  }
  return { universes, all };
}

/** Garden: each universe is a plant that grows with consolidated words (never dies). */
export const GARDEN_STAGES = [
  { id: 0, name: "Terre fertile", min: 0 },
  { id: 1, name: "Graine", min: 1 },
  { id: 2, name: "Jeune pousse", min: 3 },
  { id: 3, name: "Plante", min: 20 },
  { id: 4, name: "Arbre", min: 60 },
  { id: 5, name: "Arbre en fleurs", min: 150 },
] as const;

/** Stage from real memory: a seed needs one discovered word, the next stages need consolidated words. */
export function gardenStage(c: Pick<Counts, "discovered" | "consolidated">): number {
  if (c.consolidated >= 150) return 5;
  if (c.consolidated >= 60) return 4;
  if (c.consolidated >= 20) return 3;
  if (c.consolidated >= 3) return 2;
  if (c.discovered >= 1) return 1;
  return 0;
}

export function nextStageGoal(c: Pick<Counts, "discovered" | "consolidated">): { name: string; missing: number } | null {
  const st = gardenStage(c);
  const next = GARDEN_STAGES[st + 1];
  if (!next) return null;
  return { name: next.name, missing: st === 0 ? 1 : next.min - c.consolidated };
}

/** Stages that grew since the learner last saw the garden (celebrated once, then remembered). */
export async function newGardenStages(stats: SpaceStats): Promise<{ universe: string; stage: number }[]> {
  const s = await getSettings();
  const seen = s.gardenSeen ?? {};
  const grown: { universe: string; stage: number }[] = [];
  const next: Record<string, number> = { ...seen };
  for (const u of UNIVERSES) {
    const st = gardenStage(stats.universes[u.id]);
    if (st > (seen[u.id] ?? 0) && st >= 2) grown.push({ universe: u.id, stage: st });
    next[u.id] = Math.max(st, seen[u.id] ?? 0);
  }
  if (JSON.stringify(next) !== JSON.stringify(seen)) await saveSettings({ gardenSeen: next });
  return grown;
}

// ---------- collections ----------

export interface CollectionProgress {
  c: VocabCollection;
  total: number;
  discovered: number;
  consolidated: number;
  /** reached milestones (0.25, 0.5, 0.75, 1) */
  milestone: number;
  done: boolean;
}

export function collectionsProgress(sp: Space): CollectionProgress[] {
  return COLLECTIONS.map((c) => {
    const words = collectionWords(c, sp.lex);
    let discovered = 0;
    let consolidated = 0;
    for (const e of words) {
      const w = sp.byLemma.get(e.lemma);
      if (!w) continue;
      discovered++;
      if (isConsolidated(w.status)) consolidated++;
    }
    const ratio = words.length ? consolidated / words.length : 0;
    const milestone = [1, 0.75, 0.5, 0.25].find((m) => ratio >= m) ?? 0;
    return { c, total: words.length, discovered, consolidated, milestone, done: words.length > 0 && consolidated >= words.length };
  });
}

/** Records completed collections (their reward is granted by checkEarnedItems). Returns the newly completed ones. */
export async function recordCollections(list: CollectionProgress[]): Promise<VocabCollection[]> {
  const s = await getSettings();
  const done = new Set(s.collectionsDone ?? []);
  const fresh = list.filter((p) => p.done && !done.has(p.c.id)).map((p) => p.c);
  if (fresh.length) await saveSettings({ collectionsDone: [...done, ...fresh.map((c) => c.id)] });
  return fresh;
}

// ---------- progress messages (only from real data) ----------

export async function weekProgress(sp: Space): Promise<{ consolidatedThisWeek: number; learnedThisWeek: number; reviewsThisWeek: number; byUniverse: { id: string; n: number }[] }> {
  const since = sp.now - 7 * 86_400_000;
  let consolidatedThisWeek = 0;
  let learnedThisWeek = 0;
  let reviewsThisWeek = 0;
  const byU = new Map<string, number>();
  for (const w of sp.words) {
    const recent = w.logs.filter((l) => l.at >= since);
    reviewsThisWeek += recent.length;
    if (w.card.createdAt >= since && w.logs.some((l) => l.rating >= 3)) learnedThisWeek++;
    // consolidated this week: consolidated now, and not consolidated before this week's answers
    if (isConsolidated(w.status) && recent.length && (w.logs.filter((l) => l.at < since && l.rating >= 3).length < 2)) {
      consolidatedThisWeek++;
      for (const u of wordUnis(w.card)) byU.set(u, (byU.get(u) ?? 0) + 1);
    }
  }
  return { consolidatedThisWeek, learnedThisWeek, reviewsThisWeek, byUniverse: [...byU].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n) };
}

// ---------- library ----------

export interface LibraryRow {
  key: string;
  en: string;
  fr: string;
  level: Cefr;
  cat: string;
  unis: string[];
  subs: string[];
  status: WordStatus | "unknown";
  entry?: LexEntry;
  word?: WordData;
}

export function libraryRows(sp: Space, opts: { mine?: boolean } = {}): LibraryRow[] {
  const rows: LibraryRow[] = [];
  const seen = new Set<string>();
  for (const w of sp.words) {
    seen.add(w.card.lemma);
    rows.push({ key: w.card.id, en: w.card.term, fr: w.card.fr, level: cardLevel(w.card), cat: w.card.cat ?? "word", unis: wordUnis(w.card), subs: wordSubs(w.card), status: w.status, word: w });
  }
  if (!opts.mine)
    for (const e of sp.lex) {
      if (seen.has(e.lemma)) continue;
      rows.push({ key: `lex:${e.lemma}`, en: e.en, fr: e.fr, level: e.level, cat: e.cat, unis: e.unis, subs: e.subs, status: "unknown", entry: e });
    }
  return rows;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function searchRows(rows: LibraryRow[], q: string): LibraryRow[] {
  const n = norm(q.trim());
  if (!n) return rows;
  const score = (r: LibraryRow) => {
    const en = norm(r.en);
    const fr = norm(r.fr);
    if (en === n) return 0;
    if (en.startsWith(n)) return 1;
    if (fr.split(/[,;]\s*/).some((x) => x === n)) return 2;
    if (en.includes(n)) return 3;
    if (fr.includes(n)) return 4;
    return 9;
  };
  return rows.map((r) => ({ r, s: score(r) })).filter((x) => x.s < 9).sort((a, b) => a.s - b.s || a.r.en.length - b.r.en.length).map((x) => x.r);
}

// ---------- flashcard sessions ----------

export type SessionMode = "auto" | "new" | "review" | "mix" | "difficult";
export type CardFormat = "discover" | "en-fr" | "fr-en" | "image" | "audio" | "cloze" | "speak" | "expression";

export interface SessionOpts {
  mode: SessionMode;
  size: number;
  universe?: string;
  sub?: string;
  collection?: string;
  /** fixed level, or undefined = the learner's level (adaptive mix) */
  level?: Cefr;
  /** only the learner's own words (added manually, from books, photos, lessons…) */
  own?: boolean;
  /** restrict to some formats (the learner's preference) */
  formats?: CardFormat[];
  speechAvailable?: boolean;
}

export interface SessionCard {
  key: string;
  item: PoolItem;
  entry?: LexEntry;
  cat: string;
  skill: Skill;
  format: CardFormat;
  isNew: boolean;
  image?: string;
}

const EXPRESSION_CATS = new Set(["idiom", "phrase", "native", "slang", "collocation"]);
const OWN_SOURCES = new Set<Card["source"]>(["user", "reader", "conversation", "translator", "around", "reallife", "memory", "journal", "mission", "grammar"]);

function inScope(opts: SessionOpts, subs: string[], unis: string[]): boolean {
  if (opts.sub) return subs.includes(opts.sub);
  if (opts.universe) return unis.includes(opts.universe);
  return true;
}

function pickReviewSkill(states: SrsState[], cat: string): Skill {
  const by = new Map(states.filter((s) => s.reps > 0).map((s) => [s.skill, s]));
  const now = Date.now();
  const due = [...by.values()].filter((s) => s.due <= now).sort((a, b) => a.due - b.due);
  if (due.length) return due[0].skill;
  const rec = by.get("recognition");
  // understood well → time to use it actively (a recognised word is not yet a word you can produce)
  if (rec && rec.stability >= 7 && !by.get("production")) return "production";
  if (EXPRESSION_CATS.has(cat) && rec && rec.stability >= 3) return "production";
  return [...by.values()].sort((a, b) => a.stability - b.stability)[0]?.skill ?? "recognition";
}

let speakTurn = 0;
function formatFor(skill: Skill, item: PoolItem, cat: string, opts: SessionOpts, hasImage: boolean): CardFormat {
  const allowed = (f: CardFormat) => !opts.formats?.length || opts.formats.includes(f);
  if (skill === "listening" && allowed("audio")) return "audio";
  if (skill === "production") {
    const cands: CardFormat[] = [];
    if (EXPRESSION_CATS.has(cat)) cands.push("expression");
    if (hasImage) cands.push("image");
    if (item.example && new RegExp(`\\b${item.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").split(" ")[0]}`, "i").test(item.example)) cands.push("cloze");
    cands.push("fr-en");
    if (opts.speechAvailable && ++speakTurn % 5 === 0) cands.push("speak");
    const ok = cands.filter(allowed);
    return ok[Math.floor(Math.random() * ok.length)] ?? "fr-en";
  }
  return allowed("en-fr") ? "en-fr" : (opts.formats?.[0] ?? "en-fr");
}

export interface BuiltSession {
  cards: SessionCard[];
  /** nothing genuinely needs reviewing: the UI suggests new words instead of inventing reviews */
  nothingToReview: boolean;
  dueCount: number;
}

export async function buildSession(opts: SessionOpts): Promise<BuiltSession> {
  const sp = await loadSpace();
  const db = getDb();
  const images = new Map((await db.images.toArray()).map((i) => [i.key, i.data]));
  const col = opts.collection ? collectionById(opts.collection) : undefined;
  const colSet = col ? new Set(collectionWords(col, sp.lex).map((e) => e.lemma)) : null;
  const levelOk = (l: Cefr) => !opts.level || l === opts.level;

  // learner words in scope
  const mine = sp.words.filter((w) => {
    if (colSet && !colSet.has(w.card.lemma)) return false;
    if (!inScope(opts, wordSubs(w.card), wordUnis(w.card))) return false;
    if (!levelOk(cardLevel(w.card))) return false;
    if (opts.own && !OWN_SOURCES.has(w.card.source)) return false;
    return true;
  });
  const due = mine.filter((w) => w.status !== "new" && reviewPriority(w, sp.now) >= 2).sort((a, b) => reviewPriority(b, sp.now) - reviewPriority(a, sp.now));
  const unpractised = mine.filter((w) => w.status === "new");
  const difficult = mine
    .filter((w) => w.status !== "new" && (w.status === "review" || w.states.some((s) => s.lapses > 0) || (w.card.gameStats?.wrong ?? 0) >= 2))
    .sort((a, b) => Math.max(...b.states.map((s) => s.difficulty), 0) - Math.max(...a.states.map((s) => s.difficulty), 0));

  const n = opts.size;
  let reviewPart: WordData[] = [];
  let newCount = 0;
  switch (opts.mode) {
    case "review":
      reviewPart = due.slice(0, n);
      break;
    case "difficult":
      reviewPart = difficult.slice(0, n);
      break;
    case "new":
      reviewPart = unpractised.slice(0, Math.floor(n / 2)); // the learner's own unpractised words first
      newCount = n - reviewPart.length;
      break;
    case "mix":
      reviewPart = due.slice(0, Math.ceil(n * 0.6));
      newCount = n - reviewPart.length;
      break;
    case "auto":
      reviewPart = [...due.slice(0, n), ...unpractised].slice(0, n);
      newCount = due.length >= n * 0.6 ? 0 : Math.max(0, n - reviewPart.length);
      if (!due.length) {
        reviewPart = unpractised.slice(0, Math.floor(n / 3));
        newCount = n - reviewPart.length;
      }
      break;
  }
  if (opts.own) newCount = 0; // own words only: never invent new ones

  const cards: SessionCard[] = [];
  for (const w of reviewPart) {
    const item = itemFromCard(w.card);
    const cat = w.card.cat ?? "word";
    const isNewish = w.status === "new";
    const skill = isNewish ? "recognition" : pickReviewSkill(w.states, cat);
    const image = w.card.imageKey ? images.get(w.card.imageKey) : undefined;
    cards.push({ key: w.card.id, item, cat, skill, format: isNewish ? "discover" : formatFor(skill, item, cat, opts, !!image), isNew: isNewish, image });
  }
  if (newCount > 0) {
    const known = new Set(sp.words.map((w) => w.card.lemma));
    const lvl = await getLevelState();
    const pool = sp.lex.filter((e) => !known.has(e.lemma) && (!colSet || colSet.has(e.lemma)) && inScope(opts, e.subs, e.unis) && !["det", "pron", "prep", "num"].includes(e.pos));
    const picked: LexEntry[] = [];
    const take = (cands: LexEntry[], k: number) => {
      const sorted = cands.filter((e) => !picked.includes(e)).sort((a, b) => a.rank - b.rank);
      picked.push(...shuffle(sorted.slice(0, Math.max(k * 4, 24))).slice(0, k));
    };
    if (opts.level || col) take(pool.filter((e) => levelOk(e.level)), newCount);
    else {
      const mix = levelMix(lvl);
      mix.forEach((m, i) => take(pool.filter((e) => e.level === m.level), i === mix.length - 1 ? newCount - picked.length : Math.round(newCount * m.share)));
      if (picked.length < newCount) {
        const main = cefrIndex(mix[0].level);
        take(pool.sort((a, b) => Math.abs(cefrIndex(a.level) - main) - Math.abs(cefrIndex(b.level) - main)), newCount - picked.length);
      }
    }
    for (const e of picked) cards.push({ key: `lex:${e.lemma}`, item: itemFromLex(e), entry: e, cat: e.cat, skill: "recognition", format: "discover", isNew: true });
  }
  return { cards: opts.mode === "new" ? cards : interleave(cards), nothingToReview: (opts.mode === "review" || opts.mode === "difficult") && cards.length === 0, dueCount: due.length };
}

/** Spread new words between reviews (a block of new words is harder to retain). */
function interleave(cards: SessionCard[]): SessionCard[] {
  const news = cards.filter((c) => c.isNew);
  const old = cards.filter((c) => !c.isNew);
  if (!news.length || !old.length) return cards;
  const out: SessionCard[] = [];
  const step = Math.max(1, Math.round(old.length / news.length));
  let o = 0;
  for (const nw of news) {
    out.push(...old.slice(o, o + step));
    o += step;
    out.push(nw);
  }
  return [...out, ...old.slice(o)];
}

/** Choisis pour moi: the most relevant session right now. */
export async function suggestSession(size = 10): Promise<SessionOpts & { reason: string }> {
  const sp = await loadSpace();
  const due = sp.words.filter((w) => w.status !== "new" && reviewPriority(w, sp.now) >= 2).length;
  if (due >= size) return { mode: "review", size, reason: `${due} mots arrivent à échéance : on les consolide.` };
  if (due > 0) return { mode: "auto", size, reason: `${due} mot${due > 1 ? "s" : ""} à revoir et quelques nouveaux mots.` };
  // no review due: grow the universe the learner likes most / has started
  const st = spaceStats(sp);
  const fav = (await getSettings()).favoriteUniverses?.[0];
  const started = UNIVERSES.map((u) => ({ id: u.id, d: st.universes[u.id].discovered })).sort((a, b) => b.d - a.d)[0];
  const uni = fav ?? (started && started.d > 0 ? started.id : undefined);
  return { mode: "new", size, universe: uni, reason: uni ? `Rien à réviser : on fait grandir l'univers « ${UNIVERSES.find((u) => u.id === uni)!.fr} ».` : "Rien à réviser : place à de nouveaux mots de ton niveau." };
}

/**
 * Records a flashcard answer. The learner's own rating is used (À revoir / Difficile / Bien / Facile = FSRS
 * Again / Hard / Good / Easy), lowered when a hint was used or the answer took very long, applied with long-term
 * steps. Only the first answer of a word in a session is graded (re-asks within the session don't move the schedule).
 */
export async function recordFlashcard(sc: SessionCard, grade: Grade, opts: { ms?: number; hint?: boolean; firstInSession: boolean }): Promise<{ cardId: string; status: WordStatus; created: boolean }> {
  const db = getDb();
  const { card, created } = await ensureCard(sc.item, "seed");
  sc.item.cardId = card.id;
  let g = grade;
  if (opts.hint && g > 2) g = 2;
  if (opts.ms && opts.ms > 25_000 && g > 3) g = 3;
  if (opts.firstInSession) await gradeCard(card.id, sc.skill, g, { ms: opts.ms, context: "review", longTerm: true });
  if (opts.firstInSession) {
    const gs = card.gameStats ?? { correct: 0, wrong: 0, hints: 0 };
    await db.cards.update(card.id, {
      gameStats: { correct: gs.correct + (g >= 3 ? 1 : 0), wrong: gs.wrong + (g === 1 ? 1 : 0), hints: gs.hints + (opts.hint ? 1 : 0), lastAt: Date.now() },
      seenIn: [...new Set([...(card.seenIn ?? []), "flashcards"])].slice(-12),
      updatedAt: Date.now(),
    });
  }
  const [st, logs] = await Promise.all([db.srs.where("cardId").equals(card.id).toArray(), db.reviewLogs.where("cardId").equals(card.id).sortBy("at")]);
  return { cardId: card.id, status: statusOf(st, historyOf(logs)), created };
}

export { skillMastery };
