// Free machine translation via the MyMemory public API (no key; ~5,000 chars/day per server IP,
// 50,000 with MYMEMORY_EMAIL). Literal translation, without context or explanations.
import { FreeServiceError } from "./languagetool";

const cache = new Map<string, MyMemoryResult>();

export interface MyMemoryResult {
  translation: string;
  alternatives: string[];
  engine: "mymemory";
}

export async function myMemoryTranslate(q: string, from: "en" | "fr" = "en"): Promise<MyMemoryResult> {
  const text = q.trim().slice(0, 480); // MyMemory limit: 500 bytes per request
  const pair = from === "fr" ? "fr|en" : "en|fr";
  const key = `${pair}:${text.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", pair);
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);
  let r: Response;
  try {
    r = await fetch(url, { signal: AbortSignal.timeout(6000) });
  } catch {
    throw new FreeServiceError("Le service de traduction gratuit est injoignable pour le moment.");
  }
  type MM = { responseStatus?: number | string; responseData?: { translatedText?: string }; matches?: { translation?: string; match?: number }[] };
  const j = (await r.json().catch(() => ({}))) as MM;
  if (r.status === 429 || Number(j.responseStatus) === 429) throw new FreeServiceError("Le quota quotidien de traduction gratuite est atteint. Réessaie demain.", 429);
  const main = j.responseData?.translatedText?.trim();
  if (!r.ok || !main || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(main)) throw new FreeServiceError("Traduction gratuite indisponible pour ce texte.");
  const alternatives = [...new Set((j.matches ?? []).filter((m) => (m.match ?? 0) >= 0.7 && m.translation).map((m) => m.translation!.trim()))]
    .filter((x) => x.toLowerCase() !== main.toLowerCase())
    .slice(0, 3);
  const out: MyMemoryResult = { translation: main, alternatives, engine: "mymemory" };
  if (cache.size > 5000) cache.clear();
  cache.set(key, out);
  return out;
}

/** Translates a longer text sentence by sentence (MyMemory accepts short inputs only). */
export async function myMemoryTranslateLong(text: string, from: "en" | "fr" = "en"): Promise<string> {
  const parts = text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [text];
  const out: string[] = [];
  for (const p of parts.slice(0, 20)) {
    if (!p.trim()) { out.push(p); continue; }
    out.push((await myMemoryTranslate(p, from)).translation + (/\s$/.test(p) ? " " : ""));
  }
  return out.join("").trim();
}
