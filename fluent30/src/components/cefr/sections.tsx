"use client";
import { useEffect, useMemo, useState } from "react";
import { CAN_DO, LEVELS, READ_ALOUD, WRITING_TASKS, type Level } from "@/lib/data/cefr-test";
import { listenOnce, recognitionErrorFr, recognitionSupported, speak, stopSpeaking } from "@/lib/speech";
import { speechSimilarity } from "@/lib/text";
import { postApi, errorMessage } from "@/lib/api";
import { selfAssessedLevel } from "@/lib/cefr";
import { useT } from "@/hooks/useT";
import { Badge, Button, ErrorNote, Panel, cx } from "@/components/ui";

export interface Mcq {
  q: string;
  options: string[];
  answer: number;
}

/** Answers are not revealed during the test (as in real exams): the block reports its score at the end. */
export function McqBlock({ items, onDone, header }: { items: Mcq[]; onDone: (correct: number) => void; header?: React.ReactNode }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const item = items[i];
  if (!item) return null;
  const next = () => {
    const c = correct + (picked === item.answer ? 1 : 0);
    setPicked(null);
    if (i + 1 < items.length) {
      setCorrect(c);
      setI(i + 1);
    } else onDone(c);
  };
  return (
    <div>
      {header}
      <div key={i} className="animate-pop">
        <p className="mb-2 text-xs text-muted">{t("Question", "Question")} {i + 1}/{items.length}</p>
        <Panel className="py-5"><p className="text-center text-lg font-medium">{item.q}</p></Panel>
        <div className="mt-3 grid gap-2">
          {item.options.map((o, k) => (
            <button key={k} onClick={() => setPicked(k)} className={cx("rounded-xl border px-4 py-3 text-left transition", picked === k ? "border-ink-500 bg-ink-50 font-medium dark:bg-ink-900/60" : "border-line bg-surface hover:border-ink-300")}>{o}</button>
          ))}
        </div>
        <Button className="mt-4 w-full" disabled={picked === null} onClick={next}>{i + 1 < items.length ? t("Valider", "Confirm") : t("Valider et continuer", "Confirm and continue")}</Button>
      </div>
    </div>
  );
}

export function ReadingBlock({ passage, onDone }: { passage: { title: string; text: string; questions: Mcq[] }; onDone: (c: number) => void }) {
  const t = useT();
  return (
    <McqBlock
      items={passage.questions}
      onDone={onDone}
      header={
        <Panel className="mb-4 max-h-[45vh] overflow-y-auto">
          <p className="mb-2 font-semibold">{passage.title}</p>
          <p className="font-serif text-[17px] leading-relaxed">{passage.text}</p>
          <p className="mt-2 text-xs text-muted">{t("Vous pouvez relire le texte autant que nécessaire.", "You can reread the text as often as you like.")}</p>
        </Panel>
      }
    />
  );
}

/** Listening: the recording can be played twice (as in real exams); the transcript is shown afterwards. */
export function ListeningBlock({ item, onDone }: { item: { title: string; script: string; rate: number; questions: Mcq[] }; onDone: (c: number) => void }) {
  const t = useT();
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => () => stopSpeaking(), []);
  const play = () => {
    if (plays >= 2) return;
    setPlays(plays + 1);
    setPlaying(true);
    if (!speak(item.script, { rate: item.rate, onEnd: () => setPlaying(false) })) setPlaying(false);
  };
  if (score !== null) {
    return (
      <Panel>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{t("Transcription", "Transcript")}</p>
        <p className="font-serif text-[16px] leading-relaxed">{item.script}</p>
        <Button className="mt-4 w-full" onClick={() => onDone(score)}>{t("Continuer", "Continue")}</Button>
      </Panel>
    );
  }
  return (
    <div>
      <Panel className="mb-4 flex items-center gap-4">
        <button onClick={play} disabled={plays >= 2 || playing} className={cx("flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95", plays >= 2 ? "bg-line" : "bg-ink-600 shadow-ink-600/30", playing && "animate-pulse")} aria-label={t("Écouter", "Play")}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </button>
        <div>
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-muted">{t(`Écoutes restantes : ${2 - plays}/2`, `Plays left: ${2 - plays}/2`)}</p>
        </div>
      </Panel>
      {plays === 0 ? (
        <p className="text-center text-sm text-muted">{t("Écoutez l'enregistrement (2 écoutes maximum, comme à l'examen), puis répondez.", "Play the recording (2 plays max), then answer.")}</p>
      ) : (
        <McqBlock items={item.questions} onDone={(c) => { stopSpeaking(); setScore(c); }} />
      )}
    </div>
  );
}

