// Fluent30 — domain types shared by the whole app.

export type Skill = "recognition" | "production" | "listening";
export const SKILLS: Skill[] = ["recognition", "production", "listening"];

export type EntryKind = "word" | "verb" | "expression" | "phrase" | "phrasal";
export type CardSource = "seed" | "user" | "reader" | "conversation" | "translator" | "verbs" | "grammar" | "around" | "reallife" | "memory" | "journal" | "mission" | "game";
export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1";
export type Register = "familier" | "courant" | "professionnel" | "soutenu";

/** A learning item (word, verb, expression, sentence). */
export interface Card {
  id: string;
  term: string; // English
  lemma: string; // base form, lowercase (used for duplicates / grouping)
  kind: EntryKind;
  fr: string; // French translation(s)
  definition?: string; // simple English definition
  ipa?: string; // e.g. /ˈwɔːtə/
  ipaUS?: string;
  pos?: string; // noun, verb, adjective…
  example?: string;
  exampleFr?: string;
  synonyms?: string[];
  antonyms?: string[];
  forms?: Record<string, string>; // e.g. { past: "went", pp: "gone", ing: "going", plural: "..." }
  variants?: string[]; // conjugated / inflected forms grouped under this lemma
  themes: string[];
  difficulty?: number; // 1 (easy) … 5 (hard)
  frequencyRank?: number; // rank in frequency list, lower = more frequent
  tier?: number; // 100, 500, 1000, 2000, 3000, 5000 (intermediate/advanced)
  register?: Register;
  imageKey?: string; // key in images table
  source: CardSource;
  enriched: boolean; // filled by AI or by verified seed data
  notes?: string;
  suspended?: boolean;
  /** personal context: where the learner met this word (capture, photo, journal…) */
  context?: string;
  captureId?: string;
  memoryId?: string;
  journalId?: string;
  /** CEFR level of the word (A1…C1), from the shared lexicon or estimated */
  cefr?: Cefr;
  /** answers given in games and exercises (first attempt per question) */
  gameStats?: { correct: number; wrong: number; hints: number; lastAt?: number };
  /** where the learner has met this word: game ids, "reader", "lesson", "mission", "photo"… (deduplicated) */
  seenIn?: string[];
  createdAt: number;
  updatedAt: number;
}

/** FSRS scheduling state for one card × one skill. */
export interface SrsState {
  id: string; // `${cardId}:${skill}`
  cardId: string;
  skill: Skill;
  due: number; // epoch ms
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number; // ts-fsrs State enum (0 New,1 Learning,2 Review,3 Relearning)
  last_review?: number;
  updatedAt: number;
}

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface ReviewLog {
  id: string;
  cardId: string;
  skill: Skill;
  rating: Grade;
  at: number;
  ms?: number; // response time
  context?: "review" | "game" | "learn" | "test";
  updatedAt: number;
}

export interface KnownWord {
  lemma: string;
  at: number;
  updatedAt: number;
}

