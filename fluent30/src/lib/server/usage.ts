import "server-only";
import { jsonError } from "./guard";
import { PLAN, currentPlan, type AiFeature } from "../plan";

// Per-feature AI usage: daily quota per user (or IP) and approximate cost tracking.
// In-memory (per server instance): good enough to stop abuse and observe costs; for strict
// billing-grade quotas, move the counters to a database.

const counters = new Map<string, { day: string; count: number }>();
const totals = new Map<AiFeature, { calls: number; inTokens: number; outTokens: number }>();

function limitFor(feature: AiFeature): number {
  const env = Number(process.env[`FLUENT30_LIMIT_${feature.toUpperCase()}_PER_DAY`]);
  return Number.isFinite(env) && env > 0 ? env : PLAN[currentPlan()].dailyAi[feature];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Returns an error response when the daily quota is reached, otherwise counts the call and returns null. */
export function takeQuota(feature: AiFeature, who: string) {
  const key = `${feature}:${who}`;
  const d = today();
  const c = counters.get(key);
  const cur = c && c.day === d ? c : { day: d, count: 0 };
  const limit = limitFor(feature);
  if (cur.count >= limit)
    return jsonError(429, "daily_limit", `Limite quotidienne atteinte pour cette fonction (${limit} analyses par jour). Elle se réinitialise demain.`);
  cur.count++;
  counters.set(key, cur);
  if (counters.size > 50_000) counters.clear(); // memory guard
  return null;
}

/** Approximate token accounting (≈ 4 characters per token; images ≈ 1 500 tokens). Logged for cost follow-up. */
export function recordUsage(feature: AiFeature, input: { chars: number; images?: number }, outputChars: number) {
  const inTok = Math.round(input.chars / 4) + (input.images ?? 0) * 1500;
  const outTok = Math.round(outputChars / 4);
  const t = totals.get(feature) ?? { calls: 0, inTokens: 0, outTokens: 0 };
  t.calls++;
  t.inTokens += inTok;
  t.outTokens += outTok;
  totals.set(feature, t);
  console.info(`[ai-usage] ${feature} in≈${inTok} out≈${outTok} total_calls=${t.calls} total_in≈${t.inTokens} total_out≈${t.outTokens}`);
}

export function usageTotals() {
  return Object.fromEntries(totals);
}
