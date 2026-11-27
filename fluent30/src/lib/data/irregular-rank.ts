// Irregular verbs ordered by usefulness in everyday spoken English (most frequent first),
// with the learner-interest themes each verb is especially useful for (the personalised 30 %).
import { IRREGULAR_VERBS } from "./irregular";

/** Base forms, most important first. Every entry exists in IRREGULAR_VERBS. */
export const IRREGULAR_ORDER = [
  // Les 25 indispensables
  "be", "have", "do", "say", "get", "go", "make", "know", "think", "take", "see", "come", "give", "find", "tell",
  "feel", "leave", "put", "mean", "keep", "let", "become", "begin", "bring", "write",
  // Les essentiels (26–60)
  "buy", "pay", "meet", "run", "hear", "read", "speak", "understand", "sit", "stand", "lose", "send", "spend", "eat",
  "drink", "drive", "sleep", "forget", "choose", "break", "catch", "teach", "learn", "sell", "build", "fall", "cut",
  "win", "wear", "show", "hold", "set", "grow", "lead", "fly",
  // Pour aller plus loin
  "throw", "wake", "swim", "sing", "draw", "hit", "hurt", "ride", "fight", "hide", "feed", "steal", "shoot", "lie",
  "lay", "rise", "shake", "beat", "bite", "blow", "burn", "dream", "smell", "spell", "freeze", "hang", "ring", "shut",
  "sink", "spread", "stick", "strike", "swear", "tear", "bend", "bet", "bleed", "cost", "dig", "flee", "forbid",
  "forgive", "lend", "light", "quit", "seek", "shine", "shrink", "slide", "spill", "spin", "split", "sweep", "swing",
  "weep", "wind", "withdraw", "upset", "overcome", "mistake", "prove", "arise", "awake", "bear", "bind", "breed",
  "broadcast", "burst", "cling", "creep", "deal", "grind", "kneel", "lean", "speed", "spit", "spring", "sting", "stink",
];

export const IRREGULAR_TIERS = [
  { id: "core", fr: "Les 25 indispensables", en: "The essential 25", from: 0, to: 25 },
  { id: "essential", fr: "Les essentiels (26–60)", en: "Key verbs (26–60)", from: 25, to: 60 },
  { id: "more", fr: "Pour aller plus loin", en: "Going further", from: 60, to: Infinity },
] as const;

/** Verbs especially useful for each interest theme (used for the personalised 30 %). */
export const IRREGULAR_BY_THEME: Record<string, string[]> = {
  crime: ["steal", "shoot", "hide", "flee", "lie", "strike", "bleed", "swear", "catch", "hang", "fight", "beat", "find", "seek", "forbid", "creep"],
  sport: ["run", "swim", "win", "lose", "throw", "ride", "fight", "beat", "hit", "catch", "lead", "fall", "spin", "swing", "spring"],
  travel: ["fly", "drive", "leave", "ride", "bring", "take", "spend", "lose", "find", "meet", "go", "come", "sleep", "wake"],
  airport: ["fly", "leave", "take", "lose", "find", "wake", "sleep"],
  transport: ["drive", "ride", "fly", "leave", "speed", "take", "run"],
  food: ["eat", "drink", "feed", "grind", "cut", "spill", "freeze", "burn", "taste"],
  restaurant: ["eat", "drink", "pay", "choose", "bring", "spill", "cost"],
  animals: ["bite", "feed", "sting", "fly", "swim", "breed", "hide", "run", "creep", "dig"],
  emotions: ["feel", "weep", "hurt", "forgive", "upset", "swear", "mean", "shake", "fall"],
  dating: ["meet", "fall", "choose", "forgive", "think", "feel", "hold", "mean", "lie", "dream"],
  relationships: ["meet", "forgive", "lend", "lie", "tell", "keep", "let", "understand", "upset"],
  work: ["lead", "deal", "build", "sell", "send", "pay", "write", "teach", "set", "quit", "spend", "understand"],
  health: ["hurt", "bleed", "feel", "sleep", "wake", "break", "lie", "shake", "freeze", "swell"],
  home: ["build", "sweep", "hang", "light", "shut", "sleep", "wake", "lay", "sit"],
  nature: ["grow", "blow", "freeze", "shine", "rise", "fall", "sink", "spread"],
  clothes: ["wear", "tear", "shrink", "hang", "put"],
  shopping: ["buy", "sell", "pay", "spend", "cost", "choose", "lend"],
  adventure: ["climb", "swim", "dig", "seek", "find", "fight", "flee", "ride", "hide", "sink"],
  people: ["grow", "meet", "tell", "teach", "know", "become"],
  tech: ["send", "write", "read", "set", "build", "lose", "find"],
};

const known = new Set(IRREGULAR_VERBS.map((v) => v[0]));
export const IRREGULAR_RANKED = IRREGULAR_ORDER.filter((b) => known.has(b)).map((base, i) => {
  const v = IRREGULAR_VERBS.find((x) => x[0] === base)!;
  return { base, past: v[1], pp: v[2], fr: v[3], rank: i + 1 };
});
export type RankedIrregular = (typeof IRREGULAR_RANKED)[number];
