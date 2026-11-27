import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";
import { DICTIONARY_URL, transformDictionary } from "@/lib/dictionary";

// Proxy to the free Wiktionary-based Free Dictionary API (dictionaryapi.dev, no key, CC BY-SA).
// Provides phonetics, audio pronunciations, definitions, synonyms and antonyms.
const cache = new Map<string, unknown>();

export async function GET(req: Request) {
  const word = new URL(req.url).searchParams.get("word")?.trim().toLowerCase();
  if (!word || !/^[a-z][a-z' -]{0,40}$/.test(word)) return jsonError(400, "bad_input", "Mot invalide.");
  if (cache.has(word)) return NextResponse.json(cache.get(word));
  try {
    const r = await fetch(DICTIONARY_URL(word), { signal: AbortSignal.timeout(6000) });
    if (r.status === 404) return jsonError(404, "not_found", "Mot introuvable dans le dictionnaire libre.");
    if (!r.ok) return jsonError(502, "dict_error", "Dictionnaire indisponible.");
    const out = transformDictionary(word, (await r.json()) as Parameters<typeof transformDictionary>[1]);
    if (cache.size > 2000) cache.clear();
    cache.set(word, out);
    return NextResponse.json(out);
  } catch {
    return jsonError(502, "dict_error", "Dictionnaire libre injoignable.");
  }
}
