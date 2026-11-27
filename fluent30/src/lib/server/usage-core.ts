// Pure helpers for usage tracking (no "server-only" import so they can be unit-tested).
import { createHash } from "node:crypto";

/** Pseudonymous user id for usage stats: salted SHA-256, 16 hex chars. Never store the raw id or IP. */
export function hashUser(id: string, salt = process.env.FLUENT30_USAGE_SALT || "fluent30-usage"): string {
  return createHash("sha256").update(`${salt}:${id}`).digest("hex").slice(0, 16);
}

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7);
}

/** Whether the spending caps block further paid calls. */
export function budgetState(
  caps: { dailyCapUsd: number | null; monthlyCapUsd: number | null },
  spent: { today: number; month: number },
): { blocked: boolean; reason?: "daily" | "monthly" } {
  if (caps.dailyCapUsd !== null && spent.today >= caps.dailyCapUsd) return { blocked: true, reason: "daily" };
  if (caps.monthlyCapUsd !== null && spent.month >= caps.monthlyCapUsd) return { blocked: true, reason: "monthly" };
  return { blocked: false };
}

/** Alert thresholds (% of the monthly cap) reached by the current spend. */
export function crossedThresholds(spentUsd: number, capUsd: number, thresholds = [50, 80, 100]): number[] {
  if (!capUsd || capUsd <= 0) return [];
  return thresholds.filter((t) => spentUsd >= (capUsd * t) / 100);
}

/** Average monthly AI cost per active user over the current month (extrapolated to 30 days). */
export function estimateMonthlyPerUser(rows: { day: string; user: string; calls: number; costUsd: number }[], today = new Date()): { activeUsers: number; avgMonthlyCostPerUser: number } {
  const m = monthKey(today);
  const users = new Set<string>();
  let cost = 0;
  for (const r of rows) {
    if (!r.day.startsWith(m)) continue;
    if (r.calls > 0 && r.user !== "anon") users.add(r.user);
    cost += r.costUsd;
  }
  const perUser = users.size ? cost / users.size : 0;
  return { activeUsers: users.size, avgMonthlyCostPerUser: Math.round(((perUser * 30) / Math.max(1, today.getUTCDate())) * 10000) / 10000 };
}
