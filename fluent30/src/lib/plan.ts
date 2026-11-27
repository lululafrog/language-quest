// Freemium-ready plan configuration. NO payment is wired: every learner is on "free" and the
// free limits are deliberately generous. Essential learning (courses, reviews, games, reading)
// is never limited. Only AI-backed features have a daily quota, to keep costs under control.
// Server limits can be overridden per feature with env vars: FLUENT30_LIMIT_<FEATURE>_PER_DAY.

export type PlanId = "free" | "premium";
export type AiFeature = "reallife" | "journal" | "memories" | "chat" | "images" | "reader";

export const PLAN: Record<PlanId, { label: string; dailyAi: Record<AiFeature, number> }> = {
  free: {
    label: "Gratuit",
    dailyAi: { reallife: 40, journal: 20, memories: 20, chat: 200, images: 30, reader: 200 },
  },
  premium: {
    label: "Premium (non activé)",
    dailyAi: { reallife: 200, journal: 100, memories: 100, chat: 1000, images: 150, reader: 1000 },
  },
};

/** Current plan. Payments are not implemented: always "free" until explicitly enabled. */
export function currentPlan(): PlanId {
  return "free";
}
