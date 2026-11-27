"use client";
// Gamification: XP levels, coins, daily quests, streak rewards and the tourist's wardrobe.
import { getDb, todayKey } from "./db";
import { computeStreak } from "./track";
import { LEGACY_IDS, SHOP_BY_ID, SHOP_ITEMS, type EarnRule, type ShopItem } from "./data/shop";
import type { Appearance, AvatarSlot, DayActivity, GameState } from "./types";

export const DEFAULT_GAME: GameState = {
  id: "me", coins: 50, totalEarned: 50, owned: ["bg-home"], equipped: { background: "bg-home" }, claimed: {}, levelRewarded: 1, streakRewarded: [], updatedAt: 0,
};

export async function getGame(): Promise<GameState> {
  return normalizeGame({ ...DEFAULT_GAME, ...((await getDb().game.get("me")) ?? {}) });
}

/** Maps legacy item ids and puts each equipped item back in its current slot. */
export function normalizeGame(g: GameState): GameState {
  const map = (id: string) => LEGACY_IDS[id] ?? id;
  const owned = [...new Set(g.owned.map(map).filter((id) => SHOP_BY_ID.has(id)))];
  const equipped: Partial<Record<AvatarSlot, string>> = {};
  for (const id of Object.values(g.equipped)) {
    if (!id) continue;
    const item = SHOP_BY_ID.get(map(id));
    if (item) equipped[item.slot] = item.id;
  }
  if (equipped.dress) {
    delete equipped.top;
    delete equipped.bottom;
  }
  return { ...g, owned, equipped };
}

export async function saveAppearance(appearance: Appearance) {
  const g = await getGame();
  await saveGame({ ...g, appearance });
}
async function saveGame(g: GameState) {
  await getDb().game.put({ ...g, updatedAt: Date.now() });
}

// ---------- Levels ----------
/** Total XP needed to reach level n (level 1 = 0 XP). Gentle curve: 100, 250, 450, 700… */
export function xpForLevel(n: number) {
  return 25 * (n - 1) * (n + 2);
}
export function levelFromXp(xp: number) {
  let n = 1;
  while (xp >= xpForLevel(n + 1)) n++;
  return { level: n, current: xp - xpForLevel(n), needed: xpForLevel(n + 1) - xpForLevel(n) };
}
export const LEVEL_TITLES = [
  "Touriste perdu", "Touriste curieux", "Baroudeur débutant", "Voyageur malin", "Explorateur", "Globe-trotteur",
  "Aventurier bilingue", "Expat confirmé", "Presque local", "Légende du voyage",
];
export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))];
}
export const LEVEL_REWARD = 100;
export const CHEST_REWARD = 50;
export const STREAK_MILESTONES: Record<number, number> = { 3: 50, 7: 150, 14: 300, 30: 600, 60: 1000, 100: 2000 };

// ---------- Daily quests ----------
export interface Quest {
  id: string;
  fr: string;
  en: string;
  emoji: string;
  target: number;
  progress: number;
  reward: number;
  href: string;
}

type QuestDef = Omit<Quest, "progress" | "target"> & { target: number; value: (d: DayActivity | undefined) => number; needsAI?: boolean };

