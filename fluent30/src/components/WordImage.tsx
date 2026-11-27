"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { getDb } from "@/lib/db";
import { ensureImage, imageKeyFor, lemmaOf } from "@/lib/cards";
import { cx, Spinner } from "./ui";
import { Icon } from "./icons";
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
    if (img.attribution) {
      // openly licensed image: the credit stays visible (required by CC BY, courteous for CC0)
      return (
        <figure className={cx("relative overflow-hidden rounded-2xl", className)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.data} alt="" className="h-full w-full object-cover" draggable={false} />
          <figcaption className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-1.5 py-0.5 text-[9px] leading-tight text-white/90" title={img.attribution}>
            {img.sourceUrl ? (
              <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:underline">
                {img.attribution}
              </a>
            ) : (
              img.attribution
            )}
          </figcaption>
        </figure>
      );
    }
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
        {busy ? <Spinner /> : <Icon name="image" size={22} />}
        <span>{failed ? "Illustration indisponible" : busy ? "Création…" : "Créer une illustration"}</span>
      </button>
    );
  }
  return null;
}
