"use client";
import Link from "next/link";
import { useState } from "react";
import { getPronLesson, PRON_LESSONS, TRAP_SENTENCES } from "@/lib/data/pronunciation";
import { recognitionSupported } from "@/lib/speech";
import { sample, shuffle } from "@/lib/text";
import { useT } from "@/hooks/useT";
import { Badge, Button, LinkButton, PageHeader, Panel, ProgressBar } from "@/components/ui";
import { PairQuestion, Runner, SortQuestion, SpeakQuestion, TapQuestion, type Answer, type RunnerItem } from "@/components/pronunciation/questions";
import { saveBilan, type BilanSummary } from "@/components/pronunciation/progress";

function buildBilan(t: (fr: string, en: string) => string, withSpeech: boolean): RunnerItem[] {
  const items: RunnerItem[] = [];
  // 1) Minimal-pair discrimination: one pair from each sound lesson (max 8).
  const pairLessons = sample(PRON_LESSONS.filter((l) => l.pairs?.length && !l.pairs[0].a.includes(" ")), 8);
  for (const l of pairLessons) {
    const pair = sample(l.pairs!, 1)[0];
    const target = Math.random() < 0.5 ? "a" : "b";
    const flip = Math.random() < 0.5;
    items.push({ key: `p-${l.id}`, lesson: l.id, render: (on) => <PairQuestion pair={pair} target={target} flip={flip} onAnswer={on} /> });
  }
  // 2) Word stress (3), sentence stress (1), silent letters (1).
  const tapLesson = (id: string, n: number) => {
    const l = PRON_LESSONS.find((x) => x.id === id)!;
    for (const item of sample(l.tap!.items, n)) items.push({ key: `t-${id}-${item.word}`, lesson: id, render: (on) => <TapQuestion item={item} prompt={t(l.tap!.prompt, l.tap!.promptEn)} letters={id === "silent"} onAnswer={on} /> });
  };
  tapLesson("word-stress", 3);
  tapLesson("rhythm", 1);
  tapLesson("silent", 1);
  // 3) Endings and intonation sorting.
  const sortLesson = (id: string, n: number) => {
    const l = PRON_LESSONS.find((x) => x.id === id)!;
    for (const item of sample(l.sort!.items, n)) items.push({ key: `o-${id}-${item.text}`, lesson: id, render: (on) => <SortQuestion item={item} categories={l.sort!.categories} prompt={t(l.sort!.prompt, l.sort!.promptEn)} onAnswer={on} /> });
  };
  sortLesson("ed", 2);
  sortLesson("s", 2);
  sortLesson("intonation", 1);
  const shuffled = shuffle(items);
  // 4) Read-aloud sentences full of traps (only scored with speech recognition).
  if (withSpeech) {
    for (const s of sample(TRAP_SENTENCES, 4)) shuffled.push({ key: `r-${s.lesson}`, lesson: s.lesson, render: (on) => <SpeakQuestion text={s.text} onAnswer={on} /> });
  }
  return shuffled;
}

