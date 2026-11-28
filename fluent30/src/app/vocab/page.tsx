"use client";
// Vocabulary home: what to do today (3 main actions), the learner's words that matter now, the garden, three ways to
// explore (mind map, illustrated universes, library), collections and real progress.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Segmented, Spinner, Toggle, cx } from "@/components/ui";
import { CountsLine, SectionTitle, StatusPill, UniverseCard, WordSheet, useSpace, useVocabPrefs } from "@/components/vocab/common";
import { VocabMap } from "@/components/vocab/VocabMap";
import { VocabLibrary } from "@/components/vocab/VocabLibrary";
import { CollectionCard } from "@/components/vocab/CollectionCard";
import { Plant } from "@/components/vocab/Plant";
import { saveSettings } from "@/lib/db";
import { UNIVERSES } from "@/lib/vocab/universes";
import { collectionsProgress, gardenStage, GARDEN_STAGES, isConsolidated, libraryRows, newGardenStages, recordCollections, weekProgress, type LibraryRow } from "@/lib/vocab/space";
import { reviewPriority } from "@/lib/vocab/engine";
import { checkEarnedItems } from "@/lib/game";

const MILESTONES = [100, 250, 500, 1000, 2500, 5000];
const REWARD: Record<number, string> = { 100: "un carnet de mots en lin", 250: "un pendentif boussole", 500: "un panama du polyglotte", 1000: "une montre à gousset", 2500: "un trench d'explorateur", 5000: "une grande carte murale" };

