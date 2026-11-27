"use client";
// Export / import / deletion of personal data (RGPD-friendly).
import { getDb, SYNCED_TABLES } from "./db";

export async function exportAll(): Promise<Blob> {
  const db = getDb();
  const out: Record<string, unknown[]> = {};
  for (const name of [...SYNCED_TABLES]) out[name] = await db.table(name).toArray();
  const payload = { app: "fluent30", version: 1, exportedAt: new Date().toISOString(), data: out };
  return new Blob([JSON.stringify(payload)], { type: "application/json" });
}

export async function importAll(file: File): Promise<number> {
  const text = await file.text();
  const j = JSON.parse(text) as { app?: string; data?: Record<string, unknown[]> };
  if (j.app !== "fluent30" || !j.data) throw new Error("Ce fichier n'est pas une sauvegarde Fluent30.");
  const db = getDb();
  let n = 0;
  await db.transaction("rw", db.tables, async () => {
    for (const name of SYNCED_TABLES) {
      const rows = j.data![name];
      if (!Array.isArray(rows)) continue;
      await db.table(name).bulkPut(rows);
      n += rows.length;
    }
  });
  return n;
}

export async function wipeLocal() {
  const db = getDb();
  db.close();
  await db.delete();
  localStorage.removeItem("fluent30.theme");
  for (const k of Object.keys(localStorage)) if (k.startsWith("fluent30.")) localStorage.removeItem(k);
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
