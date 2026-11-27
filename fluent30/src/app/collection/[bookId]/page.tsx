"use client";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { LIBRARY } from "@/lib/data/library";
import { ReadingCard } from "@/components/collection/ReadingCard";
import { EmptyState, LinkButton, PageHeader, Panel } from "@/components/ui";

function fmt(sec: number) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

export default function CollectionBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const id = decodeURIComponent(bookId);
  const data = useLiveQuery(async () => ({ entry: (await getDb().collection.get(id)) ?? null, book: (await getDb().books.get(id)) ?? null }), [id]);
  if (!data) return null;
  if (!data.entry) return <EmptyState icon="🔍" title="Ce livre n'est pas encore dans ta collection" />;
  const e = data.entry;
  const lib = e.libraryId ? LIBRARY.find((b) => b.id === e.libraryId) : undefined;
  const st = e.stats;
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={e.title} subtitle={[e.author, lib?.titleFr].filter(Boolean).join(" · ")} back="/collection" />
      <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
        <ReadingCard entry={e} className="mx-auto w-52" />
        <div className="space-y-3">
          <Panel>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Mots lus", st.wordsRead.toLocaleString("fr-FR")],
                ["Temps de lecture", fmt(st.readingSeconds)],
                ["Mots notés", st.newWords],
                ["Mémorisés", st.memorized],
                ["Expressions", st.expressions],
                ["Quiz", st.quizAvg == null ? "—" : `${Math.round(st.quizAvg * 100)} %`],
                ["Lectures", `${e.times}×`],
                ["Terminé le", new Date(e.finishedAt).toLocaleDateString("fr-FR")],
              ].map(([k, v]) => (
                <div key={String(k)}><p className="text-xs text-muted">{k}</p><p className="text-lg font-semibold tabular-nums">{v}</p></div>
              ))}
            </div>
            {st.lookupsPer100 != null && <p className="mt-3 text-sm text-muted">{st.lookupsPer100} mots cherchés pour 100 mots lus.</p>}
          </Panel>
          {lib?.summaryFr && <Panel><p className="text-sm">{lib.summaryFr}</p></Panel>}
          {data.book ? (
            <LinkButton href={`/library/read/${encodeURIComponent(id)}`} className="w-full">Relire ce livre</LinkButton>
          ) : (
            <p className="text-sm text-muted">Le texte n&apos;est plus sur cet appareil : retrouve-le dans la bibliothèque pour le relire. Tes récompenses sont conservées.</p>
          )}
        </div>
      </div>
    </div>
  );
}
