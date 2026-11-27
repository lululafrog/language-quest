"use client";
// Vocabulary mind map: the learner's own cards grouped into broad categories (a word can belong to
// several), with real mastery per branch, gaps against the built-in frequent vocabulary, and
// connections between words (families, synonyms/antonyms, expressions that contain a word).
import { getDb } from "./db";
import { lemmaOf } from "./cards";
import { knownLemmas, themeWords, type ThemeWord } from "./themes";
import { countLevels, masteryMap, type MasteryCounts, type MasteryLevel } from "./mastery";
import type { Card } from "./types";

export interface Category {
  id: string;
  label: string; // full French label
  short: string; // short label for the map
  themes: string[]; // theme ids feeding this branch
  kinds?: Card["kind"][]; // card kinds feeding this branch
  /** theme used for "learn new words of this branch" */
  learnTheme: string;
  /** related "Vie réelle" course module, if any */
  module?: string;
}

export const CATEGORIES: Category[] = [
  { id: "voyage", label: "Voyage", short: "Voyage", themes: ["travel", "airport", "transport", "accommodation", "directions", "travel-problems", "city"], learnTheme: "travel", module: "theme-travel" },
  { id: "relations", label: "Relations", short: "Relations", themes: ["people", "relationships", "dating", "party", "greetings", "introductions"], learnTheme: "relationships", module: "theme-meeting-people" },
  { id: "emotions", label: "Émotions", short: "Émotions", themes: ["emotions", "opinions"], learnTheme: "emotions", module: "theme-emotions" },
  { id: "sport", label: "Sport", short: "Sport", themes: ["sport", "adventure"], learnTheme: "sport", module: "theme-sport" },
  { id: "travail", label: "Travail & études", short: "Travail", themes: ["work", "school", "tech"], learnTheme: "work", module: "theme-work" },
  { id: "cuisine", label: "Cuisine", short: "Cuisine", themes: ["food", "restaurant", "cooking"], learnTheme: "food", module: "theme-restaurant" },
  { id: "sante", label: "Santé", short: "Santé", themes: ["health", "body", "emergency"], learnTheme: "health", module: "theme-emergency" },
  { id: "nature", label: "Nature", short: "Nature", themes: ["nature", "animals", "beach"], learnTheme: "nature" },
  { id: "quotidien", label: "Vie quotidienne", short: "Quotidien", themes: ["daily", "home", "clothes", "shopping", "numbers", "time"], learnTheme: "daily" },
  { id: "culture", label: "Culture & loisirs", short: "Culture", themes: ["music", "movies", "books", "art", "crime"], learnTheme: "movies" },
  { id: "idiomes", label: "Expressions idiomatiques", short: "Idiomes", themes: ["idioms", "slang"], kinds: ["expression"], learnTheme: "idioms", module: "theme-humour" },
  { id: "verbes", label: "Verbes", short: "Verbes", themes: ["action-verbs", "irregular-verbs"], kinds: ["verb"], learnTheme: "action-verbs" },
  { id: "phrasal", label: "Phrasal verbs", short: "Phrasal", themes: ["phrasal-verbs"], kinds: ["phrasal"], learnTheme: "phrasal-verbs" },
  { id: "outils", label: "Mots-outils", short: "Mots-outils", themes: ["adjectives", "linking", "grammar-words"], learnTheme: "linking" },
];

export const OTHER: Category = { id: "autres", label: "Autres mots", short: "Autres", themes: [], learnTheme: "daily" };

export function categoriesOf(card: Pick<Card, "themes" | "kind">): string[] {
  const ids = CATEGORIES.filter((c) => c.themes.some((t) => card.themes.includes(t)) || c.kinds?.includes(card.kind)).map((c) => c.id);
  return ids.length ? ids : [OTHER.id];
}

export interface WordNode {
  card: Card;
  level: MasteryLevel;
}

export interface Branch {
  cat: Category;
  words: WordNode[];
  counts: MasteryCounts;
  /** 0..1 — weighted mastery of the words in this branch */
  strength: number;
  /** frequent reference words of this branch (built-in packs, levels 1–2) */
  reference: number;
  /** how many of them the learner already has (cards or "already known") */
  covered: number;
  /** a few frequent words still missing (to suggest) */
  missing: ThemeWord[];
}

const WEIGHT: Record<MasteryLevel, number> = { employe: 1, reconnu: 0.6, decouvert: 0.25, oublie: 0.1 };

export function strengthOf(words: WordNode[]): number {
  if (!words.length) return 0;
  return words.reduce((a, w) => a + WEIGHT[w.level], 0) / words.length;
}

function referenceFor(cat: Category): ThemeWord[] {
  const seen = new Set<string>();
  const out: ThemeWord[] = [];
  for (const t of cat.themes) {
    for (const w of themeWords(t)) {
      if (w.level > 2) continue;
      const l = lemmaOf(w.en);
      if (seen.has(l)) continue;
      seen.add(l);
      out.push(w);
    }
  }
  return out;
}

export interface MindMap {
  branches: Branch[];
  total: MasteryCounts;
  cards: Map<string, WordNode>;
}