function CanDoGrid({ grid, ticked, setTicked }: { grid: Record<Level, string[]>; ticked: Record<string, boolean>; setTicked: (v: Record<string, boolean>) => void }) {
  return (
    <ul className="space-y-3">
      {LEVELS.map((lv) => (
        <li key={lv}>
          <Badge tone="gray" className="mb-1.5">{lv}</Badge>
          {grid[lv].map((s, k) => {
            const key = `${lv}:${k}`;
            return (
              <label key={key} className="mb-1.5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-ink-600" checked={!!ticked[key]} onChange={(e) => setTicked({ ...ticked, [key]: e.target.checked })} />
                <span>{s}</span>
              </label>
            );
          })}
        </li>
      ))}
    </ul>
  );
}

export interface WritingAssessment {
  level: "pre-A1" | Level;
  taskAchievement: number;
  coherence: number;
  range: number;
  accuracy: number;
  feedbackFr: string;
  strengthsFr: string[];
  improvementsFr: string[];
  corrections: { original: string; corrected: string }[];
}

export function WritingSection({ targetLevel, aiAvailable, onDone }: { targetLevel: number; aiAvailable: boolean; onDone: (r: { level: number; method: "ai" | "self"; assessment?: WritingAssessment }) => void }) {
  const t = useT();
  const task = WRITING_TASKS[LEVELS[Math.max(0, Math.min(5, targetLevel))]];
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<WritingAssessment | null>(null);
  const [mode, setMode] = useState<"write" | "self">(aiAvailable ? "write" : "self");
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const words = text.split(/\s+/).filter(Boolean).length;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      setRes(await postApi<WritingAssessment>("/api/ai/assess-writing", { text, task: task.promptEn, level: task.level }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (res) {
    const idx = res.level === "pre-A1" ? -1 : LEVELS.indexOf(res.level);
    return (
      <Panel>
        <div className="flex items-center justify-between"><p className="font-semibold">{t("Évaluation de votre texte", "Your text's assessment")}</p><Badge tone="ink" className="text-sm">{res.level}</Badge></div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {([[t("Réalisation de la tâche", "Task"), res.taskAchievement], [t("Cohérence", "Coherence"), res.coherence], [t("Étendue", "Range"), res.range], [t("Correction", "Accuracy"), res.accuracy]] as [string, number][]).map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-2 px-3 py-2"><span className="text-muted">{l}</span><span className="float-right font-semibold tabular-nums">{v}/5</span></div>
          ))}
        </div>
        <p className="mt-3 text-sm">{res.feedbackFr}</p>
        {res.strengthsFr.length > 0 && <ul className="mt-2 list-inside list-disc text-sm text-mint-600">{res.strengthsFr.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        {res.improvementsFr.length > 0 && <ul className="mt-2 list-inside list-disc text-sm">{res.improvementsFr.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        {res.corrections.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">{res.corrections.map((c, i) => <li key={i} className="rounded-lg bg-surface-2 px-3 py-1.5"><span className="text-coral-600 line-through">{c.original}</span> → <span className="text-mint-600">{c.corrected}</span></li>)}</ul>
        )}
        <Button className="mt-4 w-full" onClick={() => onDone({ level: idx, method: "ai", assessment: res })}>{t("Continuer", "Continue")}</Button>
      </Panel>
    );
  }

  if (mode === "self") {
    return (
      <Panel>
        <p className="font-semibold">{t("Auto-évaluation de l'expression écrite", "Writing self-assessment")}</p>
        <p className="mb-3 mt-1 text-sm text-muted">
          {aiAvailable ? "" : t("L'évaluation automatique de ton texte est momentanément indisponible. ", "Automatic assessment is unavailable for now. ")}
          {t("Cochez honnêtement ce que vous savez faire (grille d'auto-évaluation du Cadre européen). Ce résultat est une auto-évaluation, moins fiable qu'un test.", "Tick honestly what you can do (CEFR self-assessment grid). This is a self-assessment.")}
        </p>
        <CanDoGrid grid={CAN_DO.writing} ticked={ticked} setTicked={setTicked} />
        <Button className="mt-4 w-full" onClick={() => onDone({ level: selfAssessedLevel(ticked, CAN_DO.writing), method: "self" })}>{t("Valider", "Confirm")}</Button>
      </Panel>
    );
  }

  return (
    <Panel>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Sujet", "Task")} · {task.level}</p>
      <p className="mt-1 font-semibold">{task.promptEn}</p>
      <p className="text-sm text-muted">{task.promptFr}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={t("Écrivez en anglais, sans traducteur ni correcteur…", "Write in English, without a translator…")} className="mt-3 w-full resize-y rounded-xl border border-line bg-surface-2 p-3 outline-none focus:border-ink-400" spellCheck={false} autoCorrect="off" />
      <p className={cx("mt-1 text-xs", words >= task.minWords ? "text-mint-600" : "text-muted")}>{words} {t("mots", "words")} · {t("minimum conseillé", "suggested minimum")} {task.minWords}</p>
      <ErrorNote>{error}</ErrorNote>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={submit} loading={busy} disabled={words < 5}>{t("Faire évaluer mon texte", "Assess my text")}</Button>
        <Button variant="ghost" onClick={() => setMode("self")}>{t("Plutôt m'auto-évaluer", "Self-assess instead")}</Button>
      </div>
    </Panel>
  );
}

export function SpeakingSection({ onDone }: { onDone: (r: { level: number; intelligibility?: number }) => void }) {
  const t = useT();
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [error, setError] = useState("");
  const supported = useMemo(() => recognitionSupported(), []);
  const sentence = READ_ALOUD[idx];

  const record = async () => {
    setError("");
    setHeard("");
    setListening(true);
    try {
      const r = await listenOnce("en-US", setHeard).promise;
      setHeard(r.transcript);
      const sim = Math.max(...[r.transcript, ...r.alternatives].map((a) => speechSimilarity(a, sentence).score));
      setScores((s) => [...s, sim]);
      if (idx + 1 < READ_ALOUD.length) setIdx(idx + 1);
    } catch (e) {
      setError(recognitionErrorFr(e));
    } finally {
      setListening(false);
    }
  };
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;

  return (
    <div className="space-y-4">
      <Panel>
        <p className="font-semibold">{t("Auto-évaluation de l'expression orale", "Speaking self-assessment")}</p>
        <p className="mb-3 mt-1 text-sm text-muted">{t("Sans examinateur, l'oral ne peut pas être noté objectivement. Cochez ce que vous savez faire (grille officielle du Cadre européen) : ce sera indiqué comme une auto-évaluation.", "Speaking can't be rated objectively without an examiner: this is a self-assessment.")}</p>
        <CanDoGrid grid={CAN_DO.speaking} ticked={ticked} setTicked={setTicked} />
      </Panel>
      <Panel>
        <p className="font-semibold">{t("Bonus : lecture à voix haute (facultatif)", "Bonus: read aloud (optional)")}</p>
        <p className="mt-1 text-sm text-muted">{t("Mesure indicative de l'intelligibilité par la reconnaissance vocale — ce n'est pas une note CECRL.", "Indicative intelligibility only — not a CEFR rating.")}</p>
        {supported ? (
          scores.length < READ_ALOUD.length ? (
            <>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-2 p-3"><p className="flex-1 text-lg">{sentence}</p><button className="text-ink-600" onClick={() => speak(sentence)} aria-label={t("Écouter le modèle", "Hear model")}>🔊</button></div>
              <Button className="mt-3" variant="outline" onClick={record} loading={listening}>{listening ? t("Je vous écoute…", "Listening…") : t(`🎙️ Lire la phrase ${idx + 1}/${READ_ALOUD.length}`, `🎙️ Read sentence ${idx + 1}/${READ_ALOUD.length}`)}</Button>
              {heard && <p className="mt-2 text-sm text-muted">{t("Entendu :", "Heard:")} « {heard} »</p>}
            </>
          ) : (
            <p className="mt-3 text-sm font-medium">{t(`Intelligibilité indicative : ${Math.round((avg ?? 0) * 100)} %`, `Indicative intelligibility: ${Math.round((avg ?? 0) * 100)}%`)}</p>
          )
        ) : (
          <p className="mt-3 text-sm text-muted">{t("La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome ou Safari).", "Speech recognition isn't available in this browser.")}</p>
        )}
        <ErrorNote>{error}</ErrorNote>
      </Panel>
      <Button className="w-full" onClick={() => onDone({ level: selfAssessedLevel(ticked, CAN_DO.speaking), intelligibility: avg })}>{t("Voir mes résultats", "See my results")}</Button>
    </div>
  );
}
