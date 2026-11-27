"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDb, uid } from "@/lib/db";
import { getPracticePool, distractors, type PoolItem } from "@/lib/pool";
import { getGrammarLesson } from "@/lib/data/grammar";
import { GRAMMAR_ITEMS, READING_PASSAGES, type McqItem, type ReadingPassage } from "@/lib/data/test-bank";
import { currentLevel } from "@/lib/progress";
import { checkAnswer, sample, shuffle } from "@/lib/text";
import { speak } from "@/lib/speech";
import { gameSignal } from "@/lib/srs";
import { recordMistake, trackActivity } from "@/lib/track";
import { useT } from "@/hooks/useT";
import { Button, EmptyState, PageHeader, Panel, ProgressBar, SpeakButton, cx } from "@/components/ui";
import type { SkillArea } from "@/lib/types";

type Q =
  | { type: "recog"; item: PoolItem; options: string[] }
  | { type: "prod"; item: PoolItem }
  | { type: "listen"; item: PoolItem; options: string[] }
  | { type: "grammar"; g: McqItem }
  | { type: "reading"; p: ReadingPassage; qi: number };

const AREA: Record<Q["type"], SkillArea> = { recog: "vocabulary", prod: "writing", listen: "listening", grammar: "grammar", reading: "reading" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

async function buildTest(kind: "weekly" | "monthly"): Promise<Q[]> {
  const n = kind === "weekly" ? { recog: 8, prod: 5, listen: 5, grammar: 6 } : { recog: 12, prod: 8, listen: 8, grammar: 10 };
  const pool = await getPracticePool(n.recog + n.prod + n.listen + 10);
  const level = await currentLevel();
  const li = Math.max(0, LEVELS.indexOf(level));
  const near = GRAMMAR_ITEMS.filter((g) => Math.abs(LEVELS.indexOf(g.level) - li) <= 1);
  const qs: Q[] = [];
  const used = [...pool];
  const take = () => used.shift();
  for (let k = 0; k < n.recog; k++) { const it = take(); if (it) qs.push({ type: "recog", item: it, options: shuffle([it.fr, ...distractors(it, pool, 3, "fr")]) }); }
  for (let k = 0; k < n.prod; k++) { const it = take(); if (it) qs.push({ type: "prod", item: it }); }
  for (let k = 0; k < n.listen; k++) { const it = take(); if (it) qs.push({ type: "listen", item: it, options: shuffle([it.fr, ...distractors(it, pool, 3, "fr")]) }); }
  for (const g of sample(near.length >= n.grammar ? near : GRAMMAR_ITEMS, n.grammar)) qs.push({ type: "grammar", g });
  if (kind === "monthly") {
    const p = READING_PASSAGES.find((x) => x.level === (li <= 1 ? "A2" : li === 2 ? "B1" : "B2")) ?? READING_PASSAGES[0];
    p.questions.forEach((_, qi) => qs.push({ type: "reading", p, qi }));
  }
  return qs;
}

export default function PeriodicTest() {
  const { kind } = useParams<{ kind: string }>();
  const t = useT();
  const router = useRouter();
  const valid = kind === "weekly" || kind === "monthly";
  const [qs, setQs] = useState<Q[] | null>(null);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<{ type: Q["type"]; ok: boolean }[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<null | "exact" | "close" | "wrong">(null);
  const [final, setFinal] = useState<{ scores: Partial<Record<SkillArea, number>>; prev?: Partial<Record<SkillArea, number>> } | null>(null);

  useEffect(() => {
    if (valid) void buildTest(kind).then(setQs);
  }, [kind, valid]);

  const q = qs?.[i];
  useEffect(() => {
    if (q?.type === "listen") speak(q.item.en);
  }, [q]);

  if (!valid) return <EmptyState icon="🤔" title={t("Test inconnu", "Unknown test")} />;

  const record = async (ok: boolean) => {
    if (!q) return;
    const r = [...results, { type: q.type, ok }];
    setResults(r);
    if ((q.type === "recog" || q.type === "prod" || q.type === "listen") && q.item.cardId) await gameSignal(q.item.cardId, ok, q.type === "prod" ? "production" : q.type === "listen" ? "listening" : "recognition");
    if (!ok && q.type === "grammar") await recordMistake({ id: `grammar:${q.g.topic}`, type: "grammar", label: getGrammarLesson(q.g.topic)?.title ?? q.g.topic, detail: q.g.explanation });
  };

  const next = async () => {
    setPicked(null);
    setTyped("");
    setVerdict(null);
    if (qs && i + 1 < qs.length) return setI(i + 1);
    // Score by skill area.
    const all = results;
    const scores: Partial<Record<SkillArea, number>> = {};
    for (const type of Object.keys(AREA) as Q["type"][]) {
      const xs = all.filter((x) => x.type === type);
      if (!xs.length) continue;
      const area = AREA[type];
      const v = xs.filter((x) => x.ok).length / xs.length;
      scores[area] = scores[area] !== undefined ? (scores[area]! + v) / 2 : v;
    }
    const db = getDb();
    const prev = (await db.tests.where("type").equals(kind).sortBy("at")).pop();
    await db.tests.put({ id: uid("t"), type: kind as "weekly" | "monthly", scores, at: Date.now(), updatedAt: Date.now() });
    await trackActivity({ xp: 20 });
    setFinal({ scores, prev: prev?.scores });
  };

  const areaLabel = (a: SkillArea) => ({ vocabulary: t("Vocabulaire", "Vocabulary"), grammar: t("Grammaire", "Grammar"), reading: t("Compréhension écrite", "Reading"), listening: t("Compréhension orale", "Listening"), writing: t("Expression écrite", "Writing"), speaking: t("Expression orale", "Speaking") })[a];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={kind === "weekly" ? t("Test hebdomadaire", "Weekly test") : t("Test mensuel", "Monthly test")} subtitle={t("Mesure tes progrès réels sur tes propres mots et la grammaire", "Measures your real progress")} back="/tests" />
      {!qs && <div className="h-60 animate-pulse rounded-2xl bg-surface-2" />}
      {qs && !final && q && (
        <>
          <ProgressBar value={i} max={qs.length} className="mb-4" />
          <div key={i} className="animate-pop">
            {(q.type === "recog" || q.type === "listen") && (
              <>
                <p className="mb-2 text-sm text-muted">{q.type === "recog" ? t("Que signifie…", "What does it mean…") : t("Écoute et choisis le sens", "Listen and choose")}</p>
                <Panel className="flex items-center justify-center gap-2 py-8">
                  {q.type === "recog" ? <p className="text-2xl font-semibold">{q.item.en}</p> : <SpeakButton text={q.item.en} size={36} label={t("Réécouter", "Replay")} />}
                </Panel>
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, k) => (
                    <button key={o + k} disabled={picked !== null} onClick={() => { setPicked(k); void record(o === q.item.fr); }} className={cx("rounded-xl border px-4 py-3 text-left", picked === null ? "border-line bg-surface hover:border-ink-300" : o === q.item.fr ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
                  ))}
                </div>
                {picked !== null && q.type === "listen" && <p className="mt-2 text-center text-sm text-muted">{q.item.en}</p>}
              </>
            )}
            {q.type === "prod" && (
              <>
                <p className="mb-2 text-sm text-muted">{t("Écris en anglais", "Write in English")}</p>
                <Panel className="py-8 text-center"><p className="text-2xl font-semibold">{q.item.fr}</p></Panel>
                <form onSubmit={(e) => { e.preventDefault(); if (verdict) return; const v = checkAnswer(typed, q.item.en); setVerdict(v); void record(v !== "wrong"); }}>
                  <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} disabled={!!verdict} autoCapitalize="off" autoCorrect="off" spellCheck={false} className="mt-3 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg outline-none focus:border-ink-400" />
                  {!verdict && <Button type="submit" className="mt-3 w-full">{t("Valider", "Check")}</Button>}
                </form>
                {verdict && <p className={cx("mt-2 text-sm font-medium", verdict === "wrong" ? "text-coral-600" : "text-mint-600")}>{verdict === "wrong" ? t(`Réponse : ${q.item.en}`, `Answer: ${q.item.en}`) : verdict === "close" ? t(`Presque ! ${q.item.en}`, `Almost! ${q.item.en}`) : "✓"}</p>}
              </>
            )}
            {q.type === "grammar" && (
              <>
                <p className="mb-2 text-sm text-muted">{t("Grammaire", "Grammar")} · {q.g.level}</p>
                <Panel className="py-6 text-center"><p className="text-xl font-medium">{q.g.prompt}</p></Panel>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {q.g.options.map((o, k) => (
                    <button key={o} disabled={picked !== null} onClick={() => { setPicked(k); void record(k === q.g.answer); }} className={cx("rounded-xl border px-4 py-3", picked === null ? "border-line bg-surface hover:border-ink-300" : k === q.g.answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
                  ))}
                </div>
                {picked !== null && <p className="mt-3 text-sm text-muted">{q.g.explanation}</p>}
              </>
            )}
            {q.type === "reading" && (
              <>
                <Panel className="max-h-64 overflow-y-auto">
                  <p className="mb-1 font-semibold">{q.p.title}</p>
                  <p className="font-serif text-[16px] leading-relaxed">{q.p.text}</p>
                </Panel>
                <p className="mt-3 font-medium">{q.p.questions[q.qi].q}</p>
                <div className="mt-2 grid gap-2">
                  {q.p.questions[q.qi].options.map((o, k) => (
                    <button key={o} disabled={picked !== null} onClick={() => { setPicked(k); void record(k === q.p.questions[q.qi].answer); }} className={cx("rounded-xl border px-4 py-3 text-left", picked === null ? "border-line bg-surface hover:border-ink-300" : k === q.p.questions[q.qi].answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
                  ))}
                </div>
              </>
            )}
            {(picked !== null || verdict) && <Button className="mt-4 w-full" onClick={next}>{i + 1 < qs.length ? t("Suivant", "Next") : t("Voir les résultats", "See results")}</Button>}
          </div>
        </>
      )}
      {final && (
        <Panel>
          <p className="text-lg font-semibold">{t("Résultats", "Results")}</p>
          <ul className="mt-3 space-y-3">
            {(Object.entries(final.scores) as [SkillArea, number][]).map(([a, v]) => {
              const p = final.prev?.[a];
              const diff = p !== undefined ? Math.round((v - p) * 100) : null;
              return (
                <li key={a}>
                  <div className="flex justify-between text-sm"><span>{areaLabel(a)}</span><span className="tabular-nums">{Math.round(v * 100)} %{diff !== null && <span className={cx("ml-2", diff >= 0 ? "text-mint-600" : "text-coral-600")}>{diff >= 0 ? "+" : ""}{diff}</span>}</span></div>
                  <ProgressBar value={v} className="mt-1" tone={v >= 0.8 ? "mint" : v >= 0.5 ? "ink" : "coral"} />
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex gap-2"><Button onClick={() => router.push("/stats")}>{t("Voir mes statistiques", "See statistics")}</Button><Button variant="outline" onClick={() => router.push("/review")}>{t("Réviser", "Review")}</Button></div>
        </Panel>
      )}
    </div>
  );
}
