import "server-only";
// Central usage, quota, budget and cost tracking for every paid call.
//
// - Per user (hashed, never the raw id/IP), per feature and per day: calls, tokens, estimated cost, errors,
//   quota hits, shared-cache hits and money saved by the cache.
// - Storage: Supabase (ai_usage_daily, ai_error_log, ai_budget_alerts, ai_usage_users) when SUPABASE_SERVICE_ROLE_KEY
//   is set; otherwise in memory (per server instance — resets on each deploy/restart, approximate on serverless).
// - Quotas per user and feature: daily AND monthly (PLAN + FLUENT30_LIMIT_<FEATURE>_PER_DAY / _PER_MONTH).
// - Per-user monthly cost cap: FLUENT30_USER_MONTHLY_BUDGET_USD (default 0.80).
// - Global caps: FLUENT30_DAILY_BUDGET_USD / FLUENT30_MONTHLY_BUDGET_USD, with alerts at 50 / 80 / 100 % of the
//   monthly cap (once per threshold per month), optionally POSTed to FLUENT30_ALERT_WEBHOOK_URL ({ text }).
//   When a cap is reached, paid calls are refused with a friendly message; free services keep working.
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { jsonError } from "./guard";
import { logError } from "./errors-log";
import { BudgetError } from "./errors";
import { PLAN, currentPlan, type AiFeature } from "../plan";
import { estimateCost, typicalCallCost, type TokenUsage } from "./costs-core";
import { hashUser, budgetState, dayKey, monthKey, crossedThresholds } from "./usage-core";

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
  cacheHits: number;
  savedUsd: number;
}
const empty = (): Agg => ({ calls: 0, inTokens: 0, outTokens: 0, costUsd: 0, errors: 0, quotaHits: 0, cacheHits: 0, savedUsd: 0 });

/** key: day|feature|user */
const mem = new Map<string, Agg>();
const dayCounters = new Map<string, { day: string; count: number }>();
const monthCounters = new Map<string, { month: string; count: number }>();

function bump(day: string, feature: string, user: string, d: Partial<Agg>) {
  const k = `${day}|${feature}|${user}`;
  const a = mem.get(k) ?? empty();
  for (const key of Object.keys(d) as (keyof Agg)[]) a[key] += d[key] ?? 0;
  mem.set(k, a);
  if (mem.size > 100_000) {
    const m = monthKey();
    for (const key of mem.keys()) if (!key.startsWith(m)) mem.delete(key);
  }
  void persist(day, feature, user, d);
}

// ---------- Supabase persistence (optional) ----------

let sb: SupabaseClient | null | undefined;
export function supabaseAdmin(): SupabaseClient | null {
  if (sb !== undefined) return sb;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  sb = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return sb;
}

export function usageStorage(): "supabase" | "memory" {
  return supabaseAdmin() ? "supabase" : "memory";
}

async function persist(day: string, feature: string, user: string, d: Partial<Agg>) {
  const s = supabaseAdmin();
  if (!s) return;
  try {
    await s.rpc("ai_usage_add", {
      p_day: day, p_feature: feature, p_user: user,
      p_calls: d.calls ?? 0, p_in: d.inTokens ?? 0, p_out: d.outTokens ?? 0, p_cost: d.costUsd ?? 0,
      p_errors: d.errors ?? 0, p_quota: d.quotaHits ?? 0, p_cache_hits: d.cacheHits ?? 0, p_saved: d.savedUsd ?? 0,
    });
  } catch {
    /* usage storage must never break a learner request */
  }
}

async function persistError(feature: string, code: string, message: string) {
  const s = supabaseAdmin();
  if (!s) return;
  try {
    await s.from("ai_error_log").insert({ feature, code, message: message.slice(0, 300) });
  } catch {
    /* ignore */
  }
}

const mappedUsers = new Set<string>();
/** Remembers hash → Supabase user id (authenticated users only) so the admin can resolve an email. */
export function rememberUser(hash: string, userId: string | null) {
  if (!userId || mappedUsers.has(hash)) return;
  mappedUsers.add(hash);
  const s = supabaseAdmin();
  if (s) void s.from("ai_usage_users").upsert({ user_hash: hash, user_id: userId }).then(() => {}, () => {});
}

// ---------- spend ----------

