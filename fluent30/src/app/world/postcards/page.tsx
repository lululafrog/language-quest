"use client";
// Postcard album: one illustrated postcard per validated destination (private unless shared).
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { getGame } from "@/lib/game";
import { ownedRewards } from "@/lib/atlas/progress";
import { Postcard } from "@/components/atlas/Postcard";
import { postcardData } from "@/components/atlas/postcardData";
import { LinkButton, PageHeader, Panel } from "@/components/ui";

export default function PostcardsPage() {
  const data = useLiveQuery(async () => {
    const [rows, game, owned] = await Promise.all([getDb().postcards.orderBy("validatedAt").reverse().toArray(), getGame(), ownedRewards()]);
    return { rows, game, owned };
  }, []);
  if (!data) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <PageHeader title="Cartes postales" subtitle="Une carte par destination validée, avec ton message en anglais. Elles restent privées, sauf si tu choisis de les partager." back="/world" />
      {data.rows.length === 0 ? (
        <Panel className="space-y-2 text-center">
          <p className="font-semibold">Ton album est encore vide</p>
          <p className="text-sm text-muted">Valide une destination (ses missions et sa mission finale) pour recevoir ta première carte postale.</p>
          <LinkButton href="/world" className="mx-auto">Explorer le monde</LinkButton>
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.rows.map((r) => {
            const d = postcardData(r, data.game, data.owned);
            if (!d) return null;
            return (
              <Link key={r.id} href={`/world/postcards/${r.destId}`} className="block overflow-hidden rounded-2xl border border-line bg-surface p-2 transition hover:border-ink-300">
                <Postcard data={d} className="h-auto w-full" />
                <p className="px-1 pt-1.5 text-sm font-medium">{d.nameFr}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
