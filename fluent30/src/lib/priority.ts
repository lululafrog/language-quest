// Usefulness priority of an English word for real-life conversation (70/30 method).
// green  = essential everyday vocabulary (learn first)
// blue   = common & useful
// orange = advanced (real English word, but outside the core lists)
// grey   = rare, archaic or mostly literary (or a proper noun): no need to memorise
import { lookupLocal } from "./lexicon";
import { THEME_PACKS } from "./data/theme-packs";
import { THEMES } from "./data/types";
import { guessThemes } from "./autotheme";
import { lemmaCandidates, normalize } from "./text";

export type Priority = "green" | "blue" | "orange" | "grey";

export const PRIORITY_INFO: Record<Priority, { fr: string; en: string; descFr: string; color: string }> = {
  green: { fr: "Essentiel", en: "Essential", descFr: "Vert : mot essentiel du quotidien — à apprendre en priorité.", color: "#2fbf9a" },
  blue: { fr: "Courant", en: "Common", descFr: "Bleu : mot courant et utile — à apprendre ensuite.", color: "#3f7fe0" },
  orange: { fr: "Avancé", en: "Advanced", descFr: "Orange : vocabulaire avancé — utile si tu vises un bon niveau, pas urgent.", color: "#f59e0b" },
  grey: { fr: "Rare", en: "Rare", descFr: "Gris : mot rare, ancien ou surtout littéraire — comprends-le, inutile de le mémoriser.", color: "#9ca3af" },
};

/** Archaic / literary markers frequent in classics but rarely used in conversation. */
const LITERARY = new Set(
  "thee thou thy thine ye hath doth dost art wert shalt wilt ere whilst amongst unto upon hither thither whither hence thence whence wherefore nay aye alas forsooth methinks perchance betwixt oft naught aught twas tis anon yonder verily mayhap lest fain hast hadst canst couldst wouldst shouldst didst knowest sayeth saith morrow eventide countenance visage abode beseech bade wont scarce nigh".split(" "),
);

let packIndex: Map<string, { priority: number; theme: string }> | null = null;
function packs() {
  if (packIndex) return packIndex;
  packIndex = new Map();
  for (const [themeId, items] of Object.entries(THEME_PACKS)) {
    const p = THEMES.find((t) => t.id === themeId)?.priority ?? 3;
    for (const it of items) {
      const k = normalize(it.en);
      const cur = packIndex.get(k);
      if (!cur || p < cur.priority) packIndex.set(k, { priority: p, theme: themeId });
    }
  }
  return packIndex;
}

export interface WordInfo {
  priority: Priority;
  rank?: number; // frequency rank in the built-in spoken-English list
  theme?: string;
  /** 1 (easy) .. 5 (hard) */
  difficulty: number;
  frequencyFr: string;
}

const memo = new Map<string, WordInfo>();

/** `properNoun` = the word is capitalised in the middle of a sentence. `inDictionary` = known to the free dictionary (if checked). */
export function wordInfo(word: string, opts: { properNoun?: boolean; inDictionary?: boolean } = {}): WordInfo {
  const key = `${word.toLowerCase()}|${opts.properNoun ? 1 : 0}|${opts.inDictionary === undefined ? "" : opts.inDictionary ? 1 : 0}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const w = word.toLowerCase().replace(/[’]/g, "'");
  const local = lookupLocal(w);
  const rank = local?.rank;
  let pack: { priority: number; theme: string } | undefined;
  for (const c of [w, ...lemmaCandidates(w)]) {
    pack = packs().get(c);
    if (pack) break;
  }
  let priority: Priority;
  if (LITERARY.has(w)) priority = "grey";
  else if (opts.properNoun && !local && !pack) priority = "grey";
  else if ((rank && rank <= 1000) || pack?.priority === 1 || (local && !rank && local.source !== "irregular")) priority = "green";
  else if (rank || pack || local) priority = "blue";
  else if (opts.inDictionary === false) priority = "grey";
  else priority = w.length >= 13 ? "grey" : "orange";
  const theme = pack?.theme ?? local?.themes?.[0] ?? guessThemes(local?.lemma ?? w, local?.pos).find((t) => t !== "daily");
  const difficulty = priority === "green" ? (rank && rank <= 300 ? 1 : 2) : priority === "blue" ? 3 : priority === "orange" ? 4 : 5;
  const frequencyFr = rank
    ? `Parmi les ${rank <= 100 ? 100 : rank <= 500 ? 500 : rank <= 1000 ? "1 000" : "2 000"} mots les plus utilisés à l'oral`
    : pack
      ? "Vocabulaire utile d'un thème de conversation"
      : opts.properNoun && priority === "grey"
        ? "Nom propre (personnage, lieu…) : pas à apprendre"
        : priority === "orange"
        ? "Mot moins fréquent à l'oral"
        : "Mot rare ou littéraire";
  const info = { priority, rank, theme, difficulty, frequencyFr };
  memo.set(key, info);
  return info;
}

export function priorityOf(word: string, properNoun = false): Priority {
  return wordInfo(word, { properNoun }).priority;
}
