import "server-only";
// Cost estimation for paid providers.
// Prices: public Anthropic rates as of 2026-11 (USD per million tokens) — to be checked against
// https://www.anthropic.com/pricing. Override any model with FLUENT30_PRICE_<MODEL>_IN / _OUT
// (model id upper-cased, dashes/dots → underscores), e.g. FLUENT30_PRICE_CLAUDE_HAIKU_5_5_IN=0.10
export { estimateCost, priceFor, PRICES, IMAGE_COST_USD, TRANSCRIBE_COST_PER_MIN_USD } from "./costs-core";
