"use client";
// Travel passport: stamps for real achievements. Stamps are never taken away
// (missing a day only pauses the regularity counter). Coins are paid once per stamp.
import { getDb } from "./db";
import { addCoins } from "./game";
import { gentleStreak } from "./goals";
import { DURABLE_DAYS, State } from "./srs";
import { ALL_LESSONS, PATH, type CefrLevel } from "./curriculum";
import { DESTINATIONS, type Destination, type StampMetric } from "./data/destinations";
import { WORLD } from "./data/world";
import { LEGACY_DEST } from "./atlas/legacy";

/** Atlas destinations validated (all missions + final story). Stored as achievements "atlas:validated:<id>". */
export async function validatedAtlas(): Promise<Set<string>> {
  const rows = await getDb().achievements.where("id").startsWith("atlas:validated:").toArray();
  return new Set(rows.map((r) => r.id.slice("atlas:validated:".length)));
}

/** World-map city stamps: every old mission of the city done, or its Atlas country validated. */
export async function completedWorldDestinations(): Promise<Set<string>> {
  const done = new Set((await getDb().missions.where("status").equals("done").toArray()).map((m) => m.id));
  const atlas = await validatedAtlas();
  return new Set(WORLD.filter((d) => d.missions.every((m) => done.has(m.id)) || atlas.has(LEGACY_DEST[d.id] ?? "")).map((d) => d.id));
}

/** Is this stamp earned by its own rule (metric, world map or Atlas validation)? */
function stampMet(d: Destination, stats: PassportStats, world: Set<string>, atlas: Set<string>): boolean {
  if (d.atlas) return atlas.has(d.atlas);
  return stats[d.rule.metric] >= d.rule.n || (!!d.world && world.has(d.id));
}

export const STAMP_PREFIX = "stamp:";
const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export type PassportStats = Record<StampMetric, number>;

export interface StampState {
  dest: Destination;
  unlockedAt?: number;
  value: number;
  target: number;
}

export async function passportStats(): Promise<PassportStats> {
  const db = getDb();
  const [lessons, collection, days, sessions, srs] = await Promise.all([
    db.lessons.toArray(),
    db.collection.toArray(),
    db.activity.toArray(),
    db.sessions.toArray(),
    db.srs.where("skill").equals("recognition").toArray(),
  ]);
  const done = new Set(lessons.filter((l) => l.status === "done").map((l) => l.id));
  // Units: all lessons sharing level + unit label.
  const units = new Map<string, string[]>();
  for (const l of ALL_LESSONS) {
    const k = `${l.level}:${l.unit}`;
    units.set(k, [...(units.get(k) ?? []), l.id]);
  }
  const unitsDone = [...units.values()].filter((ids) => ids.length && ids.every((id) => done.has(id))).length;
  // Highest consecutive CEFR level fully completed (1 = A1 … 5 = C1).
  let level = 0;
  for (const lv of LEVELS) {
    const ids = PATH.filter((l) => l.level === lv).map((l) => l.id);
    if (!ids.length || !ids.every((id) => done.has(id))) break;
    level++;
  }
  const active = days.filter((d) => d.seconds > 60 || d.reviews > 0 || d.newWords > 0 || d.grammarExercises > 0 || d.games > 0);
  return {
    lessons: done.size,
    units: unitsDone,
    level,
    books: collection.length,
    streak: gentleStreak(days).streak,
    plans: sessions.filter((s) => s.steps.length > 0 && s.steps.every((x) => x.done)).length,
    words: srs.filter((s) => s.state === State.Review && s.stability >= DURABLE_DAYS).length,
    activeDays: active.length,
  };
}

export async function passportState(): Promise<{ stats: PassportStats; stamps: StampState[]; souvenirs: Destination[] }> {
  const db = getDb();
  const [stats, records, world, atlas] = await Promise.all([passportStats(), db.achievements.where("id").startsWith(STAMP_PREFIX).toArray(), completedWorldDestinations(), validatedAtlas()]);
  const at = new Map(records.map((r) => [r.id.slice(STAMP_PREFIX.length), r.unlockedAt]));
  const stamps = DESTINATIONS.map((dest) => ({
    dest,
    unlockedAt: at.get(dest.id),
    value: dest.atlas ? (atlas.has(dest.atlas) ? dest.rule.n : 0) : dest.world && world.has(dest.id) ? dest.rule.n : Math.min(stats[dest.rule.metric], dest.rule.n),
    target: dest.rule.n,
  }));
  return { stats, stamps, souvenirs: stamps.filter((s) => s.unlockedAt).map((s) => s.dest) };
}

/** Grants every stamp whose condition is met (coins paid once). Returns the new stamps. */
export async function claimStamps(): Promise<Destination[]> {
  const db = getDb();
  const stats = await passportStats();
  const have = new Set((await db.achievements.where("id").startsWith(STAMP_PREFIX).toArray()).map((r) => r.id));
  const [world, atlas] = await Promise.all([completedWorldDestinations(), validatedAtlas()]);
  const fresh = DESTINATIONS.filter((d) => !have.has(STAMP_PREFIX + d.id) && stampMet(d, stats, world, atlas));
  if (!fresh.length) return [];
  const now = Date.now();
  await db.achievements.bulkPut(fresh.map((d) => ({ id: STAMP_PREFIX + d.id, unlockedAt: now, updatedAt: now })));
  const coins = fresh.reduce((a, d) => a + d.coins, 0);
  if (coins) await addCoins(coins);
  return fresh;
}

/** Next destination to unlock (closest relative progress). */
export function nextDestination(stamps: StampState[]): StampState | undefined {
  return stamps.filter((s) => !s.unlockedAt).sort((a, b) => b.value / b.target - a.value / a.target)[0];
}
