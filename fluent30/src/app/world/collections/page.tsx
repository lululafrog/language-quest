"use client";
// Transversal collections: follow a theme across destinations, independently of geography.
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { COLLECTIONS, collectionEntries, collectionMissions } from "@/lib/atlas/collections";
import { PageHeader, ProgressBar } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export default function CollectionsPage() {
  const done = useLiveQuery(async () => new Set((await getDb().missions.where("status").equals("done").toArray()).map((m) => m.id)), []);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Collections" subtitle="Des thèmes qui traversent les pays : chaque collection rassemble missions, vocabulaire et exercices." back="/world" />
      <div className="grid gap-2 sm:grid-cols-2">
        {COLLECTIONS.map((c) => {
          const missions = collectionMissions(c);
          const n = missions.filter(({ mission: m }) => done?.has(m.id) || (m.legacyId && done?.has(m.legacyId))).length;
          const dests = collectionEntries(c);
          const playable = dests.filter((d) => d.content !== "coming").length;
          return (
            <Link key={c.id} href={`/world/collections/${c.id}`} className="flex gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-600 dark:text-ink-300">
                <Icon name={c.icon as IconName} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-tight">{c.title}</span>
                <span className="block text-xs text-muted">{dests.length} destinations · {missions.length ? `${n}/${missions.length} missions` : playable ? "missions à venir" : "à venir"}</span>
                {missions.length > 0 && <ProgressBar value={n} max={missions.length} tone="mint" className="mt-1.5" />}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