export async function buildMindMap(): Promise<MindMap> {
  const [cards, levels, known] = await Promise.all([getDb().cards.toArray(), masteryMap(), knownLemmas()]);
  const nodes = new Map<string, WordNode>();
  const byCat = new Map<string, WordNode[]>();
  for (const card of cards) {
    const level = levels.get(card.id);
    if (!level) continue; // suspended
    const node = { card, level };
    nodes.set(card.id, node);
    for (const id of categoriesOf(card)) (byCat.get(id) ?? byCat.set(id, []).get(id)!).push(node);
  }
  const branches: Branch[] = [];
  for (const cat of [...CATEGORIES, OTHER]) {
    const words = byCat.get(cat.id) ?? [];
    if (cat.id === OTHER.id && !words.length) continue;
    const ref = referenceFor(cat);
    const missing = ref.filter((w) => !known.has(lemmaOf(w.en)));
    branches.push({
      cat,
      words: words.sort((a, b) => a.card.term.localeCompare(b.card.term)),
      counts: countLevels(words.map((w) => w.level)),
      strength: strengthOf(words),
      reference: ref.length,
      covered: ref.length - missing.length,
      missing: missing.slice(0, 8),
    });
  }
  return { branches, total: countLevels([...nodes.values()].map((n) => n.level)), cards: nodes };
}

/** Strongest branches (enough words, best weighted mastery) and the ones to develop (lowest coverage of frequent words). */
export function strengthsAndGaps(map: MindMap): { strong: Branch[]; gaps: Branch[] } {
  const real = map.branches.filter((b) => b.cat.id !== OTHER.id);
  const strong = real
    .filter((b) => b.counts.total >= 3)
    .sort((a, b) => b.strength * Math.log2(1 + b.counts.total) - a.strength * Math.log2(1 + a.counts.total))
    .slice(0, 3);
  const strongIds = new Set(strong.map((b) => b.cat.id));
  const gaps = real
    .filter((b) => b.reference >= 8 && !strongIds.has(b.cat.id))
    .sort((a, b) => a.covered / a.reference - b.covered / b.reference)
    .slice(0, 3);
  return { strong, gaps };
}

// ---------- connections between words ----------

const SUFFIXES = ["ness", "ment", "tion", "sion", "ful", "less", "able", "ible", "ing", "ed", "er", "est", "ly", "ity", "al", "ive", "s"];

/** Rough morphological root, used to group word families (happy / happiness / unhappy…). */
export function rootOf(lemma: string): string {
  let w = lemma.toLowerCase().replace(/^to /, "");
  if (w.includes(" ")) return w;
  if (w.startsWith("un") && w.length > 6) w = w.slice(2);
  for (const s of SUFFIXES) {
    if (w.length - s.length >= 4 && w.endsWith(s)) {
      w = w.slice(0, -s.length);
      break;
    }
  }
  return w.replace(/i$/, "y").replace(/(.)\1$/, "$1").replace(/e$/, "");
}

export interface Connections {
  family: Card[];
  synonyms: Card[];
  antonyms: Card[];
  expressions: Card[];
}

export function connectionsOf(card: Card, all: Card[]): Connections {
  const root = rootOf(card.lemma);
  const syn = new Set((card.synonyms ?? []).map((s) => lemmaOf(s)));
  const ant = new Set((card.antonyms ?? []).map((s) => lemmaOf(s)));
  const forms = new Set([...(card.variants ?? []), ...Object.values(card.forms ?? {})].map((v) => v.toLowerCase()));
  const single = !card.lemma.includes(" ");
  const tokenRe = single ? new RegExp(`(^|[^a-z])${card.lemma.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i") : null;
  const out: Connections = { family: [], synonyms: [], antonyms: [], expressions: [] };
  for (const c of all) {
    if (c.id === card.id) continue;
    const cl = c.lemma;
    if (syn.has(cl) || (c.synonyms ?? []).some((s) => lemmaOf(s) === card.lemma)) out.synonyms.push(c);
    else if (ant.has(cl) || (c.antonyms ?? []).some((s) => lemmaOf(s) === card.lemma)) out.antonyms.push(c);
    else if (single && cl.includes(" ") && tokenRe!.test(c.term)) out.expressions.push(c);
    else if (single && !cl.includes(" ") && (forms.has(cl) || (root.length >= 4 && rootOf(cl) === root))) out.family.push(c);
  }
  return out;
}

/** Connections for a whole branch: synonym/antonym pairs and families found among its words. */
export function branchLinks(branch: Branch, all: Card[]) {
  const pairs: { a: Card; b: Card; kind: "synonyme" | "antonyme" | "famille" }[] = [];
  const seen = new Set<string>();
  const expressions = new Map<string, Card>();
  for (const { card } of branch.words) {
    const c = connectionsOf(card, all);
    const add = (b: Card, kind: "synonyme" | "antonyme" | "famille") => {
      const k = [card.id, b.id].sort().join("|");
      if (seen.has(k)) return;
      seen.add(k);
      pairs.push({ a: card, b, kind });
    };
    c.synonyms.forEach((b) => add(b, "synonyme"));
    c.antonyms.forEach((b) => add(b, "antonyme"));
    c.family.forEach((b) => add(b, "famille"));
    c.expressions.forEach((e) => expressions.set(e.id, e));
    if (card.kind === "expression" || card.kind === "phrasal" || card.kind === "phrase") expressions.set(card.id, card);
  }
  return { pairs, expressions: [...expressions.values()] };
}
