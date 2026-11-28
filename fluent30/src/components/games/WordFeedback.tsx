"use client";
// Teaching feedback shown after every vocabulary answer, in every game: the word, its pronunciation, translation,
// a natural example with its translation, a synonym, and — after a mistake — a short reason.
import { SpeakButton, cx } from "@/components/ui";
import type { PoolItem } from "@/lib/pool";
import { lexWord } from "@/lib/vocab/words";
import { levenshtein, normalize, splitAlternatives } from "@/lib/text";

export type FeedbackVerdict = "exact" | "close" | "wrong";

/** Short French explanation of why an answer was wrong (never a fake explanation: only what we know). */
export function whyWrong(opts: { word: PoolItem; given?: string; answerLang?: "en" | "fr"; meaningOfGiven?: string; correct: string }): string {
  const given = opts.given?.trim();
  if (!given) return "Pas grave : retiens-le, il reviendra plus loin dans la partie puis demain.";
  const m = opts.meaningOfGiven;
  if (m?.startsWith("«")) return `${m}.`;
  if (m?.startsWith("la ")) return `Ta réponse était ${m}.`;
  if (m) return `« ${given} » veut dire « ${m} » : ce n'est pas le même sens.`;
  if (opts.answerLang === "en") {
    const other = lexWord(given);
    if (other && normalize(other.en) !== normalize(opts.word.en)) return `« ${other.en} » existe, mais il veut dire « ${splitAlternatives(other.fr)[0]} ».`;
    const d = levenshtein(normalize(given), normalize(opts.correct));
    if (d <= 2) return `Orthographe : on écrit « ${opts.correct} ».`;
  }
  return `La réponse attendue était « ${opts.correct} ».`;
}

export function WordFeedback({ item, verdict, reason, compact }: { item: PoolItem; verdict: FeedbackVerdict; reason?: string; compact?: boolean }) {
  const syn = item.synonyms?.find((s) => normalize(s) !== normalize(item.en));
  const tone = verdict === "wrong" ? "bg-coral-100/70 dark:bg-coral-600/15" : verdict === "close" ? "bg-sun-100/70 dark:bg-sun-500/15" : "bg-mint-100/70 dark:bg-mint-600/15";
  return (
    <div className={cx("animate-fade rounded-2xl p-3.5 text-left text-sm", tone)} role="status">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {verdict === "exact" ? "✓ Bien joué" : verdict === "close" ? "≈ Presque" : "✗ À retenir"}
        {item.cefr && <span className="ml-2 rounded-full bg-surface/70 px-1.5 py-0.5 text-[10px]">{item.cefr}</span>}
      </p>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-xl font-semibold">{item.en}</span>
        <SpeakButton text={item.en} />
        {item.ipa && <span className="text-sm text-muted">/{item.ipa.replace(/^\/|\/$/g, "")}/</span>}
      </div>
      <p className="font-medium">{item.fr}</p>
      {reason && verdict !== "exact" && <p className="mt-1.5 text-[13px]">{reason}</p>}
      {!compact && item.example && (
        <div className="mt-2 border-t border-black/5 pt-2 dark:border-white/10">
          <p className="flex items-start gap-1 italic">
            <span className="flex-1">{item.example}</span>
            <SpeakButton text={item.example} />
          </p>
          {item.exampleFr && <p className="text-muted">{item.exampleFr}</p>}
        </div>
      )}
      {!compact && syn && <p className="mt-1.5 text-muted">≈ {syn}</p>}
    </div>
  );
}
