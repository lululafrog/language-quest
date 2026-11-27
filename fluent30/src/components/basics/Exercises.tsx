"use client";
import { useMemo, useState } from "react";
import { getDb, uid } from "@/lib/db";
import { cardFromSeed, saveCard } from "@/lib/cards";
import { checkAnswer, sample, shuffle } from "@/lib/text";
import { speak } from "@/lib/speech";
import { recordMistake, trackActivity } from "@/lib/track";
import { useT } from "@/hooks/useT";
import { Button, Panel, ProgressBar, SpeakButton, cx, toast } from "@/components/ui";
import type { BasicItem, BasicLesson } from "@/lib/data/basics";
import { Visual } from "./Visual";
import { Clock } from "./Clock";
import { numberToWords, pad, timeToDigital, timeToWords } from "./lang";

async function saveResult(gameId: string, score: number, total: number) {
  await getDb().games.put({ id: uid("g"), gameId, score, total, durationSec: 0, at: Date.now(), updatedAt: Date.now() });
  await trackActivity({ games: 1, xp: score * 2 });
}

/** Adds every word of the lesson to the learner's flashcards (duplicates are merged). */
export function AddAllButton({ lesson, items }: { lesson: BasicLesson; items: BasicItem[] }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={done ? "secondary" : "primary"}
      loading={busy}
      disabled={done}
      onClick={async () => {
        setBusy(true);
        let added = 0;
        for (const it of items) {
          const r = await saveCard(cardFromSeed({ en: it.en, fr: it.fr, pos: it.pos ?? "expr", rank: 0, ex: it.ex, exFr: it.exFr, themes: [lesson.theme] }, "seed"));
          if (!r.merged) added++;
        }
        setBusy(false);
        setDone(true);
        toast(t(`${added} mots ajoutés à tes flashcards (${items.length - added} déjà présents)`, `${added} words added to your flashcards`));
      }}
    >
      {done ? t("✓ Ajoutés à mes flashcards", "✓ Added to my flashcards") : t(`+ Ajouter les ${items.length} mots à mes flashcards`, `+ Add all ${items.length} words to my flashcards`)}
    </Button>
  );
}