export default function VocabHome() {
  const data = useSpace();
  const prefs = useVocabPrefs();
  const [open, setOpen] = useState<LibraryRow | null>(null);
  const [week, setWeek] = useState<Awaited<ReturnType<typeof weekProgress>> | null>(null);
  const [grown, setGrown] = useState<{ universe: string; stage: number }[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    weekProgress(data.sp).then(setWeek);
    newGardenStages(data.stats).then(setGrown);
    recordCollections(collectionsProgress(data.sp)).then(async (done) => {
      if (done.length) {
        setFresh(done.map((c) => c.title));
        await checkEarnedItems();
      }
    });
  }, [data]);

  const today = useMemo(() => {
    if (!data) return null;
    const { sp } = data;
    const due = sp.words.filter((w) => w.status !== "new" && reviewPriority(w, sp.now) >= 2).sort((a, b) => reviewPriority(b, sp.now) - reviewPriority(a, sp.now));
    const recent = [...sp.words].sort((a, b) => b.card.createdAt - a.card.createdAt).slice(0, 8);
    const hard = sp.words.filter((w) => w.states.some((s) => s.lapses > 0) || (w.card.gameStats?.wrong ?? 0) >= 2).sort((a, b) => (b.card.gameStats?.wrong ?? 0) - (a.card.gameStats?.wrong ?? 0)).slice(0, 8);
    const consolidated = sp.words.filter((w) => isConsolidated(w.status)).length;
    return { due, recent, hard, consolidated };
  }, [data]);

  if (!data || !today || !prefs.loaded)
    return (
      <div className="flex justify-center py-20 text-ink-500">
        <Spinner className="h-8 w-8" />
      </div>
    );

  const { sp, stats } = data;
  const rowsById = (ids: string[]) => libraryRows(sp, { mine: true }).filter((r) => ids.includes(r.key));
  const nextMilestone = MILESTONES.find((m) => m > today.consolidated);
  const favs = UNIVERSES.filter((u) => prefs.favorites.includes(u.id));
  const toDevelop = UNIVERSES.filter((u) => stats.universes[u.id].discovered > 0).sort((a, b) => stats.universes[a.id].consolidated / Math.max(1, stats.universes[a.id].discovered) - stats.universes[b.id].consolidated / Math.max(1, stats.universes[b.id].discovered)).slice(0, 3);
  const cols = collectionsProgress(sp);
  const msgs: string[] = [];
  if (week?.consolidatedThisWeek) msgs.push(`Tu as consolidé ${week.consolidatedThisWeek} mot${week.consolidatedThisWeek > 1 ? "s" : ""} cette semaine !`);
  if (week?.byUniverse[0] && week.byUniverse[0].n >= 3) msgs.push(`Ton vocabulaire « ${UNIVERSES.find((u) => u.id === week.byUniverse[0].id)?.fr} » s'enrichit.`);
  for (const t of fresh) msgs.push(`Tu viens de terminer ta collection « ${t} » ! Ta récompense t'attend dans le dressing.`);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="t-display">Vocabulaire</h1>
        <p className="mt-1 text-sm text-muted">
          {today.consolidated} mot{today.consolidated > 1 ? "s" : ""} appris sur {stats.all.total.toLocaleString("fr-FR")} dans ta bibliothèque d&apos;anglais
        </p>
      </header>

      {msgs.length > 0 && (
        <div className="mb-4 space-y-2">
          {msgs.map((m) => (
            <p key={m} className="animate-pop rounded-2xl bg-mint-100/80 px-4 py-3 text-sm font-medium text-mint-700 dark:bg-mint-600/20 dark:text-mint-300">{m}</p>
          ))}
        </div>
      )}

      {/* three main actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/vocab/session?mode=new" className="group rounded-3xl bg-ink-700 p-4 text-white shadow-md transition hover:-translate-y-0.5 active:scale-[0.99]">
          <p className="font-display text-lg font-semibold">Apprendre de nouveaux mots</p>
          <p className="mt-1 text-sm text-white/75">À ton niveau et selon tes univers</p>
        </Link>
        <Link href={today.due.length ? "/vocab/session?mode=review" : "/vocab/session?mode=new"} className="group rounded-3xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 active:scale-[0.99]">
          <p className="font-display text-lg font-semibold">Réviser mes mots</p>
          <p className="mt-1 text-sm text-muted">{today.due.length ? `${today.due.length} mot${today.due.length > 1 ? "s" : ""} à revoir aujourd'hui` : "Rien à réviser : tout est à jour"}</p>
        </Link>
        <a href="#explorer" className="group rounded-3xl border border-line bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 active:scale-[0.99]">
          <p className="font-display text-lg font-semibold">Explorer un univers</p>
          <p className="mt-1 text-sm text-muted">Carte mentale, univers illustrés ou bibliothèque</p>
        </a>
      </div>
      <p className="mt-2 text-center">
        <Link href="/vocab/session?mode=auto" className="text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">Choisis pour moi ›</Link>
      </p>

      {/* the learner's words that matter now */}
      {(today.due.length > 0 || today.recent.length > 0 || today.hard.length > 0) && (
        <>
          <SectionTitle>Aujourd&apos;hui</SectionTitle>
          <div className="space-y-4">
            {today.due.length > 0 && <WordChips title="À réviser aujourd'hui" rows={rowsById(today.due.slice(0, 10).map((w) => w.card.id))} more={today.due.length - 10} onOpen={setOpen} href="/vocab/play?mode=review&size=10" />}
            {today.hard.length > 0 && <WordChips title="Mots difficiles" rows={rowsById(today.hard.map((w) => w.card.id))} onOpen={setOpen} href="/vocab/play?mode=difficult&size=10" />}
            {today.recent.length > 0 && <WordChips title="Ajoutés récemment" rows={rowsById(today.recent.map((w) => w.card.id))} onOpen={setOpen} />}
          </div>
        </>
      )}

      {/* garden */}
      {prefs.garden && (
        <>
          <SectionTitle action={<button onClick={() => saveSettings({ vocabGarden: false })} className="text-xs text-muted underline-offset-2 hover:underline">Masquer le jardin</button>}>Mon jardin de mots</SectionTitle>
          <Garden stats={stats} grown={grown} favorites={prefs.favorites} />
        </>
      )}

      {/* explore */}
      <div id="explorer" className="scroll-mt-20" />
      <SectionTitle
        action={
          <Segmented
            value={prefs.view}
            onChange={(v) => saveSettings({ vocabView: v })}
            options={[
              { value: "universes", label: "Univers" },
              { value: "map", label: "Carte" },
              { value: "library", label: "Bibliothèque" },
            ]}
          />
        }
      >
        Explorer
      </SectionTitle>
      {prefs.view === "map" && <VocabMap stats={stats} garden={prefs.garden} />}
      {prefs.view === "library" && <VocabLibrary sp={sp} onOpen={setOpen} />}
      {prefs.view === "universes" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...favs, ...UNIVERSES.filter((u) => !prefs.favorites.includes(u.id))].map((u) => (
            <UniverseCard key={u.id} u={u} c={stats.universes[u.id]} garden={prefs.garden} favorite={prefs.favorites.includes(u.id)} />
          ))}
        </div>
      )}

      {toDevelop.length > 0 && (
        <>
          <SectionTitle>Thèmes à développer</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-3">
            {toDevelop.map((u) => (
              <Link key={u.id} href={`/vocab/play?mode=mix&universe=${u.id}&size=10`} className="rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
                <p className="font-medium">{u.fr}</p>
                <CountsLine c={stats.universes[u.id]} />
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Collections</SectionTitle>
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {cols.map((p) => (
          <div key={p.c.id} className="w-60 shrink-0 snap-start">
            <CollectionCard p={p} />
          </div>
        ))}
      </div>

      <SectionTitle>Mes progrès</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Metric value={week?.learnedThisWeek ?? 0} label="nouveaux mots cette semaine" />
        <Metric value={week?.consolidatedThisWeek ?? 0} label="consolidés cette semaine" />
        <Metric value={week?.reviewsThisWeek ?? 0} label="réponses cette semaine" />
      </div>
      {nextMilestone && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">Prochaine étape : {nextMilestone.toLocaleString("fr-FR")} mots consolidés</span>
            <span className="text-xs text-muted tabular-nums">{today.consolidated} / {nextMilestone}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-mint-500 transition-all duration-700" style={{ width: `${(today.consolidated / nextMilestone) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Récompense pour ton avatar : {REWARD[nextMilestone]}. Seuls les mots vraiment retenus comptent (pas les cartes vues).</p>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Un nombre de mots ne correspond pas à un niveau : ton niveau CECRL se mesure dans les tests de niveau. <Link href="/games/progress" className="underline">Statistiques détaillées</Link>
      </p>

      {!prefs.garden && (
        <div className="mt-6">
          <Toggle checked={false} onChange={() => saveSettings({ vocabGarden: true })} label="Afficher le jardin de mots" hint="Chaque univers devient une plante qui grandit avec les mots que tu retiens." />
        </div>
      )}

      <WordSheet row={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 text-center">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-muted">{label}</p>
    </div>
  );
}

function WordChips({ title, rows, more = 0, onOpen, href }: { title: string; rows: LibraryRow[]; more?: number; onOpen: (r: LibraryRow) => void; href?: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        {href && (
          <Link href={href}>
            <Button size="sm" variant="secondary">Commencer</Button>
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <button key={r.key} onClick={() => onOpen(r)} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition hover:border-ink-300 active:scale-95">
            {r.en}
          </button>
        ))}
        {more > 0 && <span className="self-center text-xs text-muted">+{more}</span>}
      </div>
    </div>
  );
}

function Garden({ stats, grown, favorites }: { stats: ReturnType<typeof import("@/lib/vocab/space").spaceStats>; grown: { universe: string; stage: number }[]; favorites: string[] }) {
  const started = UNIVERSES.filter((u) => stats.universes[u.id].discovered > 0 || favorites.includes(u.id));
  const list = started.length ? started : UNIVERSES.slice(0, 4);
  return (
    <div className="rounded-3xl border border-line bg-gradient-to-b from-mint-100/60 to-surface p-4 dark:from-mint-600/10">
      {grown.length > 0 && (
        <p className="mb-3 animate-pop text-sm font-medium text-mint-700 dark:text-mint-300">
          Ton univers « {UNIVERSES.find((u) => u.id === grown[0].universe)?.fr} » est devenu : {GARDEN_STAGES[grown[0].stage].name.toLowerCase()} !
        </p>
      )}
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {list.map((u) => {
          const c = stats.universes[u.id];
          const st = gardenStage(c);
          const isGrown = grown.some((g) => g.universe === u.id);
          return (
            <Link key={u.id} href={`/vocab/u/${u.id}`} className="flex w-24 shrink-0 flex-col items-center rounded-2xl p-2 text-center transition hover:bg-surface/70">
              <Plant stage={st} hue={u.hue} className={cx("h-20 w-16", isGrown && "plant-grow")} title={`${u.fr} : ${GARDEN_STAGES[st].name}`} />
              <span className="mt-1 text-[12px] font-medium leading-tight">{u.fr.split(" ")[0]}</span>
              <span className="text-[10.5px] text-muted">{GARDEN_STAGES[st].name}</span>
            </Link>
          );
        })}
      </div>
      {!started.length && <p className="mt-2 text-sm text-muted">Ton jardin attend ses premières graines : chaque mot retenu fait pousser l&apos;univers correspondant.</p>}
      {started.length > 0 && <p className="mt-2 text-xs text-muted">Une plante ne fane jamais : si tu fais une pause, elle t&apos;attend.</p>}
    </div>
  );
}

export { StatusPill, Badge };
