"use client";
// Book import (EPUB / PDF / TXT), Project Gutenberg downloads and graded stories → IndexedDB.
import JSZip from "jszip";
import { LIBRARY, LIBRARY_CATEGORIES } from "./data/library";
import { getDb } from "./db";
import { getApi } from "./api";
import { textDifficulty } from "./lexicon";
import { wordsOf } from "./text";
import type { Book, BookChapter } from "./types";
import type { GradedStory } from "./data/types";

export class ImportError extends Error {}

export const MAX_IMPORT_BYTES = 60 * 1024 * 1024;

// ---------------- Helpers ----------------

function cleanText(s: string): string {
  return s.replace(/­/g, "").replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
}

function countWords(chapters: BookChapter[]): number {
  let n = 0;
  for (const c of chapters) for (const p of c.paragraphs) n += p.split(/\s+/).filter(Boolean).length;
  return n;
}

/** CEFR-like estimate from a sample of the text (first ~2500 words). */
export function estimateLevel(chapters: BookChapter[]): string {
  const sample: string[] = [];
  outer: for (const c of chapters)
    for (const p of c.paragraphs) {
      sample.push(...wordsOf(p));
      if (sample.length > 2500) break outer;
    }
  return textDifficulty(sample).level;
}

function bookId(prefix: string) {
  return `${prefix}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Split very long chapters so that each screen stays light (max ~120 paragraphs). */
function normalizeChapters(chapters: BookChapter[]): BookChapter[] {
  const out: BookChapter[] = [];
  for (const c of chapters) {
    const paras = c.paragraphs.map((p) => p.trim()).filter((p) => p.length > 0);
    if (!paras.length) continue;
    if (paras.length <= 150) {
      out.push({ title: c.title, paragraphs: paras });
      continue;
    }
    const parts = Math.ceil(paras.length / 120);
    for (let i = 0; i < parts; i++) out.push({ title: `${c.title} (${i + 1}/${parts})`, paragraphs: paras.slice(i * 120, (i + 1) * 120) });
  }
  return out;
}

export async function saveBook(meta: Omit<Book, "chapterCount" | "position" | "progress" | "createdAt" | "updatedAt" | "words" | "level"> & { level?: string }, chaptersIn: BookChapter[]): Promise<Book> {
  const chapters = normalizeChapters(chaptersIn);
  if (!chapters.length) throw new ImportError("Aucun texte lisible n'a été trouvé dans ce fichier.");
  const now = Date.now();
  const book: Book = {
    ...meta,
    level: meta.level ?? estimateLevel(chapters),
    words: countWords(chapters),
    chapterCount: chapters.length,
    position: { chapter: 0, paragraph: 0 },
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
  const db = getDb();
  await db.transaction("rw", db.books, db.bookContent, async () => {
    await db.books.put(book);
    await db.bookContent.put({ bookId: book.id, chapters, updatedAt: now });
  });
  return book;
}

export async function deleteBook(id: string) {
  const db = getDb();
  await db.transaction("rw", db.books, db.bookContent, async () => {
    await db.bookContent.delete(id);
    await db.books.delete(id);
  });
  await db.images.delete(`cover:${id}`);
}

// ---------------- TXT ----------------

const HEADING_RE = /^(chapter|chapitre|book|part|letter|stave|act|scene|canto)\s+([0-9]+|[ivxlcdm]+|[a-z-]+)\b.{0,80}$/i;
const ROMAN_RE = /^[IVXLCDM]+\.?$/;

function isHeading(p: string): boolean {
  const s = p.trim();
  if (s.length > 90 || s.includes("\n")) return false;
  if (HEADING_RE.test(s)) return true;
  if (ROMAN_RE.test(s)) return true;
  return false;
}

export function parsePlainText(raw: string, fallbackTitle = "Texte"): BookChapter[] {
  const text = raw.replace(/\r\n?/g, "\n").replace(/﻿/g, "");
  const blocks = text.split(/\n\s*\n+/).map((b) => b.replace(/-\n(\w)/g, "$1").trim()).filter(Boolean);
  const chapters: BookChapter[] = [];
  let cur: BookChapter = { title: fallbackTitle, paragraphs: [] };
  let headings = 0;
  for (const b of blocks) {
    const firstLine = b.split("\n")[0].trim();
    if (isHeading(firstLine)) {
      headings++;
      if (cur.paragraphs.length) chapters.push(cur);
      const rest = b.split("\n").slice(1).join(" ").trim();
      // "CHAPTER I.\nDown the Rabbit-Hole" → title with subtitle
      const subtitle = rest && rest.length < 80 ? rest : "";
      cur = { title: subtitle ? `${firstLine} — ${subtitle}` : firstLine, paragraphs: [] };
      if (rest && !subtitle) cur.paragraphs.push(cleanText(rest));
      continue;
    }
    cur.paragraphs.push(cleanText(b));
  }
  if (cur.paragraphs.length) chapters.push(cur);
  if (headings === 0) {
    // No chapter markers: chunk into sections of ~40 paragraphs.
    const all = chapters.flatMap((c) => c.paragraphs);
    const out: BookChapter[] = [];
    for (let i = 0; i < all.length; i += 40) out.push({ title: all.length > 40 ? `Partie ${i / 40 + 1}` : fallbackTitle, paragraphs: all.slice(i, i + 40) });
    return out;
  }
  return chapters;
}

async function decodeText(buf: ArrayBuffer): Promise<string> {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  const bad = (utf8.match(/�/g) ?? []).length;
  if (bad > 5) return new TextDecoder("windows-1252").decode(buf);
  return utf8;
}

export async function importTxt(file: File): Promise<Book> {
  const raw = await decodeText(await file.arrayBuffer());
  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const chapters = parsePlainText(raw, title);
  return saveBook({ id: bookId("import"), title, source: "import", format: "txt" }, chapters);
}

// ---------------- EPUB ----------------

function resolvePath(base: string, href: string): string {
  const clean = decodeURIComponent(href.split("#")[0]);
  if (clean.startsWith("/")) return clean.slice(1);
  const parts = base.split("/").slice(0, -1);
  for (const seg of clean.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

function parseXml(s: string, type: DOMParserSupportedType = "application/xml"): Document {
  return new DOMParser().parseFromString(s, type);
}

function byLocalName(root: Document | Element, name: string): Element[] {
  return Array.from(root.getElementsByTagName("*")).filter((e) => e.localName === name);
}

const BLOCKS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre", "dd", "dt", "figcaption", "td"]);
const CONTAINERS = new Set(["div", "section", "article", "body", "main", "aside"]);

function extractParagraphs(body: Element): string[] {
  const out: string[] = [];
  const walk = (el: Element) => {
    const name = el.localName.toLowerCase();
    if (["script", "style", "nav", "head"].includes(name)) return;
    if (BLOCKS.has(name)) {
      const t = cleanText(el.textContent ?? "");
      if (t) out.push(t);
      return;
    }
    const hasBlockChild = Array.from(el.children).some((c) => BLOCKS.has(c.localName.toLowerCase()) || CONTAINERS.has(c.localName.toLowerCase()));
    if (!hasBlockChild && CONTAINERS.has(name)) {
      const t = cleanText(el.textContent ?? "");
      if (t) out.push(t);
      return;
    }
    for (const c of Array.from(el.children)) walk(c);
  };
  walk(body);
  return out;
}

export async function importEpub(file: File): Promise<Book> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(await file.arrayBuffer());
  } catch {
    throw new ImportError("Ce fichier EPUB est illisible ou endommagé.");
  }
  const enc = await zip.file("META-INF/encryption.xml")?.async("string");
  if (enc) {
    const doc = parseXml(enc);
    const refs = byLocalName(doc, "CipherReference").map((e) => e.getAttribute("URI") ?? "");
    const methods = byLocalName(doc, "EncryptionMethod").map((e) => e.getAttribute("Algorithm") ?? "");
    const fontOnly = methods.every((m) => /idpf\.org\/2008\/embedding|ns\.adobe\.com\/pdf\/enc#RC/.test(m));
    if (!fontOnly && refs.some((r) => /\.(x?html?|xml)$/i.test(r)))
      throw new ImportError("Ce livre est protégé par des DRM : il ne peut pas être lu en dehors de l'application du vendeur. Importez un fichier sans DRM.");
  }
  if (zip.file("META-INF/rights.xml")) throw new ImportError("Ce livre est protégé par des DRM (Adobe). Importez un fichier sans DRM.");

  const container = await zip.file("META-INF/container.xml")?.async("string");
  if (!container) throw new ImportError("EPUB invalide : fichier container.xml manquant.");
  const opfPath = byLocalName(parseXml(container), "rootfile")[0]?.getAttribute("full-path");
  if (!opfPath) throw new ImportError("EPUB invalide : fichier OPF introuvable.");
  const opfStr = await zip.file(opfPath)?.async("string");
  if (!opfStr) throw new ImportError("EPUB invalide : fichier OPF manquant.");
  const opf = parseXml(opfStr);

  const title = cleanText(byLocalName(opf, "title")[0]?.textContent ?? "") || file.name.replace(/\.epub$/i, "");
  const author = cleanText(byLocalName(opf, "creator")[0]?.textContent ?? "") || undefined;
  const subject = cleanText(byLocalName(opf, "subject")[0]?.textContent ?? "") || undefined;
  const manifest = new Map<string, { href: string; type: string; props: string }>();
  for (const it of byLocalName(opf, "item")) {
    manifest.set(it.getAttribute("id") ?? "", { href: resolvePath(opfPath, it.getAttribute("href") ?? ""), type: it.getAttribute("media-type") ?? "", props: it.getAttribute("properties") ?? "" });
  }

  // Table of contents labels (EPUB 3 nav or EPUB 2 NCX)
  const tocLabels = new Map<string, string>();
  const navItem = [...manifest.values()].find((m) => m.props.split(/\s+/).includes("nav"));
  if (navItem) {
    const s = await zip.file(navItem.href)?.async("string");
    if (s) for (const a of Array.from(parseXml(s, "application/xhtml+xml").getElementsByTagName("a"))) {
      const href = a.getAttribute("href");
      const label = cleanText(a.textContent ?? "");
      if (href && label) {
        const p = resolvePath(navItem.href, href);
        if (!tocLabels.has(p)) tocLabels.set(p, label);
      }
    }
  }
  const ncxItem = [...manifest.values()].find((m) => m.type === "application/x-dtbncx+xml");
  if (ncxItem && !tocLabels.size) {
    const s = await zip.file(ncxItem.href)?.async("string");
    if (s) for (const np of byLocalName(parseXml(s), "navPoint")) {
      const label = cleanText(byLocalName(np, "text")[0]?.textContent ?? "");
      const src = byLocalName(np, "content")[0]?.getAttribute("src");
      if (src && label) {
        const p = resolvePath(ncxItem.href, src);
        if (!tocLabels.has(p)) tocLabels.set(p, label);
      }
    }
  }

  const chapters: BookChapter[] = [];
  const spine = byLocalName(opf, "itemref").map((r) => r.getAttribute("idref") ?? "");
  for (const idref of spine) {
    const item = manifest.get(idref);
    if (!item || !/html|xml/.test(item.type)) continue;
    const s = await zip.file(item.href)?.async("string");
    if (!s) continue;
    let doc = parseXml(s, "application/xhtml+xml");
    if (doc.getElementsByTagName("parsererror").length) doc = parseXml(s, "text/html");
    const body = doc.getElementsByTagName("body")[0];
    if (!body) continue;
    const paragraphs = extractParagraphs(body);
    if (!paragraphs.length) continue;
    const heading = Array.from(body.querySelectorAll("h1,h2,h3"))[0]?.textContent;
    const t = tocLabels.get(item.href) || (heading ? cleanText(heading) : "") || `Section ${chapters.length + 1}`;
    // Merge tiny sections (cover, copyright page…) into the next one.
    const prev = chapters[chapters.length - 1];
    if (prev && prev.paragraphs.join(" ").length < 300 && !tocLabels.get(item.href)) prev.paragraphs.push(...paragraphs);
    else chapters.push({ title: t.slice(0, 120), paragraphs });
  }
  if (!chapters.length) throw new ImportError("Aucun texte trouvé dans cet EPUB (livre composé uniquement d'images ?).");
  const book = await saveBook({ id: bookId("import"), title, author, source: "import", format: "epub", genre: subject }, chapters);
  // Cover image (EPUB 3 "cover-image" property, or EPUB 2 <meta name="cover">), kept on this device only.
  try {
    const coverMetaId = byLocalName(opf, "meta").find((m) => m.getAttribute("name") === "cover")?.getAttribute("content");
    const coverItem = [...manifest.values()].find((m) => m.props.split(/\s+/).includes("cover-image")) ?? (coverMetaId ? manifest.get(coverMetaId) : undefined) ?? [...manifest.values()].find((m) => /^image\//.test(m.type) && /cover/i.test(m.href));
    if (coverItem && /^image\//.test(coverItem.type)) {
      const b64 = await zip.file(coverItem.href)?.async("base64");
      if (b64 && b64.length < 3_000_000) await getDb().images.put({ key: `cover:${book.id}`, mime: coverItem.type, data: `data:${coverItem.type};base64,${b64}`, provider: "upload", createdAt: Date.now(), updatedAt: Date.now() });
    }
  } catch {
    /* a missing cover is not an error */
  }
  return book;
}

// ---------------- PDF ----------------

export async function importPdf(file: File, onProgress?: (p: number) => void): Promise<Book> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "PasswordException") throw new ImportError("Ce PDF est protégé par un mot de passe.");
    throw new ImportError("Ce PDF est illisible ou endommagé.");
  }
  const meta = await pdf.getMetadata().catch(() => null);
  const info = (meta?.info ?? {}) as { Title?: string; Author?: string };
  const pages: string[][] = [];
  let totalChars = 0;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const lines: { y: number; text: string; h: number }[] = [];
    let line = "";
    let lastY: number | null = null;
    let h = 10;
    for (const it of tc.items) {
      if (!("str" in it)) continue;
      const y = it.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2 && line.trim()) {
        lines.push({ y: lastY, text: line, h });
        line = "";
      }
      line += it.str;
      h = Math.max(4, it.height || h);
      lastY = y;
      if (it.hasEOL) {
        if (line.trim()) lines.push({ y, text: line, h });
        line = "";
        lastY = null;
      }
    }
    if (line.trim() && lastY !== null) lines.push({ y: lastY, text: line, h });
    // Rebuild paragraphs: a large vertical gap or a short line ending a sentence closes a paragraph.
    const gaps = lines.slice(1).map((l, k) => Math.abs(lines[k].y - l.y)).filter((g) => g > 0).sort((a, b) => a - b);
    const typical = gaps[Math.floor(gaps.length / 2)] ?? 12;
    const maxLen = Math.max(...lines.map((l) => l.text.length), 1);
    const paras: string[] = [];
    let cur = "";
    lines.forEach((l, k) => {
      const t = l.text.trim();
      if (!t || /^\d{1,4}$/.test(t)) return; // page numbers
      if (cur.endsWith("-")) cur = cur.slice(0, -1) + t;
      else cur = cur ? `${cur} ${t}` : t;
      const next = lines[k + 1];
      const gap = next ? Math.abs(l.y - next.y) : Infinity;
      const shortEnd = t.length < maxLen * 0.7 && /[.!?:"”']$/.test(t);
      if (gap > typical * 1.45 || shortEnd) {
        paras.push(cleanText(cur));
        cur = "";
      }
    });
    if (cur) paras.push(cleanText(cur));
    totalChars += paras.join("").length;
    pages.push(paras);
    onProgress?.(i / pdf.numPages);
  }
  if (totalChars / Math.max(1, pdf.numPages) < 40)
    throw new ImportError("Ce PDF ne contient pas de texte sélectionnable (document scanné). Utilisez un PDF texte, un EPUB ou un TXT.");

  // Chapters: detect "Chapter …" headings, otherwise group pages by 10.
  const chapters: BookChapter[] = [];
  let cur: BookChapter | null = null;
  let detected = 0;
  pages.forEach((paras, pi) => {
    for (const p of paras) {
      if (isHeading(p)) {
        detected++;
        if (cur?.paragraphs.length) chapters.push(cur);
        cur = { title: p, paragraphs: [] };
      } else {
        if (!cur) cur = { title: `Pages ${pi + 1}`, paragraphs: [] };
        cur.paragraphs.push(p);
      }
    }
  });
  if (cur && (cur as BookChapter).paragraphs.length) chapters.push(cur);
  let finalChapters = chapters;
  if (detected < 2) {
    finalChapters = [];
    for (let i = 0; i < pages.length; i += 10) {
      finalChapters.push({ title: `Pages ${i + 1}–${Math.min(pages.length, i + 10)}`, paragraphs: pages.slice(i, i + 10).flat() });
    }
  }
  const title = info.Title?.trim() || file.name.replace(/\.pdf$/i, "");
  return saveBook({ id: bookId("import"), title, author: info.Author?.trim() || undefined, source: "import", format: "pdf" }, finalChapters);
}

export async function importFile(file: File, onProgress?: (p: number) => void): Promise<Book> {
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError("Fichier trop volumineux (60 Mo maximum).");
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "epub" || file.type === "application/epub+zip") return importEpub(file);
  if (ext === "pdf" || file.type === "application/pdf") return importPdf(file, onProgress);
  if (ext === "txt" || file.type.startsWith("text/")) return importTxt(file);
  throw new ImportError("Format non pris en charge. Formats acceptés : EPUB, PDF, TXT.");
}

// ---------------- Project Gutenberg ----------------

export interface GutenbergHit {
  id: number;
  title: string;
  authors: string[];
  subjects: string[];
  downloads: number;
}

export async function searchGutenberg(params: { q?: string; topic?: string; page?: number }): Promise<{ count: number; results: GutenbergHit[]; hasNext: boolean }> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.topic) sp.set("topic", params.topic);
  sp.set("page", String(params.page ?? 1));
  return getApi(`/api/gutenberg/search?${sp}`, { cacheKey: `gutsearch:${sp}` });
}

export async function downloadGutenberg(id: number, hint?: { title?: string; author?: string; genre?: string; level?: string }): Promise<Book> {
  const existing = await getDb().books.where("source").equals("gutenberg").filter((b) => b.gutenbergId === id).first();
  if (existing) return existing;
  // 1. Built-in library (shipped with the app, works without any external service).
  const local = LIBRARY.find((b) => b.id === id);
  if (local) {
    const text = await fetchBundledBook(id);
    if (text) {
      const cat = LIBRARY_CATEGORIES.find((c) => c.id === local.cat);
      return saveBook({ id: `gutenberg:${id}`, title: local.title, author: local.author, source: "gutenberg", format: "txt", gutenbergId: id, libraryId: id, genre: cat?.fr, level: local.level }, parsePlainText(text, local.title));
    }
  }
  // 2. Project Gutenberg through the server (mirror first).
  const r = await getApi<{ id: number; title: string; author?: string; text: string; subjects: string[] }>(`/api/gutenberg/book?id=${id}`);
  const chapters = parsePlainText(r.text, r.title);
  return saveBook({ id: `gutenberg:${id}`, title: r.title || hint?.title || `Gutenberg #${id}`, author: r.author || hint?.author, source: "gutenberg", format: "txt", gutenbergId: id, libraryId: local ? id : undefined, genre: hint?.genre ?? (local ? LIBRARY_CATEGORIES.find((c) => c.id === local.cat)?.fr : undefined), level: hint?.level ?? local?.level }, chapters);
}

/** Loads public/books/<id>.txt.gz and decompresses it in the browser. */
async function fetchBundledBook(id: number): Promise<string | null> {
  try {
    const res = await fetch(`/books/${id}.txt.gz`);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    // Some hosts decompress .gz transparently: detect the gzip magic number.
    if (buf[0] !== 0x1f || buf[1] !== 0x8b) return new TextDecoder("utf-8").decode(buf);
    const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  } catch {
    return null;
  }
}

// ---------------- Graded stories ----------------

export async function ensureGradedBook(story: GradedStory): Promise<Book> {
  const id = `graded:${story.id}`;
  const db = getDb();
  const existing = await db.books.get(id);
  if (existing) return existing;
  return saveBook({ id, title: story.title, source: "graded", format: "builtin", level: story.level, genre: story.genre, author: "Fluent30" }, story.chapters);
}

export function bookLengthLabel(words = 0): "court" | "moyen" | "long" {
  return words < 5000 ? "court" : words < 30000 ? "moyen" : "long";
}