/** Generic quiz: see the picture or hear the word → pick the French meaning (or the reverse). */
export function LessonQuiz({ lesson, items }: { lesson: BasicLesson; items: BasicItem[] }) {
  const t = useT();
  const qs = useMemo(() => {
    const pool = items.filter((i) => i.fr && i.en.length < 40);
    return sample(pool, Math.min(8, pool.length)).map((it, k) => {
      const reverse = k % 3 === 2; // FR → EN every third question
      const others = sample(pool.filter((p) => p.en !== it.en), 3);
      return { it, reverse, options: shuffle([it, ...others]) };
    });
  }, [items]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const q = qs[i];

  if (!qs.length) return null;
  if (!q) {
    return (
      <Panel className="text-center">
        <div className="text-4xl">{score >= qs.length * 0.8 ? "🏆" : "💪"}</div>
        <p className="mt-2 text-lg font-bold">{t(`${score}/${qs.length} bonnes réponses`, `${score}/${qs.length} correct`)}</p>
        <Button className="mt-3" variant="outline" onClick={() => { setI(0); setScore(0); setPicked(null); }}>{t("Recommencer", "Try again")}</Button>
      </Panel>
    );
  }

  const choose = async (opt: BasicItem) => {
    if (picked) return;
    setPicked(opt.en);
    const ok = opt.en === q.it.en;
    if (ok) setScore((s) => s + 1);
    else await recordMistake({ id: `basics:${lesson.id}:${q.it.en}`, type: "vocab", label: q.it.en, detail: q.it.fr });
    if (!q.reverse) speak(q.it.en);
  };
  const next = async () => {
    setPicked(null);
    if (i + 1 >= qs.length) await saveResult(`basics:${lesson.id}`, score, qs.length);
    setI(i + 1);
  };

  return (
    <Panel>
      <div className="mb-3 flex items-center justify-between text-sm text-muted"><span>{t("Exercice", "Exercise")} · {i + 1}/{qs.length}</span><span>{score} ✓</span></div>
      <ProgressBar value={i} max={qs.length} className="mb-4" />
      <div key={i} className="animate-pop text-center">
        {q.reverse ? (
          <p className="text-xl font-bold">{q.it.fr}</p>
        ) : q.it.visual && q.it.visual.kind !== "big" ? (
          <div className="mx-auto h-28 w-28"><Visual v={q.it.visual} /></div>
        ) : (
          <button onClick={() => speak(q.it.en)} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink-600 text-3xl text-white shadow-lg">🔊</button>
        )}
        <p className="mt-2 text-sm text-muted">{q.reverse ? t("Comment dit-on en anglais ?", "How do you say it in English?") : q.it.visual && q.it.visual.kind !== "big" ? t("Qu'est-ce que c'est ?", "What is it?") : t("Écoute et choisis le sens", "Listen and choose")}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const right = o.en === q.it.en;
          return (
            <button key={o.en} onClick={() => choose(o)} className={cx("rounded-2xl border px-4 py-3 text-left font-medium transition", !picked ? "border-line bg-surface hover:border-ink-300" : right ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : picked === o.en ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>
              {q.reverse ? o.en : o.fr}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-surface-2 p-3 text-sm">
          <span><b>{q.it.en}</b> = {q.it.fr}</span>
          <SpeakButton text={q.it.en} size={16} />
        </div>
      )}
      {picked && <Button className="mt-3 w-full" onClick={next}>{t("Suivant", "Next")}</Button>}
    </Panel>
  );
}

/** Hear a number (or a price / year) → type it in digits. */
export function NumberDictation() {
  const t = useT();
  const make = () => {
    const kind = Math.floor(Math.random() * 4);
    if (kind === 0) {
      const n = Math.floor(Math.random() * 100);
      return { say: numberToWords(n), answer: String(n), hint: t("un nombre", "a number") };
    }
    if (kind === 1) {
      const n = Math.floor(Math.random() * 9900) + 100;
      return { say: numberToWords(n), answer: String(n), hint: t("un grand nombre", "a big number") };
    }
    if (kind === 2) {
      const y = 1950 + Math.floor(Math.random() * 80);
      const say = y >= 2000 && y < 2010 ? numberToWords(y) : `${numberToWords(Math.floor(y / 100))} ${y % 100 < 10 ? `oh ${numberToWords(y % 100)}` : numberToWords(y % 100)}`;
      return { say, answer: String(y), hint: t("une année", "a year") };
    }
    const p = Math.floor(Math.random() * 50) + 1;
    const c = [0, 25, 50, 75, 99][Math.floor(Math.random() * 5)];
    return { say: c ? `${numberToWords(p)} pounds ${numberToWords(c)}` : `${numberToWords(p)} pounds`, answer: c ? `${p}.${pad(c)}` : String(p), hint: t("un prix en livres (ex. 4.50)", "a price (e.g. 4.50)") };
  };
  const [q, setQ] = useState(make);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  return (
    <Panel>
      <p className="font-semibold">{t("🎧 Dictée de nombres", "🎧 Number dictation")}</p>
      <p className="text-sm text-muted">{t(`Écoute ${q.hint} et écris-le en chiffres.`, `Listen to ${q.hint} and type it in digits.`)}</p>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={() => speak(q.say, { rate: 0.85 })} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-600 text-2xl text-white shadow-lg">🔊</button>
        <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (result !== null) return; const ok = value.replace(/[\s,£$€]/g, "").replace(/\.00$/, "") === q.answer; setResult(ok); setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 })); }}>
          <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} disabled={result !== null} className={cx("h-12 flex-1 rounded-xl border bg-surface-2 px-3 text-lg outline-none", result === null ? "border-line focus:border-ink-400" : result ? "border-mint-500" : "border-coral-500")} />
          {result === null && <Button type="submit" disabled={!value.trim()}>{t("OK", "OK")}</Button>}
        </form>
      </div>
      {result !== null && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
          <p className={result ? "font-semibold text-mint-600" : "font-semibold text-coral-600"}>{result ? t("Bravo !", "Well done!") : t(`C'était ${q.answer}`, `It was ${q.answer}`)}</p>
          <p className="text-muted">“{q.say}”</p>
          <Button size="sm" className="mt-2" onClick={() => { setQ(make()); setValue(""); setResult(null); }}>{t("Suivant", "Next")}</Button>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">{t(`Score : ${score.ok}/${score.n}`, `Score: ${score.ok}/${score.n}`)}</p>
    </Panel>
  );
}