export interface BookChapter {
  title: string;
  paragraphs: string[];
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  source: "import" | "gutenberg" | "graded" | "custom";
  format: "epub" | "pdf" | "txt" | "builtin";
  level?: string; // CEFR estimate A1..C2
  genre?: string;
  words?: number;
  chapterCount: number;
  position: { chapter: number; paragraph: number };
  progress: number; // 0..1
  lastOpenedAt?: number;
  gutenbergId?: number;
  /** id in the built-in library (lib/data/library.ts) */
  libraryId?: number;
  /** AI-generated personal novel id (table "novels") */
  novelId?: string;
  startedAt?: number;
  finishedAt?: number;
  rating?: number; // 1..5, given by the reader
  readingSeconds?: number;
  wordsRead?: number;
  chaptersDone?: number[]; // chapters whose end-of-chapter session was completed
  quizResults?: { chapter: number; score: number; total: number; at: number }[];
  /** difficulty signals: words looked up per 100 words read, per chapter */
  lookups?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BookContent {
  bookId: string;
  chapters: BookChapter[];
  updatedAt: number;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD (local)
  seconds: number;
  newWords: number;
  reviews: number;
  correct: number;
  games: number;
  readingWords: number;
  chatMessages: number;
  grammarExercises: number;
  xp: number;
  around?: number; // things named in English with the "Autour de moi" exercise
  /** snapshot of the number of well-mastered words that day (vocabulary dashboard chart) */
  masteredWords?: number;
  updatedAt: number;
}

export interface Mistake {
  id: string; // stable key, e.g. "grammar:present-perfect" or "vocab:<cardId>"
  type: "grammar" | "vocab" | "spelling" | "pronunciation" | "conjugation";
  label: string; // human-readable
  detail?: string;
  example?: string;
  count: number;
  lastAt: number;
  updatedAt: number;
}

export interface GrammarProgress {
  lessonId: string;
  status: "started" | "done";
  bestScore: number; // 0..1
  attempts: number;
  lastAt: number;
  updatedAt: number;
}

export interface GameResult {
  id: string;
  gameId: string;
  score: number;
  total: number;
  durationSec: number;
  at: number;
  updatedAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  correction?: string; // immediate-mode correction attached to a user message
}

export interface ConversationReport {
  summary: string;
  errors: { original: string; corrected: string; explanation: string }[];
  naturalAlternatives: { original: string; natural: string; register?: string }[];
  newWords: { term: string; fr: string; example?: string }[];
  expressions: { term: string; fr: string; example?: string }[];
  grammarPoints: string[];
}

export interface Conversation {
  id: string;
  scenarioId: string;
  mode: CorrectionMode;
  messages: ChatMessage[];
  report?: ConversationReport;
  createdAt: number;
  updatedAt: number;
}

export interface ImageAsset {
  key: string; // normalized lemma + sense
  mime: string; // image/svg+xml | image/png | image/webp
  data: string; // data URL
  provider: "openai" | "claude-svg" | "upload" | "openverse";
  /** openly licensed images (Openverse): credit shown with the image */
  attribution?: string;
  license?: string;
  sourceUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TestResult {
  id: string;
  type: "placement" | "weekly" | "monthly";
  scores: Partial<Record<SkillArea, number>>; // 0..1
  vocabEstimate?: number;
  at: number;
  updatedAt: number;
}

export type SkillArea = "vocabulary" | "grammar" | "reading" | "listening" | "writing" | "speaking";

export interface SessionPlanStep {
  id: string;
  kind: "review" | "new" | "grammar" | "game" | "reading" | "conversation" | "listening" | "verbs";
  minutes: number;
  title: string;
  href: string;
  done: boolean;
}

export interface DailySession {
  date: string;
  minutes: number;
  steps: SessionPlanStep[];
  updatedAt: number;
}

export type CorrectionMode = "immediate" | "end" | "free";

export interface Settings {
  id: "me";
  displayName?: string;
  dailyNewWords: number; // default 10
  sessionMinutes: 5 | 10 | 15 | 20 | 30 | 60;
  /** level the learner follows in the course path (from placement or chosen) */
  pathLevel?: "A1" | "A2" | "B1" | "B2" | "C1";
  /** explicit consent to send personal content (photos, screenshots, journal, voice) to the AI service. Asked once, revocable. */
  personalAiConsent?: boolean;
  /** sync personal content (captures, journal, memories — text only, never photos/audio) to the learner's own cloud account. Off by default. */
  syncPersonalContent?: boolean;
  /** world map: destination chosen at onboarding */
  homeDestination?: string;
  /** Atlas: favourite destinations and chosen thematic route */
  atlasFavorites?: string[];
  atlasRoute?: string;
  immersion: boolean; // UI fully in English
  theme: "system" | "light" | "dark";
  accent: "en-GB" | "en-US";
  voiceURI?: string;
  speechRate: number; // 0.5..1.5
  correctionMode: CorrectionMode;
  interests: string[];
  goals: string[];
  placementDone: boolean;
  onboarded: boolean;
  reader: { font: "serif" | "sans" | "dyslexic"; size: number; theme: "light" | "sepia" | "dark"; lineHeight: number; brightness?: number; margin?: number; voice?: "en-GB" | "en-US" };
  autoImages: boolean; // generate illustrations automatically when an image API is configured
  reduceMotion?: boolean; // accessibility: disable celebrations/animations
  textScale?: number; // accessibility: 0.9 … 1.3 (root font-size multiplier)
  readingMode?: "immersive" | "assisted" | "bilingual";
  readingGoals?: { minutesPerWeek: number; wordsPerWeek: number; booksPerMonth: number };
  lastSyncAt?: number;
  /** vocabulary level estimated from the learner's real answers in games (may differ from pathLevel) */
  vocabLevel?: { level: Cefr; down?: boolean; at: number };
  /** last choices on the game mode screen */
  gamePrefs?: { mode: "new" | "review"; theme?: string };
  updatedAt: number;
}

export interface CacheEntry {
  key: string;
  value: unknown;
  at: number;
}

/** Structured AI enrichment returned by /api/ai/enrich. */
export interface Enrichment {
  term: string;
  lemma: string;
  kind: EntryKind;
  fr: string;
  definition: string;
  ipaUK: string;
  ipaUS: string;
  pos: string;
  example: string;
  exampleFr: string;
  synonyms: string[];
  antonyms: string[];
  forms: Record<string, string>;
  themes: string[];
  difficulty: number;
  frequency: "very common" | "common" | "less common" | "rare";
  register: Register;
  imagePrompt: string;
  notes?: string;
}

/** Gamification state (single row, id "me"). */
export interface GameState {
  id: "me";
  coins: number;
  totalEarned: number;
  owned: string[]; // shop item ids
  equipped: Partial<Record<AvatarSlot, string>>;
  appearance?: Appearance;
  /** personal bookshelf: decoration style, owned & placed decorations, unlocked shelves */
  shelf?: { style: string; decor: string[]; placed: Record<string, string>; shelves: number };
  claimed: Record<string, string[]>; // date -> claimed quest ids (+ "chest")
  levelRewarded: number; // highest level whose reward was paid
  streakRewarded: number[]; // streak milestones already paid
  /** up to 5 saved favourite outfits */
  outfits?: { id: string; name: string; equipped: Partial<Record<AvatarSlot, string>> }[];
  updatedAt: number;
}

export type AvatarSlot = "hat" | "glasses" | "face" | "top" | "outer" | "dress" | "bottom" | "shoes" | "bag" | "neck" | "hand" | "background";

/** How the learner's character looks (chosen at sign-up, editable for free). */
export interface Appearance {
  gender?: "female" | "male";
  skin: string;
  hair: "short" | "long" | "bun" | "curly" | "ponytail" | "afro" | "buzz" | "bob" | "bald" | "pixie" | "braids" | "wavy" | "spiky" | "mohawk" | "sidepart";
  hairColor: string;
  face?: "oval" | "round" | "square" | "heart" | "long" | "diamond";
  /** body morphology (clothes are drawn to fit) */
  body?: "slim" | "average" | "strong";
  /** default facial expression */
  expression?: "neutral" | "smile" | "laugh" | "surprised" | "focused";
  eyes: "round" | "happy" | "lashes";
  eyeColor?: string;
  brows?: "thin" | "normal" | "thick";
  nose?: "small" | "round" | "long";
  lips?: "thin" | "normal" | "full";
  facialHair?: "none" | "stubble" | "moustache" | "goatee" | "short" | "full";
  freckles?: boolean;
  makeup?: "none" | "blush" | "lipstick" | "eyeliner";
  /** @deprecated use facialHair */
  beard: boolean;
}

// ---------------- Library v2 ----------------

export interface WishItem {
  id: string; // "lib:<libraryId>" or a book id
  addedAt: number;
  updatedAt: number;
}

export interface AchievementRecord {
  id: string; // achievement id (lib/achievements.ts)
  unlockedAt: number;
  updatedAt: number;
}

/** A finished book, displayed on the personal bookshelf (collectible card). */
export interface CollectionEntry {
  bookId: string;
  libraryId?: number;
  title: string;
  author?: string;
  cat?: string;
  level?: string;
  finishedAt: number;
  times: number; // how many times finished
  card: "bronze" | "silver" | "gold" | "holo";
  stats: { wordsRead: number; readingSeconds: number; newWords: number; memorized: number; expressions: number; quizAvg: number | null; lookupsPer100: number | null };
  updatedAt: number;
}

/** AI-generated personal novel: story bible + chapters (also stored as a Book for the reader). */
export interface Novel {
  id: string;
  bookId: string;
  title: string;
  prefs: { genre: string; level: string; setting: string; era: string; hero: string; mood: string; chapterWords: number; chapters: number; interactive: boolean };
  bible: string; // running memory: characters, events, choices
  chapters: { title: string; text: string; summary: string; choices?: string[]; chosen?: string }[];
  cover: { palette: string[]; motif: string; subtitle?: string };
  status: "writing" | "done";
  createdAt: number;
  updatedAt: number;
}

/** Progress on a structured lesson (course path / real-life module), with FSRS review scheduling. */
export interface LessonProgress {
  id: string; // lesson id
  status: "started" | "done";
  bestScore: number; // 0..1
  lastScore: number;
  attempts: number;
  lastAt: number;
  weakTags: string[]; // concept tags missed in the last attempt
  // FSRS state for spaced review of the lesson
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: number;
  updatedAt: number;
}


// ---------- Phase 2: personal content (private by default) ----------

/** Binary media kept ON THE DEVICE ONLY (photos, voice notes). Never synced, deletable, included in export as metadata only. */
export interface MediaBlob {
  key: string;
  blob: Blob;
  mime: string;
  size: number;
  createdAt: number;
}

export type CaptureKind = "text" | "screenshot" | "photo" | "voice" | "french" | "film" | "book";

/** "My Real Life English": something the learner met in real life, analysed by AI. */
export interface Capture {
  id: string;
  kind: CaptureKind;
  title: string;
  input: string; // text, OCR or transcript (what was analysed)
  mediaKey?: string; // MediaBlob key (screenshot/photo/voice), local only
  analysis?: unknown; // structured AI analysis (see lib/reallife.ts)
  keptCardIds: string[];
  createdAt: number;
  updatedAt: number;
}

/** "My English Journey": daily journal entry. */
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  prompt?: string;
  text: string;
  mood?: string;
  place?: string; // only if the learner types it
  mediaKeys?: string[]; // photos (local)
  audioKey?: string; // voice recording (local)
  monthly?: boolean; // the monthly "same topic" oral check
  versions?: { corrected: string; natural: string; notes: { from: string; to: string; why: string; tag?: string }[]; pending?: { en: string; fr: string }[] };
  keptCardIds: string[];
  createdAt: number;
  updatedAt: number;
}

/** "Memory Cards": a personal photo turned into vocabulary. */
export interface Memory {
  id: string;
  title: string;
  takenAt?: string;
  place?: string;
  photoKey?: string; // MediaBlob key (original photo, compressed), local only
  illustrationKey?: string; // images table key if the learner generated an illustration
  sentence?: string; // English sentence about the memory
  sentenceFr?: string;
  words: { en: string; fr: string; cardId?: string }[];
  createdAt: number;
  updatedAt: number;
}

/** World map missions (destinations → places → missions). */
export interface MissionProgress {
  id: string; // mission id
  status: "started" | "done";
  /** CEFR band the mission was last played at (Atlas engine adapts content to the learner's level) */
  band?: "A1" | "A2" | "B1" | "B2" | "C1";
  /** best band validated (a destination can be replayed at a higher level) */
  bestBand?: "A1" | "A2" | "B1" | "B2" | "C1";
  bestScore: number;
  attempts: number;
  completedAt?: number;
  updatedAt: number;
}

/** Illustrated postcard created when a destination is validated (Atlas). Private, shared only if the learner chooses. */
export interface Postcard {
  id: string; // destination id
  destId: string;
  message: string; // learner's English message
  corrected?: string; // optional AI correction
  band?: "A1" | "A2" | "B1" | "B2" | "C1";
  skills: string[];
  rewards: string[];
  validatedAt: number;
  updatedAt: number;
}
