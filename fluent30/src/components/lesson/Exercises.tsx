"use client";
// Interactive course exercises. Each exercise reports a result once: correct (first try) or not.
// After an answer, the learner always sees WHY (the `explain` field), not just right/wrong.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/curriculum";
import { Button, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { shuffle, speechSimilarity } from "@/lib/text";
import { listenOnce, recognitionErrorFr, recognitionSupported, speak } from "@/lib/speech";
import { verdict, type Verdict } from "./check";

export interface ExerciseOutcome {
  correct: boolean;
  /** not graded (pronunciation): excluded from the score */
  ungraded?: boolean;
  /** the learner declared a valid alternative translation after a "wrong" verdict */
  override?: boolean;
}

const TYPE_LABEL: Record<Exercise["type"], string> = {
  mcq: "Choisis la bonne réponse",
  fill: "Complète la phrase",
  translate: "Traduis",
  reorder: "Remets les mots dans l'ordre",
  fix: "Corrige l'erreur",
  listen: "Écoute et réponds",
  dictation: "Écoute et écris",
  match: "Associe les paires",
  speak: "Dis la phrase à voix haute",
  dialogue: "Dialogue interactif",
};

export function exerciseLabel(ex: Exercise) {
  if (ex.type === "translate") return ex.from === "fr" ? "Traduis en anglais" : "Traduis en français";
  return TYPE_LABEL[ex.type];
}

function Feedback({ ok, close, answer, explain }: { ok: boolean; close?: boolean; answer?: string; explain?: string }) {
  return (
    <div
      role="status"
      className={cx(
        "animate-fade rounded-2xl border p-4 text-[15px] leading-relaxed",
        ok ? "border-mint-500/30 bg-mint-500/10" : "border-coral-500/30 bg-coral-500/10",
      )}
    >
      <p className={cx("flex items-center gap-2 font-semibold", ok ? "text-mint-600 dark:text-mint-400" : "text-coral-600 dark:text-coral-400")}>
        <Icon name={ok ? "check" : "eye"} size={18} />
        {ok ? (close ? "Juste — attention à l'orthographe" : "Bien joué") : "Pas tout à fait"}
      </p>
      {answer && (!ok || close) && (
        <p className="mt-1.5">
          <span className="text-fg/60">Réponse : </span>
          <strong>{answer}</strong>
        </p>
      )}
      {explain && (
        <p className="mt-1.5 text-fg/85">
          <span className="font-semibold">Pourquoi ? </span>
          {explain}
        </p>
      )}
    </div>
  );
}

function TextAnswer({ placeholder, onSubmit, disabled, multiline }: { placeholder: string; onSubmit: (v: string) => void; disabled: boolean; multiline?: boolean }) {
  const [v, setV] = useState("");
  const common = {
    value: v,
    disabled,
    placeholder,
    autoCapitalize: "off",
    autoCorrect: "off",
    spellCheck: false,
    className:
      "w-full rounded-2xl border border-ink-100 bg-surface px-4 py-3 text-[16px] outline-none transition focus:border-ink-400 focus:ring-2 focus:ring-ink-200 disabled:opacity-70 dark:border-ink-800 dark:focus:ring-ink-800",
  };
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v);
      }}
    >
      {multiline ? (
        <textarea
          {...common}
          rows={2}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (v.trim()) onSubmit(v);
            }
          }}
        />
      ) : (
        <input {...common} onChange={(e) => setV(e.target.value)} />
      )}
      {!disabled && (
        <Button type="submit" className="w-full" disabled={!v.trim()}>
          Vérifier
        </Button>
      )}
    </form>
  );
}

