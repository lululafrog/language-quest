"use client";
// Explore the World: interactive map of every destination, filters, a single recommended next step.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { atlasOverview, interestTags, nextMissionOf, ENGLISH_LABEL, STATE_LABEL, TAG_LABEL, type DestSummary } from "@/lib/atlas/ui-data";
import { COLLECTIONS, entryInCollection, getCollection } from "@/lib/atlas/collections";
import { CONTINENT_LABEL, nextRouteStop, parseRoute, routeEntries, ROUTES } from "@/lib/atlas/routes";
import type { AtlasTag, Continent } from "@/lib/atlas/types";
import { WorldMap, type PinState } from "@/components/atlas/WorldMap";
import { Landscape } from "@/components/atlas/Landscape";
import { Badge, Button, FilterChips, LinkButton, Metric, PageHeader, Panel, ProgressBar, SectionHeader, Sheet, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

type ProgressFilter = "all" | "not-started" | "progress" | "validated";
const CONTINENTS: Continent[] = ["europe", "asia", "africa", "north-america", "south-america", "oceania", "antarctica"];
const TAGS: AtlasTag[] = ["diving", "surf", "hiking", "snow", "volcano", "food", "wildlife", "music", "architecture", "history", "literature", "coffee-tea", "train", "island", "city", "nature"];

const STATE_TONE: Record<PinState, "mint" | "coral" | "ink" | "gray"> = { validated: "mint", progress: "coral", available: "ink", coming: "gray" };

export default function WorldPage() {
  const data = useLiveQuery(() => atlasOverview(), []);
  const [view, setView] = useState<Continent | "world">("world");
  const [sel, setSel] = useState<string | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tags, setTags] = useState<AtlasTag[]>([]);
  const [english, setEnglish] = useState(false);
  const [prog, setProg] = useState<ProgressFilter>("all");
  const [collection, setCollection] = useState("");
  const [available, setAvailable] = useState(false);
  const [favs, setFavs] = useState(false);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const upd = () => setWidth(Math.min(window.innerWidth - 32, 768));
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return new Set<string>();
    const col = collection ? getCollection(collection) : undefined;
    return new Set(
      data.list
        .filter((d) => (view === "world" ? true : d.entry.continent === view))
        .filter((d) => !tags.length || d.entry.tags.some((t) => tags.includes(t)))
        .filter((d) => !english || d.entry.english === "official" || d.entry.english === "co-official")
        .filter((d) => prog === "all" || (prog === "validated" ? d.state === "validated" : prog === "progress" ? d.state === "progress" : d.state === "available" || d.state === "coming"))
        .filter((d) => !col || entryInCollection(d.entry, col))
        .filter((d) => !available || d.content !== "coming")
        .filter((d) => !favs || d.favorite)
        .map((d) => d.entry.id),
    );
  }, [data, view, tags, english, prog, collection, available, favs]);

  const recommended = useMemo(() => {
    if (!data) return undefined;
    const validated = new Set(data.list.filter((d) => d.progress?.validated).map((d) => d.entry.id));
    const route = parseRoute(data.route);
    const byId = new Map(data.list.map((d) => [d.entry.id, d]));
    const inProgress = data.list.find((d) => d.state === "progress");
    const stop = nextRouteStop(routeEntries(route, data.favorites), validated);
    const fromInterests = data.list.find((d) => d.content !== "coming" && !d.progress?.validated && d.entry.tags.some((t) => interestTags(data.interests).includes(t)));
    const home = data.homeDestination ? byId.get(data.homeDestination === "london" ? "uk" : data.homeDestination) : undefined;
    const pick = inProgress ?? (stop && byId.get(stop.id)) ?? fromInterests ?? home ?? data.list.find((d) => d.content !== "coming");
    if (!pick) return undefined;
    const why = pick === inProgress ? "Tu as commencé cette destination" : stop && pick.entry.id === stop.id ? `Parcours : ${ROUTES.find((r) => r.id === route.id)?.title}` : pick === fromInterests ? "D'après tes centres d'intérêt" : "Ta destination de départ";
    return { d: pick, why };
  }, [data]);

  const nextMission = useLiveQuery(async () => (recommended ? (await nextMissionOf(recommended.d.entry.id)) ?? null : null), [recommended?.d.entry.id]);

  if (!data) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;

  const current = sel ? data.list.find((d) => d.entry.id === sel) : undefined;
  const playable = data.list.filter((d) => d.content !== "coming");
  const validatedCount = data.list.filter((d) => d.state === "validated").length;
  const missionsDone = playable.reduce((a, d) => a + (d.progress?.done ?? 0) + (d.progress?.finalDone ? 1 : 0), 0);
  const activeFilters = tags.length + Number(english) + Number(prog !== "all") + Number(!!collection) + Number(available) + Number(favs);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Explorer le monde" subtitle={`${data.list.length} destinations sur la carte · ${playable.length} déjà jouables, les autres arrivent progressivement.`} back="/profile" />

      {recommended && (
        <Panel tone="highlight" className="flex items-center gap-4">
          <div className="hidden w-28 shrink-0 overflow-hidden rounded-2xl sm:block">
            <Landscape motif={recommended.d.entry.id} continent={recommended.d.entry.continent} title={recommended.d.entry.nameFr} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Activité recommandée · {recommended.why}</p>
            <p className="font-display text-lg font-semibold">{nextMission ? nextMission.title : recommended.d.entry.nameFr}</p>
            <p className="text-sm text-muted">{recommended.d.entry.nameFr}{recommended.d.progress ? ` · ${recommended.d.progress.done}/${recommended.d.progress.total} missions` : ""}</p>
            <LinkButton href={nextMission ? nextMission.href : `/world/${recommended.d.entry.id}`} size="sm" className="mt-2">
              {nextMission ? "Commencer la mission" : "Voir la destination"}
            </LinkButton>
          </div>
        </Panel>
      )}

      <div className="space-y-2">
        <FilterChips<Continent | "world">
          value={view}
          onChange={(v) => setView(v)}
          options={[{ value: "world", label: "Monde" }, ...CONTINENTS.map((c) => ({ value: c, label: CONTINENT_LABEL[c].split(",")[0] }))]}
        />
        <div className="overflow-hidden rounded-3xl border border-line card-shadow">
          <WorldMap
            view={view}
            screenWidth={width}
            selected={sel}
            onPick={setSel}
            pins={data.list.map((d) => ({ id: d.entry.id, lon: d.entry.lon, lat: d.entry.lat, label: d.entry.nameFr, state: d.state, dim: !filtered.has(d.entry.id) }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {(["validated", "progress", "available", "coming"] as PinState[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={cx("h-2.5 w-2.5 rounded-full", s === "validated" ? "bg-mint-600" : s === "progress" ? "bg-coral-500" : s === "available" ? "bg-ink-600" : "bg-[#B9AE98]")} />
              {STATE_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Metric value={validatedCount} label="validées" />
        <Metric value={missionsDone} label="missions" />
        <Metric value={playable.length} label="jouables" />
        <Metric value={data.band} label="ton niveau" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <LinkButton href="/world/routes" variant="secondary" size="sm"><Icon name="path" size={16} /> Parcours</LinkButton>
        <LinkButton href="/world/collections" variant="secondary" size="sm"><Icon name="layers" size={16} /> Collections</LinkButton>
        <LinkButton href="/world/postcards" variant="secondary" size="sm"><Icon name="postcard" size={16} /> Cartes</LinkButton>
      </div>

      <Panel tone="subtle" className="space-y-3">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
          <span className="font-semibold">Filtres{activeFilters ? ` · ${activeFilters} actif${activeFilters > 1 ? "s" : ""}` : ""}</span>
          <Icon name="chevron" size={16} className={cx("text-muted transition", filtersOpen && "rotate-90")} />
        </button>
        {filtersOpen && (
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Centres d&apos;intérêt et compétences</p>
              <div className="flex flex-wrap gap-1.5">
                {interestTags(data.interests).length > 0 && (
                  <button type="button" onClick={() => setTags(interestTags(data.interests))} className="rounded-full border border-ink-300 px-3 py-1 text-sm font-medium text-ink-700 dark:text-ink-300">
                    Mes intérêts
                  </button>
                )}
                {TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tags.includes(t)}
                    onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                    className={cx("rounded-full border px-3 py-1 text-sm", tags.includes(t) ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface")}
                  >
                    {TAG_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Progression</p>
              <FilterChips<ProgressFilter> value={prog} onChange={setProg} options={[{ value: "all", label: "Toutes" }, { value: "not-started", label: "Non commencées" }, { value: "progress", label: "En cours" }, { value: "validated", label: "Validées" }]} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Collection</p>
              <select value={collection} onChange={(e) => setCollection(e.target.value)} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                <option value="">Toutes les collections</option>
                {COLLECTIONS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { on: english, set: setEnglish, label: "Destinations anglophones" },
                { on: available, set: setAvailable, label: "Missions disponibles" },
                { on: favs, set: setFavs, label: "Favoris" },
              ].map((f) => (
                <button key={f.label} type="button" aria-pressed={f.on} onClick={() => f.set(!f.on)} className={cx("rounded-full border px-3 py-1 text-sm", f.on ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface")}>
                  {f.label}
                </button>
              ))}
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setTags([]); setEnglish(false); setProg("all"); setCollection(""); setAvailable(false); setFavs(false); }}>
                Effacer les filtres
              </Button>
            )}
          </div>
        )}
      </Panel>

      <SectionHeader title="Destinations" subtitle={`${filtered.size} affichée${filtered.size > 1 ? "s" : ""}`} />
      <div className="space-y-2">
        {CONTINENTS.map((c) => {
          const items = data.list.filter((d) => d.entry.continent === c && filtered.has(d.entry.id)).sort(sortSummary);
          if (!items.length) return null;
          const ready = items.filter((d) => d.content !== "coming").length;
          return (
            <details key={c} className="group rounded-2xl border border-line bg-surface" open={view === c}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span className="font-semibold">{CONTINENT_LABEL[c]}</span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  {ready > 0 && <Badge tone="ink">{ready} jouable{ready > 1 ? "s" : ""}</Badge>}
                  {items.length}
                  <Icon name="chevron" size={14} className="transition group-open:rotate-90" />
                </span>
              </summary>
              <ul className="divide-y divide-line border-t border-line">
                {items.map((d) => (
                  <li key={d.entry.id}>
                    <Link href={`/world/${d.entry.id}`} className={cx("flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2", d.content === "coming" && "opacity-75")}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">
                          {d.entry.nameFr}
                          {d.favorite && <Icon name="heart" size={13} className="ml-1 inline text-coral-500" />}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {d.content === "coming" ? d.entry.themes.slice(0, 2).join(" · ") : `${d.progress?.done ?? 0}/${d.progress?.total ?? 0} missions${d.content === "preview" ? " · aperçu" : ""}`}
                        </span>
                      </span>
                      <Badge tone={STATE_TONE[d.state]}>{STATE_LABEL[d.state]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        {filtered.size === 0 && <p className="rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">Aucune destination ne correspond à ces filtres.</p>}
      </div>

      <Sheet open={!!current} onClose={() => setSel(undefined)} title={current?.entry.nameFr}>
        {current && <PinSheet d={current} />}
      </Sheet>
    </div>
  );
}

function sortSummary(a: DestSummary, b: DestSummary) {
  const r = { progress: 0, available: 1, validated: 2, coming: 3 } as const;
  return r[a.state] - r[b.state] || a.entry.nameFr.localeCompare(b.entry.nameFr, "fr");
}

function PinSheet({ d }: { d: DestSummary }) {
  const p = d.progress;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl">
        <Landscape motif={d.entry.id} continent={d.entry.continent} title={d.entry.nameFr} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={STATE_TONE[d.state]}>{STATE_LABEL[d.state]}</Badge>
        <Badge tone="gray">{ENGLISH_LABEL[d.entry.english]}</Badge>
        {d.content === "preview" && <Badge tone="sun">Aperçu</Badge>}
      </div>
      <p className="text-sm text-muted">
        Capitale : {d.entry.capital} · Langue{d.entry.languages.length > 1 ? "s" : ""} : {d.entry.languages.join(", ")}
      </p>
      {d.entry.virtualOnly && <p className="rounded-xl bg-sun-100/60 p-2.5 text-sm dark:bg-sun-500/10">Expérience virtuelle éducative uniquement — {d.entry.virtualNote ?? "aucune incitation à s'y rendre."}</p>}
      {p && d.content !== "coming" ? (
        <>
          <ProgressBar value={p.done + (p.finalDone ? 1 : 0)} max={p.total + 1} tone="mint" />
          <p className="text-xs text-muted">{p.done}/{p.total} missions{p.finalDone ? " · mission finale réussie" : ""}{p.bestBand ? ` · validée au niveau ${p.bestBand}` : ""}</p>
        </>
      ) : (
        <p className="text-sm">Destination à venir. Thèmes prévus : {d.entry.themes.join(", ")}.</p>
      )}
      <LinkButton href={`/world/${d.entry.id}`} className="w-full">
        {d.content === "coming" ? "Voir la fiche" : d.state === "available" ? `Partir pour : ${d.entry.nameFr}` : "Ouvrir la destination"}
      </LinkButton>
    </div>
  );
}
