"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDb, saveSettings, uid } from "@/lib/db";
import { SEED_VOCAB } from "@/lib/data/vocab";
import { GRAMMAR_ITEMS, PSEUDOWORDS } from "@/lib/data/test-bank";
import { markKnown } from "@/lib/learn";
import { distractors, type PoolItem } from "@/lib/pool";
import { sample, shuffle } from "@/lib/text";
import { useT } from "@/hooks/useT";
import { Button, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import type { SeedWord } from "@/lib/data/types";

// Optional placement test (≈5 min):
// 1) yes/no vocabulary checklist per frequency band, with pseudo-words to correct over-claiming;
// 2) a translation check on a sample of "known" words; 3) a short grammar section.
const BANDS: [number, number][] = [[1, 100], [101, 500], [501, 1000], [1001, 2000]];
const PER_BAND = 10;

type YesNo = { word: string; real: boolean; band: number; seed?: SeedWord };

export default function PlacementTest() {
  const t = useT();
  const router = useRouter();
  const items = useMemo<YesNo[]>(() => {
    const real: YesNo[] = BANDS.flatMap(([a, b], band) => sample(SEED_VOCAB.filter((w) => w.rank >= a && w.rank <= b && !w.en.includes(" ") && w.pos !== "det"), PER_BAND).map((w) => ({ word: w.en, real: true, band, seed: w })));
    const fake: YesNo[] = sample(PSEUDOWORDS, 12).map((w) => ({ word: w, real: false, band: -1 }));
    return shuffle([...real, ...fake]);
  }, []);
  const grammar = useMemo(() => {
    const byLevel = ["A1", "A2", "B1", "B2", "C1"].flatMap((lv) => sample(GRAMMAR_ITEMS.filter((g) => g.level === lv), 2));
    return byLevel;
  }, []);

  const [phase, setPhase] = useState<"intro" | "yesno" | "check" | "grammar" | "result">("intro");
  const [i, setI] = useState(0);
  const [yes, setYes] = useState<Record<string, boolean>>({});
  const [checkItems, setCheckItems] = useState<{ seed: SeedWord; options: string[] }[]>([]);
  const [checkOk, setCheckOk] = useState<Record<string, boolean>>({});
  const [gAnswers, setGAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{ bands: number[]; falseAlarm: number; markedKnown: number; grammar: number; vocabEstimate: number } | null>(null);

  const answerYesNo = (v: boolean) => {
    const it = items[i];
    const next = { ...yes, [it.word]: v };
    setYes(next);
    if (i + 1 < items.length) setI(i + 1);
    else {
      // Build the verification sample from claimed-known real words.
      const claimed = items.filter((x) => x.real && next[x.word] && x.seed);
      const pool: PoolItem[] = SEED_VOCAB.slice(0, 1500).map((w) => ({ key: w.en, en: w.en, fr: w.fr, pos: w.pos, weakness: 0 }));
      const chk = sample(claimed, Math.min(8, claimed.length)).map((x) => {
        const target = pool.find((p) => p.key === x.word) ?? { key: x.word, en: x.word, fr: x.seed!.fr, pos: x.seed!.pos, weakness: 0 };
        return { seed: x.seed!, options: shuffle([x.seed!.fr, ...distractors(target, pool, 3, "fr")]) };
      });
      setCheckItems(chk);
      setI(0);
      setPhase(chk.length ? "check" : "grammar");
    }
  };

  const finish = async (gAns: number[]) => {
    const fakeCount = items.filter((x) => !x.real).length;
    const falseAlarm = items.filter((x) => !x.real && yes[x.word]).length / fakeCount;
    const checks = Object.values(checkOk);
    const checkRate = checks.length ? checks.filter(Boolean).length / checks.length : 1;
    // Corrected knowledge per band: (hit − false alarm) / (1 − false alarm), scaled by the verification rate.
    const bands = BANDS.map((_, b) => {
      const inBand = items.filter((x) => x.band === b);
      const hit = inBand.filter((x) => yes[x.word]).length / inBand.length;
      const corrected = falseAlarm >= 1 ? 0 : Math.max(0, (hit - falseAlarm) / (1 - falseAlarm));
      return Math.min(1, corrected * (0.4 + 0.6 * checkRate));
    });
    // Mark as known: whole bands mastered at ≥90 %; otherwise only the words ticked in bands ≥60 %.
    const toMark: string[] = [];
    BANDS.forEach(([a, b], idx) => {
      if (bands[idx] >= 0.9) toMark.push(...SEED_VOCAB.filter((w) => w.rank >= a && w.rank <= b).map((w) => w.en));
      else if (bands[idx] >= 0.6) toMark.push(...items.filter((x) => x.band === idx && yes[x.word]).map((x) => x.word));
    });
    // Words that failed the translation check are never marked as known.
    const failed = new Set(Object.entries(checkOk).filter(([, ok]) => !ok).map(([w]) => w));
    const marked = toMark.filter((w) => !failed.has(w));
    await markKnown(marked);
    const grammarScore = gAns.filter((a, k) => a === grammar[k].answer).length / grammar.length;
    const sizes = [100, 400, 500, 1000];
    const vocabEstimate = Math.round(bands.reduce((acc, p, k) => acc + p * sizes[k], 0));
    await getDb().tests.put({ id: uid("t"), type: "placement", scores: { vocabulary: Math.min(1, vocabEstimate / 5000), grammar: grammarScore }, vocabEstimate, at: Date.now(), updatedAt: Date.now() });
    await saveSettings({ placementDone: true });
    setResult({ bands, falseAlarm, markedKnown: marked.length, grammar: grammarScore, vocabEstimate });
    setPhase("result");
  };

  const total = items.length + checkItems.length + grammar.length;
  const done = phase === "yesno" ? i : phase === "check" ? items.length + i : phase === "grammar" ? items.length + checkItems.length + i : total;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Test de niveau", "Placement test")} subtitle={t("Facultatif · ~5 minutes · pour ne pas réapprendre ce que tu sais déjà", "Optional · ~5 minutes")} back="/tests" />
      {phase !== "intro" && phase !== "result" && <ProgressBar value={done} max={total} className="mb-4" />}

      {phase === "intro" && (
        <Panel>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>{t("Des mots s'affichent : indique honnêtement si tu connais leur sens. Attention, certains mots n'existent pas !", "Say whether you know each word. Some words are fake!")}</li>
            <li>{t("Vérification rapide de quelques mots que tu as dit connaître.", "Quick check of some words you claimed to know.")}</li>
            <li>{t("10 questions de grammaire.", "10 grammar questions.")}</li>
          </ol>
          <p className="mt-3 text-xs text-muted">{t("Le résultat sert à éviter les mots déjà connus et à adapter le contenu. Ce n'est pas une certification CECRL.", "Not a CEFR certification.")}</p>
          <Button className="mt-4 w-full" onClick={() => setPhase("yesno")}>{t("Commencer", "Start")}</Button>
        </Panel>
      )}

      {phase === "yesno" && items[i] && (
        <div key={items[i].word} className="animate-pop">
          <Panel className="py-12 text-center"><p className="text-3xl font-semibold">{items[i].word}</p></Panel>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" onClick={() => answerYesNo(false)}>{t("Je ne connais pas", "I don't know it")}</Button>
            <Button size="lg" onClick={() => answerYesNo(true)}>{t("Je connais", "I know it")}</Button>
          </div>
        </div>
      )}

      {phase === "check" && checkItems[i] && (
        <div key={checkItems[i].seed.en} className="animate-pop">
          <p className="mb-2 text-sm text-muted">{t("Que signifie…", "What does it mean…")}</p>
          <Panel className="text-center"><p className="text-2xl font-semibold">{checkItems[i].seed.en}</p></Panel>
          <div className="mt-3 grid gap-2">
            {[...checkItems[i].options, t("Je ne sais pas", "I don't know")].map((o) => (
              <button key={o} className="rounded-xl border border-line bg-surface px-4 py-3 text-left hover:border-ink-300" onClick={() => {
                setCheckOk((c) => ({ ...c, [checkItems[i].seed.en]: o === checkItems[i].seed.fr }));
                if (i + 1 < checkItems.length) setI(i + 1);
                else { setI(0); setPhase("grammar"); }
              }}>{o}</button>
            ))}
          </div>
        </div>
      )}

      {phase === "grammar" && grammar[i] && (
        <div key={grammar[i].id} className="animate-pop">
          <p className="mb-2 text-sm text-muted">{t("Complète la phrase", "Complete the sentence")} · {i + 1}/{grammar.length}</p>
          <Panel className="text-center"><p className="text-xl font-medium">{grammar[i].prompt}</p></Panel>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {grammar[i].options.map((o, k) => (
              <button key={o} disabled={picked !== null} onClick={() => setPicked(k)} className={cx("rounded-xl border px-4 py-3 transition", picked === null ? "border-line bg-surface hover:border-ink-300" : k === grammar[i].answer ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : k === picked ? "border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line opacity-60")}>{o}</button>
            ))}
          </div>
          {picked !== null && (
            <>
              <p className="mt-3 text-sm text-muted">{grammar[i].explanation}</p>
              <Button className="mt-3 w-full" onClick={() => {
                const ans = [...gAnswers, picked];
                setGAnswers(ans);
                setPicked(null);
                if (i + 1 < grammar.length) setI(i + 1);
                else void finish(ans);
              }}>{t("Suivant", "Next")}</Button>
            </>
          )}
        </div>
      )}

      {phase === "result" && result && (
        <Panel>
          <p className="text-lg font-semibold">{t("Résultats", "Results")}</p>
          <p className="mt-1 text-sm text-muted">{t(`Vocabulaire estimé parmi les 2 000 mots les plus fréquents : ~${result.vocabEstimate} mots.`, `Estimated vocabulary among the 2,000 most frequent words: ~${result.vocabEstimate}.`)}</p>
          <ul className="mt-3 space-y-2">
            {BANDS.map(([a, b], k) => (
              <li key={k}>
                <div className="flex justify-between text-sm"><span>{t(`Mots ${a}–${b}`, `Words ${a}–${b}`)}</span><span className="tabular-nums">{Math.round(result.bands[k] * 100)} %</span></div>
                <ProgressBar value={result.bands[k]} tone={result.bands[k] >= 0.9 ? "mint" : "ink"} className="mt-1" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">{t(`Grammaire : ${Math.round(result.grammar * 100)} %`, `Grammar: ${Math.round(result.grammar * 100)}%`)}</p>
          {result.falseAlarm > 0.25 && <p className="mt-2 text-sm text-coral-600">{t("Tu as indiqué connaître plusieurs mots inventés : le score a été corrigé à la baisse.", "You claimed several fake words: the score was adjusted down.")}</p>}
          <p className="mt-3 text-sm text-mint-600">{t(`${result.markedKnown} mots marqués comme déjà connus : ils ne te seront pas proposés comme nouveaux mots.`, `${result.markedKnown} words marked as known.`)}</p>
          <Button className="mt-4 w-full" onClick={() => router.push("/learn")}>{t("Apprendre mes premiers mots", "Learn my first words")}</Button>
        </Panel>
      )}
    </div>
  );
}
