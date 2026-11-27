import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";

// Free word/short-phrase translation EN→FR (or FR→EN with from=fr) without any API key, via the MyMemory public API
// (translation memory; anonymous use is limited to ~5,000 characters/day per server IP,
// or 50,000 with MYMEMORY_EMAIL set). Used when the Claude key is not configured.
const cache = new Map<string, unknown>();

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q")?.trim();
  const pair = params.get("from") === "fr" ? "fr|en" : "en|fr";
  if (!q || q.length > 200) return jsonError(400, "bad_input", "Texte invalide.");
  const key = `${pair}:${q.toLowerCase()}`;
  if (cache.has(key)) return NextResponse.json(cache.get(key));
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", q);
  url.searchParams.set("langpair", pair);
  if (process.env.MYMEMORY_EMAIL) url.searchParams.set("de", process.env.MYMEMORY_EMAIL);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return jsonError(502, "translate_error", "Service de traduction gratuit indisponible.");
    type MM = { responseStatus?: number | string; responseData?: { translatedText?: string }; matches?: { translation?: string; quality?: string | number; match?: number }[] };
    const j = (await r.json()) as MM;
    if (Number(j.responseStatus) === 429) return jsonError(429, "quota", "Quota quotidien de traduction gratuite atteint.");
    const main = j.responseData?.translatedText?.trim();
    if (!main || /MYMEMORY WARNING|INVALID/i.test(main)) return jsonError(502, "translate_error", "Traduction indisponible pour ce mot.");
    const alternatives = [...new Set((j.matches ?? []).filter((m) => (m.match ?? 0) >= 0.7 && m.translation).map((m) => m.translation!.trim().toLowerCase()))]
      .filter((x) => x !== main.toLowerCase())
      .slice(0, 3);
    const out = { translation: main, alternatives, source: "MyMemory (traduction automatique, hors contexte)" };
    if (cache.size > 5000) cache.clear();
    cache.set(key, out);
    return NextResponse.json(out);
  } catch {
    return jsonError(502, "translate_error", "Service de traduction gratuit injoignable.");
  }
}
