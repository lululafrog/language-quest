// The mini-games of Fluent30. Games marked `words` share the central vocabulary engine (lib/vocab).
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
  /** uses the vocabulary engine: mode screen (new words / review), level and themes */
  words?: boolean;
}

export const CATEGORY_LABELS: Record<GameCategory, { fr: string; en: string }> = {
  vocabulary: { fr: "Vocabulaire", en: "Vocabulary" },
  listening: { fr: "Écoute", en: "Listening" },
  grammar: { fr: "Grammaire", en: "Grammar" },
  verbs: { fr: "Verbes", en: "Verbs" },
  speaking: { fr: "Prononciation", en: "Pronunciation" },
};

export const GAMES: GameDef[] = [
  { id: "hangman", words: true, titleFr: "Le pendu", titleEn: "Hangman", descFr: "Devine le mot lettre par lettre grâce à sa traduction.", descEn: "Guess the word letter by letter.", category: "vocabulary", emoji: "🪢", minutes: 4 },
  { id: "pairs", words: true, titleFr: "Paires anglais–français", titleEn: "English–French pairs", descFr: "Associe chaque mot à sa traduction.", descEn: "Match each word with its translation.", category: "vocabulary", emoji: "🔗", minutes: 3 },
  { id: "image-pairs", words: true, titleFr: "Paires image–mot", titleEn: "Picture–word pairs", descFr: "Associe chaque illustration au bon mot anglais.", descEn: "Match each picture with its word.", category: "vocabulary", emoji: "🖼️", minutes: 3 },
  { id: "memory", words: true, titleFr: "Memory", titleEn: "Memory", descFr: "Retourne les cartes et retrouve les paires.", descEn: "Flip the cards and find the pairs.", category: "vocabulary", emoji: "🃏", minutes: 4 },
  { id: "mcq", words: true, titleFr: "QCM de traduction", titleEn: "Translation quiz", descFr: "Choisis la bonne traduction parmi quatre.", descEn: "Pick the right translation.", category: "vocabulary", emoji: "✅", minutes: 3 },
  { id: "definition", words: true, titleFr: "Quiz des définitions", titleEn: "Definition quiz", descFr: "Choisis la bonne définition du mot.", descEn: "Pick the right definition.", category: "vocabulary", emoji: "📖", minutes: 3 },
  { id: "truefalse", words: true, titleFr: "Vrai ou faux", titleEn: "True or false", descFr: "Ce mot veut-il vraiment dire ça ?", descEn: "Does this word really mean that?", category: "vocabulary", emoji: "⚖️", minutes: 2 },
  { id: "mystery", words: true, titleFr: "Mot mystère", titleEn: "Mystery word", descFr: "Retrouve le mot à partir d'indices (moins d'indices = mieux retenu).", descEn: "Find the word from clues.", category: "vocabulary", emoji: "🕵️", minutes: 4 },
  { id: "context", words: true, titleFr: "Le mot en contexte", titleEn: "Word in context", descFr: "Complète une vraie phrase avec le bon mot.", descEn: "Complete a real sentence with the right word.", category: "vocabulary", emoji: "💡", minutes: 4 },
  { id: "dictation", words: true, titleFr: "Dictée audio", titleEn: "Audio dictation", descFr: "Écoute et écris ce que tu entends.", descEn: "Listen and type what you hear.", category: "listening", emoji: "🎧", minutes: 5 },
  { id: "gapfill", titleFr: "Phrases à trous", titleEn: "Fill the gap", descFr: "Complète la phrase avec le bon mot.", descEn: "Complete the sentence.", category: "grammar", emoji: "🧩", minutes: 4 },
  { id: "scramble", words: true, titleFr: "Mots mélangés", titleEn: "Word scramble", descFr: "Remets les lettres dans l'ordre.", descEn: "Unscramble the letters.", category: "vocabulary", emoji: "🔀", minutes: 4 },
  { id: "builder", titleFr: "Phrases à reconstruire", titleEn: "Sentence builder", descFr: "Remets les mots de la phrase dans l'ordre.", descEn: "Put the words in order.", category: "grammar", emoji: "🧱", minutes: 4 },
  { id: "timed", words: true, titleFr: "Quiz chronométré", titleEn: "Timed quiz", descFr: "60 secondes : la précision compte plus que la vitesse.", descEn: "60 seconds — accuracy counts more than speed.", category: "vocabulary", emoji: "⏱️", minutes: 1 },
  { id: "picture", words: true, titleFr: "Reconnaissance d'images", titleEn: "Picture recognition", descFr: "Quel mot correspond à cette image ?", descEn: "Which word matches the picture?", category: "vocabulary", emoji: "👁️", minutes: 3 },
  { id: "fr-en", words: true, titleFr: "Traduction français → anglais", titleEn: "French → English", descFr: "Écris le mot anglais : la production active.", descEn: "Type the English word.", category: "vocabulary", emoji: "✍️", minutes: 4 },
  { id: "en-fr", words: true, titleFr: "Traduction anglais → français", titleEn: "English → French", descFr: "Écris la traduction française.", descEn: "Type the French translation.", category: "vocabulary", emoji: "📝", minutes: 4 },
  { id: "synonyms", words: true, titleFr: "Synonymes", titleEn: "Synonyms", descFr: "Trouve le mot de sens proche.", descEn: "Find the word with a similar meaning.", category: "vocabulary", emoji: "≈", minutes: 3 },
  { id: "irregular", titleFr: "Verbes irréguliers", titleEn: "Irregular verbs", descFr: "Prétérit et participe passé des verbes irréguliers.", descEn: "Past simple and past participle.", category: "verbs", emoji: "🔁", minutes: 4 },
  { id: "conjugation", titleFr: "Conjugaison", titleEn: "Conjugation", descFr: "Conjugue le verbe dans la phrase.", descEn: "Conjugate the verb in context.", category: "verbs", emoji: "⚙️", minutes: 4 },
  { id: "phrasal", titleFr: "Phrasal verbs", titleEn: "Phrasal verbs", descFr: "Sens et particules des phrasal verbs.", descEn: "Meanings and particles.", category: "verbs", emoji: "🧲", minutes: 4 },
  { id: "tenses", titleFr: "Reconnaître les temps", titleEn: "Spot the tense", descFr: "Identifie le temps grammatical de la phrase.", descEn: "Identify the tense.", category: "grammar", emoji: "🕰️", minutes: 4 },
  { id: "errors", titleFr: "Erreurs à corriger", titleEn: "Fix the mistake", descFr: "Les erreurs typiques des francophones.", descEn: "Typical mistakes made by French speakers.", category: "grammar", emoji: "🩹", minutes: 4 },
  { id: "pronunciation", words: true, titleFr: "Prononciation", titleEn: "Pronunciation", descFr: "Dis le mot ou la phrase : la reconnaissance vocale t'évalue.", descEn: "Say it — speech recognition checks you.", category: "speaking", emoji: "🎙️", minutes: 4 },
];

export function gameById(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
