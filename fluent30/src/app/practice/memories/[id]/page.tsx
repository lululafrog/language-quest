"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { errorMessage } from "@/lib/api";
import { deleteMemory, illustrateMemory, masteryOf, type Mastery } from "@/lib/memories";
import { Button, EmptyState, ErrorNote, PageHeader, Panel, Sheet, SpeakButton, toast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { MemoryPhoto } from "@/components/memories/MemoryPhoto";
import { MasteryChip } from "@/components/memories/MasteryChip";
import { MemoryQuiz } from "@/components/memories/MemoryQuiz";

export default function MemoryDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const memory = useLiveQuery(async () => (await getDb().memories.get(id)) ?? null, [id]);
  const mastery = useLiveQuery(async () => (memory ? masteryOf(memory.words.flatMap((w) => (w.cardId ? [w.cardId] : []))) : ({} as Record<string, Mastery>)), [memory]);
  const [quiz, setQuiz] = useState(false);
  const [showIllus, setShowIllus] = useState(false);
  const [illusBusy, setIllusBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  if (memory === undefined) return <div className="mx-auto h-80 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  if (memory === null)
    return (
      <EmptyState icon="" title="Souvenir introuvable">
        <Link href="/practice/memories" className="font-semibold text-ink-600 underline">Retour à l&apos;album</Link>
      </EmptyState>
    );

  const illustrate = async () => {
    setError("");
    setIllusBusy(true);
    try {
      await illustrateMemory(memory);
      setShowIllus(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIllusBusy(false);
    }
  };

  const remove = async (alsoCards: boolean) => {
    await deleteMemory(memory, alsoCards);
    toast("Souvenir supprimé");
    router.push("/practice/memories");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={memory.title} subtitle={[memory.place, new Date(memory.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })].filter(Boolean).join(" · ")} back="/practice/memories" />

      {quiz ? (
        <MemoryQuiz memory={memory} onClose={() => setQuiz(false)} />
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-line/70 bg-surface card-shadow">
            <MemoryPhoto memory={memory} illustration={showIllus && !!memory.illustrationKey} className="max-h-[420px] w-full" />
            {memory.sentence && (
              <div className="flex items-start gap-1 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-semibold">{memory.sentence}</p>
                  {memory.sentenceFr && <p className="text-sm text-muted">{memory.sentenceFr}</p>}
                </div>
                <SpeakButton text={memory.sentence} />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {memory.illustrationKey ? (
              <Button variant="outline" size="sm" onClick={() => setShowIllus((v) => !v)}>
                <Icon name="image" size={16} /> {showIllus ? "Voir ma photo" : "Voir l'illustration"}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={illustrate} loading={illusBusy}>
                <Icon name="sparkle" size={16} /> Générer une illustration
              </Button>
            )}
          </div>
          {!memory.illustrationKey && <p className="text-[12.5px] text-muted">L&apos;illustration est créée à partir du titre et de ta phrase ; ta photo n&apos;est pas envoyée.</p>}
          {error && <ErrorNote>{error}</ErrorNote>}

          <Panel className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-semibold">Mots de ce souvenir</h2>
              <span className="text-xs text-muted">{memory.words.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {memory.words.map((w) => (
                <MasteryChip key={w.en} en={w.en} fr={w.fr} mastery={w.cardId ? mastery?.[w.cardId] : undefined} href={w.cardId ? `/cards/${w.cardId}` : undefined} />
              ))}
            </div>
            <Button className="w-full" onClick={() => setQuiz(true)} disabled={!memory.words.some((w) => w.cardId)}>
              Réviser ces mots
            </Button>
          </Panel>

          <button type="button" onClick={() => setConfirm(true)} className="mx-auto flex items-center gap-1.5 text-sm text-muted hover:text-coral-600">
            <Icon name="trash" size={15} /> Supprimer ce souvenir
          </button>
        </>
      )}

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Supprimer ce souvenir ?">
        <div className="space-y-3">
          <p className="text-[15px]">La photo est effacée de ton appareil. Que faire des cartes créées à partir de ce souvenir ?</p>
          <Button variant="secondary" className="w-full" onClick={() => remove(false)}>Garder les cartes</Button>
          <Button variant="danger" className="w-full" onClick={() => remove(true)}>Supprimer aussi les cartes</Button>
        </div>
      </Sheet>
    </div>
  );
}
