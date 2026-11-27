// Fluent30 — domain types shared by the whole app.

export type Skill = "recognition" | "production" | "listening";
export const SKILLS: Skill[] = ["recognition", "production", "listening"];

export type EntryKind = "word" | "verb" | "expression" | "phrase" | "phrasal";
export type CardSource = "seed" | "user" | "reader" | "conversation" | "translator" | "verbs" | "grammar" | "around";
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
  source: "import" | "gutenberg" | "graded";
  format: "epub" | "pdf" | "txt" | "builtin";
  level?: string; // CEFR estimate A1..C2
  genre?: string;
  words?: number;
  chapterCount: number;
  position: { chapter: number; paragraph: number };
  progress: number; // 0..1
  lastOpenedAt?: number;
  gutenbergId?: number;
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
  provider: "openai" | "claude-svg" | "upload";
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
  sessionMinutes: 5 | 10 | 15 | 30 | 60;
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
  reader: { font: "serif" | "sans" | "dyslexic"; size: number; theme: "light" | "sepia" | "dark"; lineHeight: number };
  autoImages: boolean; // generate illustrations automatically when an image API is configured
  lastSyncAt?: number;
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
  claimed: Record<string, string[]>; // date -> claimed quest ids (+ "chest")
  levelRewarded: number; // highest level whose reward was paid
  streakRewarded: number[]; // streak milestones already paid
  updatedAt: number;
}

export type AvatarSlot = "hat" | "glasses" | "top" | "bottom" | "shoes" | "hand" | "neck" | "face" | "background";
