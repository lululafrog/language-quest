"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { DEFAULT_SETTINGS, getDb } from "@/lib/db";
import type { Settings } from "@/lib/types";

/** Live settings (defaults until IndexedDB has loaded). */
export function useSettings(): Settings & { loaded: boolean } {
  const s = useLiveQuery(async () => (await getDb().settings.get("me")) ?? null, []);
  if (s === undefined) return { ...DEFAULT_SETTINGS, loaded: false };
  if (s === null) return { ...DEFAULT_SETTINGS, loaded: true };
  return { ...DEFAULT_SETTINGS, ...s, reader: { ...DEFAULT_SETTINGS.reader, ...(s.reader ?? {}) }, loaded: true };
}
