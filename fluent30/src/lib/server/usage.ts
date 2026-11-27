import "server-only";
// Central usage, quota, budget and cost tracking for every paid call.
//
// - Per user (hashed, never the raw id/IP), per feature and per day: calls, tokens, estimated cost, errors, quota hits.
// - Storage: Supabase tables (ai_usage_daily, ai_error_log) when SUPABASE_SERVICE_ROLE_KEY is set, otherwise
//   in memory (per server instance — resets on each deploy/restart; quotas are then approximate on serverless).
// - Budget caps: FLUENT30_DAILY_BUDGET_USD / FLUENT30_MONTHLY_BUDGET_USD (optional). When reached, paid calls are
//   refused with a friendly message; free services (dictionary, free translation, grammar checker…) keep working.
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jsonError } from "./guard";
import { logError } from "./errors-log";
import { PLAN, currentPlan, type AiFeature } from "../plan";
import { estimateCost, type TokenUsage } from "./costs-core";
import { hashUser, budgetState, dayKey, monthKey } from "./usage-core";

export { hashUser, budgetState } from "./usage-core";

// ---------- request context (feature + hashed user), carried through async calls ----------

export interface AiContext {
  feature: AiFeature;
  user: string; // hashed
}
const als = new AsyncLocalStorage<AiContext>();

export function runWithAiContext<T>(ctx: AiContext, fn: () => Promise<T>): Promise<T> {
  return als.run(ctx, fn);
}
export function currentAiContext(): AiContext | undefined {
  return als.getStore();
}

// ---------- in-memory aggregates ----------

interface Agg {
  calls: number;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  errors: number;
  quotaHits: number;
}
const empty = (): Agg => ({ calls: 0, inTokens: 0, outTokens: 0, costUsd: 0, errors: 0, quotaHits: 0 });

/** key: day|feature|user */
const mem = new Map<string, Agg>();
const quotaCounters = new Map<string, { day: string; count: number }>();

function bump(day: string, feature: string, user: string, d: Partial<Agg>) {
  const k = `${day}|${feature}|${user}`;
  const a = mem.get(k) ?? empty();
  a.calls += d.calls ?? 0;
  a.inTokens += d.inTokens ?? 0;
  a.outTokens += d.outTokens ?? 0;
  a.costUsd += d.costUsd ?? 0;
  a.errors += d.errors ?? 0;
  a.quotaHits += d.quotaHits ?? 0;
  mem.set(k, a);
  if (mem.size > 100_000) {
    // keep memory bounded: drop entries older than the current month
    const m = monthKey();
    for (const key of mem.keys()) if (!key.startsWith(m)) mem.delete(key);
  }
  void persist(day, feature, user, d);
}

// ---------- Supabase persistence (optional) ----------

let sb: SupabaseClient | null | undefined;
function admin(): SupabaseClient | null {
  if (sb !== undefined) return sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return sb;
}

export function usageStorage(): "supabase" | "memory" {
  return admin() ? "supabase" : "memory";
}

async function persist(day: string, feature: string, user: string, d: Partial<Agg>) {
  const s = admin();
  if (!s) return;
  try {
    await s.rpc("ai_usage_add", {
      p_day: day,
      p_feature: feature,
      p_user: user,
      p_calls: d.calls ?? 0,
      p_in: d.inTokens ?? 0,
      p_out: d.outTokens ?? 0,
      p_cost: d.costUsd ?? 0,
      p_errors: d.errors ?? 0,
      p_quota: d.quotaHits ?? 0,
    });
  } catch {
    /* usage storage must never break a learner request */
  }
}

async function persistError(feature: string, code: string, message: string) {
  const s = admin();
  if (!s) return;
  try {
    await s.from("ai_error_log").insert({ feature, code, message: message.slice(0, 300) });
  } catch {
    /* ignore */
  }
}

