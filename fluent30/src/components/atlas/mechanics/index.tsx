"use client";
// Dispatcher: country mechanics (Atlas) + every course exercise type (reused from the lesson player).
import type { AtlasExercise, Mechanic } from "@/lib/atlas/types";
import type { Exercise } from "@/lib/curriculum/types";
import { isMechanic } from "@/lib/atlas/select";
import { ExerciseView, exerciseLabel, type ExerciseOutcome } from "@/components/lesson/Exercises";
import { Assemble } from "./Assemble";
import { Steps } from "./Steps";
import { Decide } from "./Decide";
import { Bargain } from "./Bargain";
import { Investigate } from "./Investigate";
import { Identify } from "./Identify";
import { Produce } from "./Produce";

const MECH_LABEL: Record<Mechanic["type"], string> = {
  assemble: "Prépare la commande",
  steps: "Remets dans l'ordre",
  decide: "Lis et décide",
  bargain: "Négocie",
  investigate: "Enquête",
  identify: "Écoute et identifie",
  produce: "À toi de t'exprimer",
};

export function atlasExerciseLabel(ex: AtlasExercise): string {
  return isMechanic(ex) ? MECH_LABEL[(ex as Mechanic).type] : exerciseLabel(ex as Exercise);
}

export function AtlasExerciseView({ ex, accent, onDone }: { ex: AtlasExercise; accent?: string; onDone: (o: ExerciseOutcome) => void }) {
  switch (ex.type) {
    case "assemble":
      return <Assemble ex={ex} accent={accent} onDone={onDone} />;
    case "steps":
      return <Steps ex={ex} onDone={onDone} />;
    case "decide":
      return <Decide ex={ex} accent={accent} onDone={onDone} />;
    case "bargain":
      return <Bargain ex={ex} accent={accent} onDone={onDone} />;
    case "investigate":
      return <Investigate ex={ex} accent={accent} onDone={onDone} />;
    case "identify":
      return <Identify ex={ex} accent={accent} onDone={onDone} />;
    case "produce":
      return <Produce ex={ex} onDone={onDone} />;
    default:
      return <ExerciseView ex={ex as Exercise} onDone={onDone} />;
  }
}

export { MECH_LABEL };
