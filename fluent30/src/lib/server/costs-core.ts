// Pure cost helpers (no "server-only" import so they can be unit-tested).

/** USD per million tokens — public Anthropic rates as of 2026-11, à vérifier. */
export const PRICES: Record<string, { in: number; out: number; cacheRead?: number }> = {
  "claude-opus-5-5": { in: 4, out: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { in: 2, out: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { in: 0.1, out: 0.5 },
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-fable-5-2": { in: 8, out: 40, cacheRead: 0.2 },
};

/** Rough estimates for non-token services (overridable). */
export const IMAGE_COST_USD = Number(process.env.FLUENT30_PRICE_IMAGE) || 0.04; // one gpt-image-1 illustration (≈ medium quality)
export const TRANSCRIBE_COST_PER_MIN_USD = Number(process.env.FLUENT30_PRICE_TRANSCRIBE_MIN) || 0.003;

function envKey(model: string) {
  return model.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

export function priceFor(model: string, env: Record<string, string | undefined> = process.env): { in: number; out: number; cacheRead: number } {
  const base = PRICES[model] ?? PRICES["claude-opus-5-5"];
  const k = envKey(model);
  const pin = Number(env[`FLUENT30_PRICE_${k}_IN`]);
  const pout = Number(env[`FLUENT30_PRICE_${k}_OUT`]);
  const inP = Number.isFinite(pin) && pin > 0 ? pin : base.in;
  return {
    in: inP,
    out: Number.isFinite(pout) && pout > 0 ? pout : base.out,
    cacheRead: base.cacheRead ?? inP * 0.1,
  };
}

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/** Estimated USD cost of one call. Cache writes are billed ≈ 1.25 × input. */
export function estimateCost(model: string, u: TokenUsage, env?: Record<string, string | undefined>): number {
  const p = priceFor(model, env);
  const usd = (u.input * p.in + (u.cacheWrite ?? 0) * p.in * 1.25 + (u.cacheRead ?? 0) * p.cacheRead + u.output * p.out) / 1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}
