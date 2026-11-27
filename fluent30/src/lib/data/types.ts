// Seed (verified, built-in) pedagogical data types.

/** Frequency-list entry. `rank` follows spoken-English frequency (see data/SOURCES.md). */
export interface SeedWord {
  en: string; // headword or short expression
  fr: string; // French translation(s), comma-separated
  pos: string; // noun | verb | adj | adv | pron | prep | conj | det | interj | num | modal | expr
  rank: number; // 1 = most frequent
  ex?: string; // example sentence in English (natural, spoken)
  exFr?: string; // French translation of the example
  themes?: string[]; // theme ids from THEMES
  ipa?: string; // British IPA
}

export const TIERS = [
  { id: 100, label: "Les 100 mots essentiels", max: 100 },
  { id: 500, label: "Les 500 mots les plus utiles", max: 500 },
  { id: 1000, label: "Les 1 000 mots fréquents", max: 1000 },
  { id: 2000, label: "Les 2 000 mots fréquents", max: 2000 },
  { id: 3000, label: "Les 3 000 mots fréquents", max: 3000 },
  { id: 5000, label: "Vocabulaire intermédiaire et avancé", max: Infinity },
] as const;

export function tierOf(rank: number): number {
  for (const t of TIERS) if (rank <= t.max) return t.id;
  return 5000;
}

export interface Theme {
  id: string;
  fr: string;
  en: string;
  emoji: string;
}

export const THEMES: Theme[] = [
  { id: "travel", fr: "Voyage", en: "Travel", emoji: "🧳" },
  { id: "airport", fr: "Aéroport", en: "Airport", emoji: "✈️" },
  { id: "transport", fr: "Transports", en: "Transport", emoji: "🚆" },
  { id: "restaurant", fr: "Restaurants", en: "Restaurants", emoji: "🍽️" },
  { id: "food", fr: "Nourriture", en: "Food", emoji: "🥐" },
  { id: "sport", fr: "Sport", en: "Sport", emoji: "🏃" },
  { id: "adventure", fr: "Aventure", en: "Adventure", emoji: "🧭" },
  { id: "health", fr: "Santé", en: "Health", emoji: "🩺" },
  { id: "work", fr: "Travail", en: "Work", emoji: "💼" },
  { id: "relationships", fr: "Relations", en: "Relationships", emoji: "🤝" },
  { id: "dating", fr: "Flirt et séduction", en: "Dating & flirting", emoji: "💘" },
  { id: "emotions", fr: "Émotions", en: "Emotions", emoji: "💭" },
  { id: "daily", fr: "Conversation quotidienne", en: "Everyday conversation", emoji: "💬" },
  { id: "slang", fr: "Argot et expressions familières", en: "Slang & informal", emoji: "😎" },
  { id: "action-verbs", fr: "Verbes d'action", en: "Action verbs", emoji: "⚡" },
  { id: "adjectives", fr: "Adjectifs", en: "Adjectives", emoji: "🎨" },
  { id: "phrasal-verbs", fr: "Phrasal verbs", en: "Phrasal verbs", emoji: "🧩" },
  { id: "idioms", fr: "Expressions idiomatiques", en: "Idioms", emoji: "🦉" },
  { id: "time", fr: "Temps et dates", en: "Time & dates", emoji: "🕒" },
  { id: "home", fr: "Maison", en: "Home", emoji: "🏠" },
  { id: "shopping", fr: "Achats et argent", en: "Shopping & money", emoji: "🛍️" },
  { id: "nature", fr: "Nature et météo", en: "Nature & weather", emoji: "🌿" },
  { id: "people", fr: "Personnes et famille", en: "People & family", emoji: "👪" },
  { id: "body", fr: "Corps", en: "Body", emoji: "🫀" },
  { id: "tech", fr: "Technologie", en: "Technology", emoji: "📱" },
  { id: "grammar-words", fr: "Mots grammaticaux", en: "Function words", emoji: "🔗" },
];

export function themeLabel(id: string, immersion = false): string {
  const t = THEMES.find((x) => x.id === id);
  if (t) return immersion ? t.en : t.fr;
  // Auto-created themes are stored as "custom:<label>"
  return id.startsWith("custom:") ? id.slice(7) : id;
}
export function themeEmoji(id: string): string {
  return THEMES.find((x) => x.id === id)?.emoji ?? "🏷️";
}

/** Core verbs track (section 6). */
export interface CoreVerb {
  base: string; // "get"
  fr: string; // main French equivalents
  past: string;
  pp: string;
  ing: string;
  third: string; // "gets"
  ipa: string; // British IPA of the base
  irregular: boolean;
  meanings: { en: string; fr: string; example: string; exampleFr: string }[];
  expressions: { en: string; fr: string; example: string; exampleFr?: string }[]; // collocations: get tired, get home…
  phrasal: { en: string; fr: string; example: string; exampleFr?: string }[];
  tips?: string; // notes for French speakers
}

/** Graded reader story (original texts written for Fluent30, free of copyright issues). */
export interface GradedStory {
  id: string;
  title: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  genre: string;
  summaryFr: string;
  chapters: { title: string; paragraphs: string[] }[];
}

/** Short listening dialogue. */
export interface Dialogue {
  id: string;
  title: string;
  titleFr: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1";
  theme: string;
  lines: { speaker: "A" | "B"; en: string; fr: string }[];
}
