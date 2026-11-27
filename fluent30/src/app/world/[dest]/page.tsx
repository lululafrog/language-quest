"use client";
// A destination: landscape, facts, places, characters, culture, vocabulary, missions, final story,
// rewards, books and sources. Destinations not written yet are shown honestly as "à venir".
import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { LEGACY_DEST } from "@/lib/atlas/legacy";
import { destinationProgress, toggleFavorite } from "@/lib/atlas/progress";
import { destinationView, effectiveContent, ENGLISH_LABEL, pinState, STATE_LABEL, STATUS_LABEL, TAG_LABEL } from "@/lib/atlas/ui-data";
import { CONTINENT_LABEL } from "@/lib/atlas/routes";
import { libraryBook } from "@/lib/data/library";
import { useSettings } from "@/hooks/useSettings";
import { Landscape, hasLandscape } from "@/components/atlas/Landscape";
import { RewardTile } from "@/components/atlas/RewardTile";
import { Badge, EmptyState, LinkButton, Panel, ProgressBar, SectionHeader, SpeakButton, cx, toast } from "@/components/ui";
import { Icon } from "@/components/icons";
import type { MissionProgress } from "@/lib/types";

export default function DestinationPage() {
  const { dest: raw } = useParams<{ dest: string }>();
  const router = useRouter();
  const legacy = LEGACY_DEST[raw];
  useEffect(() => {
    if (legacy) router.replace(`/world/${legacy}`);
  }, [legacy, router]);
  const id = legacy ?? raw;
  const { entry, dest } = destinationView(id);
  const s = useSettings();
  const progress = useLiveQuery(() => destinationProgress(id), [id]);
  const missionRows = useLiveQuery(async () => {
    if (!dest) return new Map<string, MissionProgress>();
    const ids = [...dest.missions.flatMap((m) => [m.id, m.legacyId].filter((x): x is string => !!x)), dest.final.id];
    const rows = await getDb().missions.bulkGet(ids);
    return new Map(rows.filter((r): r is MissionProgress => !!r).map((r) => [r.id, r]));
  }, [id]);

  if (legacy) return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
  if (!entry) {
    return (
      <EmptyState title="Destination introuvable">
        <Link href="/world" className="font-semibold text-ink-600 underline">Retour à la carte</Link>
      </EmptyState>
    );
  }

  const content = effectiveContent(entry);
  const state = pinState(content, progress);
  const favorite = (s.atlasFavorites ?? []).includes(entry.id);
  const motif = hasLandscape(entry.id) ? entry.id : dest?.landscape;
  const books = (entry.books ?? []).map((b) => libraryBook(b)).filter((b): b is NonNullable<typeof b> => !!b);

  const header = (
    <>
      <div className="flex items-center justify-between gap-2">
        <Link href="/world" className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
          <Icon name="arrow" size={16} className="rotate-180" /> Carte du monde
        </Link>
        <button
          type="button"
          onClick={async () => toast((await toggleFavorite(entry.id)) ? "Ajoutée à tes favoris" : "Retirée de tes favoris")}
          className={cx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium", favorite ? "border-coral-500 text-coral-600" : "border-line text-muted")}
          aria-pressed={favorite}
        >
          <Icon name="heart" size={15} /> {favorite ? "Favori" : "Ajouter aux favoris"}
        </button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-line card-shadow">
        <Landscape motif={motif} continent={entry.continent} palette={dest?.palette} title={`Paysage : ${entry.nameFr}`} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-muted">{CONTINENT_LABEL[entry.continent]} · {STATUS_LABEL[entry.status]}</p>
        <h1 className="font-display text-[28px] font-bold leading-tight">{entry.nameFr}</h1>
        <p className="text-[15px] text-muted">{entry.nameEn}{dest ? ` — ${dest.tagline}` : ""}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={state === "validated" ? "mint" : state === "progress" ? "coral" : state === "available" ? "ink" : "gray"}>{STATE_LABEL[state]}</Badge>
          <Badge tone="gray">{ENGLISH_LABEL[entry.english]}</Badge>
          {content === "preview" && <Badge tone="sun">Aperçu</Badge>}
        </div>
      </div>
      {entry.statusNote && <p className="text-sm text-muted">{entry.statusNote}</p>}
      {entry.virtualOnly && (
        <Panel tone="subtle" className="text-sm">
          <strong>Expérience virtuelle éducative.</strong> {entry.virtualNote ?? "Cette destination est explorée uniquement depuis l'application, sans incitation à s'y rendre."}
        </Panel>
      )}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Fact label="Capitale" value={entry.capital} note={entry.capitalNote ?? dest?.capitalNote} />
        <Fact label={entry.languages.length > 1 ? "Langues" : "Langue"} value={entry.languages.join(", ")} />
      </dl>
      {entry.english === "foreign" && (
        <p className="text-sm text-muted">L&apos;anglais n&apos;est pas la langue locale : les missions simulent des échanges internationaux, touristiques et professionnels en anglais.</p>
      )}
    </>
  );

  if (!dest || content === "coming") {
    return (
      <article className="mx-auto max-w-3xl space-y-4 pb-6">
        {header}
        <Panel className="space-y-2">
          <h2 className="font-semibold">Destination à venir</h2>
          <p className="text-sm text-muted">Ses missions ne sont pas encore écrites : aucune activité n&apos;est proposée tant que le contenu n&apos;est pas terminé et vérifié.</p>
          <p className="text-sm">Thèmes prévus : {entry.themes.join(" · ")}</p>
          <div className="flex flex-wrap gap-1.5">{entry.tags.map((t) => <Badge key={t} tone="gray">{TAG_LABEL[t]}</Badge>)}</div>
        </Panel>
        {books.length > 0 && <Books books={books} />}
        <LinkButton href="/world" variant="secondary" className="w-full">Retour à la carte</LinkButton>
      </article>
    );
  }

  const missions = [...dest.missions].sort((a, b) => a.order - b.order);
  const ownedRewards = new Set(progress?.rewards ?? []);
  const rowOf = (mid: string, legacyId?: string) => missionRows?.get(mid) ?? (legacyId ? missionRows?.get(legacyId) : undefined);
  const finalRow = missionRows?.get(dest.final.id);
  const placeName = (pid: string) => dest.places.find((p) => p.id === pid)?.name ?? "";

  return (
    <article className="mx-auto max-w-3xl space-y-5 pb-8">
      {header}

      {dest.preview && (
        <Panel tone="subtle" className="text-sm">
          <strong>Aperçu.</strong> Ces missions viennent de la première carte du monde. La destination complète (10 missions, histoire finale, récompenses) est en préparation.
        </Panel>
      )}

      {progress && (
        <Panel className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Ta progression</span>
            <span className="text-muted">{progress.done}/{progress.total} missions{progress.finalDone ? " · finale réussie" : ""}</span>
          </div>
          <ProgressBar value={progress.done + (progress.finalDone ? 1 : 0)} max={progress.total + (dest.preview ? 0 : 1)} tone="mint" />
          {progress.validated && (
            <p className="text-sm">
              Destination validée{progress.bestBand ? ` au niveau ${progress.bestBand}` : ""}. Tu peux la rejouer à un niveau supérieur.{" "}
              <Link href={`/world/postcards/${dest.id}`} className="font-semibold text-ink-600 underline dark:text-ink-300">Ma carte postale</Link>
            </p>
          )}
          <p className="text-xs text-muted">La validation d&apos;une destination montre que tu sais communiquer dans ces situations ; ce n&apos;est pas une certification officielle.</p>
        </Panel>
      )}

      <p className="text-[15.5px] leading-relaxed">{dest.intro}</p>

      <section>
        <SectionHeader title="Missions" subtitle="La difficulté s'adapte à ton niveau" />
        <div className="space-y-2">
          {missions.map((m) => {
            const r = rowOf(m.id, m.legacyId);
            const done = r?.status === "done";
            return (
              <Link key={m.id} href={`/world/mission/${m.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
                <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold", done ? "bg-mint-600 text-white" : "bg-surface-2 text-muted")}>
                  {done ? <Icon name="check" size={18} /> : m.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">{m.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {placeName(m.place)}{placeName(m.place) ? " · " : ""}{m.minutes} min{m.grammar.length ? ` · ${m.grammar[0]}` : ""}
                  </span>
                </span>
                {r?.bestBand && <Badge tone="mint">{r.bestBand}</Badge>}
                {!r?.bestBand && r?.status === "started" && <Badge tone="coral">En cours</Badge>}
                <Icon name="chevron" size={16} className="text-muted" />
              </Link>
            );
          })}
        </div>
        {!dest.preview && dest.final.nodes.length > 0 && (
          <Panel tone="highlight" className="mt-3 space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Mission finale</p>
            <p className="font-display text-lg font-semibold">{dest.final.title}</p>
            <p className="text-sm text-muted">{dest.final.intro}</p>
            <p className="text-xs text-muted">Compétences : {dest.final.skills.join(" · ")}</p>
            <LinkButton href={`/world/final/${dest.id}`} className="w-full">
              {finalRow?.status === "done" ? "Rejouer l'aventure" : progress && progress.done < progress.total ? `Disponible quand tu veux (${progress.done}/${progress.total} missions faites)` : "Commencer l'aventure"}
            </LinkButton>
          </Panel>
        )}
      </section>

      {dest.places.length > 0 && (
        <section>
          <SectionHeader title="Lieux" />
          <div className="grid gap-2 sm:grid-cols-2">
            {dest.places.map((p) => (
              <div key={p.id} className="rounded-2xl border border-line bg-surface p-3">
                <p className="font-semibold">{p.name} <span className="text-xs font-normal text-muted">· {p.kind}</span></p>
                <p className="text-sm text-muted">{p.fr}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {dest.characters.length > 0 && (
        <section>
          <SectionHeader title="Personnages" subtitle="Habitants et voyageurs que tu vas croiser" />
          <div className="grid gap-2 sm:grid-cols-2">
            {dest.characters.map((c) => (
              <div key={c.id} className="rounded-2xl border border-line bg-surface p-3">
                <p className="font-semibold">{c.name} <span className="text-xs font-normal text-muted">· {c.role} · {c.origin === "local" ? "habitant" : "voyageur"}</span></p>
                <p className="text-sm text-muted">{c.personality}</p>
                <p className="mt-1 flex items-start gap-1 text-[15px] italic">
                  « {c.hello} » <SpeakButton text={c.hello} accent={c.accent} size={15} className="-my-1 p-1" />
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(dest.culture.length > 0 || dest.food.length > 0) && (
        <section>
          <SectionHeader title="Culture et cuisine" />
          <div className="space-y-2">
            {dest.culture.map((c) => (
              <div key={c.title} className="rounded-2xl border border-line bg-surface p-3">
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-muted">{c.fr}</p>
              </div>
            ))}
            {dest.food.length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-3">
                <p className="mb-1 font-semibold">Spécialités</p>
                <ul className="space-y-1.5 text-sm">
                  {dest.food.map((f) => (
                    <li key={f.en}>
                      <span className="font-medium">{f.en}</span> <span className="text-muted">— {f.fr}. {f.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {(dest.vocab.length > 0 || dest.expressions.length > 0) && (
        <section>
          <SectionHeader title="Vocabulaire et expressions" />
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {dest.vocab.slice(0, 24).map((v) => (
              <div key={v.id} className="flex items-center gap-1 px-3 py-2">
                <SpeakButton text={v.en} size={15} className="-ml-1 shrink-0" />
                <span className="min-w-0 flex-1"><span className="font-medium">{v.en}</span> <span className="text-sm text-muted">— {v.fr}</span></span>
              </div>
            ))}
            {dest.expressions.map((e) => (
              <div key={e.en} className="flex items-start gap-1 px-3 py-2">
                <SpeakButton text={e.en} size={15} className="-ml-1 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{e.en}</span> <span className="text-sm text-muted">— {e.fr}</span>
                  {e.note && <span className="block text-xs text-muted">{e.note}</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {dest.rewards.length > 0 && (
        <section>
          <SectionHeader title="Récompenses" subtitle={`${ownedRewards.size}/${dest.rewards.length} obtenues`} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {dest.rewards.map((r) => <RewardTile key={r.id} reward={r} owned={ownedRewards.has(r.id)} accent={dest.palette.accent} />)}
          </div>
        </section>
      )}

      {(books.length > 0 || dest.story) && (
        <section className="space-y-2">
          <SectionHeader title="À lire" />
          {dest.story && (
            <Link href={`/world/${dest.id}/story`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
              <Icon name="book" size={20} className="text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{dest.story.title}</span>
                <span className="block text-xs text-muted">Histoire originale · niveau {dest.story.level}</span>
              </span>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          )}
          {books.length > 0 && <Books books={books} />}
        </section>
      )}

      <details className="rounded-2xl border border-line bg-surface p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Sources et vérification du contenu</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          {dest.sources.map((src) => <li key={src} className="break-words">{src}</li>)}
        </ul>
        <p className="mt-2 text-muted">
          {dest.review.linguistic === "human" && dest.review.cultural === "human"
            ? `Contenu relu par une personne (mise à jour : ${dest.review.updated}).`
            : `Contenu vérifié automatiquement ; relecture humaine à venir (mise à jour : ${dest.review.updated}).`}
        </p>
      </details>
    </article>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-muted">{note}</dd>}
    </div>
  );
}

function Books({ books }: { books: { id: number; title: string; author: string; level: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
      {books.map((b) => (
        <Link key={b.id} href={`/library/book/${b.id}`} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2">
          <Icon name="book" size={18} className="text-muted" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{b.title}</span>
            <span className="block text-xs text-muted">{b.author} · {b.level} · domaine public</span>
          </span>
          <Icon name="chevron" size={16} className="text-muted" />
        </Link>
      ))}
    </div>
  );
}
