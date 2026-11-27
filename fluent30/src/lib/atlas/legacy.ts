// Atlas — compatibility with the first world map (6 cities, 26 missions).
// Old mission ids stay valid: progress recorded under them still counts, old URLs still open,
// and Toronto's missions become a clearly labelled "preview" of Canada.
import { WORLD, type Mission, type WorldDestination } from "../data/world";
import type { AtlasDestination, AtlasExercise, AtlasMission } from "./types";

/** Old city destination id → Atlas destination id. */
export const LEGACY_DEST: Record<string, string> = {
  london: "uk",
  "new-york": "usa",
  bali: "indonesia",
  sydney: "australia",
  tokyo: "japan",
  toronto: "canada",
};

export type AtlasDestinationView = AtlasDestination & { preview?: boolean };

/** Convert an old mission to the Atlas format (exercises are already course-type exercises). */
export function convertLegacyMission(m: Mission, destId: string, order: number): AtlasMission {
  return {
    id: m.id,
    order,
    title: m.title,
    titleEn: m.titleEn,
    place: m.place,
    minutes: m.minutes,
    briefing: m.briefing,
    objectives: { [m.level]: m.goal },
    grammar: [],
    phrases: m.phrases,
    vocab: [],
    exercises: m.exercises as AtlasExercise[],
    tags: [],
    lesson: m.lesson,
    scenario: m.scenario,
    legacyId: m.id,
  };
}

function previewFrom(d: WorldDestination, id: string): AtlasDestinationView {
  return {
    id,
    preview: true,
    tagline: d.tagline,
    intro: `Aperçu : ${d.missions.length} missions jouables à ${d.nameFr}. La destination complète (10 missions, mission finale, récompenses) est en préparation.`,
    palette: { sky: d.palette.sky, land: d.palette.ground, sea: "#8DB8C9", accent: d.palette.accent, ink: d.palette.ink },
    landscape: "city",
    places: d.missions.map((m) => ({ id: m.place, name: m.placeName, kind: m.place, fr: m.goal })),
    characters: d.characters.map((c, i) => ({ id: `${id}-c${i}`, name: c.name, role: c.role, origin: "local", personality: c.personality, register: c.register, accent: d.accent, hello: c.hello })),
    culture: [],
    food: [],
    vocab: [],
    expressions: [],
    missions: d.missions.map((m, i) => convertLegacyMission(m, id, i + 1)),
    final: { id: `${id}-final`, title: "Mission finale (à venir)", titleEn: "Final mission (coming soon)", intro: "", start: "", nodes: [], skills: [] },
    rewards: [],
    postcardLine: "",
    sources: [],
    review: { linguistic: "auto-checked", cultural: "auto-checked", updated: "2026-11" },
  };
}

/** Previews built from the old cities, by Atlas destination id. Canada always uses its preview;
 *  the other ones are only used if the full destination content is missing. */
export const LEGACY_PREVIEWS = new Map<string, AtlasDestinationView>(WORLD.map((d) => [LEGACY_DEST[d.id] ?? d.id, previewFrom(d, LEGACY_DEST[d.id] ?? d.id)]));
export const CANADA_PREVIEW: AtlasDestinationView | undefined = LEGACY_PREVIEWS.get("canada");

/** Old mission id → { mission converted, Atlas destination id }. */
const LEGACY_MISSIONS = new Map<string, { mission: AtlasMission; destId: string }>(
  WORLD.flatMap((d) => d.missions.map((m, i) => [m.id, { mission: convertLegacyMission(m, LEGACY_DEST[d.id] ?? d.id, i + 1), destId: LEGACY_DEST[d.id] ?? d.id }] as const)),
);

export function legacyMission(id: string): { mission: AtlasMission; destId: string } | undefined {
  return LEGACY_MISSIONS.get(id);
}

/** Every legacy mission id with its Atlas destination (used to attribute old progress). */
export function legacyMissionDest(): Map<string, string> {
  return new Map([...LEGACY_MISSIONS].map(([id, v]) => [id, v.destId]));
}