const QUEST_POOL: QuestDef[] = [
  { id: "reviews", fr: "Réviser 20 cartes", en: "Review 20 cards", emoji: "🔁", target: 20, reward: 30, href: "/review", value: (d) => d?.reviews ?? 0 },
  { id: "game", fr: "Jouer à 2 mini-jeux", en: "Play 2 mini-games", emoji: "🎮", target: 2, reward: 25, href: "/games", value: (d) => d?.games ?? 0 },
  { id: "reading", fr: "Lire 300 mots en anglais", en: "Read 300 English words", emoji: "📖", target: 300, reward: 30, href: "/library", value: (d) => d?.readingWords ?? 0 },
  { id: "grammar", fr: "Faire 8 exercices de grammaire", en: "Do 8 grammar exercises", emoji: "✍️", target: 8, reward: 30, href: "/grammar", value: (d) => d?.grammarExercises ?? 0 },
  { id: "time", fr: "Apprendre pendant 10 minutes", en: "Study for 10 minutes", emoji: "⏱️", target: 600, reward: 25, href: "/session", value: (d) => d?.seconds ?? 0 },
  { id: "chat", fr: "Envoyer 6 messages en anglais", en: "Send 6 messages in English", emoji: "💬", target: 6, reward: 35, href: "/chat", value: (d) => d?.chatMessages ?? 0, needsAI: true },
  { id: "around", fr: "Nommer 5 choses autour de toi en anglais", en: "Name 5 things around you in English", emoji: "👀", target: 5, reward: 35, href: "/around", value: (d) => d?.around ?? 0 },
  { id: "correct", fr: "Donner 25 bonnes réponses", en: "Get 25 right answers", emoji: "🎯", target: 25, reward: 30, href: "/review", value: (d) => d?.correct ?? 0 },
];

function seededPick<T>(arr: T[], n: number, seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Today's quests: always "new words", plus 3 rotating quests (same for the whole day). */
export function dailyQuests(day: DayActivity | undefined, dailyNewWords: number, aiAvailable: boolean, date = todayKey()): Quest[] {
  const pool = QUEST_POOL.filter((q) => aiAvailable || !q.needsAI);
  const base: Quest = { id: "new", fr: `Apprendre ${dailyNewWords} nouveaux mots`, en: `Learn ${dailyNewWords} new words`, emoji: "✨", target: dailyNewWords, progress: Math.min(dailyNewWords, day?.newWords ?? 0), reward: 40, href: "/learn" };
  return [base, ...seededPick(pool, 3, date).map((q) => ({ id: q.id, fr: q.fr, en: q.en, emoji: q.emoji, target: q.target, reward: q.reward, href: q.href, progress: Math.min(q.target, q.value(day)) }))];
}

// ---------- Earning ----------
export async function claimQuest(questId: string, reward: number): Promise<GameState> {
  const g = await getGame();
  const date = todayKey();
  const done = g.claimed[date] ?? [];
  if (done.includes(questId)) return g;
  const next = { ...g, coins: g.coins + reward, totalEarned: g.totalEarned + reward, claimed: { ...pruneClaims(g.claimed), [date]: [...done, questId] } };
  await saveGame(next);
  return next;
}

function pruneClaims(c: Record<string, string[]>) {
  const keep = Object.keys(c).sort().slice(-7);
  return Object.fromEntries(keep.map((k) => [k, c[k]]));
}

export interface AutoRewards {
  levelUps: number[]; // new levels reached
  streak?: { days: number; coins: number };
  game: GameState;
}

/** Pays level-up and streak rewards that haven't been paid yet (idempotent). */
export async function settleRewards(): Promise<AutoRewards> {
  const db = getDb();
  const days = await db.activity.toArray();
  const xp = days.reduce((a, d) => a + (d.xp ?? 0), 0);
  const { level } = levelFromXp(xp);
  const g = await getGame();
  const out: AutoRewards = { levelUps: [], game: g };
  let next = { ...g };
  if (level > g.levelRewarded) {
    for (let l = g.levelRewarded + 1; l <= level; l++) out.levelUps.push(l);
    const coins = out.levelUps.length * LEVEL_REWARD;
    next = { ...next, coins: next.coins + coins, totalEarned: next.totalEarned + coins, levelRewarded: level };
  }
  const streak = computeStreak(days);
  for (const [m, coins] of Object.entries(STREAK_MILESTONES)) {
    const days_ = Number(m);
    if (streak >= days_ && !next.streakRewarded.includes(days_)) {
      next = { ...next, coins: next.coins + coins, totalEarned: next.totalEarned + coins, streakRewarded: [...next.streakRewarded, days_] };
      out.streak = { days: days_, coins };
    }
  }
  if (next !== g) await saveGame(next);
  out.game = next;
  return out;
}

// ---------- Shop ----------
export async function buyItem(itemId: string): Promise<{ ok: boolean; reason?: string; game: GameState }> {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  const g = await getGame();
  if (!item) return { ok: false, reason: "Objet introuvable", game: g };
  if (g.owned.includes(itemId)) return { ok: true, game: g };
  if (item.unlock) return { ok: false, reason: `Débloqué en terminant ${item.unlock.fr}`, game: g };
  if (item.earn) return { ok: false, reason: `À gagner : ${item.earn.fr}`, game: g };
  if (g.coins < item.price) return { ok: false, reason: "Pas assez de pièces", game: g };
  const next = { ...g, coins: g.coins - item.price, owned: [...g.owned, itemId], equipped: withItem(g.equipped, item.slot, itemId) };
  await saveGame(next);
  return { ok: true, game: next };
}

export async function toggleEquip(itemId: string) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  const g = await getGame();
  if (!item || !g.owned.includes(itemId)) return g;
  const equipped = { ...g.equipped };
  if (equipped[item.slot] === itemId && item.slot !== "background") delete equipped[item.slot];
  else Object.assign(equipped, withItem(equipped, item.slot, itemId));
  const next = { ...g, equipped };
  await saveGame(next);
  return next;
}

