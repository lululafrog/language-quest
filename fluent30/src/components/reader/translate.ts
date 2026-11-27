"use client";
// Reader translation / adaptation helpers with device cache.
import { cacheGet, cacheSet } from "@/lib/db";
import { getApi, postApi } from "@/lib/api";

function batches(paras: string[], maxChars: number): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  paras.forEach((p, i) => {
    if (cur.length && len + p.length > maxChars) {
      out.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(i);
    len += p.length;
  });
  if (cur.length) out.push(cur);
  return out;
}

/** AI translation of a list of paragraphs (cached under `key`). onProgress(done, total). */
export async function aiTranslateParagraphs(paras: string[], key: string, onProgress?: (done: number, total: number) => void): Promise<string[]> {
  const hit = await cacheGet<string[]>(key);
  if (hit && hit.length === paras.length) return hit;
  const out: string[] = new Array(paras.length).fill("");
  const groups = batches(paras, 7000);
  let done = 0;
  for (const g of groups) {
    const r = await postApi<{ paragraphs: string[] }>("/api/ai/reader/translate", { paragraphs: g.map((i) => paras[i]) });
    g.forEach((i, k) => (out[i] = r.paragraphs[k] ?? ""));
    done++;
    onProgress?.(done, groups.length);
  }
  await cacheSet(key, out);
  return out;
}

/** AI adaptation of a chapter at a CEFR level (cached). */
export async function aiAdaptParagraphs(paras: string[], level: string, title: string, source: string, key: string, onProgress?: (done: number, total: number) => void): Promise<string[]> {
  const hit = await cacheGet<string[]>(key);
  if (hit && hit.length) return hit;
  const out: string[] = new Array(paras.length).fill("");
  const groups = batches(paras, 6000);
  let done = 0;
  for (const g of groups) {
    const r = await postApi<{ paragraphs: string[] }>("/api/ai/reader/adapt", { paragraphs: g.map((i) => paras[i]), level, title, source });
    g.forEach((i, k) => (out[i] = r.paragraphs[k] || paras[i]));
    done++;
    onProgress?.(done, groups.length);
  }
  await cacheSet(key, out);
  return out;
}

/** Free machine translation (MyMemory, ~200 characters per call, limited daily quota). */
export async function freeTranslate(text: string): Promise<string> {
  const parts: string[] = [];
  let cur = "";
  for (const s of text.match(/[^.!?…;]+[.!?…;]*\s*/g) ?? [text]) {
    if ((cur + s).length > 190 && cur) {
      parts.push(cur.trim());
      cur = "";
    }
    if (s.length > 190) {
      for (let i = 0; i < s.length; i += 190) parts.push(s.slice(i, i + 190));
    } else cur += s;
  }
  if (cur.trim()) parts.push(cur.trim());
  const out: string[] = [];
  for (const p of parts) {
    const r = await getApi<{ translation: string }>(`/api/translate-free?q=${encodeURIComponent(p)}`, { cacheKey: `free:${p.toLowerCase()}` });
    out.push(r.translation);
  }
  return out.join(" ");
}

/** Split a paragraph into sentences. */
export function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)\s*/g) ?? [text]).map((s) => s.trim()).filter((s) => s.length > 1);
}
