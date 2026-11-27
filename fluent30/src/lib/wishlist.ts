"use client";
// Reading wishlist ("Ma liste d'envies"): built-in books ("lib:<id>") or any book id.
import { getDb } from "./db";

export const wishIdForLibrary = (libraryId: number) => `lib:${libraryId}`;

export async function isWished(id: string): Promise<boolean> {
  return !!(await getDb().wishlist.get(id));
}

/** Adds or removes an item; returns the new state (true = in the wishlist). */
export async function toggleWish(id: string): Promise<boolean> {
  const db = getDb();
  if (await db.wishlist.get(id)) {
    await db.wishlist.delete(id);
    return false;
  }
  await db.wishlist.put({ id, addedAt: Date.now(), updatedAt: Date.now() });
  return true;
}

export async function listWishes() {
  return getDb().wishlist.orderBy("addedAt").reverse().toArray();
}

/** Library ids present in the wishlist. */
export function wishedLibraryIds(items: { id: string }[]): number[] {
  return items.map((w) => (w.id.startsWith("lib:") ? Number(w.id.slice(4)) : NaN)).filter((n) => Number.isInteger(n));
}
