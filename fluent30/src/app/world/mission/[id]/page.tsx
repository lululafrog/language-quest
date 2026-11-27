"use client";
// Atlas mission player: briefing → key phrases & words → level-adapted exercises (+ cross-destination
// reviews) → result (reward, vocabulary added to the flashcards, validation of the destination).
// Old world-map URLs (/world/mission/london-cafe…) still open: legacy ids resolve to the same mission.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { getPrefs, setSpeechPrefs, stopSpeaking } from "@/lib/speech";
import { gameSignal } from "@/lib/srs";
import { getLesson } from "@/lib/curriculum";
import { useSettings } from "@/hooks/useSettings";
import { accentFor, destName, getAtlasMission, learnerBand, reviewItems, selectExercises, type ReviewItem } from "@/lib/atlas/engine";
import { markAtlasStarted, recordAtlasMission, type AtlasMissionResult } from "@/lib/atlas/progress";
import { BAND_ORDER, type AtlasExercise, type AtlasMission, type Band } from "@/lib/atlas/types";
import type { AtlasDestinationView } from "@/lib/atlas/legacy";
import { AtlasExerciseView, atlasExerciseLabel } from "@/components/atlas/mechanics";
import type { ExerciseOutcome } from "@/components/lesson/Exercises";
import { Badge, Button, EmptyState, LinkButton, Panel, ProgressBar, Segmented, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

type Phase = "brief" | "phrases" | "play" | "result";

interface QueueItem {
  ex: AtlasExercise;
  key: string;
  retry: boolean;
  review?: ReviewItem;
}

const BAND_HINT: Record<Band, string> = {
  A1: "mots et phrases simples",
  A2: "questions et situations courantes",
  B1: "raconter, tenir la conversation",
  B2: "argumenter, négocier, résoudre",
  C1: "nuances et précision",
};

function Practice({ items, accent, onFinish }: { items: QueueItem[]; accent: string; onFinish: (score: number) => void }) {
  const [queue, setQueue] = useState<QueueItem[]>(items);
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const first = useRef(new Map<string, ExerciseOutcome>());
  const finished = useRef(false);
  const item = queue[pos];

  const record = (o: ExerciseOutcome) => {
    setOutcome(o);
    if (item.review) void gameSignal(item.review.cardId, o.correct);
    if (item.retry) return;
    if (o.override) {
      first.current.set(item.key, { correct: true });
      setQueue((q) => q.filter((x, k) => !(k > pos && x.retry && x.key === item.key)));
      return;
    }
    first.current.set(item.key, o);
    if (!o.correct && !o.ungraded) setQueue((q) => [...q, { ...item, retry: true }]);
  };
  const next = () => {
    stopSpeaking();
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setOutcome(null);
      return;
    }
    if (finished.current) return;
    finished.current = true;
    const graded = [...first.current.values()].filter((o) => !o.ungraded);
    onFinish(graded.length ? graded.filter((o) => o.correct).length / graded.length : 1);
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {item.review ? `Souvenir de ${destName(item.review.fromDest)} · ` : ""}
            {item.retry ? `Deuxième essai · ${atlasExerciseLabel(item.ex)}` : atlasExerciseLabel(item.ex)}
          </span>
          <span className="tabular-nums">{pos + 1} / {queue.length}</span>
        </div>
        <ProgressBar value={pos + (outcome ? 1 : 0)} max={queue.length} />
      </div>
      <Panel className="animate-slide-up">
        <AtlasExerciseView key={`${pos}-${item.key}`} ex={item.ex} accent={accent} onDone={record} />
      </Panel>
      {outcome && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 md:bottom-4">
          <Button size="lg" className="w-full shadow-lg" onClick={next} autoFocus>
            {pos + 1 < queue.length ? "Continuer" : "Terminer la mission"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Result({ mission, dest, score, res, band, onRetry }: { mission: AtlasMission; dest: AtlasDestinationView; score: number; res: AtlasMissionResult | null; band: Band; onRetry: () => void }) {
  const s = useSettings();
  const lesson = mission.lesson ? getLesson(mission.lesson) : undefined;
  const passed = score >= 0.7;
  const progress = useLiveQuery(() => getDb().missions.toArray(), []) ?? [];
  const doneIds = new Set(progress.filter((p) => p.status === "done").map((p) => p.id));
  const isDone = (m: AtlasMission) => doneIds.has(m.id) || (!!m.legacyId && doneIds.has(m.legacyId));
  const ordered = [...dest.missions].sort((a, b) => a.order - b.order);
  const nextM = ordered.find((m) => m.order > mission.order && !isDone(m)) ?? ordered.find((m) => m.id !== mission.id && !isDone(m));
  const allDone = ordered.every(isDone);
  const finalReady = allDone && !dest.preview && dest.final.nodes.length > 0 && !doneIds.has(dest.final.id);
  const name = destName(dest.id);
  const val = res?.validation;

  return (
    <div className="space-y-5 pb-8">
      <Panel tone="highlight" className="space-y-3 text-center">
        <p className="font-display text-5xl font-bold tabular-nums">{Math.round(score * 100)}%</p>
        <p className="text-[17px] font-semibold">{passed ? `Mission réussie au niveau ${band}` : "Presque ! Rejoue-la pour valider la mission."}</p>
        {res?.higherBand && <p className="text-sm text-mint-600 dark:text-mint-400">Nouveau palier : tu as validé cette mission à un niveau plus élevé.</p>}
        {passed && res?.firstCompletion && (
          <p className="text-sm font-semibold text-sun-600 dark:text-sun-400">+{res.coins} pièces</p>
        )}
        {res?.reward && (
          <div className={cx("mx-auto w-fit max-w-xs rounded-3xl border border-line bg-surface px-6 py-4", !s.reduceMotion && "animate-pop")}>
            <Icon name="star" size={28} className="mx-auto text-sun-500" />
            <p className="mt-2 font-semibold">{res.reward.fr}</p>
            <p className="text-xs italic text-muted">{res.reward.en}</p>
            <p className="mt-1 text-sm text-fg/75">{res.reward.desc}</p>
            {res.reward.shopItem && <p className="mt-1 text-xs text-muted">Ajouté à ton dressing.</p>}
          </div>
        )}
        {res && res.vocabAdded > 0 && <p className="text-sm text-muted">{res.vocabAdded} mot{res.vocabAdded > 1 ? "s" : ""} de la mission ajouté{res.vocabAdded > 1 ? "s" : ""} à tes flashcards : ils reviendront en révision et dans d&apos;autres destinations.</p>}
      </Panel>

      {val?.validated && (
        <Panel className="space-y-2 text-center">
          <p className="font-display text-lg font-semibold">{name} validée !</p>
          <p className="text-sm text-muted">Tampon, trophée et carte postale ajoutés à ton passeport. (Validation des situations de la destination, pas une certification officielle.)</p>
          <LinkButton href={`/world/postcards/${dest.id}`} variant="outline" size="sm">Écrire ma carte postale</LinkButton>
        </Panel>
      )}

      {mission.grammar.length > 0 && (
        <section className="space-y-2">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Grammaire travaillée</p>
          <div className="flex flex-wrap gap-1.5">{mission.grammar.map((g) => <Badge key={g} tone={passed ? "mint" : "gray"}>{g}</Badge>)}</div>
        </section>
      )}

      {(lesson || mission.scenario) && (
        <div className="divide-y divide-line rounded-2xl border border-line">
          {lesson && (
            <Link href={`/cours/${lesson.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <Icon name="course" size={18} className="text-muted" />
              <span className="flex-1 text-[15px] font-medium">Cours lié : {lesson.title}</span>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          )}
          {mission.scenario && (
            <Link href={`/chat/${mission.scenario}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <Icon name="chat" size={18} className="text-muted" />
              <span className="flex-1 text-[15px] font-medium">Rejouer la scène en conversation libre (IA)</span>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          )}
        </div>
      )}

      <div className="space-y-2">
        {finalReady ? (
          <LinkButton href={`/world/final/${dest.id}`} size="lg" className="w-full">Mission finale : {dest.final.title}</LinkButton>
        ) : nextM ? (
          <LinkButton href={`/world/mission/${nextM.id}`} size="lg" className="w-full">Mission suivante : {nextM.title}</LinkButton>
        ) : (
          <LinkButton href={`/world/${dest.id}`} size="lg" className="w-full">Retour à {name}</LinkButton>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onRetry}>Rejouer</Button>
          <LinkButton href={`/world/${dest.id}`} variant="secondary">{name}</LinkButton>
        </div>
      </div>
    </div>
  );
}

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const ref = useMemo(() => getAtlasMission(id), [id]);
  const mission = ref?.mission;
  const dest = ref?.dest;
  const [phase, setPhase] = useState<Phase>("brief");
  const [band, setBand] = useState<Band | null>(null);
  const [items, setItems] = useState<QueueItem[] | null>(null);
  const [score, setScore] = useState(0);
  const [res, setRes] = useState<AtlasMissionResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const accent = dest && mission ? accentFor(dest.id, dest.characters[0]?.accent) : "en-GB";

  useEffect(() => {
    void learnerBand().then((b) => setBand((cur) => cur ?? b));
  }, []);

  // Destination accent for every audio of the mission; the learner's preference is restored on exit.
  useEffect(() => {
    if (!ref) return;
    const before = getPrefs();
    setSpeechPrefs({ accent, voiceURI: undefined });
    void markAtlasStarted(ref.progressId);
    return () => {
      stopSpeaking();
      setSpeechPrefs({ accent: before.accent, voiceURI: before.voiceURI });
    };
  }, [ref, accent]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (!ref || !mission || !dest) {
    return (
      <EmptyState title="Mission introuvable">
        <Link href="/world" className="font-semibold text-ink-600 underline">Retour à la carte</Link>
      </EmptyState>
    );
  }

  const b = band ?? "A1";
  const place = dest.places.find((p) => p.id === mission.place);
  const name = destName(dest.id);

  const start = async () => {
    const chosen = selectExercises(mission, b).map((ex, i): QueueItem => ({ ex, key: `m${i}`, retry: false }));
    let review: ReviewItem[] = [];
    try {
      review = await reviewItems(dest.id, mission, 2);
    } catch {
      review = [];
    }
    // reviews from other destinations come after the warm-up, before the hardest items
    const at = Math.min(2, chosen.length);
    const merged = [...chosen.slice(0, at), ...review.map((r, i): QueueItem => ({ ex: r.exercise, key: `r${i}`, retry: false, review: r })), ...chosen.slice(at)];
    setItems(merged);
    setPhase("play");
  };

  const finish = (sc: number) => {
    setScore(sc);
    setRes(null);
    setPhase("result");
    recordAtlasMission(ref.progressId, sc, b).then(setRes).catch(() => setRes(null));
  };

  const steps: { k: Phase; label: string }[] = [
    { k: "brief", label: "Briefing" },
    { k: "phrases", label: "Phrases clés" },
    { k: "play", label: "Mission" },
    { k: "result", label: "Bilan" },
  ];
  const idx = steps.findIndex((s) => s.k === phase);
  const vocab = mission.vocab.map((v) => dest.vocab.find((x) => x.id === v)).filter((v): v is NonNullable<typeof v> => !!v);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/world/${dest.id}`} className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
            <Icon name="arrow" size={16} className="rotate-180" /> {name}
          </Link>
          <div className="flex gap-1.5">
            {dest.preview && <Badge tone="sun">Aperçu</Badge>}
            <Badge tone="ink">{b}</Badge>
            <Badge tone="gray"><Icon name="clock" size={13} className="mr-1 inline" />{mission.minutes} min</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: dest.palette.accent }}>
            <Icon name="map" size={22} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted">
              Mission {mission.order}
              {place ? ` · ${place.name}` : ""}
            </p>
            <h1 className="font-display text-[24px] font-bold leading-tight">{mission.title}</h1>
          </div>
        </div>
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Étapes de la mission">
          {steps.map((s, i) => (
            <li key={s.k} className="space-y-1">
              <div className={cx("h-1 rounded-full", i <= idx ? "bg-ink-500" : "bg-surface-2")} />
              <p className={cx("text-[11.5px] font-medium", i === idx ? "text-fg" : "text-muted")}>{s.label}</p>
            </li>
          ))}
        </ol>
      </header>

      {phase === "brief" && (
        <div className="space-y-4">
          <Panel tone="highlight" className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Ta mission</p>
            <p className="text-[16px] leading-relaxed">{mission.briefing}</p>
            {mission.objectives[b] && <p className="text-sm text-muted"><strong className="text-fg">Objectif ({b}) :</strong> {mission.objectives[b]}</p>}
          </Panel>
          {mission.activityDisclaimer && (
            <p className="rounded-2xl bg-sun-100/60 px-4 py-3 text-[13.5px] dark:bg-sun-500/10">
              Exercice de langue, pas une formation à la sécurité ni à la pratique de ce sport.
            </p>
          )}
          <Panel className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Ton niveau pour cette mission</p>
            <Segmented value={b} onChange={(v) => setBand(v)} options={BAND_ORDER.map((x) => ({ value: x, label: x }))} />
            <p className="text-[13px] text-muted">{b} : {BAND_HINT[b]}. Les exercices s&apos;adaptent ; tu peux rejouer plus tard à un niveau supérieur.</p>
          </Panel>
          {mission.grammar.length > 0 && <p className="text-sm text-muted"><strong className="text-fg">Grammaire :</strong> {mission.grammar.join(" · ")}</p>}
          <Button size="lg" className="w-full" onClick={() => setPhase("phrases")}>C&apos;est parti</Button>
        </div>
      )}

      {phase === "phrases" && (
        <div className="space-y-4">
          <section className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Phrases clés</p>
            <div className="divide-y divide-line rounded-2xl border border-line">
              {mission.phrases.map((p, i) => (
                <div key={i} className="flex items-start gap-1 px-3 py-2.5">
                  <SpeakButton text={p.en} accent={accent} size={16} className="-ml-1 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[15.5px] font-medium">{p.en}</p>
                    <p className="text-[14px] text-muted">{p.fr}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {vocab.length > 0 && (
            <section className="space-y-2">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Mots de la mission</p>
              <div className="flex flex-wrap gap-1.5">
                {vocab.map((v) => (
                  <span key={v.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-1 pl-3 pr-1 text-[14px]">
                    {v.en} <span className="text-muted">· {v.fr}</span>
                    <SpeakButton text={v.en} accent={accent} size={13} className="p-1" />
                  </span>
                ))}
              </div>
            </section>
          )}
          <Button size="lg" className="w-full" onClick={() => void start()}>Je suis prêt(e)</Button>
        </div>
      )}

      {phase === "play" && items && items.length > 0 && <Practice key={attempt} items={items} accent={accent} onFinish={finish} />}
      {phase === "play" && items && items.length === 0 && (
        <EmptyState title="Aucun exercice pour cette mission">
          <Link href={`/world/${dest.id}`} className="font-semibold text-ink-600 underline">Retour</Link>
        </EmptyState>
      )}
      {phase === "result" && (
        <Result
          mission={mission}
          dest={dest}
          score={score}
          res={res}
          band={b}
          onRetry={() => {
            setAttempt((a) => a + 1);
            setPhase("brief");
          }}
        />
      )}
    </article>
  );
}
