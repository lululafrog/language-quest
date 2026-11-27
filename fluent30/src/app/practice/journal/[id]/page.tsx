"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { deleteEntry } from "@/lib/journal";
import { Button, EmptyState, PageHeader, Sheet, toast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { EntryAnalysis } from "@/components/journal/EntryAnalysis";
import { AudioPlayer } from "@/components/journal/Audio";
import { MediaThumb } from "@/components/journal/MediaThumb";

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const entry = useLiveQuery(async () => (await getDb().journal.get(id)) ?? null, [id]);
  const [confirm, setConfirm] = useState(false);

  if (entry === undefined) return <div className="mx-auto h-80 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  if (entry === null)
    return (
      <EmptyState icon="" title="Entrée introuvable">
        <Link href="/practice/journal" className="font-semibold text-ink-600 underline">Retour au journal</Link>
      </EmptyState>
    );

  const date = new Date(entry.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={entry.monthly ? "Bilan oral du mois" : "Mon journal"} subtitle={[date, entry.mood, entry.place].filter(Boolean).join(" · ")} back="/practice/journal" />
      {entry.prompt && <p className="text-[15px] font-semibold text-ink-600 dark:text-ink-300">{entry.prompt}</p>}
      {entry.audioKey && <AudioPlayer mediaKey={entry.audioKey} />}
      {entry.mediaKeys && entry.mediaKeys.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {entry.mediaKeys.map((k) => <MediaThumb key={k} mediaKey={k} className="h-28 w-28 shrink-0 rounded-2xl" />)}
        </div>
      )}
      {entry.text.trim() ? <EntryAnalysis entry={entry} /> : <p className="text-sm text-muted">Enregistrement audio uniquement. Écris aussi quelques phrases pour obtenir une correction.</p>}
      <button type="button" onClick={() => setConfirm(true)} className="mx-auto flex items-center gap-1.5 text-sm text-muted hover:text-coral-600">
        <Icon name="trash" size={15} /> Supprimer cette entrée
      </button>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Supprimer cette entrée ?">
        <div className="space-y-3">
          <p className="text-[15px]">Le texte, les photos et l&apos;enregistrement sont effacés de ton appareil. Les cartes déjà créées sont conservées.</p>
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              await deleteEntry(entry);
              toast("Entrée supprimée");
              router.push("/practice/journal");
            }}
          >
            Supprimer
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
