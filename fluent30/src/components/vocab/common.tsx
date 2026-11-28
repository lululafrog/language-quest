"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, type ReactNode } from "react";
import { Badge, Button, ProgressBar, Sheet, SpeakButton, cx, toast } from "@/components/ui";
import { getDb, getSettings, saveSettings } from "@/lib/db";
import { cardFromSeed, saveCard } from "@/lib/cards";
import { STATUS_INFO, type WordStatus } from "@/lib/vocab/core";
import { CATEGORIES, UNIVERSES, subTheme, universe, type Universe } from "@/lib/vocab/universes";
import { gardenStage, loadSpace, skillMastery, spaceStats, type Counts, type LibraryRow, type Space, type SpaceStats } from "@/lib/vocab/space";
import { UniverseArt } from "./UniverseArt";
import { HUE, Plant } from "./Plant";

/** Loads the vocabulary space and recomputes when the learner's words or answers change. */
export function useSpace(): { sp: Space; stats: SpaceStats } | null {
  const cards = useLiveQuery(() => getDb().cards.count(), []);
  const logs = useLiveQuery(() => getDb().reviewLogs.count(), []);
  const [data, setData] = useState<{ sp: Space; stats: SpaceStats } | null>(null);
  useEffect(() => {
    if (cards === undefined || logs === undefined) return;
    let alive = true;
    loadSpace().then((sp) => alive && setData({ sp, stats: spaceStats(sp) }));
    return () => {
      alive = false;
    };
  }, [cards, logs]);
  return data;
}

export function useVocabPrefs() {
  const s = useLiveQuery(() => getSettings(), []);
  return {
    view: s?.vocabView ?? "universes",
    garden: s?.vocabGarden ?? true,
    favorites: s?.favoriteUniverses ?? [],
    loaded: !!s,
  };
}

export async function toggleFavorite(id: string) {
  const s = await getSettings();
  const fav = new Set(s.favoriteUniverses ?? []);
  if (fav.has(id)) fav.delete(id);
  else fav.add(id);
  await saveSettings({ favoriteUniverses: [...fav] });
}

export function hueOf(u?: Universe) {
  return HUE[u?.hue ?? "sage"] ?? HUE.sage;
}

/** Progress line for a universe or sub-theme: "12 consolidés · 4 à réviser · 230 à découvrir". */
export function CountsLine({ c, className }: { c: Counts; className?: string }) {
  return (
    <p className={cx("text-xs text-muted", className)}>
      <span className="font-semibold text-fg">{c.consolidated}</span> appris
      {c.toReview > 0 && (
        <>
          {" · "}
          <span className="font-semibold text-coral-600 dark:text-coral-400">{c.toReview}</span> à réviser
        </>
      )}
      {" · "}
      {c.toDiscover} à découvrir
    </p>
  );
}

