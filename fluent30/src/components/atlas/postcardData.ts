// Builds the data drawn on a postcard from the saved row, the destination and the avatar.
import { getCatalog } from "@/lib/atlas/catalog";
import { atlasDestination } from "@/lib/atlas/engine";
import { hasLandscape } from "./Landscape";
import type { PostcardData } from "./Postcard";
import type { GameState, Postcard as PostcardRow } from "@/lib/types";

export function postcardData(row: PostcardRow, game: GameState | undefined, owned: Set<string>, message?: string): PostcardData | undefined {
  const entry = getCatalog(row.destId);
  if (!entry) return undefined;
  const dest = atlasDestination(row.destId);
  const souvenirs = (dest?.rewards ?? []).filter((r) => owned.has(r.id) && r.kind !== "stamp" && r.kind !== "postcard").map((r) => r.en);
  return {
    nameEn: entry.nameEn,
    nameFr: entry.nameFr,
    continent: entry.continent,
    motif: hasLandscape(entry.id) ? entry.id : dest?.landscape,
    palette: dest?.palette,
    message: message ?? row.corrected ?? row.message,
    date: row.validatedAt,
    skills: row.skills,
    souvenirs,
    band: row.band,
    equipped: game?.equipped,
    appearance: game?.appearance,
  };
}
