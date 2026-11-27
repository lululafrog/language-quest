import "server-only";
// Cost estimation & model routing for paid providers (see costs-core.ts for the tables).
// Prices: public Anthropic rates as of 2026-11 (USD per million tokens) — à vérifier on https://www.anthropic.com/pricing.
// Override any model with FLUENT30_PRICE_<MODEL>_IN / _OUT (model id upper-cased, non-alphanumerics → "_"),
// e.g. FLUENT30_PRICE_CLAUDE_HAIKU_5_5_IN=0.10
export {
  estimateCost, priceFor, PRICES, IMAGE_COST_USD, TRANSCRIBE_COST_PER_MIN_USD, FEATURES, MAX_IMAGE_BASE64,
  modelForTier, supportsServerFallback, typicalCallCost, type Tier, type FeatureSpec, type TokenUsage,
} from "./costs-core";
export { simulateCosts, simulatePopulation, DEFAULT_PROFILES, type SimConfig, type UsageProfile } from "../costs-sim";
