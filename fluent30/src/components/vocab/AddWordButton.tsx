"use client";
// "+" button to add a word or phrase met anywhere (mission, lesson…) to the learner's vocabulary.
// The word is classified automatically (universe, sub-theme, level, category) and deduplicated.
import { useState } from "react";
import { cx, toast } from "@/components/ui";
import { quickAdd } from "@/lib/cards";
import type { Card } from "@/lib/types";

export function AddWordButton({ en, fr, source, example, className }: { en: string; fr?: string; source: Card["source"]; example?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  async function add() {
    if (state !== "idle") return;
    setState("busy");
    try {
      const r = await quickAdd(en, { fr, source, example });
      setState("done");
      toast(r.merged ? "Déjà dans ton vocabulaire : remis en révision." : "Ajouté à ton vocabulaire.");
    } catch {
      setState("idle");
      toast("Impossible d'ajouter ce mot pour l'instant.", "err");
    }
  }
  return (
    <button
      type="button"
      onClick={add}
      aria-label={state === "done" ? `${en} : dans ton vocabulaire` : `Ajouter « ${en} » à mon vocabulaire`}
      className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base transition active:scale-95", state === "done" ? "border-mint-400 bg-mint-100 text-mint-700 dark:bg-mint-600/20" : "border-line text-muted hover:border-ink-300 hover:text-fg", className)}
    >
      {state === "done" ? "✓" : state === "busy" ? "…" : "+"}
    </button>
  );
}
