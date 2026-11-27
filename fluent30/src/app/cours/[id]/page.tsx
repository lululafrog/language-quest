"use client";
// Lesson player: every micro-lesson follows the same path —
// Comprendre (≈30 %) → Pratiquer (≈70 %) → Situation réelle → Bilan + révision programmée.
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ALL_LESSONS, PATH, THEME_MODULES, getLesson, sheetsForTag, LEVEL_INFO, type Lesson } from "@/lib/curriculum";
import { markLessonStarted, recordLessonResult } from "@/lib/curriculum/progress";
import { getDb } from "@/lib/db";
import { emit } from "@/lib/events";
import { quickAdd } from "@/lib/cards";
import { speak, stopSpeaking } from "@/lib/speech";
import { Badge, Button, EmptyState, LinkButton, Panel, ProgressBar, SpeakButton, toast, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ExerciseView, exerciseLabel, type ExerciseOutcome } from "@/components/lesson/Exercises";

type Phase = "learn" | "practice" | "situation" | "done";

const REGISTER_LABEL: Record<string, string> = { formel: "Formel", courant: "Courant", familier: "Familier", argot: "Argot" };

function SectionTitle({ n, children }: { n?: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-fg/50">
      {n !== undefined && <span className="grid h-5 w-5 place-items-center rounded-full bg-ink-100 text-[11px] text-ink-700 dark:bg-ink-900 dark:text-ink-300">{n}</span>}
      {children}
    </h2>
  );
}

function scenarioOf(l: Lesson): string {
  const tag = l.tags.find((t) => t.startsWith("scenario:"));
  if (tag) return tag.slice(9);
  const map: Record<string, string> = {
    restaurant: "restaurant", hotel: "hotel", travel: "travel-meet", airport: "transport", dating: "flirt", "job-interview": "interview",
    work: "interview", opinions: "opinion", emergency: "problem-abroad", friends: "friends", "past-simple": "past-story", "going-to": "plans", will: "plans",
  };
  for (const t of l.tags) if (map[t]) return map[t];
  return "free";
}

function nextLessonAfter(l: Lesson): Lesson | undefined {
  const list = l.kind === "theme" ? THEME_MODULES : PATH;
  const i = list.findIndex((x) => x.id === l.id);
  return i >= 0 ? list[i + 1] : undefined;
}

// ---------- Learn ----------

