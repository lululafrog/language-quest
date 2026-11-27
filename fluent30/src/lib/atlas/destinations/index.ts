// Registry of fully written destinations. Every other catalog entry is shown as "à venir".
import type { AtlasDestination, Mechanic } from "../types";
import { checkProduce } from "../select";
import { UK } from "./uk";
import { ITALY } from "./italy";
import { INDONESIA } from "./indonesia";
import { VIETNAM } from "./vietnam";
import { JAPAN } from "./japan";
import { AUSTRALIA } from "./australia";
import { USA } from "./usa";
import { NEWZEALAND } from "./new-zealand";
import { EGYPT } from "./egypt";
import { SOUTHAFRICA } from "./south-africa";

export const DESTINATIONS_CONTENT: AtlasDestination[] = [UK, INDONESIA, VIETNAM, JAPAN, AUSTRALIA, USA, ITALY, NEWZEALAND, EGYPT, SOUTHAFRICA].filter(
  (d): d is AtlasDestination => !!d,
).map(harmonise);

type Produce = Extract<Mechanic, { type: "produce" }>;

/**
 * Quality gate for free-production items: the authors' own model answers must always be accepted.
 * A required idea that a model answer does not contain is not really required (it is dropped), and the
 * minimum length never exceeds what the shortest model answer uses. We judge communication, not one wording.
 */
function relaxProduce(ex: Produce): Produce {
  if (!ex.samples.length) return ex;
  const shortest = Math.min(...ex.samples.map((x) => x.trim().split(/\s+/).length));
  let mustInclude = ex.mustInclude.filter((g) => ex.samples.every((smp) => checkProduce(smp, { mustInclude: [g], minWords: 0 }).ok));
  if (!mustInclude.length) mustInclude = ex.mustInclude.slice(0, 0);
  return { ...ex, mustInclude, minWords: Math.max(4, Math.min(ex.minWords, shortest - 1)) };
}

function harmonise(d: AtlasDestination): AtlasDestination {
  const fix = <T,>(e: T): T => ((e as { type?: string }).type === "produce" ? (relaxProduce(e as unknown as Produce) as unknown as T) : e);
  return {
    ...d,
    missions: d.missions.map((m) => ({ ...m, exercises: m.exercises.map(fix) })),
    final: {
      ...d.final,
      nodes: d.final.nodes.map((n) =>
        n.step.kind === "produce" ? { ...n, step: { ...n.step, exercise: relaxProduce(n.step.exercise) } } : n.step.kind === "exercise" ? { ...n, step: { ...n.step, exercise: fix(n.step.exercise) } } : n,
      ),
    },
  };
}

export function getDestinationContent(id: string): AtlasDestination | undefined {
  return DESTINATIONS_CONTENT.find((d) => d.id === id);
}