function Options({ options, answer, picked, onPick }: { options: string[]; answer: number; picked: number | null; onPick: (i: number) => void }) {
  return (
    <div className="grid gap-2">
      {options.map((o, i) => {
        const state = picked === null ? "idle" : i === answer ? "right" : i === picked ? "wrong" : "dim";
        return (
          <button
            key={i}
            type="button"
            disabled={picked !== null}
            onClick={() => onPick(i)}
            className={cx(
              "rounded-2xl border px-4 py-3 text-left text-[15.5px] font-medium transition",
              state === "idle" && "border-ink-100 bg-surface hover:border-ink-300 hover:bg-ink-50/60 dark:border-ink-800 dark:hover:bg-ink-900/50",
              state === "right" && "border-mint-500 bg-mint-500/10 text-mint-600 dark:text-mint-400",
              state === "wrong" && "border-coral-500 bg-coral-500/10 text-coral-600 dark:text-coral-400",
              state === "dim" && "border-ink-100 opacity-50 dark:border-ink-800",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Renders "I ___ coffee" with the blank highlighted. */
function Blanked({ sentence, filled }: { sentence: string; filled?: string }) {
  const parts = sentence.split("___");
  return (
    <p className="text-lg font-semibold leading-relaxed">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && (
            <span className={cx("mx-1 inline-block min-w-16 border-b-2 px-1 text-center", filled ? "border-ink-500 text-ink-700 dark:text-ink-200" : "border-dashed border-ink-300")}>
              {filled ?? " "}
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

// ---------- individual exercises ----------

function useOnce(onDone: (o: ExerciseOutcome) => void) {
  const sent = useRef(false);
  const cb = useRef(onDone);
  useEffect(() => {
    cb.current = onDone;
  });
  return useCallback((o: ExerciseOutcome) => {
    if (sent.current) return;
    sent.current = true;
    cb.current(o);
  }, []);
}

function TypedExercise({ answers, explain, children, placeholder, multiline, onDone, render, allowOverride }: {
  allowOverride?: boolean;
  answers: string[];
  explain: string;
  placeholder: string;
  multiline?: boolean;
  children?: React.ReactNode;
  onDone: (o: ExerciseOutcome) => void;
  render?: (filled?: string) => React.ReactNode;
}) {
  const [res, setRes] = useState<{ v: Verdict; input: string } | null>(null);
  const [overridden, setOverridden] = useState(false);
  const done = useOnce(onDone);
  return (
    <div className="space-y-4">
      {render ? render(res ? res.input : undefined) : children}
      <TextAnswer
        placeholder={placeholder}
        multiline={multiline}
        disabled={!!res}
        onSubmit={(input) => {
          const v = verdict(input, answers);
          setRes({ v, input });
          done({ correct: v !== "wrong" });
        }}
      />
      {res && <Feedback ok={res.v !== "wrong" || overridden} close={res.v === "close"} answer={answers[0]} explain={explain} />}
      {res && res.v === "wrong" && allowOverride && !overridden && (
        <div className="text-sm text-fg/60">
          {answers.length > 1 && <p className="mb-1">Autres réponses acceptées : {answers.slice(1, 4).join(" · ")}</p>}
          <button type="button" className="font-semibold text-ink-600 hover:underline dark:text-ink-300" onClick={() => { setOverridden(true); onDone({ correct: true, override: true }); }}>
            Ma traduction dit la même chose — la compter juste
          </button>
        </div>
      )}
    </div>
  );
}

function Reorder({ ex, onDone }: { ex: Extract<Exercise, { type: "reorder" }>; onDone: (o: ExerciseOutcome) => void }) {
  const pool = useMemo(() => {
    let s = shuffle(ex.words.map((w, i) => ({ w, i })));
    if (s.length > 2 && s.every((x, k) => x.i === k)) s = [...s.slice(1), s[0]];
    return s;
  }, [ex]);
  const [chosen, setChosen] = useState<number[]>([]);
  const [res, setRes] = useState<boolean | null>(null);
  const done = useOnce(onDone);
  const sentence = chosen.map((k) => pool[k].w).join(" ");
  return (
    <div className="space-y-4">
      {ex.fr && <p className="text-fg/70">{ex.fr}</p>}
      <div className="min-h-14 rounded-2xl border border-dashed border-ink-200 p-2 dark:border-ink-800">
        <div className="flex flex-wrap gap-2">
          {chosen.map((k, pos) => (
            <button key={k} type="button" disabled={res !== null} onClick={() => setChosen((c) => c.filter((_, j) => j !== pos))} className="rounded-xl bg-ink-600 px-3 py-1.5 text-[15px] font-medium text-white dark:bg-ink-500">
              {pool[k].w}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((p, k) =>
          chosen.includes(k) ? (
            <span key={k} className="rounded-xl border border-transparent px-3 py-1.5 text-[15px] opacity-0">{p.w}</span>
          ) : (
            <button key={k} type="button" disabled={res !== null} onClick={() => setChosen((c) => [...c, k])} className="rounded-xl border border-ink-100 bg-surface px-3 py-1.5 text-[15px] font-medium transition hover:border-ink-300 dark:border-ink-800">
              {p.w}
            </button>
          ),
        )}
      </div>
      {res === null && (
        <Button
          className="w-full"
          disabled={chosen.length !== pool.length}
          onClick={() => {
            const ok = verdict(sentence, [ex.answer]) === "exact";
            setRes(ok);
            done({ correct: ok });
          }}
        >
          Vérifier
        </Button>
      )}
      {res !== null && <Feedback ok={res} answer={ex.answer} explain={ex.explain} />}
    </div>
  );
}

function Match({ ex, onDone }: { ex: Extract<Exercise, { type: "match" }>; onDone: (o: ExerciseOutcome) => void }) {
  const left = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[0], i }))), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p, i) => ({ t: p[1], i }))), [ex]);
  const [sel, setSel] = useState<number | null>(null);
  const [leftDone, setLeftDone] = useState<Set<number>>(new Set());
  const [rightDone, setRightDone] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const done = useOnce(onDone);
  const finished = leftDone.size === ex.pairs.length;
  const pick = (i: number) => {
    if (sel === null) return;
    // compare by text: two pairs may share the same translation
    if (ex.pairs[i][1] === ex.pairs[sel][1]) {
      const l = new Set(leftDone).add(sel);
      setLeftDone(l);
      setRightDone(new Set(rightDone).add(i));
      setSel(null);
      if (l.size === ex.pairs.length) done({ correct: errors <= 1 });
    } else {
      setErrors((e) => e + 1);
      setFlash(i);
      setTimeout(() => setFlash(null), 450);
    }
  };
  const cell = "rounded-xl border px-3 py-2.5 text-left text-[15px] font-medium transition";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          {left.map((l) => (
            <button
              key={l.i}
              type="button"
              disabled={leftDone.has(l.i)}
              onClick={() => {
                setSel(l.i);
                speak(l.t);
              }}
              className={cx(cell, leftDone.has(l.i) ? "border-mint-500/40 bg-mint-500/10 opacity-60" : sel === l.i ? "border-ink-500 bg-ink-50 dark:bg-ink-900/60" : "border-ink-100 bg-surface dark:border-ink-800")}
            >
              {l.t}
            </button>
          ))}
        </div>
        <div className="grid gap-2">
          {right.map((r) => (
            <button
              key={r.i}
              type="button"
              disabled={rightDone.has(r.i) || sel === null}
              onClick={() => pick(r.i)}
              className={cx(cell, rightDone.has(r.i) ? "border-mint-500/40 bg-mint-500/10 opacity-60" : flash === r.i ? "border-coral-500 bg-coral-500/10" : "border-ink-100 bg-surface dark:border-ink-800", sel === null && !rightDone.has(r.i) && "opacity-80")}
            >
              {r.t}
            </button>
          ))}
        </div>
      </div>
      {!finished && <p className="text-sm text-fg/60">Touche un mot anglais, puis sa traduction.</p>}
      {finished && <Feedback ok={errors <= 1} explain={ex.explain ?? (errors ? `${errors} erreur${errors > 1 ? "s" : ""} en chemin — relis les paires ci-dessus.` : undefined)} />}
    </div>
  );
}

function Speak({ ex, onDone }: { ex: Extract<Exercise, { type: "speak" }>; onDone: (o: ExerciseOutcome) => void }) {
  const [state, setState] = useState<"idle" | "listening" | "done">("idle");
  const [result, setResult] = useState<ReturnType<typeof speechSimilarity> | null>(null);
  const [said, setSaid] = useState("");
  const [err, setErr] = useState("");
  const done = useOnce(onDone);
  const supported = recognitionSupported();
  const start = async () => {
    setErr("");
    setState("listening");
    try {
      const r = await listenOnce("en-US").promise;
      const best = [r.transcript, ...r.alternatives].map((t) => ({ t, s: speechSimilarity(t, ex.text) })).sort((a, b) => b.s.score - a.s.score)[0];
      setSaid(best.t);
      setResult(best.s);
      setState("done");
      done({ correct: best.s.score >= 0.7, ungraded: true });
    } catch (e) {
      setErr(recognitionErrorFr(e));
      setState("idle");
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <SpeakButton text={ex.text} size={20} />
        <div>
          <p className="text-lg font-semibold">
            {result ? result.words.map((w, i) => <span key={i} className={cx(w.ok ? "text-mint-600 dark:text-mint-400" : "text-coral-600 underline decoration-dotted")}>{w.word} </span>) : ex.text}
          </p>
          <p className="text-fg/60">{ex.fr}</p>
        </div>
      </div>
      {supported ? (
        <Button variant={state === "listening" ? "secondary" : "primary"} className="w-full" onClick={start} disabled={state === "listening"}>
          <Icon name="mic" size={18} /> {state === "listening" ? "Je t'écoute…" : state === "done" ? "Réessayer" : "Parler"}
        </Button>
      ) : (
        <p className="rounded-2xl bg-ink-50 p-3 text-sm text-fg/70 dark:bg-ink-900/50">
          La reconnaissance vocale n&apos;est pas disponible dans ce navigateur. Écoute le modèle, répète-le à voix haute, puis continue.
        </p>
      )}
      {!supported && state !== "done" && (
        <Button variant="secondary" className="w-full" onClick={() => { setState("done"); done({ correct: true, ungraded: true }); }}>
          C&apos;est fait
        </Button>
      )}
      {err && <p className="text-sm text-coral-600">{err}</p>}
      {supported && state === "idle" && (
        <button type="button" className="w-full text-center text-sm font-medium text-fg/55 hover:underline" onClick={() => { setState("done"); done({ correct: true, ungraded: true }); }}>
          Je ne peux pas parler maintenant — passer
        </button>
      )}
      {result && (
        <p className="text-sm text-fg/70">
          Compris : « {said} » — {Math.round(result.score * 100)} % de mots reconnus. {result.score >= 0.85 ? "Très clair." : result.score >= 0.6 ? "Bien, retravaille les mots en orange." : "Réécoute le modèle et articule mot par mot."}
          <span className="block text-fg/50">Retour indicatif : la reconnaissance du navigateur n&apos;évalue pas finement l&apos;accent.</span>
        </p>
      )}
    </div>
  );
}

function Dialogue({ ex, onDone }: { ex: Extract<Exercise, { type: "dialogue" }>; onDone: (o: ExerciseOutcome) => void }) {
  const lines = ex.lines;
  /** index of the next line waiting for a choice, or lines.length when the dialogue is over */
  const stopFrom = (from: number) => {
    let n = from;
    while (n < lines.length && !lines[n].choices) n++;
    return n;
  };
  const [pos, setPos] = useState(() => stopFrom(0));
  const [chosen, setChosen] = useState<Record<number, number>>({});
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const done = useOnce(onDone);
  const hasChoices = lines.some((l) => l.choices);
  const finished = pos >= lines.length;

  useEffect(() => {
    if (!hasChoices) done({ correct: true });
  }, [hasChoices, done]);

  const choose = (k: number) => {
    const ch = lines[pos].choices![k];
    if (!ch.correct) {
      setWrong(k);
      setMistakes((m) => m + 1);
      return;
    }
    setWrong(null);
    setChosen((s) => ({ ...s, [pos]: k }));
    speak(ch.en);
    const n = stopFrom(pos + 1);
    setPos(n);
    if (n >= lines.length) done({ correct: mistakes === 0 });
  };

  return (
    <div className="space-y-3">
      {ex.intro && <p className="text-fg/70">{ex.intro}</p>}
      <div className="space-y-2">
        {lines.slice(0, pos).map((line, idx) => {
          const me = line.choices !== undefined || /^(you|toi|vous)$/i.test(line.speaker);
          const text = line.choices ? line.choices[chosen[idx]]?.en : line.en;
          return (
            <div key={idx} className={cx("flex animate-fade", me ? "justify-end" : "justify-start")}>
              <div className={cx("max-w-[85%] rounded-2xl px-3.5 py-2.5", me ? "rounded-br-md bg-ink-600 text-white dark:bg-ink-500" : "rounded-bl-md bg-ink-50 dark:bg-ink-900/60")}>
                <p className={cx("text-[11px] font-semibold uppercase tracking-wide", me ? "text-white/70" : "text-fg/50")}>{line.speaker}</p>
                {text && (
                  <p className="flex items-start gap-1 text-[15.5px]">
                    <span>{text}</span>
                    <SpeakButton text={text} size={15} className={cx("-my-1 p-1", me && "text-white/80 hover:bg-white/10")} />
                  </p>
                )}
                {line.fr && !line.choices && <p className={cx("text-[13px]", me ? "text-white/70" : "text-fg/55")}>{line.fr}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {!finished && (
        <div className="space-y-2 pt-1">
          <p className="text-sm font-semibold text-fg/70">Ta réponse :</p>
          {lines[pos].fr && <p className="text-sm text-fg/55">{lines[pos].fr}</p>}
          {lines[pos].choices!.map((c, k) => (
            <button
              key={k}
              type="button"
              onClick={() => choose(k)}
              className={cx(
                "w-full rounded-2xl border px-4 py-3 text-left text-[15px] font-medium transition",
                wrong === k ? "border-coral-500 bg-coral-500/10" : "border-ink-100 bg-surface hover:border-ink-300 dark:border-ink-800",
              )}
            >
              {c.en}
            </button>
          ))}
          {wrong !== null && <Feedback ok={false} explain={`${lines[pos].choices![wrong].why} Essaie une autre réponse.`} />}
        </div>
      )}
      {finished && hasChoices && (
        <Feedback ok={mistakes === 0} explain={mistakes === 0 ? "Toutes tes réponses étaient naturelles et adaptées." : `${mistakes} réponse${mistakes > 1 ? "s" : ""} à revoir : relis les explications ci-dessus.`} />
      )}
    </div>
  );
}

// ---------- dispatcher ----------

export function ExerciseView({ ex, onDone }: { ex: Exercise; onDone: (o: ExerciseOutcome) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = useOnce(onDone);
  switch (ex.type) {
    case "mcq":
      return (
        <div className="space-y-4">
          <p className="text-lg font-semibold leading-relaxed">{ex.prompt}</p>
          {ex.fr && <p className="-mt-2 text-fg/60">{ex.fr}</p>}
          <Options options={ex.options} answer={ex.answer} picked={picked} onPick={(i) => { setPicked(i); done({ correct: i === ex.answer }); }} />
          {picked !== null && <Feedback ok={picked === ex.answer} answer={ex.options[ex.answer]} explain={ex.explain} />}
        </div>
      );
    case "listen":
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => speak(ex.audio)} className="grid h-14 w-14 place-items-center rounded-full bg-ink-600 text-white shadow-sm transition hover:bg-ink-700" aria-label="Écouter">
              <Icon name="headphones" size={24} />
            </button>
            <button type="button" onClick={() => speak(ex.audio, { rate: 0.7 })} className="text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">
              Plus lentement
            </button>
          </div>
          <p className="text-lg font-semibold">{ex.question}</p>
          <Options options={ex.options} answer={ex.answer} picked={picked} onPick={(i) => { setPicked(i); done({ correct: i === ex.answer }); }} />
          {picked !== null && (
            <>
              <p className="text-sm text-fg/60">Transcription : « {ex.audio} »</p>
              <Feedback ok={picked === ex.answer} answer={ex.options[ex.answer]} explain={ex.explain} />
            </>
          )}
        </div>
      );
    case "fill":
      return (
        <TypedExercise answers={ex.answers} explain={ex.explain} placeholder={ex.hint ? `Indice : ${ex.hint}` : "Ta réponse"} onDone={onDone}
          render={(filled) => (
            <div className="space-y-1">
              <Blanked sentence={ex.sentence} filled={filled} />
              {ex.fr && <p className="text-fg/60">{ex.fr}</p>}
            </div>
          )}
        />
      );
    case "translate":
      return (
        <TypedExercise answers={ex.answers} explain={ex.explain} placeholder={ex.from === "fr" ? "En anglais…" : "En français…"} multiline allowOverride onDone={onDone}>
          <div className="flex items-start gap-1">
            <p className="text-lg font-semibold">{ex.text}</p>
            {ex.from === "en" && <SpeakButton text={ex.text} size={17} className="-my-1" />}
          </div>
        </TypedExercise>
      );
    case "fix":
      return (
        <TypedExercise answers={ex.answers} explain={ex.explain} placeholder="Phrase corrigée" multiline onDone={onDone}>
          <p className="text-lg font-semibold text-coral-600 line-through decoration-coral-400/60 decoration-1 dark:text-coral-400">{ex.sentence}</p>
        </TypedExercise>
      );
    case "dictation":
      return (
        <TypedExercise answers={ex.answers} explain={ex.explain} placeholder="Écris ce que tu entends" multiline onDone={onDone}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => speak(ex.audio)} className="grid h-14 w-14 place-items-center rounded-full bg-ink-600 text-white shadow-sm transition hover:bg-ink-700" aria-label="Écouter">
              <Icon name="headphones" size={24} />
            </button>
            <button type="button" onClick={() => speak(ex.audio, { rate: 0.65 })} className="text-sm font-medium text-ink-600 underline-offset-2 hover:underline dark:text-ink-300">
              Plus lentement
            </button>
          </div>
        </TypedExercise>
      );
    case "reorder":
      return <Reorder ex={ex} onDone={onDone} />;
    case "match":
      return <Match ex={ex} onDone={onDone} />;
    case "speak":
      return <Speak ex={ex} onDone={onDone} />;
    case "dialogue":
      return <Dialogue ex={ex} onDone={onDone} />;
  }
}