function LearnView({ lesson, onStart, alreadyDone }: { lesson: Lesson; onStart: () => void; alreadyDone: boolean }) {
  const [adding, setAdding] = useState<string | null>(null);
  const addWord = async (en: string, fr: string) => {
    setAdding(en);
    try {
      const r = await quickAdd(en, { fr, source: "grammar" });
      toast(r.duplicateOf || r.merged ? `« ${en} » est déjà dans tes cartes` : `« ${en} » ajouté à tes cartes`);
    } catch {
      toast("Impossible d'ajouter ce mot pour l'instant", "err");
    } finally {
      setAdding(null);
    }
  };
  let n = 0;
  return (
    <div className="space-y-5 pb-6">
      <Panel tone="highlight" className="space-y-1.5">
        <SectionTitle>Objectif</SectionTitle>
        <p className="text-[17px] font-semibold leading-snug">{lesson.goal}</p>
      </Panel>

      <section className="space-y-2.5">
        <SectionTitle n={++n}>L&apos;essentiel</SectionTitle>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          {lesson.explanation.map((e, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
              <span>{e}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-2xl border-l-4 border-ink-500 bg-ink-50 px-4 py-3 text-[15.5px] font-semibold dark:bg-ink-900/50">{lesson.rule}</div>
      </section>

      {lesson.table && (
        <section className="space-y-2.5">
          <SectionTitle n={++n}>{lesson.table.caption ?? "Le tableau"}</SectionTitle>
          <div className="overflow-x-auto rounded-2xl border border-ink-100 dark:border-ink-800">
            <table className="w-full text-left text-[14.5px]">
              <thead className="bg-ink-50 dark:bg-ink-900/60">
                <tr>{lesson.table.head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {lesson.table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-ink-100 dark:border-ink-800">
                    {r.map((c, j) => <td key={j} className={cx("px-3 py-2 align-top", j === 0 && "font-medium")}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle n={++n}>Exemples</SectionTitle>
          <button type="button" onClick={() => speak(lesson.examples.map((e) => e.en).join(". "))} className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:underline dark:text-ink-300">
            <Icon name="headphones" size={16} /> Tout écouter
          </button>
        </div>
        <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-ink-800 dark:border-ink-800">
          {lesson.examples.map((e, i) => (
            <div key={i} className="flex items-start gap-1 px-3 py-2.5">
              <SpeakButton text={e.en} size={16} className="-ml-1 shrink-0" />
              <div className="min-w-0">
                <p className="text-[15.5px] font-medium">{e.en}</p>
                <p className="text-[14px] text-fg/60">{e.fr}</p>
                {e.note && <p className="mt-0.5 text-[13px] text-ink-600 dark:text-ink-300">{e.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {lesson.vocab && lesson.vocab.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle n={++n}>Vocabulaire utile</SectionTitle>
          <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-ink-800 dark:border-ink-800">
            {lesson.vocab.map((v, i) => (
              <div key={i} className="flex items-center gap-1 px-3 py-2">
                <SpeakButton text={v.en} size={15} className="-ml-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">
                    {v.en}
                    {v.register && v.register !== "courant" && <span className="ml-2 rounded-full bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-fg/60 dark:bg-ink-900">{REGISTER_LABEL[v.register]}</span>}
                  </p>
                  <p className="text-[13.5px] text-fg/60">{v.fr}{v.note ? ` — ${v.note}` : ""}</p>
                </div>
                <button type="button" disabled={adding === v.en} onClick={() => addWord(v.en, v.fr)} className="shrink-0 rounded-full p-2 text-fg/50 transition hover:bg-ink-50 hover:text-ink-600 disabled:opacity-40 dark:hover:bg-ink-900" aria-label={`Ajouter « ${v.en} » à mes cartes`} title="Ajouter à mes cartes">
                  <Icon name="plus" size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {lesson.registers && lesson.registers.length > 0 && (
        <section className="space-y-2.5">
          <SectionTitle n={++n}>Selon le registre</SectionTitle>
          <div className="space-y-2">
            {lesson.registers.map((r, i) => (
              <div key={i} className="rounded-2xl border border-ink-100 p-3 dark:border-ink-800">
                <p className="mb-1.5 text-[13px] font-semibold text-fg/60">{r.meaning}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14.5px]">
                  {(["formel", "courant", "familier", "argot"] as const).filter((k) => r[k]).map((k) => (
                    <div key={k} className="contents">
                      <dt className="text-fg/50">{REGISTER_LABEL[k]}</dt>
                      <dd className="font-medium">{r[k]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2.5">
        <SectionTitle n={++n}>Les pièges des francophones</SectionTitle>
        <div className="space-y-2">
          {lesson.mistakes.map((m, i) => (
            <div key={i} className="rounded-2xl border border-ink-100 p-3 dark:border-ink-800">
              <p className="text-[15px] text-coral-600 line-through decoration-coral-400/60 dark:text-coral-400">{m.wrong}</p>
              <p className="text-[15px] font-semibold text-mint-600 dark:text-mint-400">{m.right}</p>
              <p className="mt-1 text-[14px] text-fg/70">{m.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex gap-3 rounded-2xl bg-sun-100/60 p-4 dark:bg-sun-500/10">
        <Icon name="sparkle" size={20} className="mt-0.5 shrink-0 text-sun-500" />
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-fg/50">Astuce mémoire</p>
          <p className="text-[15.5px] leading-relaxed">{lesson.tip}</p>
        </div>
      </section>

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 md:bottom-4">
        <div>
          <Button size="lg" className="w-full shadow-lg" onClick={onStart}>
            {alreadyDone ? "Réviser avec les exercices" : `Passer à la pratique · ${lesson.exercises.length} exercices`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Practice ----------

function PracticeView({ lesson, onFinish }: { lesson: Lesson; onFinish: (score: number, missed: number[]) => void }) {
  // queue of exercise indexes; graded mistakes come back once at the end (spaced inside the lesson)
  const [queue, setQueue] = useState<{ i: number; retry: boolean }[]>(() => lesson.exercises.map((_, i) => ({ i, retry: false })));
  const [pos, setPos] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const first = useRef<Map<number, ExerciseOutcome>>(new Map());
  const finished = useRef(false);
  const item = queue[pos];
  const ex = lesson.exercises[item.i];

  const record = (o: ExerciseOutcome) => {
    if (o.override) {
      setOutcome(o);
      if (!item.retry) {
        first.current.set(item.i, { correct: true });
        setQueue((q) => q.filter((x, k) => !(k > pos && x.retry && x.i === item.i)));
      }
      return;
    }
    setOutcome(o);
    if (!item.retry) {
      first.current.set(item.i, o);
      if (!o.correct && !o.ungraded) setQueue((q) => [...q, { i: item.i, retry: true }]);
    }
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
    const graded = [...first.current.entries()].filter(([, o]) => !o.ungraded);
    const ok = graded.filter(([, o]) => o.correct).length;
    const missed = graded.filter(([, o]) => !o.correct).map(([i]) => i);
    onFinish(graded.length ? ok / graded.length : 1, missed);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-fg/60">
          <span>{item.retry ? "Deuxième essai" : exerciseLabel(ex)}</span>
          <span className="tabular-nums">{Math.min(pos + 1, queue.length)} / {queue.length}</span>
        </div>
        <ProgressBar value={pos + (outcome ? 1 : 0)} max={queue.length} />
      </div>
      {item.retry && <p className="-mt-2 text-sm font-medium text-fg/70">{exerciseLabel(ex)}</p>}
      <Panel className="animate-slide-up">
        <ExerciseView key={`${pos}-${item.i}`} ex={ex} onDone={record} />
      </Panel>
      {outcome && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 md:bottom-4">
          <div>
            <Button size="lg" className="w-full shadow-lg" onClick={next} autoFocus>
              {pos + 1 < queue.length ? "Continuer" : "Voir la situation réelle"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Situation ----------

function SituationView({ lesson, onDone }: { lesson: Lesson; onDone: () => void }) {
  const [showFr, setShowFr] = useState(false);
  const s = lesson.situation;
  const playAll = () => speak(s.dialogue.map((d) => d.en).join(" … "));
  return (
    <div className="space-y-5 pb-6">
      <Panel tone="highlight" className="space-y-1">
        <SectionTitle>Situation réelle</SectionTitle>
        <p className="text-[15.5px] leading-relaxed">{s.context}</p>
      </Panel>
      <div className="flex items-center justify-between">
        <button type="button" onClick={playAll} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">
          <Icon name="headphones" size={17} /> Écouter le dialogue
        </button>
        <button type="button" onClick={() => setShowFr((v) => !v)} className="text-sm font-medium text-fg/60 hover:underline">
          {showFr ? "Masquer la traduction" : "Voir la traduction"}
        </button>
      </div>
      <div className="space-y-2">
        {s.dialogue.map((d, i) => {
          const side = i % 2 === 1;
          return (
            <div key={i} className={cx("flex", side ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[85%] rounded-2xl px-3.5 py-2.5", side ? "rounded-br-md bg-ink-600 text-white dark:bg-ink-500" : "rounded-bl-md bg-ink-50 dark:bg-ink-900/60")}>
                <p className={cx("text-[11px] font-semibold uppercase tracking-wide", side ? "text-white/70" : "text-fg/50")}>{d.speaker}</p>
                <p className="flex items-start gap-1 text-[15.5px]">
                  <span>{d.en}</span>
                  <SpeakButton text={d.en} size={15} className={cx("-my-1 p-1", side && "text-white/80 hover:bg-white/10")} />
                </p>
                {showFr && <p className={cx("text-[13px]", side ? "text-white/70" : "text-fg/55")}>{d.fr}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Panel className="space-y-2">
        <SectionTitle>À toi</SectionTitle>
        <p className="text-[15.5px] leading-relaxed">{s.task}</p>
        <Link href={`/chat/${scenarioOf(lesson)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">
          <Icon name="chat" size={16} /> S&apos;entraîner en conversation avec l&apos;IA
        </Link>
        <p className="text-[12.5px] text-fg/50">La conversation IA nécessite une clé Anthropic configurée sur le serveur.</p>
      </Panel>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 md:bottom-4">
        <div>
          <Button size="lg" className="w-full shadow-lg" onClick={onDone}>
            Voir mon bilan
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Done ----------

function DoneView({ lesson, score, missed, onRetry }: { lesson: Lesson; score: number; missed: number[]; onRetry: () => void }) {
  const progress = useLiveQuery(() => getDb().lessons.get(lesson.id), [lesson.id]) ?? null;
  const next = nextLessonAfter(lesson);
  const sheets = useMemo(() => {
    const seen = new Set<string>();
    return lesson.tags.flatMap((t) => sheetsForTag(t)).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))).slice(0, 3);
  }, [lesson]);
  const pct = Math.round(score * 100);
  const passed = score >= 0.7;
  const days = progress ? Math.max(1, Math.round((progress.due - progress.lastAt) / 86_400_000)) : null;
  return (
    <div className="space-y-5 pb-10">
      <Panel tone="highlight" className="space-y-3 text-center">
        <p className="font-display text-5xl font-bold tabular-nums">{pct}%</p>
        <p className="text-[17px] font-semibold">{passed ? (score >= 0.9 ? "Excellent, c'est acquis." : "Leçon validée.") : "Bon début — on la reverra bientôt."}</p>
        <p className="text-[14px] text-fg/65">
          {missed.length ? `${missed.length} exercice${missed.length > 1 ? "s" : ""} raté${missed.length > 1 ? "s" : ""} au premier essai. ` : "Aucune erreur au premier essai. "}
          {days !== null && `Prochaine révision de cette leçon dans ${days} jour${days > 1 ? "s" : ""}.`}
        </p>
      </Panel>

      <section className="space-y-2.5">
        <SectionTitle>À retenir</SectionTitle>
        <ul className="space-y-2 text-[15.5px] leading-relaxed">
          {lesson.summary.map((s, i) => (
            <li key={i} className="flex gap-2.5">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-mint-600" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      {(sheets.length > 0 || lesson.related) && (
        <section className="space-y-2.5">
          <SectionTitle>Pour aller plus loin</SectionTitle>
          <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 dark:divide-ink-800 dark:border-ink-800">
            {sheets.map((s) => (
              <Link key={s.id} href={`/cours/fiches/${s.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-ink-50/60 dark:hover:bg-ink-900/40">
                <Icon name="sheet" size={18} className="text-fg/50" />
                <span className="flex-1 text-[15px] font-medium">Fiche : {s.title}</span>
                <Icon name="chevron" size={16} className="text-fg/40" />
              </Link>
            ))}
            {lesson.related?.grammar && (
              <Link href={`/grammar/${lesson.related.grammar}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-ink-50/60 dark:hover:bg-ink-900/40">
                <Icon name="grammar" size={18} className="text-fg/50" />
                <span className="flex-1 text-[15px] font-medium">Frise et exercices de grammaire</span>
                <Icon name="chevron" size={16} className="text-fg/40" />
              </Link>
            )}
            {lesson.related?.course && (
              <Link href={`/courses/${lesson.related.course}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-ink-50/60 dark:hover:bg-ink-900/40">
                <Icon name="course" size={18} className="text-fg/50" />
                <span className="flex-1 text-[15px] font-medium">Fiche de règle détaillée</span>
                <Icon name="chevron" size={16} className="text-fg/40" />
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="space-y-2">
        {next ? (
          <LinkButton href={`/cours/${next.id}`} size="lg" className="w-full">
            Leçon suivante : {next.title}
          </LinkButton>
        ) : (
          <LinkButton href="/cours" size="lg" className="w-full">Retour au parcours</LinkButton>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onRetry}>Refaire les exercices</Button>
          <LinkButton href="/cours" variant="secondary">Mon parcours</LinkButton>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const lesson = getLesson(id);
  const progress = useLiveQuery(() => getDb().lessons.get(id), [id]);
  const [phase, setPhase] = useState<Phase>(search.get("mode") === "review" ? "practice" : "learn");
  const [result, setResult] = useState<{ score: number; missed: number[] } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (lesson) void markLessonStarted(lesson.id);
    return () => stopSpeaking();
  }, [lesson]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);

  if (!lesson) {
    return (
      <EmptyState icon="?" title="Leçon introuvable">
        <Link href="/cours" className="font-semibold text-ink-600 underline">Retour aux cours</Link>
      </EmptyState>
    );
  }

  const finishPractice = (score: number, missed: number[]) => {
    if (result && phase !== "practice") return;
    setResult({ score, missed });
    setPhase("situation");
    // weak concepts: the lesson's main concept tags when several exercises were missed
    const weak = score < 0.8 ? lesson.tags.filter((t) => !t.startsWith("scenario:")).slice(0, 2) : [];
    recordLessonResult(lesson.id, score, weak).then(() => emit("lesson:done", { lessonId: lesson.id, score })).catch(() => toast("Résultat non enregistré (stockage indisponible)", "err"));
  };

  const steps: { k: Phase; label: string }[] = [
    { k: "learn", label: "Comprendre" },
    { k: "practice", label: "Pratiquer" },
    { k: "situation", label: "Situation" },
    { k: "done", label: "Bilan" },
  ];
  const stepIdx = steps.findIndex((s) => s.k === phase);
  const levelTitle = lesson.kind === "theme" ? "Vie réelle" : LEVEL_INFO[lesson.level]?.title;
  const indexInList = (lesson.kind === "theme" ? THEME_MODULES : ALL_LESSONS.filter((l) => l.level === lesson.level && l.kind !== "theme")).findIndex((l) => l.id === lesson.id);

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/cours" className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-fg/60 hover:bg-ink-50 dark:hover:bg-ink-900" aria-label="Retour aux cours">
            <Icon name="arrow" size={16} className="rotate-180" /> Cours
          </Link>
          <div className="flex items-center gap-1.5">
            <Badge tone="ink">{lesson.level}</Badge>
            <Badge tone="gray">
              <Icon name="clock" size={13} className="mr-1 inline" />
              {lesson.minutes} min
            </Badge>
            {progress?.status === "done" && <Badge tone="mint">Validée</Badge>}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-fg/50">
            {levelTitle}
            {indexInList >= 0 && ` · Leçon ${indexInList + 1}`}
          </p>
          <h1 className="font-display text-[26px] font-bold leading-tight">{lesson.title}</h1>
          {lesson.titleEn && <p className="text-[15px] text-fg/55">{lesson.titleEn}</p>}
        </div>
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Étapes de la leçon">
          {steps.map((s, i) => (
            <li key={s.k} className="space-y-1">
              <div className={cx("h-1 rounded-full", i <= stepIdx ? "bg-ink-500" : "bg-ink-100 dark:bg-ink-900")} />
              <p className={cx("text-[11.5px] font-medium", i === stepIdx ? "text-fg" : "text-fg/45")}>{s.label}</p>
            </li>
          ))}
        </ol>
      </header>

      {phase === "learn" && <LearnView lesson={lesson} alreadyDone={progress?.status === "done"} onStart={() => setPhase("practice")} />}
      {phase === "practice" && <PracticeView key={attempt} lesson={lesson} onFinish={finishPractice} />}
      {phase === "situation" && <SituationView lesson={lesson} onDone={() => setPhase("done")} />}
      {phase === "done" && result && (
        <DoneView
          lesson={lesson}
          score={result.score}
          missed={result.missed}
          onRetry={() => {
            setAttempt((a) => a + 1);
            setPhase("practice");
          }}
        />
      )}
    </article>
  );
}
