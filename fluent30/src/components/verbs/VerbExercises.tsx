"use client";
import { useMemo, useState } from "react";
import { Badge, Button, Panel, Segmented, SpeakButton, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { checkAnswer, shuffle } from "@/lib/text";
import { recordMistake, trackActivity } from "@/lib/track";
import type { CoreVerb } from "@/lib/data/types";

type Mode = "forms" | "mcq" | "gap";

export function VerbExercises({ verb }: { verb: CoreVerb }) {
  const t = useT();
  const [mode, setMode] = useState<Mode>("forms");
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("Exercices", "Exercises")}</h2>
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "forms", label: t("Formes", "Forms") },
            { value: "mcq", label: t("Expressions", "Expressions") },
            { value: "gap", label: t("Phrases à trous", "Gap fill") },
          ]}
        />
      </div>
      {mode === "forms" && <FormsQuiz key={verb.base} verb={verb} />}
      {mode === "mcq" && <ExpressionMcq key={verb.base} verb={verb} />}
      {mode === "gap" && <GapFill key={verb.base} verb={verb} />}
    </Panel>
  );
}

async function logResult(verb: CoreVerb, ok: boolean, label: string, detail: string) {
  await trackActivity({ grammarExercises: 1, xp: ok ? 2 : 0 });
  if (!ok) await recordMistake({ id: `conjugation:${verb.base}:${label}`, type: "conjugation", label: `${verb.base} — ${label}`, detail });
}

function Score({ ok, total }: { ok: number; total: number }) {
  return <Badge tone={total && ok / total >= 0.8 ? "mint" : "gray"}>{ok}/{total}</Badge>;
}

// ---- (a) Forms quiz ----
function FormsQuiz({ verb }: { verb: CoreVerb }) {
  const t = useT();
  const questions = useMemo(
    () =>
      shuffle([
        { key: "past", label: t("Prétérit", "Past simple"), answer: verb.past },
        { key: "pp", label: t("Participe passé", "Past participle"), answer: verb.pp },
        { key: "ing", label: t("Forme en -ing", "-ing form"), answer: verb.ing },
        { key: "third", label: t("3e personne (he/she/it)", "3rd person (he/she/it)"), answer: verb.third },
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [verb.base],
  );
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | "exact" | "close" | "wrong">(null);
  const [score, setScore] = useState(0);
  const q = questions[i];
  const done = i >= questions.length;
  const accepted = (a: string) => a.split("/").map((x) => x.replace(/\(.*?\)/g, "").trim());

  const check = async () => {
    if (!input.trim() || result) return;
    const r = checkAnswer(input, accepted(q.answer));
    setResult(r);
    if (r !== "wrong") setScore((s) => s + 1);
    await logResult(verb, r !== "wrong", q.key, `${q.label}: ${q.answer}`);
  };
  const next = () => {
    setI((x) => x + 1);
    setInput("");
    setResult(null);
  };

  if (done)
    return (
      <div className="text-center">
        <p className="text-lg font-medium">{t("Terminé !", "Done!")} <Score ok={score} total={questions.length} /></p>
        <Button className="mt-4" variant="secondary" onClick={() => { setI(0); setScore(0); }}>{t("Recommencer", "Try again")}</Button>
      </div>
    );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>{i + 1}/{questions.length}</span>
        <Score ok={score} total={i} />
      </div>
      <p className="mb-3 text-[15px]">
        <span className="font-semibold">{verb.base}</span> → {q.label}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); if (result) next(); else void check(); }} className="flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)} disabled={!!result}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className={cx("h-11 flex-1 rounded-xl border bg-surface px-3 outline-none focus:border-ink-400", result === "wrong" ? "border-coral-500 animate-shake" : result ? "border-mint-500" : "border-line")}
          placeholder={t("Tapez la forme…", "Type the form…")}
        />
        <Button type="submit">{result ? t("Suivant", "Next") : t("Vérifier", "Check")}</Button>
      </form>
      {result && (
        <p className={cx("mt-3 flex items-center gap-1 text-sm", result === "wrong" ? "text-coral-600" : "text-mint-600")}>
          {result === "exact" ? t("Exact !", "Correct!") : result === "close" ? t("Presque — attention à l'orthographe :", "Almost — check the spelling:") : t("Réponse :", "Answer:")}{" "}
          {result !== "exact" && <strong>{q.answer}</strong>}
          <SpeakButton text={accepted(q.answer)[0]} size={16} />
        </p>
      )}
    </div>
  );
}

