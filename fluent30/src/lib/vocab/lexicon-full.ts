// The full shared lexicon (≈ 10,000 entries): the 3,000+ core words bundled with the app (lib/data/vocab) enriched
// with their sub-themes and category, plus the extended entries (lib/data/lexicon/ext.json), loaded on demand in a
// separate chunk (cached by the service worker → works offline after the first visit). Generic, identical for every
// learner, original content written for Fluent30 (see lib/data/SOURCES.md).
import type { Cefr } from "../types";
import { isCefr } from "./core";
import { lexicon, registerExtended, type LexWord } from "./words";
import { subForLegacy, universesOf, isSub, type Category } from "./universes";

export interface LexEntry extends LexWord {
  cat: Category;
  subs: string[];
  /** universe ids (from subs) */
  unis: string[];
  core: boolean;
}

interface RawExt {
  en: string; fr: string; pos: string; cat: string; level: string; subs: string[];
  def?: string; ex?: string; exFr?: string; syn?: string; ant?: string; ipa?: string; tip?: string; note?: string;
}
type CoreMeta = Record<string, { subs?: string[]; cat?: string; note?: string }>;

const CATS = new Set(["word", "verb", "irregular", "phrasal", "adjective", "adverb", "idiom", "connector", "slang", "collocation", "native", "falsefriend", "phrase", "ukus"]);

/** Category of a core word without editorial metadata, from its part of speech. */
export function catFromPos(pos?: string, en?: string): Category {
  const p = (pos ?? "").toLowerCase();
  if (p.includes("phrasal")) return "phrasal";
  if (p.startsWith("verb") || p === "modal") return "verb";
  if (p.startsWith("adj")) return "adjective";
  if (p.startsWith("adv")) return "adverb";
  if (p === "conj") return "connector";
  if (p === "expr" || p === "phrase" || (en && en.trim().includes(" "))) return "phrase";
  return "word";
}

let full: LexEntry[] | null = null;
let loading: Promise<LexEntry[]> | null = null;

function build(meta: CoreMeta, ext: RawExt[]): LexEntry[] {
  const out: LexEntry[] = [];
  const seen = new Set<string>();
  for (const w of lexicon()) {
    const m = meta[w.en] ?? meta[w.en.toLowerCase()];
    const subs = (m?.subs ?? []).filter(isSub);
    if (!subs.length) for (const t of w.themes ?? []) {
      const sb = subForLegacy(t);
      if (sb && !subs.includes(sb)) subs.push(sb);
    }
    if (!subs.length) subs.push("daily.small-talk");
    const cat = (m?.cat && CATS.has(m.cat) ? m.cat : catFromPos(w.pos, w.en)) as Category;
    out.push({ ...w, cat, subs, unis: universesOf(undefined, subs), note: m?.note, core: true });
    seen.add(w.lemma);
  }
  let rank = out.length;
  for (const r of ext) {
    const lemma = r.en.toLowerCase().trim().replace(/^to /, "");
    if (seen.has(lemma) || !isCefr(r.level)) continue;
    seen.add(lemma);
    const subs = (r.subs ?? []).filter(isSub);
    if (!subs.length) continue;
    out.push({
      en: r.en, fr: r.fr, pos: r.pos, rank: ++rank, ex: r.ex, exFr: r.exFr, def: r.def, ipa: r.ipa, themes: subs,
      level: r.level as Cefr, synonym: r.syn, ant: r.ant, tip: r.tip, note: r.note, lemma,
      cat: (CATS.has(r.cat) ? r.cat : catFromPos(r.pos, r.en)) as Category, subs, unis: universesOf(undefined, subs), core: false,
    });
  }
  return out;
}

/** Loads the full lexicon once (≈ 10,000 entries). */
export function loadFullLexicon(): Promise<LexEntry[]> {
  if (full) return Promise.resolve(full);
  if (!loading)
    loading = Promise.all([import("../data/lexicon/core-meta.json"), import("../data/lexicon/ext.json")]).then(([m, e]) => {
      full = build((m.default ?? m) as unknown as CoreMeta, (e.default ?? e) as unknown as RawExt[]);
      registerExtended(full);
      return full;
    });
  return loading;
}

export function fullLexiconIfLoaded(): LexEntry[] | null {
  return full;
}

/** For tests and server code: builds synchronously from already-imported data. */
export function buildFullLexicon(meta: CoreMeta, ext: RawExt[]): LexEntry[] {
  return build(meta, ext);
}
