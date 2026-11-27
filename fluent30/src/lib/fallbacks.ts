"use client";
// Client-side fallbacks used when the AI is not available: they rely on the built-in lexicon,
// the free dictionary (Wiktionary via dictionaryapi.dev) and free machine translation (MyMemory).
// Results are flagged `engine` so the interface can say honestly how the card was completed.
import { getApi } from "./api";
import { lookupDictionary } from "./dictionary";
import { lookupLocal } from "./lexicon";
import { guessThemes } from "./autotheme";
import type { EnrichResponse } from "./cards";

export type Engine = "ai" | "local" | "mymemory" | "languagetool" | "tesseract" | "openverse";

export const ENGINE_LABEL: Record<Engine, string> = {
  ai: "Analyse IA",
  local: "Fiche complétée sans IA",
  mymemory: "Traduction automatique simple",
  languagetool: "Correction automatique simple",
  tesseract: "Texte lu sur ton appareil",
  openverse: "Image libre de droits",
};

type FreeTranslation = { translation: string; alternatives: string[] };

async function freeTranslate(q: string, from: "en" | "fr"): Promise<FreeTranslation | null> {
  try {
    return await getApi<FreeTranslation>(`/api/translate-free?q=${encodeURIComponent(q.slice(0, 200))}${from === "fr" ? "&from=fr" : ""}`, { cacheKey: `mm:${from}:${q.toLowerCase()}` });
  } catch {
    return null;
  }
}

const FRENCH_HINT = /[àâçéèêëîïôûùüÿœæ]|\b(le|la|les|un|une|des|du|je|tu|il|elle|nous|vous|ils|est|et|pas|avec|pour)\b/i;

/** Builds a flashcard enrichment without any AI. Throws if nothing useful was found. */
export async function enrichWithoutAI(input: string): Promise<EnrichResponse & { engine: "local" }> {
  let term = input.trim();
  let originalLanguage: "en" | "fr" = "en";
  let fr = "";
  // French input → find the English word first
  if (FRENCH_HINT.test(term) && !lookupLocal(term)) {
    const t = await freeTranslate(term, "fr");
    if (t?.translation) {
      fr = term;
      term = t.translation.replace(/[.!?]+$/, "");
      originalLanguage = "fr";
    }
  }
  const single = term.split(/\s+/).length === 1;
  const local = single ? lookupLocal(term) : null;
  const dict = single ? await lookupDictionary((local?.lemma ?? term).toLowerCase()).catch(() => null) : null;
  if (!fr) fr = local?.fr || (await freeTranslate(term, "en"))?.translation || "";
  if (!fr && !dict) throw new Error("Impossible de compléter cette fiche sans connexion à l'IA. Ajoute la traduction toi-même.");
  const m = dict?.meanings[0];
  const pos = local?.pos ?? m?.pos ?? (single ? "" : "expression");
  const lemma = (local?.lemma ?? term).toLowerCase();
  const kind = pos.includes("verb") ? "verb" : single ? "word" : term.split(/\s+/).length > 4 ? "phrase" : "expression";
  return {
    term: local?.lemma ?? term,
    lemma,
    kind,
    fr,
    definition: m?.definitions[0]?.definition ?? "",
    ipaUK: local?.ipa ?? dict?.ipa ?? "",
    ipaUS: dict?.ipa ?? "",
    pos,
    example: local?.example ?? m?.definitions.find((d) => d.example)?.example ?? "",
    exampleFr: local?.exampleFr ?? "",
    synonyms: m?.synonyms ?? [],
    antonyms: m?.antonyms ?? [],
    forms: [],
    themes: local?.themes?.length ? local.themes : guessThemes(lemma, pos),
    difficulty: local?.rank ? (local.rank < 1000 ? 1 : local.rank < 3000 ? 2 : 3) : 3,
    frequency: local?.rank ? (local.rank < 1000 ? "very common" : "common") : "less common",
    register: "courant",
    imagePrompt: "",
    notes: "",
    originalLanguage,
    engine: "local",
  };
}
