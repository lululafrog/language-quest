"use client";
// Atlas UI data: one call that joins the catalogue, written content and the learner's progress.
import { getDb, getSettings } from "../db";
import { CATALOG, getCatalog } from "./catalog";
import { allAtlasProgress, atlasDestination, learnerBand, type DestinationProgress } from "./progress";
import type { AtlasDestinationView } from "./legacy";
import type { AtlasTag, Band, CatalogEntry, ContentStatus } from "./types";
import type { PinState } from "@/components/atlas/WorldMap";

export interface DestSummary {
  entry: CatalogEntry;
  /** content actually available (complete destination, or clearly labelled preview) */
  content: ContentStatus;
  progress?: DestinationProgress;
  state: PinState;
  favorite: boolean;
}

export interface AtlasOverview {
  list: DestSummary[];
  favorites: string[];
  interests: string[];
  route?: string;
  homeDestination?: string;
  band: Band;
}

/** Effective content status: the catalogue says what is planned, the registry what is really written. */
export function effectiveContent(entry: CatalogEntry): ContentStatus {
  const d = atlasDestination(entry.id);
  if (!d) return "coming";
  return d.preview ? "preview" : "complete";
}

export function pinState(content: ContentStatus, p?: DestinationProgress): PinState {
  if (content === "coming") return "coming";
  if (p?.validated) return "validated";
  if (p?.started) return "progress";
  return "available";
}

export async function atlasOverview(): Promise<AtlasOverview> {
  const [s, progress, band] = await Promise.all([getSettings(), allAtlasProgress(), learnerBand()]);
  const favorites = s.atlasFavorites ?? [];
  const list = CATALOG.map((entry) => {
    const content = effectiveContent(entry);
    const p = progress.get(entry.id);
    return { entry, content, progress: p, state: pinState(content, p), favorite: favorites.includes(entry.id) };
  });
  return { list, favorites, interests: s.interests ?? [], route: s.atlasRoute, homeDestination: s.homeDestination, band };
}

/** First regular mission not done yet (or the final story when all are done). */
export async function nextMissionOf(destId: string): Promise<{ id: string; title: string; final: boolean; href: string } | undefined> {
  const d = atlasDestination(destId);
  if (!d) return undefined;
  const rows = await getDb().missions.toArray();
  const done = new Set(rows.filter((r) => r.status === "done").map((r) => r.id));
  const m = [...d.missions].sort((a, b) => a.order - b.order).find((x) => !done.has(x.id) && !(x.legacyId && done.has(x.legacyId)));
  if (m) return { id: m.id, title: m.title, final: false, href: `/world/mission/${m.id}` };
  if (!d.preview && d.final.nodes.length && !done.has(d.final.id)) return { id: d.final.id, title: d.final.title, final: true, href: `/world/final/${d.id}` };
  return undefined;
}

export function destinationView(id: string): { entry?: CatalogEntry; dest?: AtlasDestinationView } {
  return { entry: getCatalog(id), dest: atlasDestination(id) };
}

/** Learner interests (theme ids from the vocabulary themes) → Atlas tags. */
const INTEREST_TAGS: Record<string, AtlasTag[]> = {
  sport: ["sport", "surf", "adventure-sport", "hiking", "snow"],
  adventure: ["adventure-sport", "hiking", "volcano", "diving", "surf"],
  beach: ["island", "ocean", "surf", "diving"],
  animals: ["wildlife"],
  nature: ["nature", "hiking", "volcano", "wildlife"],
  food: ["food", "market"],
  cooking: ["food"],
  restaurant: ["food"],
  music: ["music", "festival"],
  movies: ["film"],
  books: ["literature"],
  art: ["art", "architecture"],
  travel: ["city", "capital", "train"],
  transport: ["train"],
  city: ["city", "capital", "architecture"],
  work: ["business"],
  tech: ["science", "business"],
  party: ["festival", "music"],
  dating: ["city"],
  relationships: ["city"],
  shopping: ["market", "fashion"],
  clothes: ["fashion"],
  crime: ["literature"],
};

export function interestTags(interests: string[]): AtlasTag[] {
  return [...new Set(interests.flatMap((i) => INTEREST_TAGS[i] ?? []))];
}

export const TAG_LABEL: Record<AtlasTag, string> = {
  diving: "Plongée", surf: "Surf", hiking: "Randonnée", snow: "Neige", volcano: "Volcans", food: "Gastronomie", wildlife: "Faune",
  music: "Musique", capital: "Capitales", civilisation: "Civilisations", island: "Îles", "adventure-sport": "Sports d'aventure",
  architecture: "Architecture", literature: "Littérature", "coffee-tea": "Café & thé", train: "Trains", art: "Art", history: "Histoire",
  nature: "Nature", city: "Villes", ocean: "Océans", desert: "Déserts", market: "Marchés", festival: "Fêtes", science: "Sciences",
  business: "Travail", film: "Cinéma", fashion: "Mode", sport: "Sport",
};

export const ENGLISH_LABEL: Record<CatalogEntry["english"], string> = {
  official: "Anglais langue officielle",
  "co-official": "Anglais langue co-officielle",
  "widely-used": "Anglais très répandu",
  foreign: "Anglais : langue internationale de voyage",
};

export const STATUS_LABEL: Record<CatalogEntry["status"], string> = {
  sovereign: "État membre de l'ONU",
  observer: "État observateur à l'ONU",
  "partially-recognised": "Reconnaissance internationale partielle",
  sar: "Région administrative spéciale",
  territory: "Territoire",
  region: "Région internationale",
};

export const STATE_LABEL: Record<PinState, string> = {
  validated: "Validée",
  progress: "En cours",
  available: "Disponible",
  coming: "À venir",
};
