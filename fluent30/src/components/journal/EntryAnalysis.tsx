"use client";
// Three versions of an entry (original / corrected / natural), explanations, course links and expressions to keep.
import Link from "next/link";
import { useState } from "react";
import { ApiError, errorMessage } from "@/lib/api";
import { analyseEntry, keepExpressions, type JournalAnalysis } from "@/lib/journal";
import { courseForTag } from "@/lib/connect";
import { useSettings } from "@/hooks/useSettings";
import { usePersonalAiConsent } from "@/components/privacy/ConsentDialog";
import { Button, ErrorNote, FilterChips, Panel, ServiceNotice, SpeakButton, toast } from "@/components/ui";
import { Icon } from "@/components/icons";
import { WordDiff } from "./WordDiff";
import type { JournalEntry } from "@/lib/types";

export const TAG_FR: Record<string, string> = {
  "present-simple": "Present simple",
  "present-continuous": "Present continuous",
  "past-simple": "Prétérit",
  "present-perfect": "Present perfect",
  future: "Futur",
  questions: "Questions",
  negatives: "Négation",
  articles: "Articles",
  prepositions: "Prépositions",
  plurals: "Pluriels",
  "word-order": "Ordre des mots",
  modals: "Modaux",
  conditionals: "Conditionnel",
  "irregular-verbs": "Verbes irréguliers",
  "phrasal-verbs": "Phrasal verbs",
  "false-friends": "Faux amis",
  spelling: "Orthographe",
  vocabulary: "Vocabulaire",
  other: "Autre",
};

type View = "original" | "corrected" | "natural";

