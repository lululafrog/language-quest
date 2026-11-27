"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { getPronLesson, PRON_LESSONS, type PronLesson } from "@/lib/data/pronunciation";
import { shuffle } from "@/lib/text";
import { useT } from "@/hooks/useT";
import { Badge, Button, EmptyState, LinkButton, PageHeader, Panel, SpeakButton } from "@/components/ui";
import { PairQuestion, Runner, SortQuestion, SpeakQuestion, TapQuestion, type Answer, type RunnerItem } from "@/components/pronunciation/questions";
import { saveLessonResult } from "@/components/pronunciation/progress";

type Kind = "listen" | "speak" | "tap" | "sort";

function buildItems(lesson: PronLesson, kind: Kind, t: (fr: string, en: string) => string): RunnerItem[] {
  if (kind === "listen") {
    const pairs = lesson.pairs ?? [];
    const rounds = Array.from({ length: Math.min(8, Math.max(pairs.length, 4)) }, (_, i) => pairs[i % pairs.length]);
    return shuffle(rounds).map((pair, i) => {
      const target = Math.random() < 0.5 ? "a" : "b";
    const flip = Math.random() < 0.5;
      return { key: `l${i}`, lesson: lesson.id, render: (on) => <PairQuestion pair={pair} target={target} flip={flip} onAnswer={on} /> };
    });
  }
  if (kind === "speak") {
    const fromPairs = (lesson.pairs ?? []).slice(0, 3).map((p) => ({ text: p.a, ipa: p.ipaA, rival: p.b }));
    const fromExamples = shuffle(lesson.examples).slice(0, fromPairs.length ? 1 : 3).map((e) => ({ text: e.word, ipa: e.ipa, rival: undefined as string | undefined }));
    const fromSentences = lesson.sentences.slice(0, 2).map((s) => ({ text: s, ipa: undefined, rival: undefined as string | undefined }));
    return [...fromPairs, ...fromExamples, ...fromSentences].map((x, i) => ({ key: `s${i}`, lesson: lesson.id, render: (on) => <SpeakQuestion text={x.text} ipa={x.ipa} rival={x.rival} onAnswer={on} /> }));
  }
  if (kind === "tap" && lesson.tap) {
    const tap = lesson.tap;
    return shuffle(tap.items).slice(0, 8).map((item, i) => ({ key: `t${i}`, lesson: lesson.id, render: (on) => <TapQuestion item={item} prompt={t(tap.prompt, tap.promptEn)} letters={lesson.id === "silent"} onAnswer={on} /> }));
  }
  if (kind === "sort" && lesson.sort) {
    const sort = lesson.sort;
    return shuffle(sort.items).slice(0, 10).map((item, i) => ({ key: `o${i}`, lesson: lesson.id, render: (on) => <SortQuestion item={item} categories={sort.categories} prompt={t(sort.prompt, sort.promptEn)} onAnswer={on} /> }));
  }
  return [];
}