// Spend cache from the database (refreshed at most every 60 s) so caps hold across server instances.
let spendCache: { at: number; day: string; today: number; month: number } | null = null;
async function spentFromDb(): Promise<{ today: number; month: number } | null> {
  const s = admin();
  if (!s) return null;
  const d = dayKey();
  if (spendCache && spendCache.day === d && Date.now() - spendCache.at < 60_000) return spendCache;
  try {
    const { data, error } = await s.from("ai_usage_daily").select("day,cost_usd").gte("day", `${monthKey()}-01`);
    if (error || !data) return null;
    let today = 0, month = 0;
    for (const r of data as { day: string; cost_usd: number }[]) {
      month += Number(r.cost_usd) || 0;
      if (r.day === d) today += Number(r.cost_usd) || 0;
    }
    spendCache = { at: Date.now(), day: d, today, month };
    return spendCache;
  } catch {
    return null;
  }
}

function spentFromMemory() {
  const d = dayKey(), m = monthKey();
  let today = 0, month = 0;
  for (const [k, a] of mem) {
    if (k.startsWith(m)) month += a.costUsd;
    if (k.startsWith(d)) today += a.costUsd;
  }
  return { today, month };
}

export async function spend(): Promise<{ today: number; month: number }> {
  const db = await spentFromDb();
  const local = spentFromMemory();
  // DB values lag up to 60 s; take the max of both views.
  return db ? { today: Math.max(db.today, local.today), month: Math.max(db.month, local.month) } : local;
}

export function budgetCaps() {
  const daily = Number(process.env.FLUENT30_DAILY_BUDGET_USD);
  const monthly = Number(process.env.FLUENT30_MONTHLY_BUDGET_USD);
  return { dailyCapUsd: Number.isFinite(daily) && daily > 0 ? daily : null, monthlyCapUsd: Number.isFinite(monthly) && monthly > 0 ? monthly : null };
}

export class BudgetError extends Error {
  constructor() {
    super("budget_reached");
  }
}

/** Throws BudgetError when a configured spending cap is reached. */
export async function assertBudget() {
  const caps = budgetCaps();
  if (!caps.dailyCapUsd && !caps.monthlyCapUsd) return;
  const s = await spend();
  if (budgetState(caps, s).blocked) throw new BudgetError();
}

// ---------- quotas ----------

function limitFor(feature: AiFeature): number {
  const env = Number(process.env[`FLUENT30_LIMIT_${feature.toUpperCase()}_PER_DAY`]);
  if (Number.isFinite(env) && env > 0) return env;
  return PLAN[currentPlan()].dailyAi[feature] ?? Number.POSITIVE_INFINITY;
}

/** Returns an error response when the user's daily quota for this feature is reached, otherwise counts the call. */
export function takeQuota(feature: AiFeature, who: string) {
  const user = who.length === 16 && /^[0-9a-f]+$/.test(who) ? who : hashUser(who);
  const key = `${feature}:${user}`;
  const d = dayKey();
  const c = quotaCounters.get(key);
  const cur = c && c.day === d ? c : { day: d, count: 0 };
  const limit = limitFor(feature);
  if (cur.count >= limit) {
    bump(d, feature, user, { quotaHits: 1 });
    return jsonError(429, "daily_limit", `Tu as atteint la limite du jour pour cette fonction (${limit} par jour). Elle se réinitialise demain — en attendant, tout le reste de l'appli reste disponible.`);
  }
  cur.count++;
  quotaCounters.set(key, cur);
  if (quotaCounters.size > 50_000) quotaCounters.clear();
  return null;
}

// ---------- recording ----------

