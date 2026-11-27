"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDb, uid } from "@/lib/db";
import { GLOBAL_SCALE, GV_ITEMS, LEVELS, LISTENING, READING } from "@/lib/data/cefr-test";
import { adaptiveResult, levelName, levelToScore, overallLevel, SKILL_LABELS, startAdaptive, stepAdaptive, type Adaptive, type SkillKey, type SkillResult } from "@/lib/cefr";
import { sample } from "@/lib/text";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Badge, Button, LinkButton, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import { ListeningBlock, McqBlock, ReadingBlock, SpeakingSection, WritingSection } from "@/components/cefr/sections";

type Phase = "intro" | "gv" | "reading" | "listening" | "writing" | "speaking" | "results";
const ORDER: Phase[] = ["gv", "reading", "listening", "writing", "speaking"];

interface TestState {
  phase: Phase;
  gv: Adaptive;
  gvBlock: number[]; // indices of the items drawn for the current grammar block
  reading: Adaptive;
  listening: Adaptive;
  results: Partial<Record<SkillKey, SkillResult>>;
  intelligibility?: number;
  startedAt: number;
}

const KEY = "fluent30.cefr.progress";
const LAST = "fluent30.cefr.last";

function fresh(): TestState {
  return { phase: "intro", gv: startAdaptive(1), gvBlock: drawBlock(), reading: startAdaptive(1), listening: startAdaptive(1), results: {}, startedAt: Date.now() };
}
function drawBlock() {
  return sample([0, 1, 2, 3, 4, 5], 5);
}

