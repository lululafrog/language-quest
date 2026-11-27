// Pure cost & routing helpers (no "server-only" import so they can be unit-tested and reused by the simulator).
import type { AiFeature } from "../plan";

// ---------- prices ----------

/** USD per million tokens — public Anthropic rates as of 2026-11, à vérifier (https://www.anthropic.com/pricing).
 *  Haiku 5.5 rates apply to prompts up to 100K tokens ($0.50 / $2.50 beyond). */
export const PRICES: Record<string, { in: number; out: number; cacheRead?: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-fable-5-2": { in: 8, out: 40, cacheRead: 0.2 },
};

type Env = Record<string, string | undefined>;
const ENV: Env = typeof process !== "undefined" ? process.env : {};

/** Rough estimates for non-token services (overridable). */
export const IMAGE_COST_USD = Number(ENV.FLUENT30_PRICE_IMAGE) || 0.04; // one gpt-image-1 illustration (≈ medium quality)
export const TRANSCRIBE_COST_PER_MIN_USD = Number(ENV.FLUENT30_PRICE_TRANSCRIBE_MIN) || 0.003;

function envKey(model: string) {
  return model.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

export function priceFor(model: string, env: Env = ENV): { in: number; out: number; cacheRead: number } {
  const base = PRICES[model] ?? PRICES["claude-opus-5-5"];
  const k = envKey(model);
  const pin = Number(env[`FLUENT30_PRICE_${k}_IN`]);
  const pout = Number(env[`FLUENT30_PRICE_${k}_OUT`]);
  const inP = Number.isFinite(pin) && pin > 0 ? pin : base.in;
  return { in: inP, out: Number.isFinite(pout) && pout > 0 ? pout : base.out, cacheRead: base.cacheRead ?? inP * 0.1 };
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/** Estimated USD cost of one call. Cache writes are billed ≈ 1.25 × input. */
export function estimateCost(model: string, u: TokenUsage, env?: Env): number {
  const p = priceFor(model, env);
  const usd = (u.input * p.in + (u.cacheWrite ?? 0) * p.in * 1.25 + (u.cacheRead ?? 0) * p.cacheRead + u.output * p.out) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

// ---------- model routing (cheapest adequate model per task) ----------

export type Tier = "fast" | "standard" | "premium";

export function modelForTier(tier: Tier, env: Env = ENV): string {
  if (tier === "fast") return env.FLUENT30_MODEL_FAST || "claude-haiku-5-5";
  if (tier === "standard") return env.FLUENT30_MODEL_STANDARD || "claude-sonnet-5-5";
  return env.FLUENT30_MODEL_PREMIUM || env.FLUENT30_MODEL || "claude-opus-5-5";
}

/** Server-side refusal fallbacks ("default") are only supported by some models (not Haiku 5.5). */
export function supportsServerFallback(model: string): boolean {
  return /^claude-(opus-5-5|sonnet-5-5|fable-5-2|fable-5-1|opus-5)$/.test(model);
}

export interface FeatureSpec {
  tier: Tier;
  /** max characters of the raw JSON request body (images included) */
  maxBodyChars: number;
  /** hard cap on output tokens for one call of this feature */
  maxTokens: number;
  /** generic, non-personal → may be answered from the shared server cache */
  sharedCache: boolean;
  /** typical tokens per call (for the cost simulator) */
  typical: { input: number; output: number };
}

const K = 1000;
/** Per-feature routing & size limits. Adjust here; personal features are never cached. */
export const FEATURES: Record<AiFeature, FeatureSpec> = {
  enrich: { tier: "fast", maxBodyChars: 4 * K, maxTokens: 3000, sharedCache: true, typical: { input: 900, output: 700 } },
  lookup: { tier: "fast", maxBodyChars: 4 * K, maxTokens: 2000, sharedCache: true, typical: { input: 700, output: 350 } },
  translate: { tier: "fast", maxBodyChars: 2_100 * K, maxTokens: 4000, sharedCache: false, typical: { input: 900, output: 500 } },
  phrase: { tier: "fast", maxBodyChars: 8 * K, maxTokens: 3000, sharedCache: true, typical: { input: 800, output: 500 } },
  words: { tier: "fast", maxBodyChars: 12 * K, maxTokens: 6000, sharedCache: false, typical: { input: 1500, output: 2000 } },
  identify: { tier: "fast", maxBodyChars: 2_100 * K, maxTokens: 3000, sharedCache: false, typical: { input: 1800, output: 800 } },
  ocr: { tier: "fast", maxBodyChars: 2_100 * K, maxTokens: 4000, sharedCache: false, typical: { input: 1800, output: 600 } },
  correct: { tier: "standard", maxBodyChars: 8 * K, maxTokens: 3000, sharedCache: false, typical: { input: 800, output: 500 } },
  chat: { tier: "standard", maxBodyChars: 120 * K, maxTokens: 1500, sharedCache: false, typical: { input: 1500, output: 150 } },
  report: { tier: "standard", maxBodyChars: 120 * K, maxTokens: 6000, sharedCache: false, typical: { input: 3000, output: 1500 } },
  reader: { tier: "standard", maxBodyChars: 90 * K, maxTokens: 16000, sharedCache: true, typical: { input: 2500, output: 2000 } },
  reallife: { tier: "standard", maxBodyChars: 2_100 * K, maxTokens: 12000, sharedCache: false, typical: { input: 2500, output: 3000 } },
  journal: { tier: "standard", maxBodyChars: 12 * K, maxTokens: 4000, sharedCache: false, typical: { input: 1200, output: 1200 } },
  memories: { tier: "standard", maxBodyChars: 2_100 * K, maxTokens: 3000, sharedCache: false, typical: { input: 1800, output: 900 } },
  assess: { tier: "premium", maxBodyChars: 16 * K, maxTokens: 6000, sharedCache: false, typical: { input: 1500, output: 1500 } },
  novel: { tier: "premium", maxBodyChars: 30 * K, maxTokens: 16000, sharedCache: false, typical: { input: 4000, output: 8000 } },
  images: { tier: "fast", maxBodyChars: 4 * K, maxTokens: 6000, sharedCache: true, typical: { input: 600, output: 2500 } },
  transcribe: { tier: "fast", maxBodyChars: 11_000 * K, maxTokens: 0, sharedCache: false, typical: { input: 0, output: 0 } },
  health: { tier: "fast", maxBodyChars: 1 * K, maxTokens: 16, sharedCache: false, typical: { input: 10, output: 1 } },
};

/** Max base64 characters accepted for one image (clients compress to ≤ 1600 px JPEG first). */
export const MAX_IMAGE_BASE64 = 1_500_000;

export function typicalCallCost(feature: AiFeature, env?: Env): number {
  const f = FEATURES[feature];
  if (feature === "transcribe") return TRANSCRIBE_COST_PER_MIN_USD * 0.5;
  return estimateCost(modelForTier(f.tier, env), { input: f.typical.input, output: f.typical.output }, env);
}
