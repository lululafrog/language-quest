"use client";
// Small reader preferences kept on the device (not part of the synced Settings schema).
import { useSyncExternalStore } from "react";

export interface ReaderPrefs {
  colorize: boolean; // underline words by usefulness (green/blue/orange/grey)
  night: boolean; // night theme (black background, warm text)
}
const KEY = "fluent30.reader.prefs";
const DEFAULT: ReaderPrefs = { colorize: false, night: false };
const listeners = new Set<() => void>();
let cache: ReaderPrefs | null = null;

function read(): ReaderPrefs {
  if (cache) return cache;
  try {
    cache = { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    cache = DEFAULT;
  }
  return cache!;
}

export function setReaderPrefs(p: Partial<ReaderPrefs>) {
  cache = { ...read(), ...p };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useReaderPrefs(): ReaderPrefs {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT,
  );
}

/** Per-book adapted level ("A1".."C1"), or null for the original text. */
export function getAdaptLevel(bookId: string): string | null {
  try {
    return localStorage.getItem(`fluent30.adapt.${bookId}`);
  } catch {
    return null;
  }
}
export function setAdaptLevel(bookId: string, level: string | null) {
  if (level) localStorage.setItem(`fluent30.adapt.${bookId}`, level);
  else localStorage.removeItem(`fluent30.adapt.${bookId}`);
}
