"use client";
// A destination: its scene, characters, places (one mission each), skills and souvenirs.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDestination, PLACE_LABEL } from "@/lib/data/world";
import { nextMission, unlockHint, worldState } from "@/lib/world";
import { DestinationScene, PlaceGlyph, SouvenirArt } from "@/components/world/art";
import { Badge, EmptyState, LinkButton, Panel, ProgressBar, SectionHeader, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function DestinationPage() {
  const { dest: id } = useParams<{ dest: string }>();
  const dest = getDestination(id);
  const data = useLiveQuery(() => worldState(), []);
  if (!dest) {
    return (
      <EmptyState title="Destination introuvable">
        <Link href="/world" className="font-semibold text-ink-600 underline">Retour à la carte</Link>
      </EmptyState>
    );
  }
  if (!data) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const st = data.dests.find((d) => d.dest.id === dest.id)!;
  const next = nextMission(dest, data.progress);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/world" className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
          <Icon name="arrow" size={16} className="rotate-180" /> Carte du monde
        </Link>
        <div className="flex gap-1.5">
          <Badge tone="ink">{dest.level}</Badge>
          <Badge tone="gray">{dest.accentLabel}</Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line card-shadow">
        <DestinationScene dest={dest} />
        <div className="space-y-2 bg-surface p-4">
          <p className="text-[13px] font-semibold text-muted">{dest.country}</p>
          <h1 className="font-display text-[28px] font-bold leading-tight">{dest.nameFr}</h1>
          <p className="text-[15px] text-fg/80">{dest.tagline}</p>
          {st.open && (
            <>
              <ProgressBar value={st.missionsDone} max={st.missionsTotal} tone="mint" className="mt-2" />
              <p className="text-xs text-muted">{st.missionsDone}/{st.missionsTotal} missions réussies{st.status === "done" ? " · destination terminée, tampon obtenu" : ""}</p>
            </>
          )}
        </div>
      </div>

      {!st.open ? (
        <Panel className="space-y-3">
          <p className="flex items-center gap-2 font-semibold"><Icon name="lock" size={18} /> Destination verrouillée</p>
          <p className="text-sm">{unlockHint(st)}</p>
          {st.unlock.lessonsTotal > 0 && (
            <p className="text-xs text-muted">Cours conseillés validés : {st.unlock.lessonsDone}/{st.unlock.lessonsTotal}</p>
          )}
          <LinkButton href={`/world/visa/${dest.id}`} className="w-full">Passer le contrôle de visa</LinkButton>
        </Panel>
      ) : (
        next && (
          <LinkButton href={`/world/mission/${next.id}`} size="lg" className="w-full">
            {st.missionsDone ? "Mission suivante" : "Première mission"} : {next.title}
          </LinkButton>
        )
      )}

      <SectionHeader title="Les lieux" subtitle="Une mission en anglais par lieu" />
      <div className="grid gap-2">
        {dest.missions.map((m) => {
          const p = data.progress.get(m.id);
          const done = p?.status === "done";
          const inner = (
            <>
              <span className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", done ? "bg-mint-500/15 text-mint-600" : "bg-surface-2 text-fg/70")} style={!done && st.open ? { color: dest.palette.accent } : undefined}>
                <PlaceGlyph place={m.place} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-muted">{PLACE_LABEL[m.place]} · {m.placeName}</span>
                <span className="block font-semibold leading-snug">{m.title}</span>
                <span className="block text-xs text-muted">{m.minutes} min · {done ? `réussie (${Math.round((p?.bestScore ?? 0) * 100)} %)` : p ? "commencée" : `+${m.coins} pièces et un souvenir`}</span>
              </span>
              {done ? <Icon name="check" size={18} className="text-mint-600" /> : st.open ? <Icon name="chevron" size={16} className="text-muted" /> : <Icon name="lock" size={16} className="text-muted" />}
            </>
          );
          return st.open ? (
            <Link key={m.id} href={`/world/mission/${m.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
              {inner}
            </Link>
          ) : (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 opacity-70">{inner}</div>
          );
        })}
      </div>

      <SectionHeader title="Les habitants" />
      <div className="grid gap-2 sm:grid-cols-2">
        {dest.characters.map((c) => (
          <Panel key={c.name} tone="subtle" className="space-y-1">
            <p className="font-semibold">{c.name} <span className="text-xs font-normal text-muted">· {c.role}</span></p>
            <p className="text-sm text-muted">{c.personality}</p>
            <p className="flex items-center gap-1 text-[15px] italic">
              « {c.hello} » <SpeakButton text={c.hello} accent={dest.accent} size={15} className="p-1" />
            </p>
          </Panel>
        ))}
      </div>

      <SectionHeader title="Compétences de la destination" />
      <div className="flex flex-wrap gap-1.5">
        {[...new Set(dest.missions.flatMap((m) => m.skills))].map((s) => {
          const ok = dest.missions.some((m) => m.skills.includes(s) && data.progress.get(m.id)?.status === "done");
          return <Badge key={s} tone={ok ? "mint" : "gray"}>{ok ? "✓ " : ""}{s}</Badge>;
        })}
      </div>

      <SectionHeader title="Souvenirs à collectionner" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {dest.missions.map((m) => {
          const got = data.progress.get(m.id)?.status === "done";
          return (
            <div key={m.souvenir.id} className={cx("rounded-2xl border border-line bg-surface p-3 text-center", !got && "opacity-45")} title={got ? m.souvenir.desc : "À gagner"}>
              <SouvenirArt motif={m.souvenir.motif} size={36} className="mx-auto" color={got ? dest.palette.accent : undefined} />
              <p className="mt-1 text-[11px] font-semibold leading-tight">{got ? m.souvenir.fr : "?"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
