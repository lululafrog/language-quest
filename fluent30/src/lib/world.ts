"use client";
// World map state: which destinations are open (skills, not points), mission progress, souvenirs.
import { getDb, getSettings } from "./db";
import { addCoins } from "./game";
import { claimStamps } from "./passport";
import { trackActivity } from "./track";
import { LEVEL_INFO } from "./curriculum";
import { CEFR_LEVELS, type CefrLevel, type Exercise } from "./curriculum/types";
import { WORLD, getMission, type Mission, type Souvenir, type WorldDestination } from "./data/world";
import type { Destination } from "./data/destinations";
import type { MissionProgress } from "./types";

export const VISA_PREFIX = "visa:";
const PASS = 0.7;

export type DestStatus = "locked" | "open" | "visited" | "done";

export interface DestState {
  dest: WorldDestination;
  status: DestStatus;
  open: boolean;
  /** the three independent ways to prove the skills */
  unlock: { lessonsDone: number; lessonsTotal: number; byLessons: boolean; byLevel: boolean; byVisa: boolean };
  missionsDone: number;
  missionsTotal: number;
}

export interface WorldState {
  dests: DestState[];
  progress: Map<string, MissionProgress>;
  souvenirs: (Souvenir & { mission: Mission })[];
  skills: string[];
  missionsDone: number;
  level: CefrLevel;
}

const levelIdx = (l: CefrLevel) => CEFR_LEVELS.indexOf(l);

export async function worldState(): Promise<WorldState> {
  const db = getDb();
  const [settings, rows, lessons] = await Promise.all([getSettings(), db.missions.toArray(), db.lessons.where("status").equals("done").toArray()]);
  const progress = new Map(rows.map((r) => [r.id, r]));
  const lessonsDone = new Set(lessons.map((l) => l.id));
  const level = (settings.pathLevel ?? "A1") as CefrLevel;
  const dests = WORLD.map((dest): DestState => {
    const done = dest.missions.filter((m) => progress.get(m.id)?.status === "done").length;
    const started = dest.missions.some((m) => progress.has(m.id));
    const ld = dest.requires.filter((id) => lessonsDone.has(id)).length;
    const unlock = {
      lessonsDone: ld,
      lessonsTotal: dest.requires.length,
      byLessons: ld === dest.requires.length,
      byLevel: levelIdx(level) >= levelIdx(dest.level),
      byVisa: progress.get(VISA_PREFIX + dest.id)?.status === "done",
    };
    const open = unlock.byLessons || unlock.byLevel || unlock.byVisa;
    const status: DestStatus = !open ? "locked" : done === dest.missions.length ? "done" : started ? "visited" : "open";
    return { dest, status, open, unlock, missionsDone: done, missionsTotal: dest.missions.length };
  });
  const doneMissions = WORLD.flatMap((d) => d.missions).filter((m) => progress.get(m.id)?.status === "done");
  return {
    dests,
    progress,
    souvenirs: doneMissions.map((m) => ({ ...m.souvenir, mission: m })),
    skills: [...new Set(doneMissions.flatMap((m) => m.skills))],
    missionsDone: doneMissions.length,
    level,
  };
}

export async function markMissionStarted(id: string) {
  const db = getDb();
  if (await db.missions.get(id)) return;
  await db.missions.put({ id, status: "started", bestScore: 0, attempts: 0, updatedAt: Date.now() });
}

export interface MissionResult {
  passed: boolean;
  firstCompletion: boolean;
  coins: number;
  destinationCompleted: boolean;
  newStamps: Destination[];
}

/** Save a mission attempt. Coins and souvenir are granted once, on the first successful completion. */
export async function recordMission(id: string, score: number): Promise<MissionResult> {
  const db = getDb();
  const mission = getMission(id);
  const cur = await db.missions.get(id);
  const passed = score >= PASS;
  const firstCompletion = passed && cur?.status !== "done";
  const row: MissionProgress = {
    id,
    status: passed || cur?.status === "done" ? "done" : "started",
    bestScore: Math.max(score, cur?.bestScore ?? 0),
    attempts: (cur?.attempts ?? 0) + 1,
    completedAt: cur?.completedAt ?? (passed ? Date.now() : undefined),
    updatedAt: Date.now(),
  };
  await db.missions.put(row);
  await trackActivity({ grammarExercises: 1, xp: Math.round(10 + score * 25) });
  let coins = 0;
  if (firstCompletion && mission) {
    coins = mission.coins;
    await addCoins(coins);
  }
  let destinationCompleted = false;
  let newStamps: Destination[] = [];
  if (firstCompletion && mission) {
    const dest = WORLD.find((d) => d.id === mission.dest)!;
    const all = await db.missions.bulkGet(dest.missions.map((m) => m.id));
    destinationCompleted = all.every((r) => r?.status === "done");
    newStamps = await claimStamps();
  }
  return { passed, firstCompletion, coins, destinationCompleted, newStamps };
}

/** Visa check: 5 questions taken from the destination's missions. */
export function visaQuestions(dest: WorldDestination): Exercise[] {
  const choice: Exercise[] = [];
  for (const m of dest.missions) {
    const e = m.exercises.find((x) => x.type === "mcq" || x.type === "listen");
    if (e) choice.push(e);
  }
  const fills: Exercise[] = dest.missions.flatMap((m) => m.exercises.filter((e) => e.type === "fill"));
  return [...choice, ...fills].slice(0, 5);
}

export async function recordVisa(destId: string, score: number): Promise<boolean> {
  const passed = score >= 0.8;
  const id = VISA_PREFIX + destId;
  const cur = await getDb().missions.get(id);
  if (cur?.status === "done") return true;
  await getDb().missions.put({ id, status: passed ? "done" : "started", bestScore: Math.max(score, cur?.bestScore ?? 0), attempts: (cur?.attempts ?? 0) + 1, completedAt: passed ? Date.now() : undefined, updatedAt: Date.now() });
  return passed;
}

/** Next mission to play in a destination (first not done). */
export function nextMission(dest: WorldDestination, progress: Map<string, MissionProgress>): Mission | undefined {
  return dest.missions.find((m) => progress.get(m.id)?.status !== "done");
}

/** Human hint: the three ways to open a locked destination. */
export function unlockHint(d: DestState): string {
  if (d.open) return "";
  const parts = [
    d.unlock.lessonsTotal ? `terminer ${d.unlock.lessonsTotal - d.unlock.lessonsDone} cours conseillé${d.unlock.lessonsTotal - d.unlock.lessonsDone > 1 ? "s" : ""}` : "",
    `suivre le niveau ${d.dest.level} (${LEVEL_INFO[d.dest.level].title.toLowerCase()})`,
    "réussir le contrôle de visa (5 questions)",
  ].filter(Boolean);
  return `Pour l'ouvrir : ${parts.join(", ou ")}.`;
}
