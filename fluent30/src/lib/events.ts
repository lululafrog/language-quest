"use client";
// Tiny typed event bus linking reading, vocabulary and gamification modules.
export type AppEvents = {
  "chapter:finished": { bookId: string; chapter: number };
  "book:finished": { bookId: string };
  "word:saved": { cardId: string; source: string };
  "quiz:done": { bookId: string; chapter: number; score: number; total: number };
  "lesson:done": { lessonId: string; score: number };
};

type Handler<K extends keyof AppEvents> = (payload: AppEvents[K]) => void;
const handlers = new Map<keyof AppEvents, Set<(p: unknown) => void>>();

export function on<K extends keyof AppEvents>(event: K, h: Handler<K>): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set());
  const set = handlers.get(event)!;
  const fn = h as (p: unknown) => void;
  set.add(fn);
  return () => set.delete(fn);
}

export function emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]) {
  handlers.get(event)?.forEach((h) => {
    try {
      h(payload);
    } catch (e) {
      console.error(e);
    }
  });
}
