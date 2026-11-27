// Text utilities: tokenisation, normalisation, fuzzy comparison, lemmatisation.
import { IRREGULAR_FORMS } from "./data/irregular";

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripArticles(s: string): string {
  return s.replace(/^(to|a|an|the|le|la|les|l'|un|une|des|se|s')\s*/i, "").trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Compare a typed answer with accepted answers. Returns "exact" | "close" (typo) | "wrong". */
export function checkAnswer(input: string, accepted: string | string[]): "exact" | "close" | "wrong" {
  const ins = stripArticles(normalize(input));
  if (!ins) return "wrong";
  const list = (Array.isArray(accepted) ? accepted : splitAlternatives(accepted)).map((a) => stripArticles(normalize(a))).filter(Boolean);
  if (list.includes(ins)) return "exact";
  for (const a of list) {
    const tol = a.length <= 4 ? 0 : a.length <= 8 ? 1 : 2;
    if (levenshtein(ins, a) <= tol) return "close";
  }
  return "wrong";
}

/** "maison, foyer; domicile (m)" → ["maison","foyer","domicile"] */
export function splitAlternatives(s: string): string[] {
  return s
    .replace(/\([^)]*\)/g, "")
    .split(/[,;/]| ou /)
    .map((x) => x.trim())
    .filter(Boolean);
}

export interface Token {
  text: string;
  word: boolean;
}

/** Split text into word and non-word tokens, keeping contractions together. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  const re = /([A-Za-zÀ-ÿ]+(?:['’][A-Za-z]+)*)|([^A-Za-zÀ-ÿ]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1]) out.push({ text: m[1], word: true });
    else out.push({ text: m[2], word: false });
  }
  return out;
}

export function wordsOf(text: string): string[] {
  return tokenize(text).filter((t) => t.word).map((t) => t.text);
}

/** Candidate base forms for an inflected English word (most likely first). */
export function lemmaCandidates(word: string): string[] {
  const w = word.toLowerCase().replace(/[’]/g, "'").replace(/'s$/, "");
  const out: string[] = [];
  const add = (x: string) => {
    if (x && !out.includes(x)) out.push(x);
  };
  if (IRREGULAR_FORMS[w]) add(IRREGULAR_FORMS[w]);
  add(w);
  const contractions: Record<string, string> = { "n't": "not", "'re": "be", "'m": "be", "'ll": "will", "'ve": "have", "'d": "would" };
  for (const [suf, base] of Object.entries(contractions)) if (w.endsWith(suf)) { add(w.slice(0, -suf.length)); add(base); }
  if (w.endsWith("ies") && w.length > 4) add(w.slice(0, -3) + "y");
  if (w.endsWith("ied") && w.length > 4) add(w.slice(0, -3) + "y");
  if (w.endsWith("es") && w.length > 3) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 2) add(w.slice(0, -1));
  if (w.endsWith("ing") && w.length > 4) {
    const stem = w.slice(0, -3);
    add(stem);
    add(stem + "e");
    if (/(.)\1$/.test(stem)) add(stem.slice(0, -1));
  }
  if (w.endsWith("ed") && w.length > 3) {
    const stem = w.slice(0, -2);
    add(stem);
    add(w.slice(0, -1));
    if (/(.)\1$/.test(stem)) add(stem.slice(0, -1));
  }
  if (w.endsWith("er") && w.length > 4) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("est") && w.length > 5) { add(w.slice(0, -3)); add(w.slice(0, -2)); }
  if (w.endsWith("ly") && w.length > 4) { add(w.slice(0, -2)); if (w.endsWith("ily")) add(w.slice(0, -3) + "y"); }
  return out;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Word-level similarity between what was said and the target (0..1), for pronunciation feedback. */
export function speechSimilarity(said: string, target: string): { score: number; words: { word: string; ok: boolean }[] } {
  const t = normalize(target).split(" ").filter(Boolean);
  const s = normalize(said).split(" ").filter(Boolean);
  const used = new Set<number>();
  const words = t.map((w) => {
    const idx = s.findIndex((x, i) => !used.has(i) && (x === w || (w.length > 3 && levenshtein(x, w) <= 1)));
    if (idx >= 0) used.add(idx);
    return { word: w, ok: idx >= 0 };
  });
  const ok = words.filter((w) => w.ok).length;
  const extra = Math.max(0, s.length - used.size);
  const score = t.length ? Math.max(0, (ok - extra * 0.25) / t.length) : 0;
  return { score, words };
}
