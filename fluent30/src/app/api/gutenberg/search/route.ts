import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";

// Search the Project Gutenberg catalogue through Gutendex (public JSON API, no key).
// Only English, public-domain titles are returned.
type GutendexBook = { id: number; title: string; authors?: { name: string }[]; subjects?: string[]; bookshelves?: string[]; copyright?: boolean | null; download_count?: number; media_type?: string };

const cache = new Map<string, { at: number; data: unknown }>();

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").slice(0, 100).trim();
  const topic = (u.searchParams.get("topic") ?? "").slice(0, 60).trim();
  const page = Math.min(Math.max(Number(u.searchParams.get("page")) || 1, 1), 100);
  const sp = new URLSearchParams({ languages: "en", copyright: "false", page: String(page) });
  if (q) sp.set("search", q);
  if (topic) sp.set("topic", topic);
  const key = sp.toString();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return NextResponse.json(hit.data);
  try {
    const r = await fetch(`https://gutendex.com/books?${key}`, { signal: AbortSignal.timeout(12000), headers: { Accept: "application/json" } });
    if (!r.ok) return jsonError(502, "gutenberg_error", `Le catalogue Gutenberg ne répond pas (${r.status}). Réessayez plus tard.`);
    const j = (await r.json()) as { count: number; next: string | null; results: GutendexBook[] };
    const data = {
      count: j.count,
      hasNext: !!j.next,
      results: j.results
        .filter((b) => b.copyright === false && (b.media_type ?? "Text") === "Text")
        .map((b) => ({ id: b.id, title: b.title, authors: (b.authors ?? []).map((a) => a.name), subjects: [...(b.subjects ?? []), ...(b.bookshelves ?? [])].slice(0, 6), downloads: b.download_count ?? 0 })),
    };
    if (cache.size > 300) cache.clear();
    cache.set(key, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch {
    return jsonError(502, "gutenberg_unreachable", "Impossible de joindre le catalogue Project Gutenberg (connexion ou service indisponible).");
  }
}