/** Equipping a dress removes top & bottom (and vice versa). */
function withItem(eq: Partial<Record<AvatarSlot, string>>, slot: AvatarSlot, id: string) {
  const next = { ...eq, [slot]: id };
  if (slot === "dress") {
    delete next.top;
    delete next.bottom;
  }
  if (slot === "top" || slot === "bottom") delete next.dress;
  return next;
}

// ---------- Rewards used by reading (ceremony, achievements) ----------
export async function addCoins(n: number): Promise<GameState> {
  const g = await getGame();
  const next = { ...g, coins: g.coins + n, totalEarned: g.totalEarned + Math.max(0, n) };
  await saveGame(next);
  return next;
}

/** Gives exclusive items for free (literary collections); returns the ones newly granted. */
export async function grantItems(ids: string[]): Promise<string[]> {
  const g = await getGame();
  const fresh = ids.filter((id) => !g.owned.includes(id) && SHOP_BY_ID.has(id));
  if (fresh.length) await saveGame({ ...g, owned: [...g.owned, ...fresh] });
  return fresh;
}

/** Exclusive literary items unlocked by finishing the given Gutenberg/library book id. */
export function itemsUnlockedBy(libraryId: number | undefined): string[] {
  if (!libraryId) return [];
  return SHOP_ITEMS.filter((i) => i.unlock?.ids.includes(libraryId)).map((i) => i.id);
}

// ---------- Personal bookshelf ----------
export const DEFAULT_SHELF = { style: "oak", decor: [] as string[], placed: {} as Record<string, string>, shelves: 2 };

export async function getShelf() {
  const g = await getGame();
  return { ...DEFAULT_SHELF, ...(g.shelf ?? {}), owned: g.owned, coins: g.coins };
}

export async function buyShelfThing(kind: "decor" | "style", id: string, price: number): Promise<{ ok: boolean; reason?: string }> {
  const g = await getGame();
  const shelf = { ...DEFAULT_SHELF, ...(g.shelf ?? {}) };
  const key = kind === "style" ? `style:${id}` : id;
  if (shelf.decor.includes(key)) {
    if (kind === "style") await saveGame({ ...g, shelf: { ...shelf, style: id } });
    return { ok: true };
  }
  if (g.coins < price) return { ok: false, reason: `Il te manque ${price - g.coins} pièces` };
  await saveGame({ ...g, coins: g.coins - price, shelf: { ...shelf, decor: [...shelf.decor, key], ...(kind === "style" ? { style: id } : {}) } });
  return { ok: true };
}

export async function placeDecor(slot: string, decorId: string | null) {
  const g = await getGame();
  const shelf = { ...DEFAULT_SHELF, ...(g.shelf ?? {}) };
  const placed = { ...shelf.placed };
  for (const [k, v] of Object.entries(placed)) if (v === decorId) delete placed[k];
  if (decorId) placed[slot] = decorId;
  else delete placed[slot];
  await saveGame({ ...g, shelf: { ...shelf, placed } });
}

