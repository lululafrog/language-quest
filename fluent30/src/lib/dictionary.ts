// Free Dictionary API (dictionaryapi.dev, Wiktionary data, CC BY-SA). Shared by the server proxy and the browser:
// the browser calls it directly (CORS allowed), because some hosting providers' IPs are refused by the API.
export interface DictResult {
  word: string;
  ipa: string | null;
  audioUK: string | null;
  audioUS: string | null;
  meanings: { pos: string; definitions: { definition: string; example: string | null }[]; synonyms: string[]; antonyms: string[] }[];
  license: string;
}

type Entry = {
  word: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings?: { partOfSpeech: string; definitions: { definition: string; example?: string }[]; synonyms?: string[]; antonyms?: string[] }[];
};

export function transformDictionary(word: string, j: Entry[]): DictResult {
  const phonetics = j.flatMap((e) => e.phonetics ?? []);
  const audio = (re: RegExp) => phonetics.find((p) => p.audio && re.test(p.audio))?.audio;
  return {
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
}

export const DICTIONARY_URL = (word: string) => `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

/** Browser-side lookup: direct call first (works from the learner's own connection), then the server proxy. */
export async function lookupDictionary(word: string): Promise<DictResult> {
  const { cacheGet, cacheSet } = await import("./db");
  const { getApi } = await import("./api");
  const key = `dict:${word}`;
  const hit = await cacheGet<DictResult>(key);
  if (hit) return hit;
  try {
    const r = await fetch(DICTIONARY_URL(word), { signal: AbortSignal.timeout(6000) });
    if (r.status === 404) throw new Error("not_found");
    if (r.ok) {
      const out = transformDictionary(word, await r.json());
      await cacheSet(key, out);
      return out;
    }
  } catch (e) {
    if (e instanceof Error && e.message === "not_found") throw e;
  }
  return getApi<DictResult>(`/api/dictionary?word=${encodeURIComponent(word)}`, { cacheKey: key });
}