export default function CefrTestPage() {
  const t = useT();
  const status = useStatus();
  const [st, setSt] = useState<TestState | null>(null);
  const [resumable, setResumable] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore from localStorage once
    if (saved) setResumable(true);
    setSt(fresh());
  }, []);
  useEffect(() => {
    if (st && st.phase !== "intro" && st.phase !== "results") localStorage.setItem(KEY, JSON.stringify(st));
  }, [st]);

  const sectionIndex = st ? ORDER.indexOf(st.phase) : -1;
  const progress = st?.phase === "results" ? 1 : sectionIndex < 0 ? 0 : sectionIndex / ORDER.length;

  const goNext = (s: TestState): TestState => {
    const i = ORDER.indexOf(s.phase);
    return { ...s, phase: i + 1 < ORDER.length ? ORDER[i + 1] : "results" };
  };

  const finishSkill = (s: TestState, key: SkillKey, r: SkillResult) => goNext({ ...s, results: { ...s.results, [key]: r } });

  if (!st) return null;

  const header = <PageHeader title={t("Test de niveau complet", "Full level test")} subtitle={t("A1 → C2 · 5 compétences évaluées séparément · 25 à 35 min", "A1 → C2 · 5 skills · 25–35 min")} back="/tests" />;
  const bar = st.phase !== "intro" && st.phase !== "results" && (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{t("Partie", "Part")} {sectionIndex + 1}/5 · {t(SKILL_LABELS[phaseSkill(st.phase)].fr, SKILL_LABELS[phaseSkill(st.phase)].en)}</span>
        <button className="underline" onClick={() => setSt(goNext(st))}>{t("Passer cette partie", "Skip this part")}</button>
      </div>
      <ProgressBar value={progress} />
    </div>
  );

  if (st.phase === "intro") {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        <Panel>
          <p className="font-semibold">{t("Comment ça marche", "How it works")}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            <li>{t("Grammaire & vocabulaire — adaptatif : les questions montent de niveau si vous réussissez au moins 4/5.", "Grammar & vocabulary — adaptive: questions get harder when you score at least 4/5.")}</li>
            <li>{t("Compréhension écrite — textes de A1 à C2 (réussite : 2/3 bonnes réponses).", "Reading — A1 to C2 texts (pass: 2/3).")}</li>
            <li>{t("Compréhension orale — enregistrements écoutables 2 fois, comme à l'examen.", "Listening — recordings can be played twice, as in exams.")}</li>
            <li>{t("Expression écrite — un sujet adapté à votre niveau, évalué selon les critères du CECRL.", "Writing — a task at your level, assessed with CEFR criteria.")}</li>
            <li>{t("Expression orale — auto-évaluation avec la grille officielle, + lecture à voix haute facultative.", "Speaking — self-assessment with the official grid + optional read-aloud.")}</li>
          </ol>
          <p className="mt-3 text-xs text-muted">{t("Méthode inspirée de l'évaluation officielle du Cadre européen (CECRL) : chaque compétence reçoit son propre niveau. Vous pouvez passer une partie ou reprendre plus tard. Pas de dictionnaire ni de traducteur pendant le test.", "Inspired by official CEFR assessment: each skill gets its own level.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {resumable && <Button onClick={() => { try { setSt(JSON.parse(localStorage.getItem(KEY)!)); } catch { setSt({ ...fresh(), phase: "gv" }); } }}>{t("Reprendre le test en cours", "Resume test")}</Button>}
            <Button variant={resumable ? "outline" : "primary"} onClick={() => { localStorage.removeItem(KEY); setSt({ ...fresh(), phase: "gv" }); }}>{resumable ? t("Recommencer", "Start over") : t("Commencer le test", "Start the test")}</Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (st.phase === "gv") {
    const level = LEVELS[st.gv.current];
    const items = st.gvBlock.map((k) => GV_ITEMS[level][k]);
    return (
      <div className="mx-auto max-w-xl">
        {header}
        {bar}
        <McqBlock key={`${st.gv.current}-${st.gv.history.length}`} items={items} onDone={(c) => {
          const gv = stepAdaptive(st.gv, c, items.length, "gv");
          if (gv.done) setSt(finishSkill({ ...st, gv }, "gv", { level: adaptiveResult(gv), method: "test" }));
          else setSt({ ...st, gv, gvBlock: drawBlock() });
        }} />
      </div>
    );
  }

  if (st.phase === "reading" || st.phase === "listening") {
    const key = st.phase;
    const ad = st[key];
    const level = LEVELS[ad.current];
    const onDone = (c: number) => {
      const total = key === "reading" ? READING[level].questions.length : LISTENING[level].questions.length;
      const next = stepAdaptive(ad, c, total, key);
      if (next.done) setSt(finishSkill({ ...st, [key]: next }, key, { level: adaptiveResult(next), method: "test" }));
      else setSt({ ...st, [key]: next });
    };
    return (
      <div className="mx-auto max-w-xl">
        {header}
        {bar}
        {key === "reading" ? <ReadingBlock key={level} passage={READING[level]} onDone={onDone} /> : <ListeningBlock key={level} item={LISTENING[level]} onDone={onDone} />}
      </div>
    );
  }

  if (st.phase === "writing") {
    const known = [st.results.gv?.level, st.results.reading?.level].filter((x): x is number => x !== undefined);
    const target = known.length ? Math.max(0, Math.min(...known)) : 2;
    return (
      <div className="mx-auto max-w-xl">
        {header}
        {bar}
        <WritingSection targetLevel={target} aiAvailable={!!status?.ai} onDone={(r) => setSt(finishSkill(st, "writing", { level: r.level, method: r.method }))} />
      </div>
    );
  }

  if (st.phase === "speaking") {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        {bar}
        <SpeakingSection onDone={(r) => setSt(finishSkill({ ...st, intelligibility: r.intelligibility }, "speaking", { level: r.level, method: "self" }))} />
      </div>
    );
  }

  return <Results st={st} onRestart={() => { localStorage.removeItem(KEY); setResumable(false); setSt(fresh()); }} />;
}

function phaseSkill(p: Phase): SkillKey {
  return p === "gv" ? "gv" : (p as SkillKey);
}

function Results({ st, onRestart }: { st: TestState; onRestart: () => void }) {
  const t = useT();
  const overall = useMemo(() => overallLevel(st.results), [st.results]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- save once on mount
    setSaved(true);
    localStorage.removeItem(KEY);
    const scores: Record<string, number> = {};
    for (const [k, r] of Object.entries(st.results) as [SkillKey, SkillResult][]) {
      scores[SKILL_LABELS[k].area] = levelToScore(r.level);
      if (k === "gv") scores.vocabulary = levelToScore(r.level);
    }
    if (Object.keys(scores).length) void getDb().tests.put({ id: uid("t"), type: "placement", scores, at: Date.now(), updatedAt: Date.now() });
    localStorage.setItem(LAST, JSON.stringify({ at: Date.now(), overall, skills: Object.fromEntries(Object.entries(st.results).map(([k, r]) => [k, { level: levelName(r!.level), method: r!.method }])) }));
  }, [saved, st.results, overall]);

  const skills = Object.keys(SKILL_LABELS) as SkillKey[];
  const g = overall !== null && overall >= 0 ? GLOBAL_SCALE[LEVELS[overall]] : null;
  const weakest = skills.filter((k) => st.results[k]).sort((a, b) => st.results[a]!.level - st.results[b]!.level)[0];
  const methodLabel = (m: SkillResult["method"]) => (m === "test" ? t("test", "test") : m === "ai" ? t("évalué par l'IA", "AI-assessed") : t("auto-évaluation", "self-assessed"));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={t("Vos résultats", "Your results")} back="/tests" />
      <Panel className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Niveau global estimé", "Estimated overall level")}</p>
        <p className="mt-1 text-5xl font-bold text-ink-600 dark:text-ink-300">{overall === null ? "—" : levelName(overall)}</p>
        {g && <p className="mt-1 font-medium">{g.title}</p>}
        {overall === null && <p className="mt-2 text-sm text-muted">{t("Complétez au moins deux parties pour obtenir un niveau global.", "Complete at least two parts for an overall level.")}</p>}
      </Panel>

      <Panel>
        <p className="mb-3 font-semibold">{t("Profil par compétence", "Profile by skill")}</p>
        <ul className="space-y-3">
          {skills.map((k) => {
            const r = st.results[k];
            return (
              <li key={k}>
                <div className="flex items-center justify-between text-sm">
                  <span>{t(SKILL_LABELS[k].fr, SKILL_LABELS[k].en)}</span>
                  <span className="flex items-center gap-2">{r && <span className="text-xs text-muted">{methodLabel(r.method)}</span>}<Badge tone={r ? "ink" : "gray"}>{r ? levelName(r.level) : t("non évalué", "skipped")}</Badge></span>
                </div>
                <div className="mt-1.5 grid grid-cols-6 gap-1">
                  {LEVELS.map((lv, i) => <div key={lv} className={cx("h-2.5 rounded-full", r && r.level >= i ? "bg-ink-500" : "bg-surface-2")} title={lv} />)}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 grid grid-cols-6 text-center text-[11px] text-muted">{LEVELS.map((l) => <span key={l}>{l}</span>)}</div>
        {st.intelligibility !== undefined && <p className="mt-3 text-xs text-muted">{t(`Lecture à voix haute : intelligibilité indicative ${Math.round(st.intelligibility * 100)} % (pas une note CECRL).`, `Read-aloud intelligibility ${Math.round(st.intelligibility * 100)}% (indicative).`)}</p>}
      </Panel>

      {g && (
        <Panel>
          <p className="font-semibold">{t("Ce que vous savez faire", "What you can do")}</p>
          <p className="mt-1 text-sm">{g.canDo}</p>
          <p className="mt-3 font-semibold">{t("Pour progresser", "To progress")}</p>
          <p className="mt-1 text-sm">{g.next}</p>
          {weakest && <p className="mt-2 text-sm text-muted">{t(`Votre compétence la plus faible : ${SKILL_LABELS[weakest].fr.toLowerCase()}. C'est elle qui fera le plus monter votre niveau global.`, `Your weakest skill: ${SKILL_LABELS[weakest].en.toLowerCase()}.`)}</p>}
        </Panel>
      )}

      <p className="rounded-xl bg-sun-100/70 px-4 py-3 text-xs text-amber-900 dark:bg-sun-500/10 dark:text-sun-100">
        {t("Estimation indicative, pas une certification officielle (Cambridge, TOEIC, IELTS…). Règles : un niveau est validé avec au moins 4/5 en grammaire et 2/3 en compréhension ; le niveau global est la médiane des compétences, jamais plus d'un niveau au-dessus de votre compréhension la plus faible.", "Indicative estimate, not an official certification.")}
      </p>
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/session">{t("Ma séance du jour", "Today's session")}</LinkButton>
        <LinkButton href="/stats" variant="outline">{t("Statistiques", "Statistics")}</LinkButton>
        <Button variant="ghost" onClick={onRestart}>{t("Refaire le test", "Retake")}</Button>
      </div>
      <p className="text-center text-xs text-muted"><Link href="/tests" className="underline">{t("Tous les tests", "All tests")}</Link></p>
    </div>
  );
}
