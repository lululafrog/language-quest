// Client-side search across revision sheets, course lessons, grammar, courses, verbs, theme packs and the user's cards.
// Accent-insensitive, ranked. Static sources are indexed once (lazily); user cards are searched asynchronously.
import { normalize } from "@/lib/text";
import { ALL_LESSONS } from "./index";
import { SHEETS } from "./sheets";
import { GRAMMAR_LESSONS } from "@/lib/data/grammar";
import { COURSES } from "@/lib/data/courses";
import { IRREGULAR_VERBS } from "@/lib/data/irregular";
import { CORE_VERBS } from "@/lib/data/verbs";
import { THEME_PACKS } from "@/lib/data/theme-packs";
import type { Sheet, SheetBlock } from "./types";

export type SearchKind = "sheet" | "lesson" | "grammar" | "course" | "verb" | "expression" | "card";

export interface SearchResult {
  kind: SearchKind;
  id: string;
  title: string;
  snippet: string;
  href: string;
  score: number;
}

export const SEARCH_KIND_LABEL: Record<SearchKind, { fr: string; en: string }> = {
  sheet: { fr: "Fiches", en: "Sheets" },
  lesson: { fr: "Cours", en: "Lessons" },
  grammar: { fr: "Grammaire", en: "Grammar" },
  course: { fr: "Règles", en: "Rules" },
  verb: { fr: "Verbes", en: "Verbs" },
  expression: { fr: "Expressions", en: "Expressions" },
  card: { fr: "Mes cartes", en: "My cards" },
};

export const SEARCH_KIND_ORDER: SearchKind[] = ["sheet", "lesson", "verb", "expression", "card", "grammar", "course"];

interface Doc {
  kind: SearchKind;
  id: string;
  title: string;
  href: string;
  /** normalized title (high weight) */
  t: string;
  /** normalized keywords: tags, base forms… (medium weight) */
  k: string;
  /** normalized body (low weight) */
  b: string;
  /** raw body pieces used to build a snippet */
  pieces: string[];
  /** fallback snippet */
  summary: string;
  boost: number;
}

function blockText(b: SheetBlock): string[] {
  switch (b.type) {
    case "text":
    case "rule":
    case "tip":
      return [b.text];
    case "table":
      return [b.caption ?? "", ...b.rows.map((r) => r.join(" · "))];
    case "examples":
      return b.items.map((e) => `${e.en} — ${e.fr}`);
    case "list":
      return [b.title ?? "", ...b.items];
    case "compare":
      return [...b.left.items, ...b.right.items];
    case "mistakes":
      return b.items.map((m) => `${m.wrong} → ${m.right}`);
  }
}

function doc(d: Omit<Doc, "t" | "k" | "b"> & { keywords?: string[] }): Doc {
  return {
    ...d,
    t: normalize(d.title),
    k: normalize((d.keywords ?? []).join(" ")),
    b: normalize(d.pieces.join(" \n ")),
  };
}

let INDEX: Doc[] | null = null;

function buildIndex(): Doc[] {
  const out: Doc[] = [];
  for (const s of SHEETS) out.push(sheetDoc(s));
  for (const l of ALL_LESSONS) {
    out.push(
      doc({
        kind: "lesson",
        id: l.id,
        title: l.title,
        href: `/cours/${l.id}`,
        summary: `${l.level} · ${l.goal}`,
        keywords: [l.titleEn ?? "", l.unit, l.level, ...l.tags],
        pieces: [l.goal, l.rule, ...l.explanation, ...l.examples.map((e) => `${e.en} — ${e.fr}`), ...(l.vocab ?? []).map((v) => `${v.en} — ${v.fr}`)],
        boost: 1.1,
      }),
    );
  }
  for (const g of GRAMMAR_LESSONS) {
    out.push(
      doc({
        kind: "grammar",
        id: g.id,
        title: g.titleFr,
        href: `/grammar/${g.id}`,
        summary: g.summaryFr,
        keywords: [g.title, g.id],
        pieces: [g.summaryFr, ...g.when, ...g.examples.map((e) => `${e.en} — ${e.fr}`)],
        boost: 0.9,
      }),
    );
  }
  for (const c of COURSES) {
    out.push(
      doc({
        kind: "course",
        id: c.slug,
        title: c.title,
        href: `/courses/${c.slug}`,
        summary: c.summary,
        keywords: [c.category, c.level ?? ""].map(String),
        pieces: [c.summary, ...(c.retenir ?? []).map(String)],
        boost: 0.85,
      }),
    );
  }
  const core = new Set<string>();
  for (const v of CORE_VERBS) {
    core.add(v.base);
    out.push(
      doc({
        kind: "verb",
        id: v.base,
        title: `to ${v.base}`,
        href: `/verbs/${v.base}`,
        summary: `${v.fr} · ${v.base} – ${v.past} – ${v.pp}`,
        keywords: [v.base, v.past, v.pp, v.ing, v.third],
        pieces: [v.fr],
        boost: 1.15,
      }),
    );
  }
  for (const [base, past, pp, fr] of IRREGULAR_VERBS) {
    if (core.has(base)) continue;
    out.push(
      doc({
        kind: "verb",
        id: `irr-${base}`,
        title: `${base} – ${past} – ${pp}`,
        href: "/verbs/irregular",
        summary: `${fr} · verbe irrégulier`,
        keywords: [base, past, pp],
        pieces: [fr],
        boost: 0.95,
      }),
    );
  }
  for (const [theme, items] of Object.entries(THEME_PACKS)) {
    items.forEach((it, i) => {
      out.push(
        doc({
          kind: "expression",
          id: `${theme}-${i}`,
          title: it.en,
          href: `/learn?theme=${encodeURIComponent(theme)}`,
          summary: `${it.fr}${it.ex ? ` · ${it.ex}` : ""}`,
          keywords: [theme],
          pieces: [it.fr, it.ex ?? "", it.exFr ?? ""],
          boost: 0.8,
        }),
      );
    });
  }
  return out;
}