// ---- (b) Expression MCQ ----
function ExpressionMcq({ verb }: { verb: CoreVerb }) {
  const t = useT();
  const items = useMemo(() => shuffle([...verb.expressions, ...verb.phrasal]).slice(0, 8), [verb]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const all = useMemo(() => [...verb.expressions, ...verb.phrasal], [verb]);
  const q = items[i];
  const options = useMemo(() => (q ? shuffle([q.en, ...shuffle(all.filter((x) => x.en !== q.en)).slice(0, 3).map((x) => x.en)]) : []), [q, all]);

  if (items.length < 2) return <p className="text-sm text-muted">{t("Pas assez d'expressions pour ce verbe.", "Not enough expressions for this verb.")}</p>;
  if (i >= items.length)
    return (
      <div className="text-center">
        <p className="text-lg font-medium">{t("Terminé !", "Done!")} <Score ok={score} total={items.length} /></p>
        <Button className="mt-4" variant="secondary" onClick={() => { setI(0); setScore(0); setPicked(null); }}>{t("Recommencer", "Try again")}</Button>
      </div>
    );

  const choose = async (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.en;
    if (ok) setScore((s) => s + 1);
    await logResult(verb, ok, `expr:${q.en}`, `${q.fr} = ${q.en}`);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>{i + 1}/{items.length}</span>
        <Score ok={score} total={i} />
      </div>
      <p className="mb-3 text-[15px]">{t("Comment dit-on :", "How do you say:")} <strong>« {q.fr} »</strong></p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o} onClick={() => void choose(o)}
            className={cx("rounded-xl border px-4 py-3 text-left text-[15px] transition",
              !picked ? "border-line hover:border-ink-400 hover:bg-surface-2" : o === q.en ? "border-mint-500 bg-mint-100/60 dark:bg-mint-600/15" : o === picked ? "border-coral-500 bg-coral-100/60 dark:bg-coral-600/15" : "border-line opacity-60")}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <div className="flex items-center gap-1"><em>{q.example}</em><SpeakButton text={q.example} size={16} /></div>
          <Button className="mt-2" size="sm" onClick={() => { setI((x) => x + 1); setPicked(null); }}>{t("Suivant", "Next")}</Button>
        </div>
      )}
    </div>
  );
}

// ---- (c) Gap fill ----
function makeGap(sentence: string, verb: CoreVerb): { text: string; answer: string } | null {
  const forms = [verb.base, verb.third, verb.ing, ...verb.past.split("/"), ...verb.pp.split("/").map((x) => x.replace(/\(.*?\)/g, "").trim())]
    .flatMap((f) => f.split(" / ")).map((f) => f.trim()).filter(Boolean);
  if (verb.base === "be") forms.push("am", "is", "are", "'m", "'re", "'s");
  if (verb.base === "have") forms.push("'ve", "has");
  const uniq = [...new Set(forms)].sort((a, b) => b.length - a.length);
  for (const f of uniq) {
    const esc = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = f.startsWith("'") ? new RegExp(`${esc}\\b`, "i") : new RegExp(`\\b${esc}\\b`, "i");
    const m = sentence.match(re);
    if (m && m.index !== undefined) return { text: sentence.slice(0, m.index) + "_____" + sentence.slice(m.index + m[0].length), answer: m[0] };
  }
  return null;
}

function GapFill({ verb }: { verb: CoreVerb }) {
  const t = useT();
  const items = useMemo(() => {
    const pool = [...verb.meanings.map((x) => ({ s: x.example, fr: x.exampleFr })), ...verb.expressions.map((x) => ({ s: x.example, fr: x.exampleFr ?? x.fr })), ...verb.phrasal.map((x) => ({ s: x.example, fr: x.exampleFr ?? x.fr }))];
    return shuffle(pool.flatMap((p) => {
      const g = makeGap(p.s, verb);
      return g ? [{ ...g, full: p.s, fr: p.fr }] : [];
    })).slice(0, 8);
  }, [verb]);
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | "exact" | "close" | "wrong">(null);
  const [score, setScore] = useState(0);

  if (!items.length) return <p className="text-sm text-muted">{t("Pas d'exercice disponible.", "No exercise available.")}</p>;
  if (i >= items.length)
    return (
      <div className="text-center">
        <p className="text-lg font-medium">{t("Terminé !", "Done!")} <Score ok={score} total={items.length} /></p>
        <Button className="mt-4" variant="secondary" onClick={() => { setI(0); setScore(0); }}>{t("Recommencer", "Try again")}</Button>
      </div>
    );
  const q = items[i];
  const check = async () => {
    if (!input.trim() || result) return;
    const r = checkAnswer(input, [q.answer]);
    setResult(r);
    if (r !== "wrong") setScore((s) => s + 1);
    await logResult(verb, r !== "wrong", "gap", q.full);
  };
  const next = () => { setI((x) => x + 1); setInput(""); setResult(null); };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>{i + 1}/{items.length}</span>
        <Score ok={score} total={i} />
      </div>
      <p className="text-[17px] leading-relaxed">{q.text}</p>
      <p className="mb-3 mt-1 text-sm text-muted">{q.fr}</p>
      <p className="mb-2 text-xs text-muted">{t(`Utilisez la bonne forme de « ${verb.base} ».`, `Use the right form of "${verb.base}".`)}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (result) next(); else void check(); }} className="flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)} disabled={!!result}
          autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className={cx("h-11 flex-1 rounded-xl border bg-surface px-3 outline-none focus:border-ink-400", result === "wrong" ? "border-coral-500 animate-shake" : result ? "border-mint-500" : "border-line")}
          placeholder="…"
        />
        <Button type="submit">{result ? t("Suivant", "Next") : t("Vérifier", "Check")}</Button>
      </form>
      {result && (
        <div className={cx("mt-3 flex items-center gap-1 text-sm", result === "wrong" ? "text-coral-600" : "text-mint-600")}>
          {result === "wrong" ? <>{t("Réponse :", "Answer:")} <strong>{q.answer}</strong></> : t("Bravo !", "Well done!")}
          <span className="ml-2 text-fg"><em>{q.full}</em></span>
          <SpeakButton text={q.full} size={16} />
        </div>
      )}
    </div>
  );
}
