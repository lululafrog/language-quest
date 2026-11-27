// Atlas — the reusable destination engine (Explore the World).
// One structured data model for every destination; content files only fill data,
// the engine (selection by level, review, rewards, progress) and the UI are shared.
import type { CefrLevel, Exercise, DialogueLine } from "../curriculum/types";

export type Continent = "europe" | "asia" | "africa" | "north-america" | "south-america" | "oceania" | "antarctica";

/** Real status — special destinations are never counted as sovereign states. */
export type GeoStatus =
  | "sovereign" // UN member state
  | "observer" // UN observer state (Vatican / Holy See, Palestine)
  | "partially-recognised" // e.g. Kosovo, Taiwan (described factually)
  | "sar" // special administrative region (Hong Kong, Macao)
  | "territory" // overseas territory / dependency / associated state / autonomous territory
  | "region"; // e.g. Antarctica (international treaty zone)

/** Place of English in the destination — never present English as the local language when it is not. */
export type EnglishStatus = "official" | "co-official" | "widely-used" | "foreign";

export type ContentStatus = "complete" | "preview" | "coming";

/** Interest / thematic tags (used for personalisation, filters, collections and routes). */
export type AtlasTag =
  | "diving" | "surf" | "hiking" | "snow" | "volcano" | "food" | "wildlife" | "music" | "capital" | "civilisation"
  | "island" | "adventure-sport" | "architecture" | "literature" | "coffee-tea" | "train" | "art" | "history"
  | "nature" | "city" | "ocean" | "desert" | "market" | "festival" | "science" | "business" | "film" | "fashion" | "sport";

export interface CatalogEntry {
  id: string; // stable slug, e.g. "japan", "uk", "hong-kong"
  iso2: string; // ISO 3166-1 alpha-2 ("AQ" Antarctica, "XK" Kosovo user-assigned)
  nameFr: string;
  nameEn: string;
  continent: Continent;
  status: GeoStatus;
  statusNote?: string; // factual French note for special statuses (e.g. "Région administrative spéciale de la Chine")
  capital: string; // French name; factual note in capitalNote when contested / multiple
  capitalNote?: string;
  /** approximate capital (or main town) coordinates, used to place the pin */
  lat: number;
  lon: number;
  languages: string[]; // main local language(s), French names
  english: EnglishStatus;
  tags: AtlasTag[];
  /** 3–5 mission themes (French) planned for this destination */
  themes: string[];
  /** visit only as a virtual educational experience (conflict / high-risk / closed areas) */
  virtualOnly?: boolean;
  virtualNote?: string;
  /** library book ids (src/lib/data/library.ts) legally available and relevant */
  books?: number[];
  content: ContentStatus;
}

// ---------- full destination content ----------

export type Band = "A1" | "A2" | "B1" | "B2" | "C1";

/** Country-specific mechanics (on top of the course Exercise union). Every checkable item explains WHY. */
export type Mechanic =
  /** Listen/read an order and pick exactly the right items among options (sushi chef, taqueria, packing). */
  | { type: "assemble"; title: string; brief: string; audio?: string; options: { id: string; en: string; fr: string }[]; correct: string[]; explain: string }
  /** Put steps / events in the right order (pasta workshop, lantern, archaeologist timeline). */
  | { type: "steps"; title: string; brief: string; steps: string[]; explain: string; fr?: string[] }
  /** Read / listen to a document (weather report, sign, briefing) and decide; each option has its own feedback. */
  | { type: "decide"; title: string; doc: string; audio?: boolean; question: string; options: { en: string; correct: boolean; why: string }[] }
  /** Negotiation with a virtual seller: each turn, choose a line; politeness and strategy move the price. */
  | { type: "bargain"; title: string; brief: string; item: string; currency: string; start: number; target: number; floor: number; turns: { seller: string; options: { en: string; delta: number; mood: "good" | "rude" | "weak"; why: string }[] }[] }
  /** Mystery: question characters, collect clues, then choose the solution. */
  | { type: "investigate"; title: string; brief: string; suspects: { name: string; role: string; questions: { q: string; a: string; clue?: string }[] }[]; question: string; options: { en: string; correct: boolean; why: string }[] }
  /** Listen to a description and identify (safari photo, monument): options are illustrated labels. */
  | { type: "identify"; title: string; audio: string; options: { en: string; fr: string; motif?: string }[]; answer: number; explain: string }
  /** Free production (spoken or written): validated by meaning, not by an exact sentence. */
  | { type: "produce"; title: string; prompt: string; fr: string; /** each group = one idea; any of its variants counts */ mustInclude: string[][]; minWords: number; samples: string[]; tip: string };

export type AtlasExercise = (Exercise | Mechanic) & {
  /** CEFR band(s) this item suits; the engine picks items around the learner's level */
  bands?: Band[];
  /** vocabulary ids (from the destination vocab) this item practises */
  vocab?: string[];
};

