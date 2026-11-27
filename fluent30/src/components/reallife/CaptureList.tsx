"use client";
// Recent captures, with private deletion (capture + media; optionally the cards created from it).
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { deleteCapture, kindLabel } from "@/lib/reallife";
import { Button, EmptyState, Sheet, toast } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import type { Capture, CaptureKind } from "@/lib/types";

const KIND_ICON: Record<CaptureKind, IconName> = { text: "chat", screenshot: "image", photo: "camera", voice: "mic", french: "translate", film: "play", book: "book" };

export function CaptureList() {
  const caps = useLiveQuery(() => getDb().captures.orderBy("createdAt").reverse().toArray(), []);
  const [del, setDel] = useState<Capture | null>(null);
  if (!caps) return <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />;
  if (!caps.length)
    return (
      <EmptyState icon="" title="Aucun import pour l'instant">
        Importe ton premier message ou une phrase entendue : il deviendra une mini-leçon et des flashcards.
      </EmptyState>
    );
  const remove = async (withCards: boolean) => {
    if (!del) return;
    await deleteCapture(del.id, withCards);
    toast(withCards ? "Import et cartes supprimés" : "Import supprimé");
    setDel(null);
  };
  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {caps.map((c) => (
          <li key={c.id} className="flex items-center gap-1 pr-1">
            <Link href={`/practice/real-life/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
              <Icon name={KIND_ICON[c.kind] ?? "chat"} size={19} className="shrink-0 text-fg/50" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{c.title}</span>
                <span className="block text-xs text-muted">
                  {kindLabel(c.kind)} · {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {c.keptCardIds.length ? ` · ${c.keptCardIds.length} carte${c.keptCardIds.length > 1 ? "s" : ""}` : ""}
                  {!c.analysis ? " · à analyser" : ""}
                </span>
              </span>
            </Link>
            <button type="button" onClick={() => setDel(c)} className="rounded-full p-2 text-fg/40 transition hover:bg-surface-2 hover:text-coral-600" aria-label={`Supprimer « ${c.title} »`}>
              <Icon name="trash" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <Sheet open={!!del} onClose={() => setDel(null)} title="Supprimer cet import ?">
        <div className="space-y-3 text-[15px]">
          <p className="text-fg/80">Le texte, l&apos;image ou l&apos;enregistrement seront effacés de ton appareil (et de ta sauvegarde si tu es connecté).</p>
          <Button className="w-full" variant="secondary" onClick={() => remove(false)}>Supprimer l&apos;import, garder mes cartes</Button>
          {!!del?.keptCardIds.length && (
            <Button className="w-full" variant="secondary" onClick={() => remove(true)}>Supprimer aussi les {del.keptCardIds.length} cartes créées</Button>
          )}
          <Button className="w-full" variant="ghost" onClick={() => setDel(null)}>Annuler</Button>
        </div>
      </Sheet>
    </>
  );
}