export default function PronLessonPage() {
  const { lesson: id } = useParams<{ lesson: string }>();
  const t = useT();
  const lesson = getPronLesson(id);
  const [kind, setKind] = useState<Kind | null>(null);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; selfRated: number } | null>(null);

  if (!lesson) return <EmptyState icon="🔍" title={t("Leçon introuvable", "Lesson not found")}><Link href="/pronunciation" className="text-ink-600 underline">{t("Retour", "Back")}</Link></EmptyState>;

  const idx = PRON_LESSONS.findIndex((l) => l.id === lesson.id);
  const next = PRON_LESSONS[idx + 1];
  const exercises: { kind: Kind; label: string; desc: string }[] = [
    ...(lesson.pairs?.length ? [{ kind: "listen" as Kind, label: t("👂 Écoute discriminatoire", "👂 Listening"), desc: t("Entendez-vous la différence ?", "Can you hear the difference?") }] : []),
    ...(lesson.tap ? [{ kind: "tap" as Kind, label: lesson.id === "silent" ? t("🤫 Lettre muette", "🤫 Silent letter") : lesson.id === "rhythm" ? t("🥁 Mot accentué", "🥁 Stressed word") : t("🎯 Syllabe accentuée", "🎯 Stressed syllable"), desc: t(lesson.tap.prompt, lesson.tap.promptEn) }] : []),
    ...(lesson.sort ? [{ kind: "sort" as Kind, label: t("🗂️ Classer les sons", "🗂️ Sort the sounds"), desc: t(lesson.sort.prompt, lesson.sort.promptEn) }] : []),
    { kind: "speak", label: t("🎙️ Répéter", "🎙️ Repeat"), desc: t("Dites les mots et les phrases, retour indicatif", "Say words and sentences, indicative feedback") },
  ];

  const start = (k: Kind) => {
    setResult(null);
    setItems(buildItems(lesson, k, t));
    setKind(k);
    window.scrollTo({ top: 0 });
  };

  const finish = async (answers: { answer: Answer }[]) => {
    const r = await saveLessonResult(lesson.id, answers);
    setResult({ ...r, selfRated: answers.filter((a) => a.answer === null).length });
    setKind(null);
  };

  if (kind) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={lesson.title} subtitle={exercises.find((e) => e.kind === kind)?.label} action={<Button variant="ghost" size="sm" onClick={() => setKind(null)}>{t("Quitter", "Quit")}</Button>} />
        <Runner key={kind + items.length} items={items} onFinish={finish} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title={<span>{lesson.emoji} {t(lesson.title, lesson.titleEn)}</span>} subtitle={<span className="font-mono">{lesson.sound}</span>} back="/pronunciation" />

      {result && (
        <Panel className="animate-pop border-ink-200 text-center">
          {result.total ? (
            <>
              <p className="text-3xl font-semibold">{result.score}/{result.total}</p>
              <p className="mt-1 text-sm text-muted">{result.score / result.total >= 0.8 ? t("Excellent, ce son est en bonne voie ! 🎉", "Excellent! 🎉") : result.score / result.total >= 0.5 ? t("Pas mal ! Refaites l'exercice dans quelques jours.", "Not bad! Try again in a few days.") : t("Ce son mérite encore de l'entraînement : relisez les conseils et réessayez.", "Keep practising this sound.")}</p>
            </>
          ) : (
            <p className="text-sm text-muted">{t("Auto-évaluation terminée.", "Self-assessment done.")}</p>
          )}
          {result.selfRated > 0 && result.total > 0 && <p className="mt-1 text-xs text-muted">{t(`${result.selfRated} réponse(s) auto-évaluée(s) non comptée(s).`, `${result.selfRated} self-rated answer(s) not counted.`)}</p>}
        </Panel>
      )}

      <Panel>
        <p className="text-[15px] font-medium">{lesson.summary}</p>
        <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{t("Pourquoi c'est difficile pour un francophone", "Why it's hard for French speakers")}</h2>
        <p className="mt-1 text-[15px]">{lesson.why}</p>
        <h2 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{t("Comment faire", "How to do it")}</h2>
        <ul className="mt-1 space-y-1.5">
          {lesson.how.map((h, i) => <li key={i} className="flex gap-2 text-[15px]"><span className="text-ink-500">●</span><span>{h}</span></li>)}
        </ul>
      </Panel>

      <Panel>
        <h2 className="mb-3 font-semibold">{t("Exemples", "Examples")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {lesson.examples.map((e) => (
            <div key={e.word} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
              <span><span className="block font-medium">{e.word}</span><span className="font-mono text-xs text-muted">{e.ipa}</span>{e.note && <span className="block text-[11px] text-coral-600">{e.note}</span>}</span>
              <SpeakButton text={e.word} size={16} />
            </div>
          ))}
        </div>
      </Panel>

      {lesson.pairs?.length ? (
        <Panel>
          <h2 className="mb-1 font-semibold">{t("Paires minimales", "Minimal pairs")}</h2>
          <p className="mb-3 text-sm text-muted">{t("Un seul son change… et le sens aussi. Écoutez-les l'une après l'autre.", "One sound changes… and so does the meaning.")}</p>
          <ul className="space-y-2">
            {lesson.pairs.map((p) => (
              <li key={p.a + p.b} className="grid grid-cols-2 gap-2">
                {([[p.a, p.ipaA, p.frA], [p.b, p.ipaB, p.frB]] as const).map(([w, ipa, fr]) => (
                  <div key={w} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                    <span className="min-w-0"><span className="block font-medium">{w}</span><span className="font-mono text-xs text-muted">{ipa}</span>{fr && <span className="block truncate text-xs text-muted">{fr}</span>}</span>
                    <SpeakButton text={w} size={16} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Phrases d'entraînement", "Practice sentences")}</h2>
        <ul className="space-y-2">
          {lesson.sentences.map((s) => (
            <li key={s} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
              <span>{s}</span>
              <span className="flex shrink-0"><SpeakButton text={s} size={16} /><SpeakButton text={s} rate={0.6} size={14} label="×0.6" /></span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-semibold">{t("Erreurs fréquentes", "Common mistakes")}</h2>
        <ul className="space-y-3">
          {lesson.mistakes.map((m, i) => (
            <li key={i} className="text-[15px]">
              <p><span className="text-coral-600 line-through decoration-2">{m.wrong}</span> → <span className="font-medium text-mint-600">{m.right}</span></p>
              <p className="text-sm text-muted">{m.explanation}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="space-y-2">
        <h2 className="font-semibold">{t("S'entraîner", "Practise")}</h2>
        {exercises.map((e) => (
          <button key={e.kind} onClick={() => start(e.kind)} className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-ink-300">
            <span><span className="block font-medium">{e.label}</span><span className="block text-sm text-muted">{e.desc}</span></span>
            <span className="text-muted">›</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <LinkButton href="/pronunciation" variant="ghost" size="sm">← {t("Toutes les leçons", "All lessons")}</LinkButton>
        {next && <LinkButton href={`/pronunciation/${next.id}`} variant="outline" size="sm">{next.emoji} {t(next.title, next.titleEn)} →</LinkButton>}
      </div>
      <p className="text-center text-xs text-muted"><Badge tone="gray">IPA</Badge> {t("Transcriptions en anglais britannique standard.", "Standard British English transcriptions.")}</p>
    </div>
  );
}