// ---------- Earned wardrobe items (real progress, never bought) ----------

/** Real progress measured from the learner's data (used by earned items). */
export interface ProgressStats {
  lessons: number; // course lessons passed
  books: number; // books finished
  mastered: number; // words durably memorised (FSRS stability ≥ 21 days)
  streak: number; // total active days (never lost — rewards regularity without penalty)
  missions: Record<string, number>; // destination id → missions completed
}

export async function progressStats(): Promise<ProgressStats> {
  const db = getDb();
  const [lessons, books, srs, days, missions] = await Promise.all([
    db.lessons.where("status").equals("done").count(),
    db.collection.count(),
    db.srs.where("state").equals(2).toArray(),
    db.activity.toArray(),
    db.missions.where("status").equals("done").toArray(),
  ]);
  const mastered = new Set(srs.filter((x) => x.stability >= 21).map((x) => x.cardId)).size;
  const activeDays = days.filter((d) => d.seconds > 30 || d.reviews > 0 || d.newWords > 0 || d.xp > 0).length;
  const byDest: Record<string, number> = {};
  for (const m of missions) {
    const dest = m.id.split("-")[0];
    byDest[dest] = (byDest[dest] ?? 0) + 1;
  }
  return { lessons, books, mastered, streak: activeDays, missions: byDest };
}

/** Current value of an earn rule. */
export function earnValue(rule: EarnRule, st: ProgressStats): number {
  switch (rule.kind) {
    case "lessons": return st.lessons;
    case "books": return st.books;
    case "mastered": return st.mastered;
    case "streak": return st.streak;
    case "missions": return rule.dest ? st.missions[rule.dest] ?? 0 : Object.values(st.missions).reduce((a, b) => a + b, 0);
  }
}

/** Grants every earned item whose rule is met (idempotent). Returns the newly granted items. */
export async function checkEarnedItems(): Promise<ShopItem[]> {
  const st = await progressStats();
  const g = await getGame();
  const fresh = SHOP_ITEMS.filter((i) => i.earn && !g.owned.includes(i.id) && earnValue(i.earn, st) >= i.earn.n);
  if (fresh.length) await saveGame({ ...g, owned: [...g.owned, ...fresh.map((i) => i.id)] });
  return fresh;
}

// ---------- Favourite outfits ----------
export const MAX_OUTFITS = 5;

export async function saveOutfit(name: string): Promise<{ ok: boolean; reason?: string }> {
  const g = await getGame();
  const outfits = g.outfits ?? [];
  if (outfits.length >= MAX_OUTFITS) return { ok: false, reason: `${MAX_OUTFITS} tenues maximum : supprime-en une d'abord.` };
  const id = `o${Date.now().toString(36)}`;
  await saveGame({ ...g, outfits: [...outfits, { id, name: name.trim().slice(0, 30) || `Tenue ${outfits.length + 1}`, equipped: { ...g.equipped } }] });
  return { ok: true };
}

/** Puts on a saved outfit (only items still owned). */
export async function wearOutfit(id: string) {
  const g = await getGame();
  const o = g.outfits?.find((x) => x.id === id);
  if (!o) return g;
  const equipped: Partial<Record<AvatarSlot, string>> = {};
  for (const [slot, itemId] of Object.entries(o.equipped)) if (itemId && g.owned.includes(itemId)) equipped[slot as AvatarSlot] = itemId;
  const next = normalizeGame({ ...g, equipped });
  await saveGame(next);
  return next;
}

export async function deleteOutfit(id: string) {
  const g = await getGame();
  await saveGame({ ...g, outfits: (g.outfits ?? []).filter((o) => o.id !== id) });
}

/** Removes everything except the background. */
export async function undressAll() {
  const g = await getGame();
  await saveGame({ ...g, equipped: g.equipped.background ? { background: g.equipped.background } : {} });
}
