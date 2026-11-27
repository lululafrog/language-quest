import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";

// Proxy to the free Wiktionary-based Free Dictionary API (dictionaryapi.dev, no key, CC BY-SA).
// Provides phonetics, audio pronunciations, definitions, synonyms and antonyms.
const cache = new Map<string, unknown>();

export async function GET(req: Request) {
  const word = new URL(req.url).searchParams.get("word")?.trim().toLowerCase();
  if (!word || !/^[a-z][a-z' -]{0,40}$/.test(word)) return jsonError(400, "bad_input", "Mot invalide.");
  if (cache.has(word)) return NextResponse.json(cache.get(word));
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(6000) });
    if (r.status === 404) return jsonError(404, "not_found", "Mot introuvable dans le dictionnaire libre.");
    if (!r.ok) return jsonError(502, "dict_error", "Dictionnaire indisponible.");
    type Entry = {
      word: string;
      phonetics?: { text?: string; audio?: string }[];
      meanings?: { partOfSpeech: string; definitions: { definition: string; example?: string }[]; synonyms?: string[]; antonyms?: string[] }[];
    };
    const j = (await r.json()) as Entry[];
    const phonetics = j.flatMap((e) => e.phonetics ?? []);
    const audio = (re: RegExp) => phonetics.find((p) => p.audio && re.test(p.audio))?.audio;
    const out = {
      word,
      ipa: phonetics.find((p) => p.text)?.text ?? null,
      audioUK: audio(/-uk\.mp3$/) ?? null,
      audioUS: audio(/-us\.mp3$/) ?? null,
      meanings: j.flatMap((e) => e.meanings ?? []).slice(0, 6).map((m) => ({
        pos: m.partOfSpeech,
        definitions: m.definitions.slice(0, 3).map((d) => ({ definition: d.definition, example: d.example ?? null })),
        synonyms: (m.synonyms ?? []).slice(0, 6),
        antonyms: (m.antonyms ?? []).slice(0, 4),
      })),
      license: "Wiktionary, CC BY-SA 3.0 via dictionaryapi.dev",
    };
    if (cache.size > 2000) cache.clear();
    cache.set(word, out);
    return NextResponse.json(out);
  } catch {
    return jsonError(502, "dict_error", "Dictionnaire libre injoignable.");
  }
}
