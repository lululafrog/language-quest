// Special vocabulary collections: curated selections of the shared lexicon with their own identity, intermediate
// goals (25 / 50 / 75 %) and a final avatar reward (lib/data/shop.ts, earn kind "collection").
// Progress counts CONSOLIDATED words only (real memory), never cards merely viewed.
import type { LexEntry } from "./lexicon-full";

export interface VocabCollection {
  id: string;
  title: string;
  tagline: string;
  /** illustration (universe art) and colour */
  art: string;
  hue: "sea" | "sage" | "terracotta" | "sand" | "plum" | "ocean" | "moss" | "rose" | "slate" | "amber";
  /** maximum number of words (most useful first) */
  size: number;
  /** reward item id in the avatar shop */
  reward: string;
  select: (e: LexEntry) => boolean;
  /** ordering: most useful first (default: level then frequency rank) */
  order?: (a: LexEntry, b: LexEntry) => number;
}

const LV = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 } as const;
const hasSub = (e: LexEntry, ...subs: string[]) => e.subs.some((s) => subs.includes(s) || subs.some((x) => x.endsWith(".*") && s.startsWith(x.slice(0, -1))));
const GRAMMAR_POS = new Set(["det", "pron", "prep", "conj", "num", "interj", "modal"]);

export const COLLECTIONS: VocabCollection[] = [
  { id: "first100", title: "Mes 100 premiers mots", tagline: "Le socle : les mots qu'on entend partout", art: "daily", hue: "sand", size: 100, reward: "x-col-first100",
    select: (e) => e.core && e.rank <= 400 && !GRAMMAR_POS.has(e.pos) && e.level === "A1", order: (a, b) => a.rank - b.rank },
  { id: "verbs", title: "Les verbes indispensables", tagline: "Ceux qui font tourner toutes les phrases", art: "work", hue: "slate", size: 120, reward: "x-col-verbs",
    select: (e) => (e.cat === "verb" || e.cat === "irregular") && LV[e.level] <= 2, order: (a, b) => a.rank - b.rank },
  { id: "airport", title: "Survivre à l'aéroport", tagline: "De l'enregistrement à la porte d'embarquement", art: "travel", hue: "sea", size: 80, reward: "x-col-airport",
    select: (e) => hasSub(e, "travel.airport", "travel.plane", "travel.border") && LV[e.level] <= 3 },
  { id: "solo", title: "Voyager seul à l'étranger", tagline: "Se débrouiller, demander, rebondir", art: "transport", hue: "ocean", size: 100, reward: "x-col-solo",
    select: (e) => hasSub(e, "travel.problems", "travel.orientation", "travel.hotel", "transport.directions", "emergency.lost", "travel.backpacking") && LV[e.level] <= 3 },
  { id: "flirt", title: "Flirter en anglais", tagline: "Avec élégance et un brin d'humour", art: "love", hue: "rose", size: 80, reward: "x-col-flirt",
    select: (e) => hasSub(e, "love.flirting", "love.compliments", "love.dating", "love.plans") },
  { id: "native", title: "Parler comme un natif", tagline: "Ce que les anglophones disent vraiment", art: "humour", hue: "terracotta", size: 100, reward: "x-col-native",
    select: (e) => e.cat === "native" || hasSub(e, "debate.fillers", "humour.reactions") },
  { id: "restaurant", title: "Commander au restaurant", tagline: "De la réservation à l'addition", art: "food", hue: "terracotta", size: 80, reward: "x-col-restaurant",
    select: (e) => hasSub(e, "food.ordering", "travel.restaurant", "food.cafe") && LV[e.level] <= 3 },
  { id: "friends", title: "Se faire des amis en voyage", tagline: "Briser la glace et garder le contact", art: "friends", hue: "amber", size: 80, reward: "x-col-friends",
    select: (e) => hasSub(e, "friends.making-friends", "travel.meeting", "daily.small-talk", "friends.invitations") && LV[e.level] <= 3 },
  { id: "school", title: "Les expressions que l'école ne nous apprend pas", tagline: "Argot, images et clins d'œil", art: "humour", hue: "plum", size: 100, reward: "x-col-school",
    select: (e) => (e.cat === "slang" || e.cat === "idiom") && LV[e.level] <= 3 },
  { id: "literal", title: "Arrêter de traduire mot à mot", tagline: "Faux amis et associations naturelles", art: "debate", hue: "sea", size: 100, reward: "x-col-literal",
    select: (e) => e.cat === "falsefriend" || e.cat === "collocation" },
  { id: "phrasal", title: "Les phrasal verbs incontournables", tagline: "get up, give up, figure out…", art: "transport", hue: "moss", size: 100, reward: "x-col-phrasal",
    select: (e) => e.cat === "phrasal" && LV[e.level] <= 3 },
  { id: "interview", title: "Préparer un entretien professionnel", tagline: "Se présenter, convaincre, négocier", art: "work", hue: "slate", size: 80, reward: "x-col-interview",
    select: (e) => hasSub(e, "work.interview", "work.job-search", "work.negotiation") },
  { id: "stories", title: "Raconter ses aventures", tagline: "Captiver avec ses souvenirs de voyage", art: "nature", hue: "sage", size: 80, reward: "x-col-stories",
    select: (e) => hasSub(e, "debate.storytelling", "emotions.surprise", "travel.hiking", "travel.diving") },
  { id: "humour", title: "Développer son humour en anglais", tagline: "Taquiner, ironiser, faire rire", art: "humour", hue: "amber", size: 80, reward: "x-col-humour",
    select: (e) => hasSub(e, "humour.jokes", "humour.sarcasm", "humour.banter", "humour.exclamations") },
];

const defaultOrder = (a: LexEntry, b: LexEntry) => LV[a.level] - LV[b.level] || a.rank - b.rank;

/** Words of a collection (most useful first, capped to its size). */
export function collectionWords(c: VocabCollection, lex: LexEntry[]): LexEntry[] {
  return lex.filter(c.select).sort(c.order ?? defaultOrder).slice(0, c.size);
}

export const MILESTONES = [0.25, 0.5, 0.75, 1] as const;

export function collectionById(id: string): VocabCollection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}
