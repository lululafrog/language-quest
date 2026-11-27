// Pure cost simulator (usable from tests, scripts or the admin UI — no server-only dependency).
// Estimates the AI cost per user per month for usage profiles, with the current model routing,
// public prices (à vérifier) and a shared-cache hit rate for generic features.
import type { AiFeature } from "./plan";
import { FEATURES, IMAGE_COST_USD, typicalCallCost } from "./server/costs-core";

export type UsageProfile = Partial<Record<AiFeature, number>>; // calls per month per feature

export interface SimConfig {
  profiles: Record<string, UsageProfile>;
  /** share of generic calls answered from the shared cache (0..1), default 0.5 */
  cacheHitRate?: number;
  /** share of illustrations found in free banks or cache (0..1), default 0.7 */
  freeImageRate?: number;
  env?: Record<string, string | undefined>;
  usdToEur?: number; // default 0.92
}

export const DEFAULT_PROFILES: Record<string, UsageProfile> = {
  occasional: { enrich: 20, lookup: 30, phrase: 5, translate: 10, chat: 20, reallife: 2, journal: 2, images: 5 },
  regular: { enrich: 60, lookup: 120, phrase: 20, translate: 40, chat: 120, report: 4, reallife: 8, journal: 10, memories: 4, identify: 4, reader: 10, images: 20, transcribe: 20 },
  intensive: { enrich: 150, lookup: 400, phrase: 60, translate: 120, chat: 500, report: 15, reallife: 30, journal: 30, memories: 15, identify: 15, ocr: 10, reader: 40, words: 10, assess: 2, novel: 2, images: 60, transcribe: 80 },
};

export function simulateCosts(cfg: SimConfig = { profiles: DEFAULT_PROFILES }) {
  const hit = cfg.cacheHitRate ?? 0.5;
  const freeImg = cfg.freeImageRate ?? 0.7;
  const fx = cfg.usdToEur ?? 0.92;
  const out: Record<string, { usd: number; eur: number; byFeature: Record<string, number> }> = {};
  for (const [name, prof] of Object.entries(cfg.profiles)) {
    let usd = 0;
    const byFeature: Record<string, number> = {};
    for (const [f, calls] of Object.entries(prof) as [AiFeature, number][]) {
      if (!calls) continue;
      const spec = FEATURES[f];
      let unit = typicalCallCost(f, cfg.env);
      // illustrations: free banks first, then a cheap pictogram; paid generation only if FLUENT30_PAID_IMAGES=1
      if (f === "images") unit = (1 - freeImg) * ((cfg.env ?? process.env).FLUENT30_PAID_IMAGES === "1" ? IMAGE_COST_USD : typicalCallCost("images", cfg.env));
      const paidCalls = spec.sharedCache && f !== "images" ? calls * (1 - hit) : calls;
      const c = paidCalls * unit;
      byFeature[f] = Math.round(c * 10000) / 10000;
      usd += c;
    }
    out[name] = { usd: Math.round(usd * 10000) / 10000, eur: Math.round(usd * fx * 10000) / 10000, byFeature };
  }
  return out;
}

/** Monthly bill for a population mix (e.g. 100 / 1k / 10k / 100k users). */
export function simulatePopulation(
  users: number,
  mix: Record<string, number> = { occasional: 0.6, regular: 0.3, intensive: 0.1 },
  cfg?: SimConfig,
  /** per-user monthly cap (FLUENT30_USER_MONTHLY_BUDGET_USD); beyond it paid AI is paused and free engines take over */
  userCapUsd: number | null = 0.8,
) {
  const per = simulateCosts(cfg ?? { profiles: DEFAULT_PROFILES });
  let usd = 0;
  let uncapped = 0;
  for (const [p, share] of Object.entries(mix)) {
    const c = per[p]?.usd ?? 0;
    uncapped += c * share * users;
    usd += (userCapUsd == null ? c : Math.min(c, userCapUsd)) * share * users;
  }
  const fx = cfg?.usdToEur ?? 0.92;
  return {
    users,
    usd: Math.round(usd * 100) / 100,
    eur: Math.round(usd * fx * 100) / 100,
    perUserUsd: Math.round((usd / users) * 10000) / 10000,
    perUserEur: Math.round((usd * fx / users) * 10000) / 10000,
    uncappedUsd: Math.round(uncapped * 100) / 100,
  };
}