/** Records one successful provider call (real token counts from the API response). */
export function recordCall(opts: { model: string; usage: TokenUsage; latencyMs: number; feature?: AiFeature; user?: string; costUsd?: number }) {
  const ctx = currentAiContext();
  const feature = opts.feature ?? ctx?.feature ?? "health";
  const user = opts.user ?? ctx?.user ?? "anon";
  const cost = opts.costUsd ?? estimateCost(opts.model, opts.usage);
  bump(dayKey(), feature, user, { calls: 1, inTokens: opts.usage.input + (opts.usage.cacheRead ?? 0) + (opts.usage.cacheWrite ?? 0), outTokens: opts.usage.output, costUsd: cost });
  console.info(`[ai-usage] feature=${feature} model=${opts.model} in=${opts.usage.input} cache_read=${opts.usage.cacheRead ?? 0} out=${opts.usage.output} cost≈$${cost.toFixed(5)} ${opts.latencyMs}ms`);
}

/** Records a failed call (technical code only — never personal content). */
export function recordFailure(opts: { code: string; message: string; provider?: string; feature?: AiFeature }) {
  const ctx = currentAiContext();
  const feature = opts.feature ?? ctx?.feature ?? "health";
  bump(dayKey(), feature, ctx?.user ?? "anon", { errors: 1 });
  logError({ at: Date.now(), feature, code: opts.code, message: opts.message, provider: opts.provider });
  void persistError(feature, opts.code, opts.message);
  console.warn(`[ai-error] feature=${feature} code=${opts.code} ${opts.message.slice(0, 200)}`);
}

/** Legacy helper (approximate accounting by characters). Prefer recordCall with real usage. */
export function recordUsage(feature: AiFeature, input: { chars: number; images?: number }, outputChars: number) {
  void feature;
  void input;
  void outputChars;
  // Real token usage is now captured centrally from every Anthropic response (see ai.ts).
}

// ---------- reporting (admin) ----------

export interface UsageRow {
  day: string;
  feature: string;
  user: string;
  calls: number;
  inTokens: number;
  outTokens: number;
  costUsd: number;
  errors: number;
  quotaHits: number;
}

export async function usageRows(sinceDay: string): Promise<UsageRow[]> {
  const s = admin();
  if (s) {
    try {
      const { data, error } = await s.from("ai_usage_daily").select("*").gte("day", sinceDay).limit(20000);
      if (!error && data)
        return (data as Record<string, unknown>[]).map((r) => ({
          day: String(r.day),
          feature: String(r.feature),
          user: String(r.user_hash),
          calls: Number(r.calls) || 0,
          inTokens: Number(r.in_tokens) || 0,
          outTokens: Number(r.out_tokens) || 0,
          costUsd: Number(r.cost_usd) || 0,
          errors: Number(r.errors) || 0,
          quotaHits: Number(r.quota_hits) || 0,
        }));
    } catch {
      /* fall back to memory */
    }
  }
  const out: UsageRow[] = [];
  for (const [k, a] of mem) {
    const [day, feature, user] = k.split("|");
    if (day >= sinceDay) out.push({ day, feature, user, ...a });
  }
  return out;
}

export async function recentPersistedErrors(limit = 50) {
  const s = admin();
  if (!s) return null;
  try {
    const { data, error } = await s.from("ai_error_log").select("at,feature,code,message").order("at", { ascending: false }).limit(limit);
    if (error || !data) return null;
    return (data as { at: string; feature: string; code: string; message: string }[]).map((r) => ({ ...r, at: Date.parse(r.at) }));
  } catch {
    return null;
  }
}

/** Average monthly AI cost per active user over the current month (extrapolated to 30 days). */
export function estimateMonthlyPerUser(rows: UsageRow[], today = new Date()): { activeUsers: number; avgMonthlyCostPerUser: number } {
  const m = monthKey(today);
  const users = new Set<string>();
  let cost = 0;
  for (const r of rows) {
    if (!r.day.startsWith(m)) continue;
    if (r.calls > 0 && r.user !== "anon") users.add(r.user);
    cost += r.costUsd;
  }
  const dayOfMonth = today.getUTCDate();
  const perUser = users.size ? cost / users.size : 0;
  return { activeUsers: users.size, avgMonthlyCostPerUser: Math.round((perUser * 30) / Math.max(1, dayOfMonth) * 10000) / 10000 };
}
