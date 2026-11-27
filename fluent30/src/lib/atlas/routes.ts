// Atlas — thematic journeys. A route is an ordered list of destinations; only written destinations
// are playable steps, the others are shown as future stops ("à venir"). No fixed order is imposed.
import { CATALOG } from "./catalog";
import type { AtlasTag, CatalogEntry, Continent } from "./types";

export type RouteId = "world-tour" | "continent" | "english" | "sport" | "food" | "culture" | "oceans" | "free";

export interface AtlasRoute {
  id: RouteId;
  title: string;
  desc: string;
  tags?: AtlasTag[];
}

export const ROUTES: AtlasRoute[] = [
  { id: "world-tour", title: "Tour du monde", desc: "D'ouest en est, en partant de Londres : un pays après l'autre." },
  { id: "continent", title: "Exploration d'un continent", desc: "Choisis un continent et parcours-le en entier." },
  { id: "english", title: "Destinations anglophones", desc: "Là où l'anglais est langue officielle : accents et expressions locales." },
  { id: "sport", title: "Voyage sportif", desc: "Surf, plongée, randonnée, ski… (exercices de langue, pas des formations sportives).", tags: ["surf", "diving", "hiking", "snow", "adventure-sport", "sport"] },
  { id: "food", title: "Tour du monde gastronomique", desc: "Marchés, restaurants, recettes et spécialités.", tags: ["food", "market"] },
  { id: "culture", title: "Aventure culturelle", desc: "Musées, architecture, musique, littérature et histoire.", tags: ["art", "architecture", "music", "literature", "history", "civilisation"] },
  { id: "oceans", title: "Découverte des océans", desc: "Îles, récifs, plongée et protection des océans.", tags: ["ocean", "diving", "island"] },
  { id: "free", title: "Destinations libres", desc: "Ton propre itinéraire : tes destinations favorites, dans l'ordre que tu veux." },
];

export const CONTINENT_LABEL: Record<Continent, string> = {
  europe: "Europe",
  asia: "Asie",
  africa: "Afrique",
  "north-america": "Amérique du Nord, centrale et Caraïbes",
  "south-america": "Amérique du Sud",
  oceania: "Océanie",
  antarctica: "Antarctique",
};

/** Stored as Settings.atlasRoute: "sport", or "continent:asia". */
export function parseRoute(v?: string): { id: RouteId; continent?: Continent } {
  if (!v) return { id: "world-tour" };
  const [id, c] = v.split(":");
  const r = ROUTES.find((x) => x.id === id);
  return r ? { id: r.id, continent: id === "continent" ? ((c as Continent) || "europe") : undefined } : { id: "world-tour" };
}

/** Eastward from the UK (longitude −2°), wrapping around the globe. */
function eastward(a: CatalogEntry, b: CatalogEntry) {
  const k = (e: CatalogEntry) => (e.lon + 2 + 360) % 360;
  return k(a) - k(b);
}

const playableFirst = (a: CatalogEntry, b: CatalogEntry) => Number(a.content === "coming") - Number(b.content === "coming");

export function routeEntries(route: { id: RouteId; continent?: Continent }, favorites: string[] = []): CatalogEntry[] {
  const r = ROUTES.find((x) => x.id === route.id)!;
  let list: CatalogEntry[];
  switch (route.id) {
    case "continent":
      list = CATALOG.filter((e) => e.continent === (route.continent ?? "europe")).sort(eastward);
      break;
    case "english":
      list = CATALOG.filter((e) => e.english === "official" || e.english === "co-official").sort(eastward);
      break;
    case "free":
      list = favorites.map((id) => CATALOG.find((e) => e.id === id)).filter((e): e is CatalogEntry => !!e);
      return list;
    case "world-tour":
      list = [...CATALOG].sort(eastward);
      break;
    default:
      list = CATALOG.filter((e) => e.tags.some((t) => r.tags!.includes(t))).sort(eastward);
  }
  // playable stops first (in route order), then the future stops
  return [...list].sort(playableFirst);
}

/** Next playable destination of the route that is not validated yet. */
export function nextRouteStop(entries: CatalogEntry[], validated: Set<string>): CatalogEntry | undefined {
  return entries.find((e) => e.content !== "coming" && !validated.has(e.id));
}
