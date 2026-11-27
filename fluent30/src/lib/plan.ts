// Freemium-ready plan configuration. NO payment is wired: every learner is on "free" and the
// free limits are deliberately generous. Essential learning (courses, reviews, games, reading)
// is never limited. Only AI-backed features have a daily quota, to keep costs under control.
// Server limits can be overridden per feature with env vars: FLUENT30_LIMIT_<FEATURE>_PER_DAY.

export type PlanId = "free" | "premium";

/** Every server feature that calls a paid AI / external API (used for quotas, usage and cost tracking). */
export type AiFeature =
  | "enrich" | "lookup" | "translate" | "phrase" | "correct" | "ocr" | "identify" | "words"
  | "chat" | "report" | "assess" | "reader" | "novel" | "reallife" | "journal" | "memories"
  | "images" | "transcribe" | "health";

export const AI_FEATURE_LABEL: Record<AiFeature, string> = {
  enrich: "Fiches de vocabulaire (enrichissement)",
  lookup: "Traduction d'un mot en contexte",
  translate: "Traducteur / traduction de messages",
  phrase: "Explication d'expressions",
  correct: "Correction grammaticale",
  ocr: "Lecture de texte sur image",
  identify: "Autour de moi (objets d'une photo)",
  words: "Nouveaux mots générés",
  chat: "Conversations avec l'IA",
  report: "Bilan de conversation",
  assess: "Évaluation de l'expression écrite",
  reader: "Liseuse intelligente (traduction, adaptation, quiz, personnages)",
  novel: "Romans personnalisés",
  reallife: "My Real Life English",
  journal: "Journal (corrections)",
  memories: "Memory Cards (analyse de photos)",
  images: "Illustrations du vocabulaire",
  transcribe: "Transcription audio",
  health: "Tests de santé (admin)",
};

export const PLAN: Record<PlanId, { label: string; dailyAi: Partial<Record<AiFeature, number>>; monthlyAi?: Partial<Record<AiFeature, number>> }> = {
  free: {
    label: "Gratuit",
    // Per user (or IP) and per day. Features not listed are only protected by the per-minute rate limit and the budget caps.
    dailyAi: { reallife: 40, journal: 20, memories: 20, chat: 200, images: 30, reader: 200, novel: 10, identify: 30, ocr: 40, transcribe: 60 },
    // Monthly caps keep the average cost per active learner low (see the per-user monthly budget too).
    monthlyAi: { reallife: 150, journal: 90, memories: 60, chat: 1500, images: 200, reader: 1500, novel: 20, identify: 120, ocr: 150, transcribe: 400, assess: 30, report: 60 },
  },
  premium: {
    label: "Premium (non activé)",
    dailyAi: { reallife: 200, journal: 100, memories: 100, chat: 1000, images: 150, reader: 1000, novel: 50, identify: 150, ocr: 200, transcribe: 300 },
  },
};

/** Current plan. Payments are not implemented: always "free" until explicitly enabled. */
export function currentPlan(): PlanId {
  return "free";
}
