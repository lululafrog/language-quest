// The 20 mini-games of Fluent30.
export type GameCategory = "vocabulary" | "listening" | "grammar" | "verbs" | "speaking";

export interface GameDef {
  id: string;
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  category: GameCategory;
  emoji: string;
  minutes: number;
}

export const CATEGORY_LABELS: Record<GameCategory, { fr: string; en: string }> = {
  vocabulary: { fr: "Vocabulaire", en: "Vocabulary" },
  listening: { fr: "Écoute", en: "Listening" },
  grammar: { fr: "Grammaire", en: "Grammar" },
  verbs: { fr: "Verbes", en: "Verbs" },
  speaking: { fr: "Prononciation", en: "Pronunciation" },
};

export const GAMES: GameDef[] = [
  { id: "hangman", titleFr: "Le pendu", titleEn: "Hangman", descFr: "Devine le mot lettre par lettre grâce à sa traduction.", descEn: "Guess the word letter by letter.", category: "vocabulary", emoji: "🪢", minutes: 4 },
  { id: "pairs", titleFr: "Paires anglais–français", titleEn: "English–French pairs", descFr: "Associe chaque mot à sa traduction.", descEn: "Match each word with its translation.", category: "vocabulary", emoji: "🔗", minutes: 3 },
  { id: "image-pairs", titleFr: "Paires image–mot", titleEn: "Picture–word pairs", descFr: "Associe chaque illustration au bon mot anglais.", descEn: "Match each picture with its word.", category: "vocabulary", emoji: "🖼️", minutes: 3 },
  { id: "memory", titleFr: "Memory", titleEn: "Memory", descFr: "Retourne les cartes et retrouve les paires.", descEn: "Flip the cards and find the pairs.", category: "vocabulary", emoji: "🃏", minutes: 4 },
  { id: "mcq", titleFr: "QCM de traduction", titleEn: "Translation quiz", descFr: "Choisis la bonne traduction parmi quatre.", descEn: "Pick the right translation.", category: "vocabulary", emoji: "✅", minutes: 3 },
  { id: "dictation", titleFr: "Dictée audio", titleEn: "Audio dictation", descFr: "Écoute et écris ce que tu entends.", descEn: "Listen and type what you hear.", category: "listening", emoji: "🎧", minutes: 5 },
  { id: "gapfill", titleFr: "Phrases à trous", titleEn: "Fill the gap", descFr: "Complète la phrase avec le bon mot.", descEn: "Complete the sentence.", category: "grammar", emoji: "🧩", minutes: 4 },
  { id: "scramble", titleFr: "Mots mélangés", titleEn: "Word scramble", descFr: "Remets les lettres dans l'ordre.", descEn: "Unscramble the letters.", category: "vocabulary", emoji: "🔀", minutes: 4 },
  { id: "builder", titleFr: "Phrases à reconstruire", titleEn: "Sentence builder", descFr: "Remets les mots de la phrase dans l'ordre.", descEn: "Put the words in order.", category: "grammar", emoji: "🧱", minutes: 4 },
  { id: "timed", titleFr: "Quiz chronométré", titleEn: "Timed quiz", descFr: "60 secondes : la précision compte plus que la vitesse.", descEn: "60 seconds — accuracy counts more than speed.", category: "vocabulary", emoji: "⏱️", minutes: 1 },
  { id: "picture", titleFr: "Reconnaissance d'images", titleEn: "Picture recognition", descFr: "Quel mot correspond à cette image ?", descEn: "Which word matches the picture?", category: "vocabulary", emoji: "👁️", minutes: 3 },
  { id: "fr-en", titleFr: "Traduction français → anglais", titleEn: "French → English", descFr: "Écris le mot anglais : la production active.", descEn: "Type the English word.", category: "vocabulary", emoji: "✍️", minutes: 4 },
  { id: "en-fr", titleFr: "Traduction anglais → français", titleEn: "English → French", descFr: "Écris la traduction française.", descEn: "Type the French translation.", category: "vocabulary", emoji: "📝", minutes: 4 },
  { id: "synonyms", titleFr: "Synonymes", titleEn: "Synonyms", descFr: "Trouve le mot de sens proche.", descEn: "Find the word with a similar meaning.", category: "vocabulary", emoji: "≈", minutes: 3 },
  { id: "irregular", titleFr: "Verbes irréguliers", titleEn: "Irregular verbs", descFr: "Prétérit et participe passé des verbes irréguliers.", descEn: "Past simple and past participle.", category: "verbs", emoji: "🔁", minutes: 4 },
  { id: "conjugation", titleFr: "Conjugaison", titleEn: "Conjugation", descFr: "Conjugue le verbe dans la phrase.", descEn: "Conjugate the verb in context.", category: "verbs", emoji: "⚙️", minutes: 4 },
  { id: "phrasal", titleFr: "Phrasal verbs", titleEn: "Phrasal verbs", descFr: "Sens et particules des phrasal verbs.", descEn: "Meanings and particles.", category: "verbs", emoji: "🧲", minutes: 4 },
  { id: "tenses", titleFr: "Reconnaître les temps", titleEn: "Spot the tense", descFr: "Identifie le temps grammatical de la phrase.", descEn: "Identify the tense.", category: "grammar", emoji: "🕰️", minutes: 4 },
  { id: "errors", titleFr: "Erreurs à corriger", titleEn: "Fix the mistake", descFr: "Les erreurs typiques des francophones.", descEn: "Typical mistakes made by French speakers.", category: "grammar", emoji: "🩹", minutes: 4 },
  { id: "pronunciation", titleFr: "Prononciation", titleEn: "Pronunciation", descFr: "Dis le mot ou la phrase : la reconnaissance vocale t'évalue.", descEn: "Say it — speech recognition checks you.", category: "speaking", emoji: "🎙️", minutes: 4 },
];

export function gameById(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
