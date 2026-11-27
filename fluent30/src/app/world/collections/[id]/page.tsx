"use client";
// One collection: progress, vocabulary gathered across destinations, a short practice, destinations.
import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { collectionEntries, collectionMissions, collectionVocab, getCollection } from "@/lib/atlas/collections";
import { effectiveContent } from "@/lib/atlas/ui-data";
import { VocabPractice } from "@/components/atlas/VocabPractice";
import { Badge, EmptyState, PageHeader, Panel, ProgressBar, SectionHeader, SpeakButton } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const c = getCollection(id);
  const done = useLiveQuery(async () => new Set((await getDb().missions.where("status").equals("done").toArray()).map((m) => m.id)), []);
  const missions = useMemo(() => (c ? collectionMissions(c) : []), [c]);
  const vocab = useMemo(() => (c ? collectionVocab(c) : []), [c]);
  if (!c) {
    return (
      <EmptyState title="Collection introuvable">
        <Link href="/world/collections" className="font-semibold text-ink-600 underline">Toutes les collections</Link>
      </EmptyState>
    );
  }
  const entries = collectionEntries(c);
  const isDone = (mid: string, legacy?: string) => !!done?.has(mid) || (!!legacy && !!done?.has(legacy));
  const n = missions.filter(({ mission: m }) => isDone(m.id, m.legacyId)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <PageHeader title={c.title} subtitle={c.desc} back="/world/collections" />

      {missions.length > 0 ? (
        <Panel className="space-y-2">
          <div className="flex justify-between text-sm"><span className="font-semibold">Progression</span><span className="text-muted">{n}/{missions.length} missions</span></div>
          <ProgressBar value={n} max={missions.length} tone="mint" />
        </Panel>
      ) : (
        <Panel tone="subtle" className="text-sm">Aucune mission de cette collection n&apos;est encore jouable : les destinations concernées sont à venir.</Panel>
      )}

      {missions.length > 0 && (
        <section>
          <SectionHeader title="Missions" />
          <div className="space-y-2">
            {missions.map(({ mission: m, dest }) => (
              <Link key={m.id} href={`/world/mission/${m.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
                <span className={isDone(m.id, m.legacyId) ? "text-mint-600" : "text-muted"}><Icon name={isDone(m.id, m.legacyId) ? "check" : "globe"} size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-tight">{m.title}</span>
                  <span className="block text-xs text-muted">{entries.find((e) => e.id === dest.id)?.nameFr ?? dest.id} · {m.minutes} min</span>
                </span>
                <Icon name="chevron" size={16} className="text-muted" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {vocab.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Vocabulaire de la collection" subtitle={`${vocab.length} mots et expressions venus de plusieurs pays`} />
          <div className="flex flex-wrap gap-1.5">
            {vocab.slice(0, 40).map((v) => (
              <span key={v.en} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-0.5 pl-1 pr-3 text-sm">
                <SpeakButton text={v.en} size={13} className="p-1" /> {v.en} <span className="text-muted">· {v.fr.split(/[,;]/)[0]}</span>
              </span>
            ))}
          </div>
          <SectionHeader title="S'entraîner" />
          <VocabPractice vocab={vocab} />
        </section>
      )}

      <section>
        <SectionHeader title="Destinations" />
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {entries.map((e) => {
            const content = effectiveContent(e);
            return (
              <Link key={e.id} href={`/world/${e.id}`} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2">
                <span className="min-w-0 flex-1 truncate font-medium">{e.nameFr}</span>
                <Badge tone={content === "coming" ? "gray" : content === "preview" ? "sun" : "ink"}>{content === "coming" ? "À venir" : content === "preview" ? "Aperçu" : "Jouable"}</Badge>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
