import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { estimateCost, priceFor, modelForTier, supportsServerFallback, FEATURES, typicalCallCost } from "../src/lib/server/costs-core";
import { hashUser, budgetState, crossedThresholds, estimateMonthlyPerUser } from "../src/lib/server/usage-core";
import { classifyAiError, BudgetError, NotConfiguredError, RefusalError, BadResponseError, BadInput } from "../src/lib/server/errors";
import { simulateCosts, simulatePopulation, DEFAULT_PROFILES } from "../src/lib/costs-sim";

test("cost estimation uses per-model prices and env overrides", () => {
  assert.equal(estimateCost("claude-opus-5-5", { input: 1_000_000, output: 0 }), 4);
  assert.equal(estimateCost("claude-sonnet-5-5", { input: 0, output: 1_000_000 }), 10);
  assert.equal(estimateCost("claude-haiku-5-5", { input: 1_000_000, output: 1_000_000 }), 0.6);
  assert.equal(priceFor("claude-haiku-5-5", { FLUENT30_PRICE_CLAUDE_HAIKU_5_5_IN: "0.2" }).in, 0.2);
  // cache reads are much cheaper than input
  assert.ok(estimateCost("claude-opus-5-5", { input: 0, output: 0, cacheRead: 1_000_000 }) < 1);
});

test("model routing per tier with env overrides; fallbacks only where supported", () => {
  assert.equal(modelForTier("fast", {}), "claude-haiku-5-5");
  assert.equal(modelForTier("standard", {}), "claude-sonnet-5-5");
  assert.equal(modelForTier("premium", {}), "claude-opus-5-5");
  assert.equal(modelForTier("premium", { FLUENT30_MODEL: "claude-opus-5" }), "claude-opus-5");
  assert.equal(modelForTier("fast", { FLUENT30_MODEL_FAST: "claude-sonnet-5-5" }), "claude-sonnet-5-5");
  assert.ok(supportsServerFallback("claude-opus-5-5") && supportsServerFallback("claude-sonnet-5-5"));
  assert.ok(!supportsServerFallback("claude-haiku-5-5"));
  for (const f of ["journal", "reallife", "memories", "chat", "assess"] as const) assert.equal(FEATURES[f].sharedCache, false, `${f} must never be shared`);
  assert.ok(typicalCallCost("enrich") < typicalCallCost("novel"));
});

test("user hashing is stable, salted and not reversible-looking", () => {
  const a = hashUser("user-123", "s1");
  assert.equal(a, hashUser("user-123", "s1"));
  assert.notEqual(a, hashUser("user-123", "s2"));
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.ok(!a.includes("123"));
});

test("budget caps and alert thresholds", () => {
  assert.deepEqual(budgetState({ dailyCapUsd: null, monthlyCapUsd: null }, { today: 99, month: 999 }), { blocked: false });
  assert.equal(budgetState({ dailyCapUsd: 5, monthlyCapUsd: null }, { today: 5, month: 5 }).reason, "daily");
  assert.equal(budgetState({ dailyCapUsd: null, monthlyCapUsd: 50 }, { today: 1, month: 50.01 }).reason, "monthly");
  assert.equal(budgetState({ dailyCapUsd: 5, monthlyCapUsd: 50 }, { today: 4.99, month: 49 }).blocked, false);
  assert.deepEqual(crossedThresholds(24, 50), []);
  assert.deepEqual(crossedThresholds(40, 50), [50, 80]);
  assert.deepEqual(crossedThresholds(50, 50), [50, 80, 100]);
});

test("monthly cost per active user", () => {
  const today = new Date("2026-11-10T12:00:00Z");
  const r = estimateMonthlyPerUser([
    { day: "2026-11-02", user: "a", calls: 3, costUsd: 0.03 },
    { day: "2026-11-05", user: "b", calls: 1, costUsd: 0.07 },
    { day: "2026-10-30", user: "c", calls: 9, costUsd: 9 },
  ], today);
  assert.equal(r.activeUsers, 2);
  assert.equal(r.avgMonthlyCostPerUser, 0.15); // 0.05 per user over 10 days → 0.15 over 30
});

test("errors map to friendly codes without variable names", () => {
  const headers = new Headers();
  const cases: [unknown, string][] = [
    [new NotConfiguredError(), "not_configured"],
    [new BudgetError("global"), "budget"],
    [new BudgetError("user"), "user_budget"],
    [new RefusalError("x"), "refusal"],
    [new BadResponseError("x"), "bad_response"],
    [new BadInput("Champ manquant"), "bad_input"],
    [new Anthropic.AuthenticationError(401, { type: "error" }, "invalid x-api-key", headers), "service_auth"],
    [new Anthropic.RateLimitError(429, { type: "error" }, "rate", headers), "provider_rate_limit"],
    [new Anthropic.InternalServerError(529, { type: "error" }, "overloaded", headers), "provider_unavailable"],
    [new Anthropic.APIConnectionTimeoutError(), "timeout"],
    [new Anthropic.APIConnectionError({ message: "ECONNREFUSED" }), "provider_unavailable"],
    [new SyntaxError("Unexpected token"), "bad_response"],
    [new TypeError("fetch failed"), "provider_unavailable"],
  ];
  for (const [e, code] of cases) {
    const m = classifyAiError(e);
    assert.equal(m.code, code, String(e));
    assert.ok(!/API_KEY|ANTHROPIC|OPENAI|variable/i.test(m.message), `${code}: ${m.message}`);
  }
});

test("cost simulation per profile and population", () => {
  const s = simulateCosts({ profiles: DEFAULT_PROFILES, env: {} });
  assert.ok(s.occasional.usd < s.regular.usd && s.regular.usd < s.intensive.usd);
  const p = simulatePopulation(1000, undefined, { profiles: DEFAULT_PROFILES, env: {} });
  assert.ok(p.usd > 0 && p.perUserUsd > 0);
  console.log("simulated USD/user/month:", JSON.stringify({ occasional: s.occasional.usd, regular: s.regular.usd, intensive: s.intensive.usd, mix1000: p.perUserUsd }));
});
