import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";
import { LIBRARY } from "@/lib/data/library";

export const maxDuration = 30;

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
  // 1. Gutendex (JSON catalogue).
  try {
    const r = await fetch(`https://gutendex.com/books?${key}`, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } });
    if (r.ok) {
      const j = (await r.json()) as { count: number; next: string | null; results: GutendexBook[] };
      const data = {
        count: j.count,
        hasNext: !!j.next,
        source: "gutendex",
        results: j.results
          .filter((b) => b.copyright === false && (b.media_type ?? "Text") === "Text")
          .map((b) => ({ id: b.id, title: b.title, authors: (b.authors ?? []).map((a) => a.name), subjects: [...(b.subjects ?? []), ...(b.bookshelves ?? [])].slice(0, 6), downloads: b.download_count ?? 0 })),
      };
      if (cache.size > 300) cache.clear();
      cache.set(key, { at: Date.now(), data });
      return NextResponse.json(data);
    }
  } catch {
    /* fall through */
  }
  // 2. Project Gutenberg's own OPDS search feed.
  const query = q || topic;
  if (query) {
    try {
      const r = await fetch(`https://www.gutenberg.org/ebooks/search.opds/?query=${encodeURIComponent(query)}&start_index=${(page - 1) * 25 + 1}`, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Fluent30 reader (educational app)" } });
      if (r.ok) {
        const xml = await r.text();
        const results = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
          .map((m) => {
            const e = m[1];
            const id = Number(/\/ebooks\/(\d+)/.exec(e)?.[1]);
            const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/.exec(e)?.[1] ?? "");
            const author = decode(/<content[^>]*>([\s\S]*?)<\/content>/.exec(e)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
            return { id, title, authors: author ? [author] : [], subjects: [], downloads: 0 };
          })
          .filter((b) => Number.isInteger(b.id) && b.id > 0 && b.title);
        if (results.length) {
          const data = { count: results.length, hasNext: results.length >= 25, source: "gutenberg.org", results };
          cache.set(key, { at: Date.now(), data });
          return NextResponse.json(data);
        }
      }
    } catch {
      /* fall through */
    }
  }
  // 3. Offline fallback: the built-in library.
  const nq = query.toLowerCase();
  const local = LIBRARY.filter((b) => !nq || `${b.title} ${b.titleFr} ${b.author} ${b.cat}`.toLowerCase().includes(nq));
  if (local.length) {
    return NextResponse.json({ count: local.length, hasNext: false, source: "local", results: local.map((b) => ({ id: b.id, title: b.title, authors: [b.author], subjects: [b.titleFr], downloads: 0 })) });
  }
  return jsonError(502, "gutenberg_unreachable", "Le catalogue Project Gutenberg est indisponible pour le moment. Les 100 classiques intégrés restent disponibles (onglet « 100 classiques »).");
}

function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
