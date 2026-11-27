import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/guard";

// Downloads the plain-text edition of a public-domain Project Gutenberg book and strips
// the license header/footer (a short attribution is kept, as Project Gutenberg asks).
const MAX_BYTES = 8 * 1024 * 1024;
export const maxDuration = 60;

type GutendexBook = { id: number; title: string; authors?: { name: string }[]; subjects?: string[]; copyright?: boolean | null; formats?: Record<string, string> };

function stripGutenberg(text: string): string {
  const t = text.replace(/\r\n?/g, "\n");
  const start = t.search(/^\*{3}\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK.*$/im);
  let body = t;
  if (start >= 0) {
    const nl = t.indexOf("\n", start);
    body = t.slice(nl + 1);
  }
  const end = body.search(/^\*{3}\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK.*$/im);
  if (end >= 0) body = body.slice(0, end);
  else {
    const alt = body.search(/^End of (the )?Project Gutenberg/im);
    if (alt >= 0) body = body.slice(0, alt);
  }
  // Remove "Produced by…" credit lines at the very top.
  body = body.replace(/^\s*(Produced by|Transcribed from|E-text prepared by)[^\n]*(\n[^\n]+)*\n\n/i, "");
  return body.trim();
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "follow", headers: { "User-Agent": "Fluent30 reader (educational app)" } });
    if (!r.ok) return null;
    const len = Number(r.headers.get("content-length") || 0);
    if (len > MAX_BYTES) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return null;
    const ct = r.headers.get("content-type") ?? "";
    const charset = /charset=([\w-]+)/i.exec(ct)?.[1]?.toLowerCase();
    try {
      return new TextDecoder(charset && charset !== "us-ascii" ? charset : "utf-8").decode(buf);
    } catch {
      return new TextDecoder("utf-8").decode(buf);
    }
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0 || id > 200000) return jsonError(400, "bad_input", "Identifiant de livre invalide.");

  // Catalogue metadata (optional: Gutendex is often slow or blocks cloud hosts).
  let meta: GutendexBook | null = null;
  try {
    const r = await fetch(`https://gutendex.com/books/${id}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) meta = (await r.json()) as GutendexBook;
  } catch {
    /* ignore: the text files below carry their own Title/Author header */
  }
  if (meta?.copyright === true) return jsonError(403, "copyright", "Ce livre est encore protégé par le droit d'auteur : il ne peut pas être distribué ici.");

  // Official mirror first (reliable), then gutenberg.org, then the formats listed by the catalogue.
  const candidates: string[] = [
    `https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
  ];
  for (const [mime, url] of Object.entries(meta?.formats ?? {})) {
    if (mime.startsWith("text/plain") && !url.endsWith(".zip")) candidates.push(url);
  }

  let raw: string | null = null;
  for (const url of [...new Set(candidates)]) {
    raw = await fetchText(url);
    if (raw && raw.length > 500) break;
  }
  if (!raw) return jsonError(502, "gutenberg_unreachable", "Téléchargement impossible depuis Project Gutenberg (service indisponible ou livre sans version texte). Les 100 classiques de la « bibliothèque du voyageur » restent disponibles.");
  if (/Copyrighted Project Gutenberg/i.test(raw.slice(0, 5000))) return jsonError(403, "copyright", "Ce livre est encore protégé par le droit d'auteur : il ne peut pas être distribué ici.");

  const title = meta?.title ?? /^Title:\s*(.+)$/im.exec(raw)?.[1]?.trim() ?? `Gutenberg #${id}`;
  const author = meta?.authors?.[0]?.name ?? /^Author:\s*(.+)$/im.exec(raw)?.[1]?.trim();
  const body = stripGutenberg(raw);
  const attribution = `This eBook is from Project Gutenberg (www.gutenberg.org), ebook #${id}. It is in the public domain in the USA; check the laws of your country before redistributing it.`;
  return NextResponse.json({ id, title, author, subjects: meta?.subjects ?? [], text: `${body}\n\n${attribution}` });
}
