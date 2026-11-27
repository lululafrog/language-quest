"use client";
// Atlas progress: missions (per CEFR band), rewards granted once, destination validation, postcards, favourites.
import { getDb, getSettings, saveSettings } from "../db";
import { addCoins, grantItems } from "../game";
import { emit } from "../events";
import { claimStamps } from "../passport";
import { trackActivity } from "../track";
import { SHOP_BY_ID } from "../data/shop";
import type { Destination } from "../data/destinations";
import type { MissionProgress } from "../types";
import { atlasDestination, ensureMissionVocab, getAtlasMission, playableDestinations } from "./engine";
import type { AtlasDestinationView } from "./legacy";
import { BAND_ORDER, type AtlasMission, type AtlasReward, type Band } from "./types";

export {
  learnerBand, selectExercises, reviewItems, ensureMissionVocab, getAtlasMission, atlasDestination, playableDestinations, accentFor, destName, checkProduce,
} from "./engine";

export const PASS = 0.7;
export const MISSION_COINS = 25;
export const FINAL_COINS = 80;
export const VALIDATION_COINS = 150;
export const ATLAS_PREFIX = "atlas:";
export const VALIDATED_PREFIX = "atlas:validated:";

const bandIdx = (b?: Band) => (b ? BAND_ORDER.indexOf(b) : -1);
const higher = (a?: Band, b?: Band): Band | undefined => (bandIdx(a) >= bandIdx(b) ? a : b);

function isDone(map: Map<string, MissionProgress>, m: Pick<AtlasMission, "id" | "legacyId">): boolean {
  return map.get(m.id)?.status === "done" || (!!m.legacyId && map.get(m.legacyId)?.status === "done");
}

async function progressMap(): Promise<Map<string, MissionProgress>> {
  return new Map((await getDb().missions.toArray()).map((r) => [r.id, r]));
}

/** Gives a reward once: wearable/decor → the shop item; always an achievement record (for the album). */
export async function grantReward(r: AtlasReward): Promise<boolean> {
  const db = getDb();
  const key = ATLAS_PREFIX + r.id;
  if (await db.achievements.get(key)) return false;
  if (r.shopItem && SHOP_BY_ID.has(r.shopItem)) await grantItems([r.shopItem]);
  const now = Date.now();
  await db.achievements.put({ id: key, unlockedAt: now, updatedAt: now });
  return true;
}

export async function ownedRewards(): Promise<Set<string>> {
  const rows = await getDb().achievements.where("id").startsWith(ATLAS_PREFIX).toArray();
  return new Set(rows.map((r) => r.id.slice(ATLAS_PREFIX.length)).filter((id) => !id.startsWith("validated:")));
}

async function saveAttempt(id: string, score: number, band: Band): Promise<{ passed: boolean; first: boolean; row: MissionProgress }> {
  const db = getDb();
  const cur = await db.missions.get(id);
  const passed = score >= PASS;
  const first = passed && cur?.status !== "done";
  const row: MissionProgress = {
    id,
    status: passed || cur?.status === "done" ? "done" : "started",
    band,
    bestBand: passed ? higher(cur?.bestBand, band) : cur?.bestBand,
    bestScore: Math.max(score, cur?.bestScore ?? 0),
    attempts: (cur?.attempts ?? 0) + 1,
    completedAt: cur?.completedAt ?? (passed ? Date.now() : undefined),
    updatedAt: Date.now(),
  };
  await db.missions.put(row);
  await trackActivity({ grammarExercises: 1, xp: Math.round(10 + score * 25) });
  return { passed, first, row };
}

export interface AtlasMissionResult {
  passed: boolean;
  firstCompletion: boolean;
  coins: number;
  reward?: AtlasReward;
  vocabAdded: number;
  higherBand: boolean;
  validation?: ValidationResult;
}

export async function markAtlasStarted(id: string) {
  const db = getDb();
  if (await db.missions.get(id)) return;
  await db.missions.put({ id, status: "started", bestScore: 0, attempts: 0, updatedAt: Date.now() });
}

/** Saves a mission attempt (pass ≥ 70 %). Reward, coins and vocabulary come with the first success only. */
export async function recordAtlasMission(id: string, score: number, band: Band): Promise<AtlasMissionResult> {
  const ref = getAtlasMission(id);
  const before = (await getDb().missions.get(ref?.progressId ?? id))?.bestBand;
  const pid = ref?.progressId ?? id;
  const { passed, first } = await saveAttempt(pid, score, band);
  let coins = 0;
  let reward: AtlasReward | undefined;
  let vocabAdded = 0;
  if (first && ref) {
    coins = MISSION_COINS;
    await addCoins(coins);
    reward = ref.mission.reward ? ref.dest.rewards.find((r) => r.id === ref.mission.reward) : undefined;
    if (reward && !(await grantReward(reward))) reward = undefined;
  }
  if (passed && ref) vocabAdded = await ensureMissionVocab(ref.mission, ref.dest);
  if (passed) emit("mission:done", { missionId: pid, score });
  const validation = passed && ref ? await validateDestination(ref.dest.id) : undefined;
  return { passed, firstCompletion: first, coins, reward, vocabAdded, higherBand: passed && !!before && bandIdx(band) > bandIdx(before), validation: validation?.validated ? validation : undefined };
}

