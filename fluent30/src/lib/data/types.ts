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
  /** 1 = indispensable for travelling/speaking, 2 = everyday life, 3 = according to your interests, 4 = language tools */
  priority: 1 | 2 | 3 | 4;
}

export const THEME_GROUPS: Record<Theme["priority"], { fr: string; en: string; descFr: string }> = {
  1: { fr: "Indispensables", en: "Essentials", descFr: "Ce qu'il faut savoir dire en premier, en voyage comme au quotidien." },
  2: { fr: "Vie quotidienne", en: "Everyday life", descFr: "Pour parler de ta vie, de ton entourage et de ce qui t'entoure." },
  3: { fr: "Selon tes envies", en: "Your interests", descFr: "Pour parler de ce qui te passionne." },
  4: { fr: "Outils de la langue", en: "Language tools", descFr: "Verbes, adjectifs, expressions : la mécanique de l'anglais." },
};

export const THEMES: Theme[] = [
  // 1 — Indispensables
  { id: "greetings", fr: "Salutations & politesse", en: "Greetings & politeness", emoji: "👋", priority: 1 },
  { id: "introductions", fr: "Se présenter", en: "Introducing yourself", emoji: "🙋", priority: 1 },
  { id: "daily", fr: "Conversation quotidienne", en: "Everyday conversation", emoji: "💬", priority: 1 },
  { id: "numbers", fr: "Nombres & prix", en: "Numbers & prices", emoji: "🔢", priority: 1 },
  { id: "time", fr: "Heures, jours & dates", en: "Time & dates", emoji: "🕒", priority: 1 },
  { id: "directions", fr: "Demander son chemin", en: "Asking for directions", emoji: "🧭", priority: 1 },
  { id: "transport", fr: "Transports", en: "Transport", emoji: "🚆", priority: 1 },
  { id: "airport", fr: "Aéroport & avion", en: "Airport & flying", emoji: "✈️", priority: 1 },
  { id: "accommodation", fr: "Hôtel & logement", en: "Hotel & accommodation", emoji: "🏨", priority: 1 },
  { id: "restaurant", fr: "Restaurant & café", en: "Restaurants & cafés", emoji: "🍽️", priority: 1 },
  { id: "shopping", fr: "Achats & argent", en: "Shopping & money", emoji: "🛍️", priority: 1 },
  { id: "health", fr: "Santé & pharmacie", en: "Health & pharmacy", emoji: "🩺", priority: 1 },
  { id: "emergency", fr: "Urgences & sécurité", en: "Emergencies & safety", emoji: "🚨", priority: 1 },
  { id: "travel-problems", fr: "Problèmes en voyage", en: "Travel problems", emoji: "⚠️", priority: 1 },
  // 2 — Vie quotidienne
  { id: "people", fr: "Famille & personnes", en: "Family & people", emoji: "👪", priority: 2 },
  { id: "home", fr: "Maison", en: "Home", emoji: "🏠", priority: 2 },
  { id: "food", fr: "Nourriture & boissons", en: "Food & drink", emoji: "🥐", priority: 2 },
  { id: "body", fr: "Corps", en: "Body", emoji: "🫀", priority: 2 },
  { id: "clothes", fr: "Vêtements", en: "Clothes", emoji: "👕", priority: 2 },
  { id: "emotions", fr: "Émotions & sentiments", en: "Emotions & feelings", emoji: "💭", priority: 2 },
  { id: "opinions", fr: "Donner son avis", en: "Giving opinions", emoji: "🗣️", priority: 2 },
  { id: "nature", fr: "Météo & nature", en: "Weather & nature", emoji: "🌦️", priority: 2 },
  { id: "city", fr: "En ville", en: "In town", emoji: "🏙️", priority: 2 },
  { id: "work", fr: "Travail", en: "Work", emoji: "💼", priority: 2 },
  { id: "school", fr: "Études & école", en: "School & studies", emoji: "🎓", priority: 2 },
  { id: "tech", fr: "Téléphone & internet", en: "Phone & internet", emoji: "📱", priority: 2 },
  { id: "travel", fr: "Voyage", en: "Travel", emoji: "🧳", priority: 2 },
  // 3 — Selon tes envies
  { id: "relationships", fr: "Amis & relations", en: "Friends & relationships", emoji: "🤝", priority: 3 },
  { id: "dating", fr: "Flirt & séduction", en: "Dating & flirting", emoji: "💘", priority: 3 },
  { id: "party", fr: "Sorties & soirées", en: "Going out & parties", emoji: "🎉", priority: 3 },
  { id: "sport", fr: "Sport & fitness", en: "Sport & fitness", emoji: "🏃", priority: 3 },
  { id: "adventure", fr: "Aventure & randonnée", en: "Adventure & hiking", emoji: "🧭", priority: 3 },
  { id: "beach", fr: "Plage & mer", en: "Beach & sea", emoji: "🏖️", priority: 3 },
  { id: "animals", fr: "Animaux", en: "Animals", emoji: "🐾", priority: 3 },
  { id: "cooking", fr: "Cuisine", en: "Cooking", emoji: "👩‍🍳", priority: 3 },
  { id: "music", fr: "Musique", en: "Music", emoji: "🎵", priority: 3 },
  { id: "movies", fr: "Films & séries", en: "Films & series", emoji: "🎬", priority: 3 },
  { id: "books", fr: "Lecture & livres", en: "Reading & books", emoji: "📚", priority: 3 },
  { id: "art", fr: "Art & culture", en: "Art & culture", emoji: "🎨", priority: 3 },
  { id: "crime", fr: "Crime & enquête", en: "Crime & mystery", emoji: "🔎", priority: 3 },
  { id: "slang", fr: "Argot & familier", en: "Slang & informal", emoji: "😎", priority: 3 },
  // 4 — Outils de la langue
  { id: "action-verbs", fr: "Verbes", en: "Verbs", emoji: "⚡", priority: 4 },
  { id: "irregular-verbs", fr: "Verbes irréguliers", en: "Irregular verbs", emoji: "🔁", priority: 4 },
  { id: "phrasal-verbs", fr: "Phrasal verbs", en: "Phrasal verbs", emoji: "🧩", priority: 4 },
  { id: "adjectives", fr: "Adjectifs", en: "Adjectives", emoji: "🎨", priority: 4 },
  { id: "linking", fr: "Mots de liaison", en: "Linking words", emoji: "🔗", priority: 4 },
  { id: "idioms", fr: "Expressions idiomatiques", en: "Idioms", emoji: "🦉", priority: 4 },
  { id: "grammar-words", fr: "Mots grammaticaux", en: "Function words", emoji: "🧱", priority: 4 },
];

export function themeById(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}

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
