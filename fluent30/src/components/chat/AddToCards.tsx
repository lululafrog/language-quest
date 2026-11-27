"use client";
import { useState } from "react";
import { quickAdd } from "@/lib/cards";
import { errorMessage } from "@/lib/api";
import type { CardSource } from "@/lib/types";
import { Button, SpeakButton, cx, toast } from "@/components/ui";
import { useT } from "@/hooks/useT";

export interface AddItem {
  term: string;
  fr: string;
  example?: string;
  note?: string;
}

/** Checklist of words/expressions with a button to add the selected ones to the flashcards. */
export function AddToCards({ items, source, context, defaultChecked = true }: { items: AddItem[]; source: CardSource; context?: string; defaultChecked?: boolean }) {
  const t = useT();
  const [checked, setChecked] = useState<Set<number>>(() => new Set(defaultChecked ? items.map((_, i) => i) : []));
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!items.length) return null;

  async function addSelected() {
    const idx = [...checked].filter((i) => !added.has(i));
    if (!idx.length) return;
    setBusy(true);
    setProgress(0);
    let ok = 0;
    let merged = 0;
    for (const i of idx) {
      const it = items[i];
      try {
        const r = await quickAdd(it.term, { fr: it.fr, source, context: it.example ?? context, example: it.example });
        if (r.merged) merged++;
        else ok++;
        setAdded((s) => new Set(s).add(i));
      } catch (e) {
        toast(`${it.term} : ${errorMessage(e)}`, "err");
      }
      setProgress((p) => p + 1);
    }
    setBusy(false);
    toast(t(`${ok} ajouté(s) aux flashcards${merged ? `, ${merged} déjà présent(s)` : ""}`, `${ok} added to flashcards${merged ? `, ${merged} already there` : ""}`));
  }

  const remaining = [...checked].filter((i) => !added.has(i)).length;
  return (
    <div>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-3 px-3 py-2.5">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-ink-600"
              checked={checked.has(i) || added.has(i)}
              disabled={added.has(i)}
              onChange={(e) => setChecked((s) => {
                const n = new Set(s);
                if (e.target.checked) n.add(i);
                else n.delete(i);
                return n;
              })}
              aria-label={it.term}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className={cx("font-medium", added.has(i) && "text-mint-600")}>{it.term}</span>
                <span className="text-sm text-muted">— {it.fr}</span>
                {added.has(i) && <span className="text-xs text-mint-600">✓ {t("ajouté", "added")}</span>}
              </div>
              {it.example && <p className="mt-0.5 text-sm italic text-muted">{it.example}</p>}
              {it.note && <p className="mt-0.5 text-xs text-muted">{it.note}</p>}
            </div>
            <SpeakButton text={it.term} size={16} className="-my-1" />
          </li>
        ))}
      </ul>
      <Button className="mt-3 w-full sm:w-auto" onClick={addSelected} loading={busy} disabled={!remaining}>
        {busy ? t(`Ajout… ${progress}/${[...checked].length}`, `Adding… ${progress}`) : remaining ? t(`Ajouter ${remaining} aux flashcards`, `Add ${remaining} to flashcards`) : t("Tout est ajouté ✓", "All added ✓")}
      </Button>
    </div>
  );
}