function sheetDoc(s: Sheet): Doc {
  return doc({
    kind: "sheet",
    id: s.id,
    title: s.title,
    href: `/cours/fiches/${s.id}`,
    summary: s.summary,
    keywords: [...s.tags.map((t) => t.replace(/-/g, " ")), s.category],
    pieces: [s.summary, ...s.blocks.flatMap(blockText)],
    boost: 1.25,
  });
}

function index(): Doc[] {
  if (!INDEX) INDEX = buildIndex();
  return INDEX;
}

function terms(q: string): string[] {
  return normalize(q).split(/\s+/).filter(Boolean);
}

function wordStart(hay: string, term: string): boolean {
  const i = hay.indexOf(term);
  if (i < 0) return false;
  if (i === 0) return true;
  return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(hay);
}

/** Scores a doc against query terms. Every term must match somewhere (AND). */
function scoreDoc(d: { t: string; k: string; b: string; boost: number }, full: string, ts: string[]): number {
  let score = 0;
  for (const term of ts) {
    let s = 0;
    if (d.t === term) s = 12;
    else if (d.t.startsWith(term)) s = 8;
    else if (wordStart(d.t, term)) s = 6;
    else if (d.t.includes(term)) s = 4;
    if (wordStart(d.k, term)) s = Math.max(s, 5);
    else if (d.k.includes(term)) s = Math.max(s, 3);
    if (!s) {
      if (wordStart(d.b, term)) s = 2;
      else if (term.length >= 3 && d.b.includes(term)) s = 1;
    }
    if (!s) return 0;
    score += s;
  }
  if (ts.length > 1) {
    if (d.t.includes(full)) score += 8;
    else if (d.b.includes(full)) score += 3;
  }
  return score * d.boost;
}

function snippetFor(pieces: string[], ts: string[], fallback: string): string {
  for (const p of pieces) {
    const n = normalize(p);
    if (p && ts.every((t) => n.includes(t))) return clip(p);
  }
  for (const p of pieces) {
    const n = normalize(p);
    if (p && ts.some((t) => n.includes(t))) return clip(p);
  }
  return clip(fallback);
}

function clip(s: string, n = 120): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

/** Synchronous search over the built-in content. */
export function searchStatic(query: string, limit = 60): SearchResult[] {
  const ts = terms(query);
  if (!ts.length) return [];
  const full = ts.join(" ");
  const res: SearchResult[] = [];
  for (const d of index()) {
    const score = scoreDoc(d, full, ts);
    if (score > 0) res.push({ kind: d.kind, id: d.id, title: d.title, href: d.href, score, snippet: snippetFor(d.pieces, ts, d.summary) });
  }
  res.sort((a, b) => b.score - a.score || a.title.length - b.title.length);
  return res.slice(0, limit);
}

/** Searches the user's own flashcards (IndexedDB). */
export async function searchCards(query: string, limit = 20): Promise<SearchResult[]> {
  const ts = terms(query);
  if (!ts.length || typeof indexedDB === "undefined") return [];
  const { getDb } = await import("@/lib/db");
  const cards = await getDb().cards.toArray();
  const full = ts.join(" ");
  const res: SearchResult[] = [];
  for (const c of cards) {
    if ((c as { deleted?: boolean }).deleted) continue;
    const d = {
      t: normalize(c.term),
      k: normalize([c.lemma, ...(c.variants ?? []), ...(c.themes ?? [])].join(" ")),
      b: normalize([c.fr, c.example ?? "", c.exampleFr ?? "", c.definition ?? ""].join(" ")),
      boost: 1.2,
    };
    const score = scoreDoc(d, full, ts);
    if (score > 0) res.push({ kind: "card", id: c.id, title: c.term, href: `/cards/${c.id}`, score, snippet: clip(`${c.fr}${c.example ? ` · ${c.example}` : ""}`) });
  }
  res.sort((a, b) => b.score - a.score);
  return res.slice(0, limit);
}

/** Full search: static content + the user's cards. */
export async function searchAll(query: string, limit = 60): Promise<SearchResult[]> {
  const [cards] = await Promise.all([searchCards(query).catch(() => [] as SearchResult[])]);
  return [...searchStatic(query, limit), ...cards].sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Groups results by kind, in display order. */
export function groupResults(results: SearchResult[], perGroup = 6): { kind: SearchKind; items: SearchResult[]; total: number }[] {
  return SEARCH_KIND_ORDER.map((kind) => {
    const all = results.filter((r) => r.kind === kind);
    return { kind, items: all.slice(0, perGroup), total: all.length };
  }).filter((g) => g.total > 0);
}

/** Searches only revision sheets (used to filter the sheet list). */
export function searchSheets(query: string): Sheet[] {
  const ts = terms(query);
  if (!ts.length) return SHEETS;
  const full = ts.join(" ");
  return SHEETS.map((s) => ({ s, score: scoreDoc(sheetDoc(s), full, ts) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}