export interface AtlasVocab {
  id: string; // unique inside the destination, e.g. "bargain"
  en: string;
  fr: string;
  example?: string;
  /** cross-destination concept id reused elsewhere (e.g. "to-bargain") so reviews connect countries */
  concept?: string;
}

export interface AtlasCharacter {
  id: string;
  name: string;
  role: string; // French
  origin: "local" | "traveller";
  personality: string; // French
  register: "formel" | "courant" | "familier";
  accent?: "en-GB" | "en-US" | "en-AU" | "en-NZ" | "en-IE" | "en-ZA" | "en-IN" | "en-CA";
  hello: string;
}

export interface AtlasPlace {
  id: string;
  name: string; // real place or generic named place
  kind: string; // café, marché, plage, temple, gare…
  fr: string; // one factual line
}

export interface AtlasMission {
  id: string; // globally unique, prefixed by destination id: "indonesia-market"
  order: number; // 1..10, 10 = final mission
  title: string; // French
  titleEn: string;
  place: string; // AtlasPlace id
  minutes: number;
  briefing: string; // French; for non-English-speaking countries, frame English as the international language used
  /** what you can do at each level (French) */
  objectives: Partial<Record<Band, string>>;
  grammar: string[]; // grammar focus, French
  phrases: { en: string; fr: string }[];
  vocab: string[]; // AtlasVocab ids introduced
  /** pool (8–14 items, bands spread A1→C1); the engine selects 5–10 for the learner */
  exercises: AtlasExercise[];
  tags: AtlasTag[];
  lesson?: string; // course lesson id (src/lib/curriculum)
  scenario?: string; // AI chat scenario id
  reward?: string; // AtlasReward id granted on first success
  /** legacy id from the first world map (kept so existing progress counts) */
  legacyId?: string;
  /** a sport/activity mission is a language exercise, never real safety training */
  activityDisclaimer?: boolean;
}

/** Final mission: a branching story combining several skills. */
export interface StoryNode {
  id: string;
  scene: string; // French narration (short)
  lines?: DialogueLine[]; // what characters say (English, with fr)
  /** the learner acts: a choice (can branch) or a free production (validated by meaning) or a mechanic */
  step:
    | { kind: "choice"; prompt: string; options: { en: string; next: string; good: boolean; why: string }[] }
    | { kind: "produce"; exercise: Extract<Mechanic, { type: "produce" }>; next: string }
    | { kind: "exercise"; exercise: AtlasExercise; next: string }
    | { kind: "end"; summary: string };
}

export interface AtlasFinal {
  id: string; // "<dest>-final"
  title: string;
  titleEn: string;
  intro: string; // French
  start: string; // first node id
  nodes: StoryNode[];
  /** skills evaluated (French) */
  skills: string[];
}

export type RewardKind = "clothing" | "accessory" | "decor" | "souvenir-culture" | "souvenir-activity" | "stamp" | "postcard" | "trophy";

export interface AtlasReward {
  id: string; // "<dest>-<slug>"
  kind: RewardKind;
  fr: string;
  en: string;
  desc: string; // French, respectful of cultural meaning
  /** shop item id when the reward is wearable / decor (src/lib/data/shop.ts) */
  shopItem?: string;
  motif?: string; // illustration hint for the art layer
}

export interface AtlasStory {
  title: string;
  level: Band;
  text: string; // original short story (250–500 words) set in the destination
  glossary: { en: string; fr: string }[];
}

export interface AtlasDestination {
  id: string; // = CatalogEntry.id
  tagline: string; // French
  intro: string; // French, factual and nuanced (no clichés)
  palette: { sky: string; land: string; sea: string; accent: string; ink: string };
  landscape: string; // motif id for the art layer, e.g. "rice-terraces", "fjord", "pyramids"
  capitalNote?: string;
  places: AtlasPlace[];
  characters: AtlasCharacter[];
  culture: { title: string; fr: string }[]; // activities & cultural notes, factual
  food: { en: string; fr: string; desc: string }[];
  vocab: AtlasVocab[];
  expressions: { en: string; fr: string; note?: string }[];
  missions: AtlasMission[]; // ≥ 9 regular missions + the final story
  final: AtlasFinal;
  rewards: AtlasReward[]; // ≥ 2 clothing, 2 accessories, 1 decor, 1 cultural souvenir, 1 activity souvenir, stamp, postcard, trophy
  story?: AtlasStory;
  postcardLine: string; // default English sentence for the postcard
  /** sources consulted for cultural / geographic facts (names + URLs you are sure of) */
  sources: string[];
  /** content QA: who/what checked it */
  review: { linguistic: "auto-checked" | "human"; cultural: "auto-checked" | "human"; updated: string };
}

export const BAND_ORDER: Band[] = ["A1", "A2", "B1", "B2", "C1"];
export type { CefrLevel };