export function UniverseCard({ u, c, garden, favorite, compact }: { u: Universe; c: Counts; garden: boolean; favorite?: boolean; compact?: boolean }) {
  const h = hueOf(u);
  const stage = gardenStage(c);
  return (
    <Link href={`/vocab/u/${u.id}`} className="group block overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]">
      <div className="relative">
        <UniverseArt id={u.id} className={cx("block w-full", compact ? "h-24" : "h-32")} />
        {garden && (
          <div className="absolute bottom-1 right-2 h-14 w-12 drop-shadow-sm">
            <Plant stage={stage} hue={u.hue} />
          </div>
        )}
        {favorite && <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-medium">Favori</span>}
      </div>
      <div className="p-3.5">
        <p className="font-display text-[17px] font-semibold leading-tight">{u.fr}</p>
        {!compact && <p className="mt-0.5 text-xs text-muted">{u.tagline}</p>}
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.total ? Math.max(c.consolidated ? 3 : 0, (c.consolidated / c.total) * 100) : 0}%`, background: h.main }} />
        </div>
        <CountsLine c={c} className="mt-1.5" />
      </div>
    </Link>
  );
}

export function StatusPill({ status }: { status: WordStatus | "unknown" }) {
  if (status === "unknown") return <Badge tone="gray">À découvrir</Badge>;
  return <Badge tone={STATUS_INFO[status].tone}>{STATUS_INFO[status].short}</Badge>;
}

/** Details of a word (shared lexicon entry and/or the learner's card), with "add to my words". */
export function WordSheet({ row, onClose }: { row: LibraryRow | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  if (!row) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;
  const e = row.entry;
  const c = row.word?.card;
  const ex = c?.example ?? e?.ex;
  const exFr = c?.exampleFr ?? e?.exFr;
  const syn = c?.synonyms?.[0] ?? e?.synonym;
  const ant = c?.antonyms?.[0] ?? e?.ant;
  const ipa = c?.ipa ?? e?.ipa;
  const sk = row.word ? skillMastery(row.word.states) : null;
  const SK = { none: "pas encore travaillé", fragile: "en cours", solid: "solide" };
  async function add() {
    if (!e) return;
    setBusy(true);
    try {
      await saveCard({ ...cardFromSeed(e, "user"), cefr: e.level, subs: e.subs, cat: e.cat, synonyms: e.synonym ? [e.synonym] : undefined, antonyms: e.ant ? [e.ant] : undefined });
      setAdded(true);
      toast("Ajouté à tes mots : il arrive dans tes prochaines sessions.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet open={!!row} onClose={onClose} title={row.en}>
      <div className="space-y-3 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <SpeakButton text={row.en} />
          {ipa && <span className="text-sm text-muted">/{ipa.replace(/^\/|\/$/g, "")}/</span>}
          <Badge tone="gray">{row.level}</Badge>
          <Badge tone="ink">{CATEGORIES[row.cat as keyof typeof CATEGORIES] ?? row.cat}</Badge>
          <StatusPill status={row.status} />
        </div>
        <p className="text-lg font-semibold">{row.fr}</p>
        {(c?.definition ?? e?.def) && <p className="text-sm text-muted">{c?.definition ?? e?.def}</p>}
        {ex && (
          <div className="rounded-2xl bg-surface-2 p-3 text-sm">
            <p className="flex items-start gap-1 italic"><span className="flex-1">{ex}</span><SpeakButton text={ex} /></p>
            {exFr && <p className="mt-1 text-muted">{exFr}</p>}
          </div>
        )}
        {(syn || ant) && (
          <p className="text-sm">
            {syn && <span>≈ <b>{syn}</b></span>}
            {syn && ant && " · "}
            {ant && <span>≠ <b>{ant}</b></span>}
          </p>
        )}
        {e?.note && <p className="rounded-xl bg-sun-100/70 p-2.5 text-sm dark:bg-sun-500/15">{e.note}</p>}
        {e?.tip && <p className="text-sm"><span className="font-semibold">Astuce : </span>{e.tip}</p>}
        {row.subs.length > 0 && <p className="text-xs text-muted">{row.subs.map((s) => subTheme(s)?.fr).filter(Boolean).join(" · ")}</p>}
        {sk && (
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl border border-line p-2"><p className="text-muted">Le comprendre</p><p className="font-semibold">{SK[sk.recognition]}</p></div>
            <div className="rounded-xl border border-line p-2"><p className="text-muted">L&apos;utiliser soi-même</p><p className="font-semibold">{SK[sk.production]}</p></div>
          </div>
        )}
        {!row.word && e && (
          <Button className="w-full" loading={busy} disabled={added} onClick={add}>
            {added ? "Ajouté à mes mots" : "Ajouter à mes mots"}
          </Button>
        )}
      </div>
    </Sheet>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function universeName(id?: string) {
  return universe(id)?.fr ?? "";
}

export function MiniProgress({ value, max, hue }: { value: number; max: number; hue?: string }) {
  return <ProgressBar value={value} max={Math.max(1, max)} tone={hue === "terracotta" || hue === "rose" ? "coral" : hue === "sand" || hue === "amber" ? "sun" : hue === "sage" || hue === "moss" ? "mint" : "ink"} />;
}

export { UNIVERSES };
