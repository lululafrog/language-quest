// Answer checking for course exercises. Stricter than the vocabulary checker:
// articles are NOT ignored (they are often the point of the exercise), but
// contractions and full forms are treated as equivalent.
import { levenshtein, normalize } from "@/lib/text";

const IS_WORDS = ["it", "he", "she", "that", "what", "there", "where", "who", "here", "how", "this"];

export function canonical(s: string): string {
  let t = ` ${normalize(s)} `;
  t = t
    .replace(/ can't /g, " cannot ")
    .replace(/ won't /g, " will not ")
    .replace(/ shan't /g, " shall not ")
    .replace(/ ain't /g, " am not ")
    .replace(/ let's /g, " let us ")
    .replace(/n't /g, " not ")
    .replace(/'m /g, " am ")
    .replace(/'re /g, " are ")
    .replace(/'ve /g, " have ")
    .replace(/'ll /g, " will ")
    .replace(/'d /g, " would ");
  for (const w of IS_WORDS) t = t.replace(new RegExp(` ${w}'s `, "g"), ` ${w} is `);
  t = t.replace(/ cannot /g, " can not ").replace(/ gonna /g, " going to ").replace(/ wanna /g, " want to ");
  return t.replace(/\s+/g, " ").trim();
}

export type Verdict = "exact" | "close" | "wrong";

/** exact = accepted form; close = one small typo on a long answer (counted right, with a spelling note). */
export function verdict(input: string, answers: string[]): Verdict {
  const ins = canonical(input);
  if (!ins) return "wrong";
  const list = answers.map(canonical).filter(Boolean);
  if (list.includes(ins)) return "exact";
  // Missing apostrophe only ("dont", "Ive") → spelling note.
  const bare = normalize(input).replace(/'/g, "");
  if (answers.some((a) => normalize(a).replace(/'/g, "") === bare)) return "close";
  // One small typo inside ONE long word; grammatical endings (-s, -ed, -ing…) are never forgiven.
  const iw = ins.split(" ");
  for (const a of list) {
    const aw = a.split(" ");
    if (aw.length !== iw.length) continue;
    const diff = aw.map((w, i) => [w, iw[i]] as const).filter(([w, x]) => w !== x);
    if (diff.length !== 1) continue;
    const [w, x] = diff[0];
    if (w.length < 6 || levenshtein(w, x) > 1) continue;
    const ending = (u: string, v: string) => /^(s|es|d|ed|ing|er|est|ly)$/.test(u.startsWith(v) ? u.slice(v.length) : v.startsWith(u) ? v.slice(u.length) : "-");
    if (ending(w, x)) continue;
    return "close";
  }
  return "wrong";
}
