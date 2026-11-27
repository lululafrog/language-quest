"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { ApiError, errorMessage, postApi } from "@/lib/api";
import { recordQuiz, difficultyAdvice, canAdapt } from "@/lib/reading";
import { wordInfo } from "@/lib/priority";
import { lemmaCandidates, shuffle, speechSimilarity, tokenize } from "@/lib/text";
import { listenOnce, recognitionErrorFr, recognitionSupported, speak } from "@/lib/speech";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, ProgressBar, ServiceNotice, Sheet, Spinner, cx } from "@/components/ui";
import { sentencesOf } from "./translate";
import type { Book } from "@/lib/types";

interface Quiz {
  mcq: { question: string; options: string[]; answer: number; explanationFr: string }[];
  openQuestion: string;
}
interface Fill {
  sentence: string;
  answer: string;
  options: string[];
}
type Step = "intro" | "quiz" | "open" | "vocab" | "speak" | "done";

/** Optional 3–5 minute session at the end of a chapter. */
export function ChapterSession({ book, chapter, chapterTitle, paragraphs, lookedUp, wordsRead, level, onClose }: {
  book: Book;
  chapter: number;
  chapterTitle: string;
  paragraphs: string[];
  lookedUp: string[];
  wordsRead: number;
  level: string;
  onClose: (completed: boolean) => void;
}) {
  const t = useT();
  const status = useStatus();
  const [step, setStep] = useState<Step>("intro");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizErr, setQuizErr] = useState<unknown>(null);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [openAnswer, setOpenAnswer] = useState("");
  const [openFb, setOpenFb] = useState<{ feedbackFr: string; corrected: string; score: number } | null>(null);
  const [grading, setGrading] = useState(false);
  const [fi, setFi] = useState(0);
  const [fillPick, setFillPick] = useState<string | null>(null);
  const [said, setSaid] = useState<{ score: number; words: { word: string; ok: boolean }[]; text: string } | null>(null);
  const [listening, setListening] = useState(false);
  const [speakErr, setSpeakErr] = useState("");

  const text = paragraphs.join("\n\n");
  const advice = difficultyAdvice(lookedUp.length, wordsRead);

  // Vocabulary fill-ins: words looked up in this chapter, then the learner's cards present in the chapter, then useful chapter words.
  const cards = useMemo(() => [] as string[], []);
  const [fills, setFills] = useState<Fill[]>([]);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const sentences = paragraphs.flatMap(sentencesOf).filter((s) => s.split(" ").length >= 5 && s.length < 220);
      const myCards = (await getDb().cards.toArray()).filter((c) => !c.term.includes(" ")).map((c) => c.term.toLowerCase());
      const chapterWords = [...new Set(tokenize(text).filter((x) => x.word && x.text.length > 3).map((x) => x.text.toLowerCase()))];
      const inChapter = (w: string) => chapterWords.includes(w) || chapterWords.some((cw) => lemmaCandidates(cw).includes(w));
      const pool = [...new Set([...lookedUp.map((w) => w.toLowerCase()), ...myCards.filter(inChapter), ...chapterWords.filter((w) => ["green", "blue"].includes(wordInfo(w).priority) && (wordInfo(w).rank ?? 0) > 250)])];
      const out: Fill[] = [];
      for (const w of pool) {
        if (out.length >= 3) break;
        const re = new RegExp(`\\b${w.replace(/[^a-z']/g, "")}\\b`, "i");
        const sentence = sentences.find((s) => re.test(s));
        if (!sentence) continue;
        const form = sentence.match(re)?.[0] ?? w;
        const others = shuffle(pool.filter((x) => x !== w)).slice(0, 3);
        if (others.length < 2) continue;
        out.push({ sentence: sentence.replace(re, "_____"), answer: form, options: shuffle([form, ...others]) });
      }
      if (alive) setFills(out);
    })();
    return () => {
      alive = false;
    };
  }, [paragraphs, lookedUp, text]);
  void cards;

  const speakSentence = useMemo(() => {
    const all = paragraphs.flatMap(sentencesOf).filter((s) => {
      const n = s.split(/\s+/).length;
      return n >= 6 && n <= 14 && !/["“”]/.test(s.slice(1, -1));
    });
    return all[Math.floor(all.length / 2)] ?? all[0] ?? null;
  }, [paragraphs]);

  // Load AI quiz when starting.
  useEffect(() => {
    if (step !== "quiz" || quiz || quizErr || !status?.ai) return;
    let alive = true;
    postApi<Quiz>("/api/ai/reader/quiz", { text: text.slice(0, 100000), title: book.title, chapterTitle, level }, { cacheKey: `rq:${book.id}:${chapter}:${level}` })
      .then((r) => alive && setQuiz(r))
      .catch((e) => alive && setQuizErr(e));
    return () => {
      alive = false;
    };
  }, [step, quiz, quizErr, status, text, book, chapter, chapterTitle, level]);

  const next = (from: Step) => {
    const order: Step[] = ["quiz", "open", "vocab", "speak", "done"];
    let i = order.indexOf(from) + 1;
    // skip unavailable steps
    while (i < order.length) {
      const s = order[i];
      if (s === "quiz" && !status?.ai) i++;
      else if (s === "open" && (!status?.ai || !quiz?.openQuestion)) i++;
      else if (s === "vocab" && !fills.length) i++;
      else if (s === "speak" && !speakSentence) i++;
      else break;
    }
    const target = order[Math.min(i, order.length - 1)];
    if (target === "done") void recordQuiz(book.id, chapter, score, Math.max(total, 1));
    setStep(target);
  };
  const start = () => {
    if (status?.ai) setStep("quiz");
    else next("open");
  };

  const answerMcq = (k: number) => {
    if (picked !== null || !quiz) return;
    setPicked(k);
    setTotal((x) => x + 1);
    if (k === quiz.mcq[qi].answer) setScore((x) => x + 1);
  };

  const grade = async () => {
    if (!quiz || !openAnswer.trim()) return;
    setGrading(true);
    try {
      const r = await postApi<{ feedbackFr: string; corrected: string; score: number }>("/api/ai/reader/grade", { question: quiz.openQuestion, answer: openAnswer, summary: text.slice(0, 3500) });
      setOpenFb(r);
      setTotal((x) => x + 1);
      if (r.score >= 1) setScore((x) => x + 1);
    } catch (e) {
      setOpenFb({ feedbackFr: errorMessage(e), corrected: openAnswer, score: 0 });
    } finally {
      setGrading(false);
    }
  };

  const pickFill = (o: string) => {
    if (fillPick) return;
    setFillPick(o);
    setTotal((x) => x + 1);
    if (o === fills[fi].answer) setScore((x) => x + 1);
  };

  const record = async () => {
    if (!speakSentence) return;
    setSpeakErr("");
    setListening(true);
    try {
      const r = await listenOnce("en-US").promise;
      const sim = speechSimilarity(r.transcript, speakSentence);
      setSaid({ ...sim, text: r.transcript });
      setTotal((x) => x + 1);
      if (sim.score >= 0.7) setScore((x) => x + 1);
    } catch (e) {
      setSpeakErr(recognitionErrorFr(e));
    } finally {
      setListening(false);
    }
  };

  const stepsTotal = 4;
  const stepIdx = { intro: 0, quiz: 1, open: 2, vocab: 3, speak: 4, done: 4 }[step];

  return (
    <Sheet open onClose={() => onClose(step === "done")} title={t(`Fin du chapitre ${chapter + 1}`, `End of chapter ${chapter + 1}`)}>
      <div className="space-y-4">
        {step !== "intro" && step !== "done" && <ProgressBar value={stepIdx} max={stepsTotal} />}

        {step === "intro" && (
          <>
            <p className="text-[15px]">{t("Bravo, chapitre terminé ! Une petite séance de 3 à 5 minutes pour ancrer ce que tu as lu ? C'est facultatif.", "Chapter done! A short 3–5 minute session to lock it in? Optional.")}</p>
            <div className="rounded-xl bg-surface-2 p-3 text-sm">
              <p>{t(`${lookedUp.length} mot(s) consulté(s) sur environ ${wordsRead} mots lus.`, `${lookedUp.length} word(s) looked up out of ~${wordsRead} read.`)}</p>
              {advice === "hard" && (
                <p className="mt-1 text-amber-700 dark:text-sun-100">
                  {t("Ce livre semble difficile pour toi en ce moment.", "This book seems hard for you right now.")} {canAdapt(book.source) ? t("Essaie une version adaptée (bouton Niveau en haut) ou ", "Try an adapted version (Level button) or ") : ""}
                  <Link href="/library" className="underline">{t("un livre plus accessible", "an easier book")}</Link>.
                </p>
              )}
              {advice === "easy" && <p className="mt-1 text-mint-600">{t("Tu lis avec aisance ! Tu pourrais passer à la version originale ou à un livre plus exigeant.", "You read easily — try the original or a harder book.")}</p>}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={start}>{t("Faire la séance", "Start the session")}</Button>
              <Button variant="ghost" onClick={() => onClose(false)}>{t("Passer", "Skip")}</Button>
            </div>
            {status && !status.ai && <p className="text-xs text-muted">{t("Sans clé IA, la séance propose les exercices de vocabulaire et de prononciation ; le quiz de compréhension nécessite ANTHROPIC_API_KEY.", "Without AI key: vocabulary and pronunciation only.")}</p>}
          </>
        )}

        {step === "quiz" && (
          <>
            {!quiz && !quizErr && <p className="flex items-center gap-2 text-sm text-muted"><Spinner className="h-4 w-4" /> {t("Préparation des questions…", "Preparing questions…")}</p>}
            {quizErr instanceof ApiError && quizErr.notConfigured ? <ServiceNotice service={t("Le quiz de compréhension", "The comprehension quiz")} envVar="ANTHROPIC_API_KEY" /> : quizErr ? <ErrorNote>{errorMessage(quizErr)}</ErrorNote> : null}
            {quizErr ? <Button onClick={() => next("quiz")}>{t("Continuer", "Continue")}</Button> : null}
            {quiz && quiz.mcq[qi] && (
              <div key={qi} className="animate-pop">
                <p className="text-xs text-muted">{t("Compréhension", "Comprehension")} · {qi + 1}/{quiz.mcq.length}</p>
                <p className="mt-1 font-semibold">{quiz.mcq[qi].question}</p>
                <div className="mt-3 grid gap-2">
                  {quiz.mcq[qi].options.map((o, k) => (
                    <button key={k} onClick={() => answerMcq(k)} className={cx("rounded-xl border px-3 py-2.5 text-left text-sm transition", picked === null ? "border-line hover:border-ink-300" : k === quiz.mcq[qi].answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
                  ))}
                </div>
                {picked !== null && (
                  <>
                    <p className="mt-2 text-sm text-muted">{quiz.mcq[qi].explanationFr}</p>
                    <Button className="mt-3 w-full" onClick={() => { setPicked(null); if (qi + 1 < quiz.mcq.length) setQi(qi + 1); else next("quiz"); }}>{t("Suivant", "Next")}</Button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {step === "open" && quiz && (
          <div>
            <p className="text-xs text-muted">{t("Question ouverte — réponds en anglais", "Open question — answer in English")}</p>
            <p className="mt-1 font-semibold">{quiz.openQuestion}</p>
            <textarea value={openAnswer} onChange={(e) => setOpenAnswer(e.target.value)} rows={3} disabled={!!openFb} className="mt-3 w-full rounded-xl border border-line bg-surface-2 p-3 outline-none focus:border-ink-400" placeholder="I think…" />
            {!openFb ? (
              <div className="mt-2 flex gap-2">
                <Button onClick={grade} loading={grading} disabled={!openAnswer.trim()}>{t("Envoyer", "Send")}</Button>
                <Button variant="ghost" onClick={() => next("open")}>{t("Passer", "Skip")}</Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <p>{openFb.feedbackFr}</p>
                {openFb.corrected !== openAnswer && <p className="rounded-xl bg-mint-100/60 p-2 dark:bg-mint-600/10">✍️ {openFb.corrected}</p>}
                <Button className="w-full" onClick={() => next("open")}>{t("Suivant", "Next")}</Button>
              </div>
            )}
          </div>
        )}

        {step === "vocab" && fills[fi] && (
          <div key={fi} className="animate-pop">
            <p className="text-xs text-muted">{t("Vocabulaire du chapitre", "Chapter vocabulary")} · {fi + 1}/{fills.length}</p>
            <p className="mt-2 rounded-xl bg-surface-2 p-3 font-serif text-[15px] leading-relaxed">{fills[fi].sentence}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {fills[fi].options.map((o) => (
                <button key={o} onClick={() => pickFill(o)} className={cx("rounded-xl border px-3 py-2.5 text-sm transition", !fillPick ? "border-line hover:border-ink-300" : o === fills[fi].answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : o === fillPick ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
              ))}
            </div>
            {fillPick && <Button className="mt-3 w-full" onClick={() => { setFillPick(null); if (fi + 1 < fills.length) setFi(fi + 1); else next("vocab"); }}>{t("Suivant", "Next")}</Button>}
          </div>
        )}

        {step === "speak" && speakSentence && (
          <div>
            <p className="text-xs text-muted">{t("Prononciation — écoute puis répète", "Pronunciation — listen then repeat")}</p>
            <p className="mt-2 rounded-xl bg-surface-2 p-3 font-serif text-[15px] leading-relaxed">
              {said ? said.words.map((w, i) => <span key={i} className={w.ok ? "text-mint-600" : "text-coral-600 underline"}>{w.word} </span>) : speakSentence}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => speak(speakSentence, { rate: 0.85 })}>🔊 {t("Écouter", "Listen")}</Button>
              {recognitionSupported() ? (
                <Button onClick={record} loading={listening}>🎙️ {listening ? t("Je t'écoute…", "Listening…") : t("Répéter", "Repeat")}</Button>
              ) : (
                <p className="text-xs text-muted">{t("Reconnaissance vocale indisponible sur ce navigateur : répète à voix haute pour t'entraîner.", "Speech recognition unavailable here.")}</p>
              )}
            </div>
            {speakErr && <ErrorNote>{speakErr}</ErrorNote>}
            {said && <p className="mt-2 text-sm">{t(`Score indicatif : ${Math.round(said.score * 100)} % — entendu : « ${said.text} »`, `Indicative score: ${Math.round(said.score * 100)}%`)}</p>}
            <Button className="mt-3 w-full" variant={said ? "primary" : "ghost"} onClick={() => next("speak")}>{said ? t("Terminer", "Finish") : t("Passer", "Skip")}</Button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="text-4xl">🌟</div>
            <p className="mt-2 text-lg font-semibold">{t("Séance terminée !", "Session complete!")}</p>
            <p className="text-sm text-muted">{total ? t(`${score}/${total} bonnes réponses`, `${score}/${total} correct`) : t("Merci d'avoir pris le temps !", "Thanks!")}</p>
            <Button className="mt-4 w-full" onClick={() => onClose(true)}>{t("Continuer la lecture", "Continue reading")}</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
