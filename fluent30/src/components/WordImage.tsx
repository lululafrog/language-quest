"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { getDb } from "@/lib/db";
import { ensureImage, imageKeyFor, lemmaOf } from "@/lib/cards";
import { cx, Spinner } from "./ui";
import type { Card } from "@/lib/types";

/** Shows the cached illustration for a word (if any). With `card` + `allowGenerate`, offers generation. */
export function WordImage({ term, fr, card, className, allowGenerate }: { term: string; fr?: string; card?: Card; className?: string; allowGenerate?: boolean }) {
  const img = useLiveQuery(async () => {
    const db = getDb();
    const c = card ?? (await db.cards.where("lemma").equals(lemmaOf(term)).first());
    const key = c?.imageKey ?? (c ? imageKeyFor(c) : fr ? imageKeyFor({ lemma: lemmaOf(term), fr }) : undefined);
    if (!key) return null;
    return (await db.images.get(key)) ?? null;
  }, [term, fr, card?.imageKey, card?.id]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (img) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={img.data} alt="" className={cx("rounded-2xl object-cover", className)} draggable={false} />
    );
  }
  if (allowGenerate && card) {
    return (
      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          setBusy(true);
          setFailed(false);
          const r = await ensureImage(card);
          setBusy(false);
          if (!r) setFailed(true);
        }}
        className={cx("flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-xs text-muted hover:border-ink-300", className)}
      >
        {busy ? <Spinner /> : <span className="text-2xl">🖼️</span>}
        <span>{failed ? "Indisponible (clé API ?)" : busy ? "Création…" : "Créer une illustration"}</span>
      </button>
    );
  }
  return null;
}
