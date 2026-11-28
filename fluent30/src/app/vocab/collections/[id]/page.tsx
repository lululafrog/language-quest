"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, EmptyState, LinkButton, PageHeader, Spinner } from "@/components/ui";
import { StatusPill, WordSheet, useSpace } from "@/components/vocab/common";
import { CollectionCard } from "@/components/vocab/CollectionCard";
import { HUE } from "@/components/vocab/Plant";
import { collectionById, collectionWords } from "@/lib/vocab/collections";
import { collectionsProgress, libraryRows, type LibraryRow } from "@/lib/vocab/space";
import { SHOP_ITEMS } from "@/lib/data/shop";

const STEPS = [
  { at: 0.25, label: "Premier quart" },
  { at: 0.5, label: "À mi-chemin" },
  { at: 0.75, label: "Dernière ligne droite" },
  { at: 1, label: "Collection terminée" },
];

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const col = collectionById(id);
  const data = useSpace();
  const [open, setOpen] = useState<LibraryRow | null>(null);
  const [all, setAll] = useState(false);

  const rows = useMemo(() => {
    if (!data || !col) return [];
    const lemmas = new Set(collectionWords(col, data.sp.lex).map((e) => e.lemma));
    return libraryRows(data.sp).filter((r) => lemmas.has((r.entry?.lemma ?? r.word?.card.lemma) || ""));
  }, [data, col]);

  if (!col) return <EmptyState icon="📚" title="Collection introuvable"><LinkButton href="/vocab" className="mt-3">Vocabulaire</LinkButton></EmptyState>;
  if (!data)
    return (
      <div className="flex justify-center py-20 text-ink-500">
        <Spinner className="h-8 w-8" />
      </div>
    );
  const p = collectionsProgress(data.sp).find((x) => x.c.id === col.id)!;
  const reward = SHOP_ITEMS.find((i) => i.id === col.reward);
  const h = HUE[col.hue];
  const ratio = p.total ? p.consolidated / p.total : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={col.title} back="/vocab" />
      <CollectionCard p={p} large />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/vocab/play?mode=new&collection=${col.id}&size=10`}><Button className="w-full">Apprendre la suite</Button></Link>
        <Link href={`/vocab/play?mode=mix&collection=${col.id}&size=10`}><Button className="w-full" variant="secondary">Réviser la collection</Button></Link>
      </div>

      <h2 className="mb-3 mt-6 font-display text-lg font-semibold">Objectifs</h2>
      <ol className="space-y-2">
        {STEPS.map((s) => {
          const reached = ratio >= s.at;
          const need = Math.ceil(p.total * s.at);
          return (
            <li key={s.at} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: reached ? h.main : "var(--color-line)" }}>{reached ? "✓" : Math.round(s.at * 100)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted">{reached ? "Atteint" : `${need - p.consolidated} mot${need - p.consolidated > 1 ? "s" : ""} à retenir encore`}{s.at === 1 && reward ? ` · récompense : ${reward.fr}` : ""}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted">Seuls les mots vraiment retenus comptent (réussis plusieurs jours de suite), pas les cartes simplement vues.</p>

      <h2 className="mb-2 mt-6 font-display text-lg font-semibold">Les {p.total} mots</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {(all ? rows : rows.slice(0, 20)).map((r) => (
          <li key={r.key}>
            <button onClick={() => setOpen(r)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.en}</p>
                <p className="truncate text-sm text-muted">{r.fr}</p>
              </div>
              <StatusPill status={r.status} />
            </button>
          </li>
        ))}
      </ul>
      {rows.length > 20 && !all && <button onClick={() => setAll(true)} className="mt-2 h-10 w-full rounded-xl border border-line text-sm font-medium">Tout afficher</button>}
      <WordSheet row={open} onClose={() => setOpen(null)} />
    </div>
  );
}
