"use client";
// Mission player: briefing → key phrases (local accent) → dialogue & exercises → result + souvenir.
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getDestination, getMission, PLACE_LABEL, type Mission, type WorldDestination } from "@/lib/data/world";
import { markMissionStarted, recordMission, type MissionResult } from "@/lib/world";
import { getPrefs, setSpeechPrefs, speak, stopSpeaking } from "@/lib/speech";
import { getLesson } from "@/lib/curriculum";
import { useSettings } from "@/hooks/useSettings";
import { DESTINATIONS } from "@/lib/data/destinations";
import { Stamp } from "@/components/passport/Stamp";
import { ExerciseView, exerciseLabel, type ExerciseOutcome } from "@/components/lesson/Exercises";
import { DestinationScene, PlaceGlyph, SouvenirArt } from "@/components/world/art";
import { Badge, Button, EmptyState, LinkButton, Panel, ProgressBar, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

type Phase = "brief" | "phrases" | "play" | "result";

function Practice({ mission, onFinish }: { mission: Mission; onFinish: (score: number) => void }) {
  const [queue, setQueue] = useState(() => mission.exercises.map((_, i) => ({ i, retry: false })));
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const first = useRef(new Map<number, ExerciseOutcome>());
  const finished = useRef(false);
  const item = queue[pos];
  const ex = mission.exercises[item.i];

  const record = (o: ExerciseOutcome) => {
    setOutcome(o);
    if (item.retry) return;
    if (o.override) {
      first.current.set(item.i, { correct: true });
      setQueue((q) => q.filter((x, k) => !(k > pos && x.retry && x.i === item.i)));
      return;
    }
    first.current.set(item.i, o);
    if (!o.correct && !o.ungraded) setQueue((q) => [...q, { i: item.i, retry: true }]);
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
          <span>{item.retry ? `Deuxième essai · ${exerciseLabel(ex)}` : exerciseLabel(ex)}</span>
          <span className="tabular-nums">{pos + 1} / {queue.length}</span>
        </div>
        <ProgressBar value={pos + (outcome ? 1 : 0)} max={queue.length} />
      </div>
      <Panel className="animate-slide-up">
        <ExerciseView key={`${pos}-${item.i}`} ex={ex} onDone={record} />
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

function Result({ mission, dest, score, res, onRetry }: { mission: Mission; dest: WorldDestination; score: number; res: MissionResult | null; onRetry: () => void }) {
  const s = useSettings();
  const lesson = mission.lesson ? getLesson(mission.lesson) : undefined;
  const passed = score >= 0.7;
  const stamp = res?.destinationCompleted ? DESTINATIONS.find((d) => d.id === dest.id) : undefined;
  const nextM = dest.missions[dest.missions.findIndex((m) => m.id === mission.id) + 1];
  return (
    <div className="space-y-5 pb-8">
      <Panel tone="highlight" className="space-y-3 text-center">
        <p className="font-display text-5xl font-bold tabular-nums">{Math.round(score * 100)}%</p>
        <p className="text-[17px] font-semibold">{passed ? "Mission réussie !" : "Presque ! Rejoue-la pour gagner le souvenir."}</p>
        {passed && res?.firstCompletion && (
          <div className={cx("mx-auto w-fit rounded-3xl border border-line bg-surface px-6 py-4", !s.reduceMotion && "animate-pop")}>
            <SouvenirArt motif={mission.souvenir.motif} size={64} className="mx-auto" color={dest.palette.accent} />
            <p className="mt-2 font-semibold">{mission.souvenir.fr}</p>
            <p className="text-xs italic text-muted">{mission.souvenir.en}</p>
            <p className="mt-1 max-w-xs text-sm text-fg/75">{mission.souvenir.desc}</p>
            <p className="mt-2 text-sm font-semibold text-sun-500">+{res.coins} pièces</p>
          </div>
        )}
        {passed && res && !res.firstCompletion && <p className="text-sm text-muted">Souvenir déjà obtenu — bonne révision !</p>}
      </Panel>

      {stamp && (
        <Panel className="space-y-2 text-center">
          <Stamp dest={stamp} size={120} tilt={-8} className={cx("mx-auto", !s.reduceMotion && "animate-pop")} />
          <p className="font-display text-lg font-semibold">{dest.nameFr} est terminée !</p>
          <p className="text-sm text-muted">Le tampon a été ajouté à ton passeport.</p>
          <LinkButton href="/profile/passport" variant="outline" size="sm">Ouvrir mon passeport</LinkButton>
        </Panel>
      )}

      <section className="space-y-2">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Compétences travaillées</p>
        <div className="flex flex-wrap gap-1.5">{mission.skills.map((k) => <Badge key={k} tone={passed ? "mint" : "gray"}>{k}</Badge>)}</div>
      </section>

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

      <div className="space-y-2">
        {nextM ? (
          <LinkButton href={`/world/mission/${nextM.id}`} size="lg" className="w-full">Mission suivante : {nextM.title}</LinkButton>
        ) : (
          <LinkButton href={`/world/${dest.id}`} size="lg" className="w-full">Retour à {dest.nameFr}</LinkButton>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onRetry}>Rejouer</Button>
          <LinkButton href="/world" variant="secondary">Carte du monde</LinkButton>
        </div>
      </div>
    </div>
  );
}

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const mission = getMission(id);
  const dest = mission ? getDestination(mission.dest) : undefined;
  const [phase, setPhase] = useState<Phase>("brief");
  const [score, setScore] = useState(0);
  const [res, setRes] = useState<MissionResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Local accent for every audio of the mission; the learner's preference is restored on exit.
  useEffect(() => {
    if (!dest || !mission) return;
    const before = getPrefs();
    setSpeechPrefs({ accent: dest.accent, voiceURI: undefined });
    void markMissionStarted(mission.id);
    return () => {
      stopSpeaking();
      setSpeechPrefs({ accent: before.accent, voiceURI: before.voiceURI });
    };
  }, [dest, mission]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (!mission || !dest) {
    return (
      <EmptyState title="Mission introuvable">
        <Link href="/world" className="font-semibold text-ink-600 underline">Retour à la carte</Link>
      </EmptyState>
    );
  }

  const finish = (sc: number) => {
    setScore(sc);
    setRes(null);
    setPhase("result");
    recordMission(mission.id, sc).then(setRes).catch(() => setRes(null));
  };

  const steps: { k: Phase; label: string }[] = [
    { k: "brief", label: "Briefing" },
    { k: "phrases", label: "Phrases clés" },
    { k: "play", label: "Mission" },
    { k: "result", label: "Bilan" },
  ];
  const idx = steps.findIndex((s) => s.k === phase);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/world/${dest.id}`} className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
            <Icon name="arrow" size={16} className="rotate-180" /> {dest.nameFr}
          </Link>
          <div className="flex gap-1.5">
            <Badge tone="ink">{mission.level}</Badge>
            <Badge tone="gray"><Icon name="clock" size={13} className="mr-1 inline" />{mission.minutes} min</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: dest.palette.accent }}>
            <PlaceGlyph place={mission.place} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-muted">{PLACE_LABEL[mission.place]} · {mission.placeName}</p>
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
          <div className="overflow-hidden rounded-3xl border border-line">
            <DestinationScene dest={dest} />
          </div>
          <Panel tone="highlight" className="space-y-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Ta mission</p>
            <p className="text-[16px] leading-relaxed">{mission.briefing}</p>
            <p className="text-sm text-muted"><strong className="text-fg">Objectif :</strong> {mission.goal}</p>
          </Panel>
          <Panel tone="subtle" className="flex items-center gap-3">
            <SouvenirArt motif={mission.souvenir.motif} size={36} color={dest.palette.accent} />
            <p className="text-sm">À gagner : <strong>un souvenir</strong> et {mission.coins} pièces. Les voix utilisent l&apos;{dest.accentLabel} quand ton appareil le propose.</p>
          </Panel>
          <Button size="lg" className="w-full" onClick={() => setPhase("phrases")}>C&apos;est parti</Button>
        </div>
      )}

      {phase === "phrases" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Phrases utiles</p>
            <button type="button" onClick={() => speak(mission.phrases.map((p) => p.en).join(" … "), { accent: dest.accent })} className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:underline dark:text-ink-300">
              <Icon name="headphones" size={16} /> Tout écouter
            </button>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {mission.phrases.map((p) => (
              <div key={p.en} className="flex items-start gap-1 px-3 py-2.5">
                <SpeakButton text={p.en} accent={dest.accent} size={16} className="-ml-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[15.5px] font-medium">{p.en}</p>
                  <p className="text-[14px] text-muted">{p.fr}</p>
                </div>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => setPhase("play")}>Je suis prêt(e)</Button>
        </div>
      )}

      {phase === "play" && <Practice key={attempt} mission={mission} onFinish={finish} />}

      {phase === "result" && (
        <Result
          mission={mission}
          dest={dest}
          score={score}
          res={res}
          onRetry={() => {
            setAttempt((a) => a + 1);
            setPhase("play");
          }}
        />
      )}
    </article>
  );
}
