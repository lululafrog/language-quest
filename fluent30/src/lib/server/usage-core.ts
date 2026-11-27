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
