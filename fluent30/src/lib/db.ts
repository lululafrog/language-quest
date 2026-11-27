"use client";
// Local-first persistence (IndexedDB via Dexie). Works offline; optional cloud sync in sync.ts.
import Dexie, { type Table } from "dexie";
import type {
  Book, BookContent, CacheEntry, Card, Conversation, DailySession, DayActivity, GameResult, GameState,
  GrammarProgress, ImageAsset, KnownWord, Mistake, ReviewLog, Settings, SrsState, TestResult,
} from "./types";

export interface Tombstone {
  key: string; // `${table}:${rowId}`
  table: string;
  rowId: string;
  updatedAt: number;
}

export class FluentDB extends Dexie {
  settings!: Table<Settings, string>;
  cards!: Table<Card, string>;
  srs!: Table<SrsState, string>;
  reviewLogs!: Table<ReviewLog, string>;
  known!: Table<KnownWord, string>;
  books!: Table<Book, string>;
  bookContent!: Table<BookContent, string>;
  activity!: Table<DayActivity, string>;
  mistakes!: Table<Mistake, string>;
  grammar!: Table<GrammarProgress, string>;
  games!: Table<GameResult, string>;
  conversations!: Table<Conversation, string>;
  images!: Table<ImageAsset, string>;
  tests!: Table<TestResult, string>;
  sessions!: Table<DailySession, string>;
  cache!: Table<CacheEntry, string>;
  tombstones!: Table<Tombstone, string>;
  game!: Table<GameState, string>;

  constructor() {
    super("fluent30");
    this.version(1).stores({
      settings: "id",
      cards: "id, lemma, kind, source, createdAt, updatedAt, *themes, tier",
      srs: "id, cardId, skill, due, state, updatedAt",
      reviewLogs: "id, cardId, skill, at, updatedAt",
      known: "lemma, updatedAt",
      books: "id, source, lastOpenedAt, updatedAt",
      bookContent: "bookId, updatedAt",
      activity: "date, updatedAt",
      mistakes: "id, type, count, lastAt, updatedAt",
      grammar: "lessonId, updatedAt",
      games: "id, gameId, at, updatedAt",
      conversations: "id, scenarioId, createdAt, updatedAt",
      images: "key, updatedAt",
      tests: "id, type, at, updatedAt",
      sessions: "date, updatedAt",
      cache: "key, at",
      tombstones: "key, table, updatedAt",
    });
    this.version(2).stores({ game: "id, updatedAt" });

    // Every write stamps updatedAt (used by sync), except for local-only tables.
    const localOnly = new Set(["cache", "tombstones"]);
    for (const table of this.tables) {
      if (localOnly.has(table.name)) continue;
      table.hook("creating", (_pk, obj: { updatedAt?: number }) => {
        if (!SYNC_APPLYING) obj.updatedAt = Date.now();
      });
      table.hook("updating", () => (SYNC_APPLYING ? undefined : { updatedAt: Date.now() }));
      table.hook("deleting", (pk) => {
        if (SYNC_APPLYING) return;
        const rowId = String(pk);
        // Record a tombstone so deletions propagate to other devices.
        setTimeout(() => {
          void this.tombstones.put({ key: `${table.name}:${rowId}`, table: table.name, rowId, updatedAt: Date.now() });
        }, 0);
      });
    }
  }
}

/** Set to true while applying remote changes so hooks don't re-stamp them. */
export let SYNC_APPLYING = false;
export function setSyncApplying(v: boolean) {
  SYNC_APPLYING = v;
}

export const SYNCED_TABLES = [
  "settings", "cards", "srs", "reviewLogs", "known", "books", "bookContent", "activity", "mistakes",
  "grammar", "games", "conversations", "images", "tests", "sessions", "game",
] as const;

let _db: FluentDB | null = null;
export function getDb(): FluentDB {
  if (typeof window === "undefined") throw new Error("IndexedDB is only available in the browser");
  if (!_db) _db = new FluentDB();
  return _db;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "me",
  dailyNewWords: 10,
  sessionMinutes: 15,
  immersion: false,
  theme: "system",
  accent: "en-GB",
  speechRate: 0.95,
  correctionMode: "end",
  interests: [],
  goals: [],
  placementDone: false,
  onboarded: false,
  reader: { font: "serif", size: 19, theme: "light", lineHeight: 1.7 },
  autoImages: true,
  updatedAt: 0,
};

export async function getSettings(): Promise<Settings> {
  const db = getDb();
  const s = await db.settings.get("me");
  if (!s) return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...s, reader: { ...DEFAULT_SETTINGS.reader, ...(s.reader ?? {}) } };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = getDb();
  const cur = await getSettings();
  const next = { ...cur, ...patch, id: "me" as const, updatedAt: Date.now() };
  await db.settings.put(next);
  return next;
}

export function uid(prefix = ""): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Simple local cache for AI responses (avoids paying twice for the same request). */
export async function cacheGet<T>(key: string, maxAgeMs = 1000 * 60 * 60 * 24 * 90): Promise<T | undefined> {
  const e = await getDb().cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > maxAgeMs) return undefined;
  return e.value as T;
}
export async function cacheSet(key: string, value: unknown) {
  await getDb().cache.put({ key, value, at: Date.now() });
}
