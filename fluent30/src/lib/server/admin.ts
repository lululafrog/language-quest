import "server-only";
// Admin access + overview aggregation. Auth: FLUENT30_ADMIN_TOKEN (header x-admin-token, constant-time compare)
// OR a Supabase session whose email is listed in FLUENT30_ADMIN_EMAILS. When neither is configured, admin routes 404.
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { config } from "./config";
import { providerOverview, modelsInUse } from "./providers";
import { recentErrors } from "./errors-log";
import { budgetAlerts, budgetCaps, estimateMonthlyPerUser, recentPersistedErrors, resolveEmails, spend, usageRows, usageStorage } from "./usage";
import { AI_FEATURE_LABEL, type AiFeature } from "../plan";
import { cacheStats } from "./cache";
import { simulateCosts } from "../costs-sim";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminConfigured() {
  return !!process.env.FLUENT30_ADMIN_TOKEN || !!(process.env.FLUENT30_ADMIN_EMAILS && config.supabaseUrl && config.supabaseAnonKey);
}

/** Returns null when allowed, otherwise the error response (404 when admin is not configured at all). */
export async function requireAdmin(req: Request): Promise<NextResponse | null> {
  if (!adminConfigured()) return NextResponse.json({ error: { code: "not_found", message: "Not found" } }, { status: 404 });
  const token = process.env.FLUENT30_ADMIN_TOKEN;
  const given = req.headers.get("x-admin-token");
  if (token && given && safeEqual(given, token)) return null;
  const emails = (process.env.FLUENT30_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (emails.length && bearer && config.supabaseUrl && config.supabaseAnonKey) {
    try {
      const sb = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false } });
      const { data } = await sb.auth.getUser(bearer);
      if (data.user?.email && emails.includes(data.user.email.toLowerCase())) return null;
    } catch {
      /* fall through */
    }
  }
  return NextResponse.json({ error: { code: "forbidden", message: "Accès administrateur refusé." } }, { status: 403 });
}

const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

export async function adminOverview() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.toISOString().slice(0, 7)}-01`;
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const rows = await usageRows(since < monthStart ? since : monthStart);

  const sum = (rs: typeof rows) => rs.reduce((a, r) => ({ calls: a.calls + r.calls, costUsd: a.costUsd + r.costUsd, errors: a.errors + r.errors, quotaHits: a.quotaHits + r.quotaHits, cacheHits: a.cacheHits + r.cacheHits, savedUsd: a.savedUsd + r.savedUsd }), { calls: 0, costUsd: 0, errors: 0, quotaHits: 0, cacheHits: 0, savedUsd: 0 });
  const monthRows = rows.filter((r) => r.day >= monthStart);
  const t = sum(rows.filter((r) => r.day === today));
  const m = sum(monthRows);

  const feats = new Map<string, typeof rows>();
  for (const r of monthRows) feats.set(r.feature, [...(feats.get(r.feature) ?? []), r]);
  const byFeature = [...feats.entries()].map(([feature, rs]) => {
    const s = sum(rs);
    return { feature, label: AI_FEATURE_LABEL[feature as AiFeature] ?? feature, calls: s.calls, costUsd: round(s.costUsd), avgCostPerCall: s.calls ? round(s.costUsd / s.calls, 6) : 0, errors: s.errors, quotaHits: s.quotaHits, cacheHits: s.cacheHits, savedUsd: round(s.savedUsd) };
  }).sort((a, b) => b.costUsd - a.costUsd);

  const days = new Map<string, { calls: number; costUsd: number }>();
  for (const r of rows) {
    const d = days.get(r.day) ?? { calls: 0, costUsd: 0 };
    d.calls += r.calls;
    d.costUsd += r.costUsd;
    days.set(r.day, d);
  }
  const byDay = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, calls: v.calls, costUsd: round(v.costUsd) }));

  const users = new Map<string, { calls: number; costUsd: number; monthCostUsd: number }>();
  for (const r of rows) {
    if (r.user === "anon") continue;
    const u = users.get(r.user) ?? { calls: 0, costUsd: 0, monthCostUsd: 0 };
    u.calls += r.calls;
    u.costUsd += r.costUsd;
    if (r.day >= monthStart) u.monthCostUsd += r.costUsd;
    users.set(r.user, u);
  }
  const top = [...users.entries()].sort((a, b) => b[1].monthCostUsd - a[1].monthCostUsd).slice(0, 50);
  const emails = await resolveEmails(top.map(([u]) => u));
  const byUser = top.map(([user, v]) => ({ user, email: emails[user] ?? null, calls: v.calls, costUsd: round(v.costUsd), monthCostUsd: round(v.monthCostUsd) }));

  const caps = budgetCaps();
  const spent = await spend();
  const persisted = await recentPersistedErrors(50);
  const est = estimateMonthlyPerUser(rows, now);

  return {
    providers: providerOverview(),
    models: modelsInUse(),
    storage: usageStorage(),
    cache: cacheStats(),
    usage: {
      today: { calls: t.calls, costUsd: round(t.costUsd), errors: t.errors, quotaHits: t.quotaHits, cacheHits: t.cacheHits },
      month: { calls: m.calls, costUsd: round(m.costUsd), errors: m.errors, quotaHits: m.quotaHits, cacheHits: m.cacheHits },
      byFeature,
      byDay,
      byUser,
      activeUsers: est.activeUsers,
      avgMonthlyCostPerUser: est.avgMonthlyCostPerUser,
    },
    cacheSavingsUsd: round(m.savedUsd),
    budget: { dailyCapUsd: caps.dailyCapUsd, monthlyCapUsd: caps.monthlyCapUsd, userMonthlyCapUsd: caps.userMonthlyCapUsd, spentTodayUsd: round(spent.today), spentMonthUsd: round(spent.month) },
    alerts: await budgetAlerts(),
    errors: persisted ?? recentErrors(50),
    simulation: simulateCosts(),
    generatedAt: Date.now(),
  };
}
