"use client";
// Thematic journeys: choose how to travel (world tour, a continent, English-speaking countries, sport…).
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { saveSettings } from "@/lib/db";
import { atlasOverview, STATE_LABEL } from "@/lib/atlas/ui-data";
import { CONTINENT_LABEL, nextRouteStop, parseRoute, routeEntries, ROUTES, type RouteId } from "@/lib/atlas/routes";
import type { Continent } from "@/lib/atlas/types";
import { Badge, LinkButton, PageHeader, Panel, SectionHeader, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

const CONTINENTS: Continent[] = ["europe", "asia", "africa", "north-america", "south-america", "oceania", "antarctica"];

export default function RoutesPage() {
  const data = useLiveQuery(() => atlasOverview(), []);
  if (!data) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
  const route = parseRoute(data.route);
  const entries = routeEntries(route, data.favorites);
  const byId = new Map(data.list.map((d) => [d.entry.id, d]));
  const validated = new Set(data.list.filter((d) => d.progress?.validated).map((d) => d.entry.id));
  const next = nextRouteStop(entries, validated);
  const playable = entries.filter((e) => byId.get(e.id)?.content !== "coming");
  const future = entries.filter((e) => byId.get(e.id)?.content === "coming");
  const choose = (id: RouteId, continent?: Continent) => void saveSettings({ atlasRoute: id === "continent" ? `continent:${continent ?? "europe"}` : id });

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <PageHeader title="Parcours" subtitle="Aucun ordre imposé : choisis une façon de voyager, ou va où tu veux depuis la carte." back="/world" />

      <div className="grid gap-2 sm:grid-cols-2">
        {ROUTES.map((r) => {
          const active = route.id === r.id;
          return (
            <button key={r.id} type="button" onClick={() => choose(r.id, route.continent)} aria-pressed={active} className={cx("rounded-2xl border p-3 text-left transition", active ? "border-ink-600 bg-ink-50 dark:bg-ink-900/40" : "border-line bg-surface hover:border-ink-300")}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.title}</span>
                {active && <Icon name="check" size={18} className="text-ink-600" />}
              </span>
              <span className="mt-0.5 block text-sm text-muted">{r.desc}</span>
            </button>
          );
        })}
      </div>

      {route.id === "continent" && (
        <div className="flex flex-wrap gap-1.5">
          {CONTINENTS.map((c) => (
            <button key={c} type="button" onClick={() => choose("continent", c)} aria-pressed={route.continent === c} className={cx("rounded-full border px-3 py-1 text-sm", route.continent === c ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface")}>
              {CONTINENT_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <Panel tone="highlight" className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Prochaine étape</p>
        {next ? (
          <>
            <p className="font-display text-lg font-semibold">{next.nameFr}</p>
            <LinkButton href={`/world/${next.id}`} className="w-full">Partir</LinkButton>
          </>
        ) : route.id === "free" && !entries.length ? (
          <p className="text-sm">Ajoute des destinations à tes favoris (bouton cœur sur chaque destination) pour construire ton itinéraire.</p>
        ) : (
          <p className="text-sm">Toutes les étapes jouables de ce parcours sont validées. Les prochaines destinations arrivent progressivement.</p>
        )}
      </Panel>

      {playable.length > 0 && (
        <section>
          <SectionHeader title="Étapes jouables" subtitle={`${playable.length} destination${playable.length > 1 ? "s" : ""}`} />
          <ol className="space-y-2">
            {playable.map((e, i) => {
              const d = byId.get(e.id)!;
              return (
                <li key={e.id}>
                  <Link href={`/world/${e.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
                    <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold", d.state === "validated" ? "bg-mint-600 text-white" : "bg-surface-2")}>
                      {d.state === "validated" ? <Icon name="check" size={16} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">{e.nameFr}</span>
                    <Badge tone={d.state === "validated" ? "mint" : d.state === "progress" ? "coral" : "ink"}>{STATE_LABEL[d.state]}</Badge>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {future.length > 0 && (
        <section>
          <SectionHeader title="Étapes à venir" subtitle="Destinations dont le contenu est en préparation" />
          <p className="text-sm leading-relaxed text-muted">{future.map((e) => e.nameFr).join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