let spendCache: { at: number; day: string; today: number; month: number } | null = null;
async function spentFromDb(): Promise<{ today: number; month: number } | null> {
  const s = supabaseAdmin();
  if (!s) return null;
  const d = dayKey();
  if (spendCache && spendCache.day === d && Date.now() - spendCache.at < 60_000) return spendCache;
  try {
    const { data, error } = await s.from("ai_usage_daily").select("day,cost_usd").gte("day", `${monthKey()}-01`).limit(100000);
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

function spentFromMemory(user?: string) {
  const d = dayKey(), m = monthKey();
  let today = 0, month = 0;
  for (const [k, a] of mem) {
    if (user && !k.endsWith(`|${user}`)) continue;
    if (k.startsWith(m)) month += a.costUsd;
    if (k.startsWith(d)) today += a.costUsd;
  }
  return { today, month };
}

export async function spend(): Promise<{ today: number; month: number }> {
  const db = await spentFromDb();
  const local = spentFromMemory();
  return db ? { today: Math.max(db.today, local.today), month: Math.max(db.month, local.month) } : local;
}

const userSpendCache = new Map<string, { at: number; month: string; usd: number }>();
async function userMonthSpend(user: string): Promise<number> {
  const local = spentFromMemory(user).month;
  const s = supabaseAdmin();
  if (!s) return local;
  const m = monthKey();
  const c = userSpendCache.get(user);
  if (c && c.month === m && Date.now() - c.at < 60_000) return Math.max(c.usd, local);
  try {
    const { data } = await s.from("ai_usage_daily").select("cost_usd").eq("user_hash", user).gte("day", `${m}-01`);
    const usd = (data as { cost_usd: number }[] | null)?.reduce((a, r) => a + (Number(r.cost_usd) || 0), 0) ?? 0;
    userSpendCache.set(user, { at: Date.now(), month: m, usd });
    if (userSpendCache.size > 20_000) userSpendCache.clear();
    return Math.max(usd, local);
  } catch {
    return local;
  }
}

export function budgetCaps() {
  const num = (v?: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const userCap = process.env.FLUENT30_USER_MONTHLY_BUDGET_USD;
  return {
    dailyCapUsd: num(process.env.FLUENT30_DAILY_BUDGET_USD),
    monthlyCapUsd: num(process.env.FLUENT30_MONTHLY_BUDGET_USD),
    userMonthlyCapUsd: userCap === "0" || userCap === "off" ? null : (num(userCap) ?? 0.8),
  };
}

export { BudgetError };

/** Throws BudgetError when a global spending cap is reached. */
export async function assertBudget() {
  const caps = budgetCaps();
  if (!caps.dailyCapUsd && !caps.monthlyCapUsd) return;
  const s = await spend();
  if (budgetState(caps, s).blocked) throw new BudgetError("global");
}

/** Throws BudgetError("user") when this learner's monthly AI budget is used up. */
export async function assertUserBudget(user: string) {
  const cap = budgetCaps().userMonthlyCapUsd;
  if (!cap) return;
  if ((await userMonthSpend(user)) >= cap) throw new BudgetError("user");
}

// ---------- alerts (50 / 80 / 100 % of the global monthly cap) ----------

export interface BudgetAlert {
  threshold: number;
  at: number;
  spentUsd: number;
}
const alerts: BudgetAlert[] = [];
const fired = new Set<string>();
let lastAlertCheck = 0;

async function checkAlerts() {
  const cap = budgetCaps().monthlyCapUsd;
  if (!cap || Date.now() - lastAlertCheck < 15_000) return;
  lastAlertCheck = Date.now();
  const s = await spend();
  const m = monthKey();
  for (const t of crossedThresholds(s.month, cap)) {
    const key = `${m}:${t}`;
    if (fired.has(key)) continue;
    fired.add(key);
    // de-duplicate across instances when the database is available
    const db = supabaseAdmin();
    if (db) {
      try {
        const { error } = await db.from("ai_budget_alerts").insert({ month: m, threshold: t, spent_usd: s.month });
        if (error) continue; // unique (month, threshold) → already fired by another instance
      } catch {
        /* keep going with memory only */
      }
    }
    const a = { threshold: t, at: Date.now(), spentUsd: Math.round(s.month * 100) / 100 };
    alerts.push(a);
    logError({ at: a.at, feature: "budget", code: `budget_alert_${t}`, message: `Dépenses IA du mois : ${a.spentUsd} $ (${t} % du plafond de ${cap} $)` });
    const hook = process.env.FLUENT30_ALERT_WEBHOOK_URL;
    if (hook) {
      const text = `Fluent30 — alerte budget IA : ${t} % du plafond mensuel atteint (${a.spentUsd} $ / ${cap} $).${t >= 100 ? " Les fonctions IA payantes sont suspendues jusqu'au mois prochain ou jusqu'à la hausse du plafond." : ""}`;
      void fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, content: text }), signal: AbortSignal.timeout(5000) }).catch(() => {});
    }
  }
}

export async function budgetAlerts(): Promise<BudgetAlert[]> {
  const db = supabaseAdmin();
  if (db) {
    try {
      const { data } = await db.from("ai_budget_alerts").select("threshold,created_at,spent_usd").order("created_at", { ascending: false }).limit(24);
      if (data) return (data as { threshold: number; created_at: string; spent_usd: number }[]).map((r) => ({ threshold: r.threshold, at: Date.parse(r.created_at), spentUsd: Number(r.spent_usd) }));
    } catch {
      /* memory */
    }
  }
  return [...alerts].reverse();
}

// ---------- quotas & concurrency ----------

