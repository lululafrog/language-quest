"use client";
// World map: destinations open through demonstrated skills (lessons, level, or a short visa check).
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { unlockHint, worldState, type DestState } from "@/lib/world";
import { WorldMapArt, SouvenirArt } from "@/components/world/art";
import { Badge, LinkButton, Metric, PageHeader, Panel, ProgressBar, SectionHeader, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

const STATE_LABEL: Record<DestState["status"], string> = {
  locked: "Verrouillée",
  open: "Disponible",
  visited: "En cours",
  done: "Découverte",
};

export default function WorldPage() {
  const data = useLiveQuery(() => worldState(), []);
  const [sel, setSel] = useState<string | undefined>();
  if (!data) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;

  const current = data.dests.find((d) => d.dest.id === sel) ?? data.dests.find((d) => d.status === "visited") ?? data.dests.find((d) => d.status === "open") ?? data.dests[0];
  const visited = data.dests.filter((d) => d.status === "done" || d.status === "visited").length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Carte du monde" subtitle="Chaque destination est une vraie mission d'anglais. Elles s'ouvrent quand tu as les compétences — pas en accumulant des points." back="/profile" />

      <div className="overflow-hidden rounded-3xl border border-line card-shadow">
        <WorldMapArt
          selected={current.dest.id}
          onPick={setSel}
          pins={data.dests.map((d) => ({ id: d.dest.id, x: d.dest.pin.x, y: d.dest.pin.y, label: d.dest.nameFr, state: d.status, color: d.dest.palette.accent }))}
        />
      </div>

      <Panel className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted">{current.dest.country} · {current.dest.accentLabel}</p>
            <h2 className="font-display text-xl font-semibold">{current.dest.nameFr}</h2>
            <p className="mt-0.5 text-sm text-muted">{current.dest.tagline}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge tone="ink">{current.dest.level}</Badge>
            <Badge tone={current.status === "locked" ? "gray" : current.status === "done" ? "mint" : "sun"}>{STATE_LABEL[current.status]}</Badge>
          </div>
        </div>
        {current.open ? (
          <>
            <ProgressBar value={current.missionsDone} max={current.missionsTotal} tone="mint" />
            <p className="text-xs text-muted">{current.missionsDone}/{current.missionsTotal} missions réussies</p>
            <LinkButton href={`/world/${current.dest.id}`} className="w-full">
              {current.status === "open" ? `Partir pour ${current.dest.nameFr}` : current.status === "done" ? "Revoir la destination" : "Continuer l'aventure"}
            </LinkButton>
          </>
        ) : (
          <>
            <p className="text-sm">{unlockHint(current)}</p>
            <div className="grid grid-cols-2 gap-2">
              <LinkButton href={`/world/visa/${current.dest.id}`} variant="primary">Contrôle de visa</LinkButton>
              <LinkButton href={`/world/${current.dest.id}`} variant="outline">Voir la destination</LinkButton>
            </div>
          </>
        )}
      </Panel>

      <div className="grid grid-cols-4 gap-2">
        <Metric value={visited} label="destinations" />
        <Metric value={data.missionsDone} label="missions" />
        <Metric value={data.skills.length} label="compétences" />
        <Metric value={data.souvenirs.length} label="souvenirs" />
      </div>

      <SectionHeader title="Toutes les destinations" />
      <div className="grid gap-2 sm:grid-cols-2">
        {data.dests.map((d) => (
          <Link
            key={d.dest.id}
            href={d.open ? `/world/${d.dest.id}` : `/world/visa/${d.dest.id}`}
            className={cx("flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300", !d.open && "opacity-80")}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: d.open ? d.dest.palette.accent : "#B8B0A0" }}>
              <Icon name={d.open ? (d.status === "done" ? "check" : "globe") : "lock"} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{d.dest.nameFr} <span className="text-xs font-normal text-muted">· {d.dest.level}</span></span>
              <span className="block truncate text-xs text-muted">{d.open ? `${d.missionsDone}/${d.missionsTotal} missions · ${d.dest.accentLabel}` : "Verrouillée — compétences à démontrer"}</span>
            </span>
            <Icon name="chevron" size={16} className="text-muted" />
          </Link>
        ))}
      </div>

      {data.souvenirs.length > 0 && (
        <>
          <SectionHeader title="Mes souvenirs de voyage" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {data.souvenirs.map((s) => (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-3 text-center">
                <SouvenirArt motif={s.motif} size={40} className="mx-auto text-ink-600 dark:text-ink-300" />
                <p className="mt-1 text-xs font-semibold leading-tight">{s.fr}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {data.skills.length > 0 && (
        <>
          <SectionHeader title="Compétences validées en mission" />
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <Badge key={s} tone="mint">{s}</Badge>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