/** Saves the final story. Score = share of good decisions + productions validated by meaning. */
export async function recordAtlasFinal(destId: string, score: number, band: Band): Promise<AtlasMissionResult> {
  const dest = atlasDestination(destId);
  if (!dest || !dest.final.nodes.length) return { passed: false, firstCompletion: false, coins: 0, vocabAdded: 0, higherBand: false };
  const { passed, first } = await saveAttempt(dest.final.id, score, band);
  let coins = 0;
  if (first) {
    coins = FINAL_COINS;
    await addCoins(coins);
  }
  if (passed) emit("mission:done", { missionId: dest.final.id, score });
  const validation = passed ? await validateDestination(destId) : undefined;
  return { passed, firstCompletion: first, coins, vocabAdded: 0, higherBand: false, validation };
}

export interface DestinationProgress {
  destId: string;
  done: number; // regular missions done
  total: number; // regular missions
  finalDone: boolean;
  validated: boolean;
  validatedAt?: number;
  bestBand?: Band; // lowest band validated across all missions (the level at which the whole destination was proven)
  rewards: string[]; // reward ids owned
  started: boolean;
  preview: boolean;
}

function computeProgress(dest: AtlasDestinationView, map: Map<string, MissionProgress>, owned: Set<string>, validatedAt?: number): DestinationProgress {
  const done = dest.missions.filter((m) => isDone(map, m)).length;
  const finalDone = map.get(dest.final.id)?.status === "done";
  const bands = [...dest.missions.map((m) => map.get(m.id)?.bestBand), map.get(dest.final.id)?.bestBand].filter(Boolean) as Band[];
  const allProven = bands.length === dest.missions.length + 1;
  return {
    destId: dest.id,
    done,
    total: dest.missions.length,
    finalDone,
    validated: !!validatedAt,
    validatedAt,
    bestBand: allProven ? bands.reduce((a, b) => (bandIdx(b) < bandIdx(a) ? b : a)) : undefined,
    rewards: dest.rewards.filter((r) => owned.has(r.id)).map((r) => r.id),
    started: dest.missions.some((m) => map.has(m.id) || (!!m.legacyId && map.has(m.legacyId))) || map.has(dest.final.id),
    preview: !!dest.preview,
  };
}

async function validatedMap(): Promise<Map<string, number>> {
  const rows = await getDb().achievements.where("id").startsWith(VALIDATED_PREFIX).toArray();
  return new Map(rows.map((r) => [r.id.slice(VALIDATED_PREFIX.length), r.unlockedAt]));
}

export async function destinationProgress(destId: string): Promise<DestinationProgress | undefined> {
  const dest = atlasDestination(destId);
  if (!dest) return undefined;
  const [map, owned, val] = await Promise.all([progressMap(), ownedRewards(), validatedMap()]);
  return computeProgress(dest, map, owned, val.get(destId));
}

export async function allAtlasProgress(): Promise<Map<string, DestinationProgress>> {
  const [map, owned, val] = await Promise.all([progressMap(), ownedRewards(), validatedMap()]);
  return new Map(playableDestinations().map((d) => [d.id, computeProgress(d, map, owned, val.get(d.id))]));
}

export interface ValidationResult {
  validated: boolean;
  firstTime: boolean;
  rewards: AtlasReward[];
  newStamps: Destination[];
  coins: number;
}

/**
 * When every regular mission and the final story are done: marks the destination validated (once),
 * grants the stamp, trophy, postcard and the rewards not tied to a mission, and prepares the postcard.
 * This validates communication in the destination's situations — it is not an official certification.
 */
export async function validateDestination(destId: string): Promise<ValidationResult> {
  const none: ValidationResult = { validated: false, firstTime: false, rewards: [], newStamps: [], coins: 0 };
  const dest = atlasDestination(destId);
  if (!dest || dest.preview || !dest.final.nodes.length) return none;
  const db = getDb();
  const map = await progressMap();
  const allDone = dest.missions.every((m) => isDone(map, m)) && map.get(dest.final.id)?.status === "done";
  if (!allDone) return none;
  const key = VALIDATED_PREFIX + destId;
  if (await db.achievements.get(key)) return { ...none, validated: true };
  const now = Date.now();
  await db.achievements.put({ id: key, unlockedAt: now, updatedAt: now });
  const tied = new Set(dest.missions.map((m) => m.reward).filter(Boolean));
  const rewards: AtlasReward[] = [];
  for (const r of dest.rewards) if (!tied.has(r.id) && (await grantReward(r))) rewards.push(r);
  await addCoins(VALIDATION_COINS);
  const final = map.get(dest.final.id);
  if (!(await db.postcards.get(destId))) {
    await db.postcards.put({
      id: destId,
      destId,
      message: dest.postcardLine,
      band: final?.bestBand ?? final?.band,
      skills: [...new Set([...dest.final.skills, ...dest.missions.map((m) => m.title)])].slice(0, 12),
      rewards: dest.rewards.map((r) => r.id),
      validatedAt: now,
      updatedAt: now,
    });
  }
  const newStamps = await claimStamps();
  return { validated: true, firstTime: true, rewards, newStamps, coins: VALIDATION_COINS };
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const s = await getSettings();
  const cur = new Set(s.atlasFavorites ?? []);
  const on = !cur.has(id);
  if (on) cur.add(id);
  else cur.delete(id);
  await saveSettings({ atlasFavorites: [...cur] });
  return on;
}