function limitFor(feature: AiFeature, period: "DAY" | "MONTH"): number {
  const env = Number(process.env[`FLUENT30_LIMIT_${feature.toUpperCase()}_PER_${period}`]);
  if (Number.isFinite(env) && env > 0) return env;
  const daily = PLAN[currentPlan()].dailyAi[feature];
  if (period === "DAY") return daily ?? Number.POSITIVE_INFINITY;
  const monthly = PLAN[currentPlan()].monthlyAi?.[feature];
  return monthly ?? Number.POSITIVE_INFINITY;
}

function asHash(who: string) {
  return who.length === 16 && /^[0-9a-f]+$/.test(who) ? who : hashUser(who);
}

/** Returns an error response when the user's daily or monthly quota for this feature is reached, otherwise counts the call. */
export function takeQuota(feature: AiFeature, who: string) {
  const user = asHash(who);
  const key = `${feature}:${user}`;
  const d = dayKey(), m = monthKey();
  const dc = dayCounters.get(key);
  const day = dc && dc.day === d ? dc : { day: d, count: 0 };
  const mc = monthCounters.get(key);
  const month = mc && mc.month === m ? mc : { month: m, count: 0 };
  const dl = limitFor(feature, "DAY"), ml = limitFor(feature, "MONTH");
  if (day.count >= dl || month.count >= ml) {
    bump(d, feature, user, { quotaHits: 1 });
    const per = day.count >= dl ? `${dl} par jour` : `${ml} par mois`;
    return jsonError(429, "daily_limit", `Tu as atteint la limite de cette fonction (${per}). Elle se réinitialise ${day.count >= dl ? "demain" : "le mois prochain"} — tout le reste de l'appli reste disponible.`);
  }
  day.count++;
  month.count++;
  dayCounters.set(key, day);
  monthCounters.set(key, month);
  if (dayCounters.size > 50_000) dayCounters.clear();
  if (monthCounters.size > 50_000) monthCounters.clear();
  return null;
}

const inflight = new Map<string, number>();
const MAX_CONCURRENT = Number(process.env.FLUENT30_MAX_CONCURRENT_PER_USER) || 3;
/** Reserves one concurrent slot for this user; returns a release function, or null when too many calls are running. */
export function acquireSlot(user: string): (() => void) | null {
  const n = inflight.get(user) ?? 0;
  if (n >= MAX_CONCURRENT) return null;
  inflight.set(user, n + 1);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const v = (inflight.get(user) ?? 1) - 1;
    if (v <= 0) inflight.delete(user);
    else inflight.set(user, v);
  };
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
  void checkAlerts();
}

/** A generic answer was served from the shared cache: counts the hit and the money saved. */
export function recordCacheHit(feature: AiFeature) {
  const ctx = currentAiContext();
  bump(dayKey(), feature, ctx?.user ?? "anon", { cacheHits: 1, savedUsd: typicalCallCost(feature) });
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

/** @deprecated Real token usage is now captured centrally from every Anthropic response (ai.ts). Kept for compatibility. */
export function recordUsage(feature: AiFeature, input: { chars: number; images?: number }, outputChars: number) {
  void feature;
  void input;
  void outputChars;
}

// ---------- reporting (admin) ----------

export interface UsageRow extends Agg {
  day: string;
  feature: string;
  user: string;
}

export async function usageRows(sinceDay: string): Promise<UsageRow[]> {
  const s = supabaseAdmin();
  if (s) {
    try {
      const { data, error } = await s.from("ai_usage_daily").select("*").gte("day", sinceDay).limit(50000);
      if (!error && data)
        return (data as Record<string, unknown>[]).map((r) => ({
          day: String(r.day), feature: String(r.feature), user: String(r.user_hash),
          calls: Number(r.calls) || 0, inTokens: Number(r.in_tokens) || 0, outTokens: Number(r.out_tokens) || 0,
          costUsd: Number(r.cost_usd) || 0, errors: Number(r.errors) || 0, quotaHits: Number(r.quota_hits) || 0,
          cacheHits: Number(r.cache_hits) || 0, savedUsd: Number(r.saved_usd) || 0,
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
  const s = supabaseAdmin();
  if (!s) return null;
  try {
    const { data, error } = await s.from("ai_error_log").select("at,feature,code,message").order("at", { ascending: false }).limit(limit);
    if (error || !data) return null;
    return (data as { at: string; feature: string; code: string; message: string }[]).map((r) => ({ ...r, at: Date.parse(r.at) }));
  } catch {
    return null;
  }
}

/** Resolves hashed users to emails (authenticated users only, via the service role). */
export async function resolveEmails(hashes: string[]): Promise<Record<string, string>> {
  const s = supabaseAdmin();
  if (!s || !hashes.length) return {};
  try {
    const { data } = await s.from("ai_usage_users").select("user_hash,user_id").in("user_hash", hashes);
    const out: Record<string, string> = {};
    for (const r of (data as { user_hash: string; user_id: string }[] | null) ?? []) {
      const u = await s.auth.admin.getUserById(r.user_id);
      if (u.data.user?.email) out[r.user_hash] = u.data.user.email;
    }
    return out;
  } catch {
    return {};
  }
}

export { estimateMonthlyPerUser } from "./usage-core";
