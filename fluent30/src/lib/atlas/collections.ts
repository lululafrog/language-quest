// Atlas — transversal collections: themes that cross destinations (seabeds, volcanoes, trains…).
// Defined by tags / English status over the catalogue and the written missions, never by hand lists.
import { CATALOG } from "./catalog";
import { playableDestinations } from "./engine";
import type { AtlasDestinationView } from "./legacy";
import type { AtlasMission, AtlasTag, AtlasVocab, CatalogEntry } from "./types";

export interface AtlasCollection {
  id: string;
  title: string; // French
  titleEn: string;
  desc: string; // French
  tags: AtlasTag[];
  /** special rule: English-speaking destinations (official / co-official English) */
  english?: boolean;
  icon: "globe" | "map" | "star" | "book" | "camera" | "heart" | "bolt" | "layers" | "compass" | "train" | "coffee";
}

export const COLLECTIONS: AtlasCollection[] = [
  { id: "seabeds", title: "Les plus beaux fonds marins", titleEn: "The finest seabeds", desc: "Récifs, plongées et vie marine : le vocabulaire de l'océan.", tags: ["diving", "ocean"], icon: "globe" },
  { id: "hikes", title: "Les grandes randonnées du monde", titleEn: "Great hikes", desc: "Sentiers, sommets, équipement et météo de montagne.", tags: ["hiking"], icon: "map" },
  { id: "snow", title: "Les aventures enneigées", titleEn: "Snowy adventures", desc: "Ski, froid, équipement d'hiver et paysages enneigés.", tags: ["snow"], icon: "star" },
  { id: "volcanoes", title: "Les volcans", titleEn: "Volcanoes", desc: "Décrire un volcan, comprendre un phénomène naturel.", tags: ["volcano"], icon: "bolt" },
  { id: "food", title: "Les cuisines du monde", titleEn: "World cuisines", desc: "Commander, comprendre un menu, parler goûts et recettes.", tags: ["food", "market"], icon: "heart" },
  { id: "wildlife", title: "Les animaux sauvages", titleEn: "Wildlife", desc: "Observer, décrire et protéger les animaux.", tags: ["wildlife"], icon: "camera" },
  { id: "music", title: "Les traditions musicales", titleEn: "Musical traditions", desc: "Instruments, concerts, goûts musicaux.", tags: ["music"], icon: "star" },
  { id: "capitals", title: "Les capitales", titleEn: "Capital cities", desc: "Transports, visites et vie urbaine dans les grandes capitales.", tags: ["capital", "city"], icon: "map" },
  { id: "civilisations", title: "Les grandes civilisations", titleEn: "Great civilisations", desc: "Archéologie, histoire et chronologies.", tags: ["civilisation", "history"], icon: "layers" },
  { id: "islands", title: "Les îles paradisiaques", titleEn: "Island escapes", desc: "Ferries, plages, lagons et vie insulaire.", tags: ["island"], icon: "globe" },
  { id: "adventure", title: "Les sports d'aventure", titleEn: "Adventure sports", desc: "Surf, plongée, parachute, randonnée : comprendre un briefing (exercice de langue, pas une formation).", tags: ["adventure-sport", "surf", "sport"], icon: "bolt" },
  { id: "architecture", title: "Les merveilles architecturales", titleEn: "Architectural wonders", desc: "Décrire un monument, comprendre une visite guidée.", tags: ["architecture"], icon: "layers" },
  { id: "literature", title: "Les livres et la littérature", titleEn: "Books and literature", desc: "Auteurs, lieux littéraires et lectures en VO.", tags: ["literature"], icon: "book" },
  { id: "coffee-tea", title: "Les cafés et thés du monde", titleEn: "Coffee and tea", desc: "Commander, comparer, parler des traditions du café et du thé.", tags: ["coffee-tea"], icon: "coffee" },
  { id: "trains", title: "Les trains emblématiques", titleEn: "Iconic trains", desc: "Billets, quais, annonces et longs voyages en train.", tags: ["train"], icon: "train" },
  { id: "english", title: "Les destinations anglophones", titleEn: "English-speaking destinations", desc: "Là où l'anglais est langue officielle : accents et expressions locales.", tags: [], english: true, icon: "compass" },
];

export function getCollection(id: string): AtlasCollection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

const isEnglish = (e: CatalogEntry) => e.english === "official" || e.english === "co-official";

export function entryInCollection(e: CatalogEntry, c: AtlasCollection): boolean {
  if (c.english) return isEnglish(e);
  return e.tags.some((t) => c.tags.includes(t));
}

/** Catalogue entries of a collection, written destinations first. */
export function collectionEntries(c: AtlasCollection): CatalogEntry[] {
  const rank = { complete: 0, preview: 1, coming: 2 } as const;
  return CATALOG.filter((e) => entryInCollection(e, c)).sort((a, b) => rank[a.content] - rank[b.content] || a.nameFr.localeCompare(b.nameFr, "fr"));
}

export interface CollectionMission {
  mission: AtlasMission;
  dest: AtlasDestinationView;
}

/** Playable missions matching the collection (by mission tags; English collection = all missions of English-speaking destinations). */
export function collectionMissions(c: AtlasCollection): CollectionMission[] {
  const out: CollectionMission[] = [];
  for (const d of playableDestinations()) {
    const entry = CATALOG.find((e) => e.id === d.id);
    for (const m of d.missions) {
      const ok = c.english ? !!entry && isEnglish(entry) : m.tags.some((t) => c.tags.includes(t));
      if (ok) out.push({ mission: m, dest: d });
    }
  }
  return out;
}

/** Vocabulary introduced by the collection's missions (deduplicated by English form). */
export function collectionVocab(c: AtlasCollection): (AtlasVocab & { destId: string })[] {
  const seen = new Set<string>();
  const out: (AtlasVocab & { destId: string })[] = [];
  for (const { mission, dest } of collectionMissions(c)) {
    for (const id of mission.vocab) {
      const v = dest.vocab.find((x) => x.id === id);
      if (!v) continue;
      const k = v.en.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ ...v, destId: dest.id });
    }
  }
  return out;
}
