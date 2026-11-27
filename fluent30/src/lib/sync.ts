"use client";
// Optional cloud backup & multi-device sync through Supabase (last-write-wins per row).
// Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY and the SQL in supabase/schema.sql.
import { getDb, setSyncApplying, SYNCED_TABLES } from "./db";
import { supabase } from "./supabase";

const TABLE = "fluent_rows";
export const PERSONAL_TABLES = new Set<string>(["captures", "journal", "memories"]);
const SKIP = new Set(["images"]); // illustrations are cached server-side and regenerated on demand
const MAX_ROW_BYTES = 2_000_000;

type Row = { user_id: string; tbl: string; row_id: string; data: unknown; deleted: boolean; updated_at: number };

function pkOf(table: string, row: Record<string, unknown>): string {
  const key = table === "settings" ? "id" : table === "known" ? "lemma" : table === "bookContent" || table === "collection" ? "bookId" : table === "activity" || table === "sessions" ? "date" : table === "grammar" ? "lessonId" : table === "images" ? "key" : "id";
  return String(row[key]);
}

let running: Promise<SyncResult> | null = null;
export interface SyncResult {
  pushed: number;
  pulled: number;
  at: number;
  skipped?: string;
}

export function syncNow(): Promise<SyncResult> {
  if (!running) running = doSync().finally(() => (running = null));
  return running;
}

async function doSync(): Promise<SyncResult> {
  const sb = supabase();
  if (!sb) return { pushed: 0, pulled: 0, at: Date.now(), skipped: "not_configured" };
  const { data: sess } = await sb.auth.getSession();
  const user = sess.session?.user;
  if (!user) return { pushed: 0, pulled: 0, at: Date.now(), skipped: "signed_out" };
  if (!navigator.onLine) return { pushed: 0, pulled: 0, at: Date.now(), skipped: "offline" };

  const db = getDb();
  const lsKey = `fluent30.sync.${user.id}`;
  const state = JSON.parse(localStorage.getItem(lsKey) ?? '{"push":0,"pull":0}') as { push: number; pull: number };
  const startedAt = Date.now();

  // ---- Push local changes
  const rows: Row[] = [];
  // Personal content (Real Life captures, journal, memory cards) stays on the device unless the learner opts in.
  const settings = await db.settings.get("me");
  const personalOn = !!settings?.syncPersonalContent;
  const personalKey = `fluent30.sync.personal.${user.id}`;
  const personalPush = Number(localStorage.getItem(personalKey) ?? 0);
  for (const name of SYNCED_TABLES) {
    if (SKIP.has(name)) continue;
    const personal = PERSONAL_TABLES.has(name);
    if (personal && !personalOn) continue;
    const table = db.table(name);
    const changed = (await table.where("updatedAt").above(personal ? personalPush : state.push).toArray()) as Record<string, unknown>[];
    for (const r of changed) {
      const size = JSON.stringify(r).length;
      if (size > MAX_ROW_BYTES) continue;
      rows.push({ user_id: user.id, tbl: name, row_id: pkOf(name, r), data: r, deleted: false, updated_at: Number(r.updatedAt) || Date.now() });
    }
  }
  const tombs = await db.tombstones.where("updatedAt").above(state.push).toArray();
  for (const t of tombs) rows.push({ user_id: user.id, tbl: t.table, row_id: t.rowId, data: null, deleted: true, updated_at: t.updatedAt });
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from(TABLE).upsert(rows.slice(i, i + 200), { onConflict: "user_id,tbl,row_id" });
    if (error) throw new Error(`Synchronisation (envoi) : ${error.message}`);
  }

  // ---- Pull remote changes
  let pulled = 0;
  let cursor = state.pull;
  for (;;) {
    const { data, error } = await sb.from(TABLE).select("tbl,row_id,data,deleted,updated_at").eq("user_id", user.id).gt("updated_at", cursor).order("updated_at", { ascending: true }).limit(500);
    if (error) throw new Error(`Synchronisation (réception) : ${error.message}`);
    if (!data?.length) break;
    setSyncApplying(true);
    try {
      for (const r of data as Omit<Row, "user_id">[]) {
        if (!(SYNCED_TABLES as readonly string[]).includes(r.tbl)) continue;
        if (PERSONAL_TABLES.has(r.tbl) && !personalOn) continue;
        const table = db.table(r.tbl);
        const local = (await table.get(r.row_id)) as { updatedAt?: number } | undefined;
        if (local && (local.updatedAt ?? 0) >= r.updated_at) continue;
        if (r.deleted) await table.delete(r.row_id);
        else await table.put(r.data);
        pulled++;
      }
    } finally {
      setSyncApplying(false);
    }
    cursor = Number(data[data.length - 1].updated_at);
    if (data.length < 500) break;
  }

  if (personalOn) localStorage.setItem(personalKey, String(startedAt));
  const next = { push: startedAt, pull: Math.max(cursor, state.pull) };
  localStorage.setItem(lsKey, JSON.stringify(next));
  return { pushed: rows.length, pulled, at: Date.now() };
}

/** Background sync: on start, every 2 minutes, when coming back online and when the tab is hidden. */
export function startAutoSync(): () => void {
  if (!supabase()) return () => {};
  const run = () => void syncNow().catch((e) => console.warn(e));
  const t0 = setTimeout(run, 1500);
  const iv = setInterval(run, 120_000);
  const onVis = () => document.visibilityState === "hidden" && run();
  window.addEventListener("online", run);
  document.addEventListener("visibilitychange", onVis);
  return () => {
    clearTimeout(t0);
    clearInterval(iv);
    window.removeEventListener("online", run);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/** Deletes all of the user's data stored in the cloud. */
export async function deleteRemoteData(): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  const { data: sess } = await sb.auth.getSession();
  const user = sess.session?.user;
  if (!user) return;
  const { error } = await sb.from(TABLE).delete().eq("user_id", user.id);
  if (error) throw new Error(error.message);
  localStorage.removeItem(`fluent30.sync.${user.id}`);
}
