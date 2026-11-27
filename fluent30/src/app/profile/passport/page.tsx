"use client";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { claimStamps, passportState, nextDestination, type StampState } from "@/lib/passport";
import { useSettings } from "@/hooks/useSettings";
import { Stamp } from "@/components/passport/Stamp";
import { Tourist } from "@/components/avatar/Tourist";
import { Icon } from "@/components/icons";
import { PageHeader, Panel, ProgressBar, Sheet, toast, cx } from "@/components/ui";

const METRIC_LABEL: Record<string, string> = {
  lessons: "cours terminés",
  units: "unités terminées",
  level: "niveaux terminés",
  books: "livres terminés",
  streak: "jours de régularité",
  plans: "programmes complets",
  words: "mots mémorisés",
  activeDays: "jours de pratique",
};

export default function PassportPage() {
  const s = useSettings();
  const data = useLiveQuery(() => passportState(), []);
  const game = useLiveQuery(() => getDb().game.get("me"), []);
  const [open, setOpen] = useState<StampState | null>(null);

  // Grant stamps earned since the last visit (coins paid once).
  useEffect(() => {
    void claimStamps().then((fresh) => {
      for (const d of fresh) toast(`Nouveau tampon : ${d.nameFr} (+${d.coins} pièces)`);
    });
  }, []);

  if (!data) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const got = data.stamps.filter((x) => x.unlockedAt);
  const next = nextDestination(data.stamps);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Passeport" subtitle="Chaque tampon récompense un vrai progrès. Un jour manqué n'efface jamais rien." back="/profile" />

      {/* Cover / identity page */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface card-shadow">
        <div className="flex items-center gap-4 bg-ink-900 px-5 py-4 text-white dark:bg-ink-950">
          <Icon name="passport" size={26} className="text-sun-400" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Passport · Passeport</p>
            <p className="truncate font-display text-lg font-semibold">Fluent30 Traveller</p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">{got.length}/{data.stamps.length}</span>
        </div>
        <div className="flex items-center gap-4 p-5">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
            <Tourist appearance={game?.appearance} equipped={game?.equipped} portrait animate={false} className="h-full w-full" />
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Nom</dt>
            <dd className="truncate font-medium">{s.displayName || "Voyageur"}</dd>
            <dt className="text-muted">Niveau visé</dt>
            <dd className="font-medium">{s.pathLevel ?? "A1"}</dd>
            <dt className="text-muted">Cours</dt>
            <dd className="font-medium tabular-nums">{data.stats.lessons}</dd>
            <dt className="text-muted">Régularité</dt>
            <dd className="font-medium tabular-nums">{data.stats.streak} j</dd>
          </dl>
        </div>
      </section>

      {next && (
        <Panel>
          <p className="text-xs uppercase tracking-wider text-muted">Prochaine escale</p>
          <div className="mt-2 flex items-center gap-4">
            <Stamp dest={next.dest} locked size={64} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {next.dest.nameFr} <span className="font-normal text-muted">· {next.dest.country}</span>
              </p>
              <p className="text-sm text-muted">{next.dest.rule.fr}</p>
              <ProgressBar value={next.value} max={next.target} className="mt-2" />
              <p className="mt-1 text-xs tabular-nums text-muted">
                {next.dest.atlas ? "Destination à valider" : `${next.value}/${next.target} ${METRIC_LABEL[next.dest.rule.metric]}`} · +{next.dest.coins} pièces
              </p>
            </div>
          </div>
        </Panel>
      )}

      {/* Stamp pages */}
      <section className="rounded-3xl border border-line bg-[#FBF8F1] p-4 dark:bg-surface" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 27px, rgba(120,100,60,0.06) 27px 28px)" }}>
        <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted">Visas</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {data.stamps.map((st, i) => (
            <button key={st.dest.id} onClick={() => setOpen(st)} className="flex flex-col items-center rounded-2xl p-1.5 text-center transition hover:bg-black/5 dark:hover:bg-white/5">
              <Stamp dest={st.dest} locked={!st.unlockedAt} size={84} tilt={st.unlockedAt ? ((i * 37) % 17) - 8 : 0} />
              <span className={cx("mt-1 text-[12px] font-medium leading-tight", !st.unlockedAt && "text-muted")}>{st.dest.nameFr}</span>
              {!st.unlockedAt && !st.dest.atlas && <span className="text-[10px] tabular-nums text-muted">{st.value}/{st.target}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Souvenirs shelf */}
      <Panel>
        <h2 className="font-semibold">Souvenirs</h2>
        <p className="mb-3 text-sm text-muted">Un souvenir rapporté de chaque escale.</p>
        {data.souvenirs.length ? (
          <ul className="divide-y divide-line">
            {data.souvenirs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <span className="flex h-3 w-9 shrink-0 overflow-hidden rounded-sm border border-line">
                  {d.colors.map((c, k) => (
                    <span key={k} className="flex-1" style={{ background: c }} />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">{d.souvenir.fr}</span> <span className="text-muted">· {d.souvenir.en}</span>
                </span>
                <span className="text-xs text-muted">{d.nameFr}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">Termine ton premier cours pour rapporter ton premier souvenir de Londres.</p>
        )}
      </Panel>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open?.dest.nameFr}>
        {open && (
          <div className="flex flex-col items-center gap-3 pb-2 text-center">
            <Stamp dest={open.dest} locked={!open.unlockedAt} size={140} />
            <p className="text-sm text-muted">
              {open.dest.nameEn} · {open.dest.country}
            </p>
            <p className="font-medium">{open.dest.rule.fr}</p>
            {open.unlockedAt ? (
              <p className="text-sm text-mint-600">
                Tamponné le {new Date(open.unlockedAt).toLocaleDateString("fr-FR")} · souvenir : {open.dest.souvenir.fr}
              </p>
            ) : (
              <div className="w-full max-w-xs">
                <ProgressBar value={open.value} max={open.target} />
                <p className="mt-1 text-xs tabular-nums text-muted">
                  {open.dest.atlas ? "Valide la destination sur la carte du monde" : `${open.value}/${open.target} ${METRIC_LABEL[open.dest.rule.metric]}`} · récompense +{open.dest.coins} pièces
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