export function EntryAnalysis({ entry }: { entry: JournalEntry }) {
  const s = useSettings();
  const consent = usePersonalAiConsent();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; nc?: boolean } | null>(null);
  const [fresh, setFresh] = useState<JournalAnalysis | null>(null);
  const [view, setView] = useState<View>("natural");
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const v = entry.versions;

  const run = async () => {
    setError(null);
    if (!(await consent.ask())) return;
    setBusy(true);
    try {
      const a = await analyseEntry(entry, s.pathLevel ?? "A2");
      setFresh(a);
      setPicked(new Set(a.expressions.map((_, i) => i)));
    } catch (e) {
      setError({ msg: errorMessage(e), nc: e instanceof ApiError && e.notConfigured });
    } finally {
      setBusy(false);
    }
  };

  // expressions suggested by the last analysis (kept in the entry, so they survive a reload)
  const exprs = fresh ? fresh.expressions : (v?.pending ?? []);
  const keep = async () => {
    setSaving(true);
    const items = exprs.filter((_, i) => picked.has(i));
    await keepExpressions(entry, items, (fresh?.natural ?? v?.natural ?? "").slice(0, 200));
    toast(`${items.length} expression${items.length > 1 ? "s" : ""} ajoutée${items.length > 1 ? "s" : ""} à tes cartes`);
    setPicked(new Set());
    if (fresh) setFresh({ ...fresh, expressions: fresh.expressions.filter((_, i) => !picked.has(i)) });
    setSaving(false);
  };

  if (!entry.text.trim()) return null;

  if (!v) {
    return (
      <Panel className="space-y-3">
        {consent.dialog}
        <p className="text-[15px]">Obtiens une version corrigée et une version plus naturelle, avec les explications.</p>
        <Button className="w-full" onClick={run} loading={busy}>
          <Icon name="sparkle" size={18} /> Corriger et améliorer
        </Button>
        {error && (error.nc ? <ServiceNotice service="La correction du journal" alternative="Ta page est bien enregistrée : tu pourras lancer la correction plus tard." /> : <ErrorNote>{error.msg}</ErrorNote>)}
      </Panel>
    );
  }

  const errors = v.notes.filter((n) => n.tag);
  const style = v.notes.filter((n) => !n.tag);
  const tags = [...new Set(errors.map((n) => n.tag!))];

  return (
    <div className="space-y-4">
      {consent.dialog}
      {fresh?.encouragement && <p className="rounded-2xl bg-mint-500/10 px-4 py-3 text-[15px]">{fresh.encouragement}</p>}

      <Panel className="space-y-3">
        <FilterChips
          value={view}
          onChange={setView}
          options={[
            { value: "original", label: "Ma version" },
            { value: "corrected", label: "Corrigée" },
            { value: "natural", label: "Naturelle" },
          ]}
        />
        {view === "original" && <p className="whitespace-pre-wrap text-[15.5px] leading-relaxed">{entry.text}</p>}
        {view === "corrected" && <WordDiff from={entry.text} to={v.corrected} />}
        {view === "natural" && (
          <div className="flex items-start gap-1">
            <p className="flex-1 whitespace-pre-wrap text-[15.5px] leading-relaxed">{v.natural}</p>
            <SpeakButton text={v.natural} className="shrink-0" />
          </div>
        )}
        <p className="text-[12.5px] text-muted">
          {view === "corrected" ? "Barré : ce que tu as écrit · surligné : la correction." : view === "natural" ? "Comment un anglophone le dirait spontanément." : "Ton texte, tel que tu l'as écrit."}
        </p>
      </Panel>

      {errors.length > 0 && (
        <Panel className="space-y-3">
          <h3 className="font-semibold">Erreurs à retenir</h3>
          <ul className="space-y-2.5">
            {errors.map((n, i) => (
              <li key={i} className="text-[14.5px]">
                <p>
                  <del className="text-coral-600 dark:text-coral-400">{n.from}</del> → <strong className="text-mint-600 dark:text-mint-400">{n.to}</strong>
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{TAG_FR[n.tag!] ?? n.tag}</span>
                </p>
                <p className="text-muted">{n.why}</p>
              </li>
            ))}
          </ul>
          {tags.map((t) => {
            const c = courseForTag(t);
            return c ? (
              <Link key={t} href={c.href} className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2.5 text-sm font-medium hover:border-ink-300">
                <Icon name="course" size={16} className="text-ink-600" /> Revoir le cours : {c.title}
                <Icon name="chevron" size={16} className="ml-auto text-muted" />
              </Link>
            ) : null;
          })}
        </Panel>
      )}

      {style.length > 0 && (
        <Panel className="space-y-3">
          <h3 className="font-semibold">Pour sonner plus naturel</h3>
          <ul className="space-y-2.5">
            {style.map((n, i) => (
              <li key={i} className="text-[14.5px]">
                <p>
                  <span className="text-muted">{n.from}</span> → <strong>{n.to}</strong>
                </p>
                <p className="text-muted">{n.why}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {exprs.length > 0 && (
        <Panel className="space-y-2">
          <h3 className="font-semibold">Expressions à garder</h3>
          {exprs.map((x, i) => (
            <label key={i} className="flex items-start gap-3 rounded-2xl border border-line px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-ink-600)]"
                checked={picked.has(i)}
                onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(i); else n.delete(i); return n; })}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{x.en}</span>
                <span className="block text-[13px] text-muted">{x.fr}</span>
              </span>
              <SpeakButton text={x.en} size={15} className="-my-1 shrink-0" />
            </label>
          ))}
          <Button className="w-full" onClick={keep} disabled={!picked.size} loading={saving}>
            Ajouter à mes cartes ({picked.size})
          </Button>
        </Panel>
      )}

      <button type="button" onClick={run} disabled={busy} className="mx-auto block text-sm text-muted hover:underline">
        {busy ? "Analyse…" : "Relancer l'analyse"}
      </button>
      {error && (error.nc ? <ServiceNotice service="La correction du journal" alternative="Ta page est bien enregistrée : tu pourras lancer la correction plus tard." /> : <ErrorNote>{error.msg}</ErrorNote>)}
    </div>
  );
}