export default function PronunciationBilan() {
  const t = useT();
  const [rec] = useState(() => recognitionSupported());
  const [items, setItems] = useState<RunnerItem[] | null>(null);
  const [summary, setSummary] = useState<BilanSummary | null>(null);

  const finish = async (answers: { lesson?: string; answer: Answer }[]) => {
    setSummary(await saveBilan(answers));
    setItems(null);
  };

  if (summary) {
    const rows = Object.entries(summary.byLesson).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]);
    const score = rows.reduce((s, [, v]) => s + v[0], 0);
    const total = rows.reduce((s, [, v]) => s + v[1], 0);
    const weak = rows.filter(([, [ok, n]]) => ok / n < 0.7);
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <PageHeader title={t("Résultats du bilan", "Check-up results")} back="/pronunciation" />
        <Panel className="text-center">
          <p className="text-4xl font-semibold">{Math.round((score / Math.max(1, total)) * 100)} %</p>
          <p className="mt-1 text-sm text-muted">{score}/{total} {t("réponses correctes", "correct answers")}</p>
        </Panel>
        <Panel>
          <h2 className="mb-3 font-semibold">{t("Par point de prononciation", "By pronunciation point")}</h2>
          <ul className="space-y-3">
            {rows.map(([id, [ok, n]]) => {
              const l = getPronLesson(id);
              const r = ok / n;
              return (
                <li key={id}>
                  <div className="flex items-center justify-between text-sm">
                    <Link href={`/pronunciation/${id}`} className="hover:underline">{l?.emoji} {l ? t(l.title, l.titleEn) : id}</Link>
                    <span className="flex items-center gap-2"><span className="tabular-nums text-muted">{ok}/{n}</span>{r >= 0.7 ? <Badge tone="mint">{t("acquis", "good")}</Badge> : <Badge tone="coral">{t("à travailler", "work on it")}</Badge>}</span>
                  </div>
                  <ProgressBar value={ok} max={n} className="mt-1" tone={r >= 0.7 ? "mint" : "coral"} />
                </li>
              );
            })}
          </ul>
        </Panel>
        {weak.length > 0 && (
          <Panel>
            <h2 className="mb-2 font-semibold">{t("Commence par ces leçons", "Start with these lessons")}</h2>
            <div className="flex flex-wrap gap-2">
              {weak.slice(0, 4).map(([id]) => {
                const l = getPronLesson(id);
                return l ? <LinkButton key={id} href={`/pronunciation/${id}`} variant="outline" size="sm">{l.emoji} {t(l.title, l.titleEn)}</LinkButton> : null;
              })}
            </div>
          </Panel>
        )}
        {!rec && <p className="text-center text-xs text-muted">{t("Sans reconnaissance vocale, la lecture à voix haute n'a pas pu être évaluée.", "Read-aloud could not be assessed without speech recognition.")}</p>}
        <div className="flex justify-center gap-2">
          <Button onClick={() => { setSummary(null); setItems(buildBilan(t, rec)); }}>{t("Refaire un bilan", "Retake")}</Button>
          <LinkButton href="/pronunciation" variant="ghost">{t("Leçons", "Lessons")}</LinkButton>
        </div>
      </div>
    );
  }

  if (items) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("Bilan de prononciation", "Pronunciation check-up")} action={<Button variant="ghost" size="sm" onClick={() => setItems(null)}>{t("Quitter", "Quit")}</Button>} />
        <Runner items={items} onFinish={finish} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Bilan de prononciation", "Pronunciation check-up")} back="/pronunciation" />
      <Panel>
        <p className="text-[15px]">{t("Environ 20 questions qui passent en revue les erreurs les plus fréquentes des francophones :", "About 20 questions covering the most common French-speaker mistakes:")}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>👂 {t("entendre la différence entre des sons proches (ship/sheep, think/sink, hair/air…)", "hearing similar sounds apart")}</li>
          <li>🎯 {t("repérer l'accent tonique et les lettres muettes", "word stress and silent letters")}</li>
          <li>🗂️ {t("prononcer les terminaisons -ed et -s, l'intonation des questions", "-ed and -s endings, question intonation")}</li>
          <li>🎙️ {rec ? t("lire à voix haute des phrases pleines de pièges", "reading trap sentences aloud") : t("(lecture à voix haute indisponible dans ce navigateur)", "(read-aloud unavailable in this browser)")}</li>
        </ul>
        <p className="mt-3 text-xs text-muted">{t("Mettez le son. Le résultat est donné par point de prononciation, avec les leçons à travailler. Les retours vocaux sont indicatifs.", "Turn the sound on.")}</p>
        <Button className="mt-4 w-full" size="lg" onClick={() => setItems(buildBilan(t, rec))}>{t("Commencer", "Start")}</Button>
      </Panel>
    </div>
  );
}
