// Conversation-oriented grammar track (section 7).
import { GRAMMAR_P1 } from "./grammar-p1";
import { GRAMMAR_P2 } from "./grammar-p2";
import { GRAMMAR_P3 } from "./grammar-p3";
import { GRAMMAR_CMP } from "./grammar-cmp";
import type { GrammarLesson } from "./grammar-types";

export * from "./grammar-types";

export const GRAMMAR_LESSONS: GrammarLesson[] = [...GRAMMAR_P1, ...GRAMMAR_P2, ...GRAMMAR_P3, ...GRAMMAR_CMP];

export function getGrammarLesson(id: string): GrammarLesson | undefined {
  return GRAMMAR_LESSONS.find((l) => l.id === id);
}

export function nextGrammarLesson(id: string): GrammarLesson | undefined {
  const i = GRAMMAR_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? GRAMMAR_LESSONS[i + 1] : undefined;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 +-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuzzy match a free-text topic (French or English, e.g. "le present perfect", "conditionnel")
 * to the most relevant lesson. Used to link "points à réviser" from chat reports. */
export function grammarLessonForTopic(text: string): GrammarLesson | undefined {
  const q = norm(text);
  if (!q) return undefined;
  const padded = ` ${q} `;
  const qWords = new Set(q.split(" ").filter((w) => w.length > 2));
  const comparing = /\b(vs|versus|ou|or|et|and)\b/.test(q);
  let best: { lesson: GrammarLesson; score: number } | undefined;
  for (const l of GRAMMAR_LESSONS) {
    let score = 0;
    const names = [...new Set([l.title, l.titleFr, l.id.replace(/-/g, " "), ...l.keywords].map(norm))];
    for (const n of names) {
      if (!n) continue;
      if (q === n) score += 100;
      else if (padded.includes(` ${n} `)) score += 30 + n.length;
      else if (n.length >= 6 && q.length >= 6 && n.includes(q)) score += 20 + q.length;
      else {
        const nWords = n.split(" ").filter((w) => w.length > 2);
        const overlap = nWords.filter((w) => qWords.has(w)).length;
        if (overlap) score += (overlap / Math.max(nWords.length, 1)) * 10;
      }
    }
    // Comparison lessons win only when the topic compares two things.
    if (l.priority === 4) score *= comparing ? 1.3 : 0.5;
    if (score > (best?.score ?? 0)) best = { lesson: l, score };
  }
  return best && best.score >= 12 ? best.lesson : undefined;
}
