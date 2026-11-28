"use client";
// One universe: illustration, plant, progress, its sub-themes (progressive: tap one to see its words and actions).
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, EmptyState, LinkButton, PageHeader, Spinner, cx } from "@/components/ui";
import { CountsLine, StatusPill, WordSheet, toggleFavorite, useSpace, useVocabPrefs } from "@/components/vocab/common";
import { UniverseArt } from "@/components/vocab/UniverseArt";
import { HUE, Plant } from "@/components/vocab/Plant";
import { universe } from "@/lib/vocab/universes";
import { GARDEN_STAGES, gardenStage, libraryRows, nextStageGoal, type LibraryRow } from "@/lib/vocab/space";

export default function UniversePage() {
  const { id } = useParams<{ id: string }>();
  const u = universe(id);
  const data = useSpace();
  const prefs = useVocabPrefs();
  const [sub, setSub] = useState<string | null>(null);
  const [open, setOpen] = useState<LibraryRow | null>(null);
  const [showAll, setShowAll] = useState(false);

  const subRows = useMemo(() => {
    if (!data || !sub) return [];
    return libraryRows(data.sp)
      .filter((r) => r.subs.includes(sub))
      .sort((a, b) => (a.status === "unknown" ? 1 : 0) - (b.status === "unknown" ? 1 : 0) || "A1A2B1B2C1".indexOf(a.level) - "A1A2B1B2C1".indexOf(b.level));
  }, [data, sub]);

  if (!u) return <EmptyState icon="🧭" title="Univers introuvable"><LinkButton href="/vocab" className="mt-3">Vocabulaire</LinkButton></EmptyState>;
  if (!data)
    return (
      <div className="flex justify-center py-20 text-ink-500">
        <Spinner className="h-8 w-8" />
      </div>
    );

  const c = data.stats.universes[u.id];
  const h = HUE[u.hue];
  const st = gardenStage(c);
  const goal = nextStageGoal(c);
  const fav = prefs.favorites.includes(u.id);
  const selected = u.subs.find((s) => s.id === sub);
  const sc = selected ? c.subs[selected.id] : undefined;
  const q = (extra: string) => `universe=${u.id}${selected ? `&sub=${selected.id}` : ""}${extra}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={u.fr} back="/vocab" action={<Button size="sm" variant={fav ? "secondary" : "outline"} onClick={() => toggleFavorite(u.id)}>{fav ? "Favori ✓" : "Ajouter aux favoris"}</Button>} />
      <div className="relative overflow-hidden rounded-3xl border border-line" style={{ background: h.soft }}>
        <UniverseArt id={u.id} className="block h-44 w-full sm:h-56" title={u.fr} />
        {prefs.garden && (
          <div className="absolute bottom-2 right-3 flex flex-col items-center rounded-2xl bg-surface/85 px-2 pb-1 pt-1.5 backdrop-blur-sm">
            <Plant stage={st} hue={u.hue} className="h-16 w-14" />
            <span className="text-[11px] font-medium">{GARDEN_STAGES[st].name}</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-muted">{u.tagline}</p>
        <CountsLine c={c} className="mt-1 text-sm" />
        {prefs.garden && goal && <p className="mt-1 text-xs text-muted">Encore {goal.missing} mot{goal.missing > 1 ? "s" : ""} retenu{goal.missing > 1 ? "s" : ""} pour atteindre le stade « {goal.name} ».</p>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href={`/vocab/play?mode=new&${q("&size=10")}`}><Button className="w-full">Apprendre</Button></Link>
        <Link href={`/vocab/play?mode=${c.toReview ? "review" : "mix"}&${q("&size=10")}`}><Button className="w-full" variant="secondary">Flashcards</Button></Link>
        <Link href={`/games/pairs?mode=${c.discovered >= 4 ? "review" : "new"}&theme=${u.id}`}><Button className="w-full" variant="outline">Jouer</Button></Link>
      </div>

      <h2 className="mb-3 mt-7 font-display text-xl font-semibold">Sous-thèmes</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {u.subs.map((s) => {
          const x = c.subs[s.id];
          const ratio = x.total ? x.consolidated / x.total : 0;
          return (
            <button
              key={s.id}
              onClick={() => {
                setSub(sub === s.id ? null : s.id);
                setShowAll(false);
              }}
              className={cx("rounded-2xl border p-3 text-left transition active:scale-[0.98]", sub === s.id ? "border-transparent ring-2" : "border-line bg-surface hover:border-ink-300")}
              style={sub === s.id ? { background: h.soft, ["--tw-ring-color" as string]: h.main } : undefined}
              aria-pressed={sub === s.id}
            >
              <p className="font-medium leading-snug">{s.fr}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: h.main }} />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {x.consolidated}/{x.total} appris{x.toReview ? ` · ${x.toReview} à réviser` : ""}
              </p>
            </button>
          );
        })}
      </div>

      {selected && sc && (
        <div className="mt-5 animate-slide-up rounded-3xl border border-line bg-surface p-4">
          <p className="font-display text-lg font-semibold">{selected.fr}</p>
          <CountsLine c={sc} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link href={`/vocab/play?mode=new&${q("&size=10")}`}><Button size="sm" className="w-full">Apprendre</Button></Link>
            <Link href={`/vocab/play?mode=${sc.toReview ? "review" : "mix"}&${q("&size=10")}`}><Button size="sm" variant="secondary" className="w-full">Flashcards</Button></Link>
            <Link href={`/games/mcq?mode=${sc.discovered >= 4 ? "review" : "new"}&theme=${u.id}`}><Button size="sm" variant="outline" className="w-full">Jouer</Button></Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {(showAll ? subRows : subRows.slice(0, 12)).map((r) => (
              <li key={r.key}>
                <button onClick={() => setOpen(r)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.en}</p>
                    <p className="truncate text-sm text-muted">{r.fr}</p>
                  </div>
                  <span className="text-xs text-muted">{r.level}</span>
                  <StatusPill status={r.status} />
                </button>
              </li>
            ))}
          </ul>
          {subRows.length > 12 && !showAll && (
            <button onClick={() => setShowAll(true)} className="mt-2 h-10 w-full rounded-xl border border-line text-sm font-medium">Voir les {subRows.length} mots</button>
          )}
        </div>
      )}
      <WordSheet row={open} onClose={() => setOpen(null)} />
    </div>
  );
}