/** Interactive clock + "What time is it?" quiz. */
export function ClockLab() {
  const t = useT();
  const [m, setM] = useState(15 * 60 + 30);
  const [quiz, setQuiz] = useState<null | { target: number; options: string[]; picked?: string }>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const words = timeToWords(h, mm);
  const newQuiz = () => {
    const target = (Math.floor(Math.random() * 24) * 60 + Math.floor(Math.random() * 12) * 5);
    const wrong = new Set<string>();
    while (wrong.size < 3) {
      const d = target + (Math.floor(Math.random() * 7) - 3) * 15 + (Math.random() < 0.5 ? 60 : 0);
      const x = ((d % 1440) + 1440) % 1440;
      const w = timeToWords(Math.floor(x / 60), x % 60);
      if (x !== target) wrong.add(w);
    }
    setQuiz({ target, options: shuffle([timeToWords(Math.floor(target / 60), target % 60), ...wrong]) });
  };
  return (
    <Panel>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <Clock minutes={quiz ? quiz.target : m} onChange={quiz ? undefined : setM} interactive={!quiz} />
        <div className="w-full flex-1">
          {!quiz ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("Fais tourner la grande aiguille", "Drag the long hand")}</p>
              <p className="mt-1 text-3xl font-black tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{pad(h)}:{pad(mm)}</p>
              <button onClick={() => speak(words)} className="mt-2 block text-left text-lg font-semibold text-ink-700 dark:text-ink-200">🔊 {words}</button>
              <button onClick={() => speak(timeToDigital(h, mm))} className="mt-1 block text-left text-sm text-muted">🔊 {timeToDigital(h, mm)}</button>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[["−1 h", -60], ["−5 min", -5], ["+5 min", 5], ["+1 h", 60]].map(([label, d]) => (
                  <Button key={label as string} size="sm" variant="secondary" onClick={() => setM((x) => (((x + (d as number)) % 1440) + 1440) % 1440)}>{label}</Button>
                ))}
              </div>
              <Button className="mt-4" onClick={newQuiz}>{t("🎯 Quiz : quelle heure est-il ?", "🎯 Quiz: what time is it?")}</Button>
            </>
          ) : (
            <>
              <p className="font-semibold">{t("Quelle heure est-il ?", "What time is it?")} <span className="text-sm text-muted">({Math.floor(quiz.target / 60) < 12 ? t("le matin", "a.m.") : t("après-midi / soir", "p.m.")})</span></p>
              <div className="mt-2 grid gap-2">
                {quiz.options.map((o) => {
                  const right = o === timeToWords(Math.floor(quiz.target / 60), quiz.target % 60);
                  return (
                    <button key={o} disabled={!!quiz.picked} onClick={() => { setQuiz({ ...quiz, picked: o }); setScore((s) => ({ ok: s.ok + (right ? 1 : 0), n: s.n + 1 })); speak(timeToWords(Math.floor(quiz.target / 60), quiz.target % 60)); }} className={cx("rounded-xl border px-3 py-2.5 text-left", !quiz.picked ? "border-line bg-surface hover:border-ink-300" : right ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : quiz.picked === o ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>
                      {o}
                    </button>
                  );
                })}
              </div>
              {quiz.picked && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={newQuiz}>{t("Suivant", "Next")}</Button>
                  <Button variant="ghost" onClick={async () => { await saveResult("basics:clock", score.ok, score.n); setQuiz(null); }}>{t("Terminer", "Finish")}</Button>
                </div>
              )}
              <p className="mt-2 text-xs text-muted">{t(`Score : ${score.ok}/${score.n}`, `Score: ${score.ok}/${score.n}`)}</p>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** Type the English word for a French one (used by the time-words lesson). */
export function checkTyped(input: string, en: string) {
  return checkAnswer(input, en.split(" / "));
}
