"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button, LinkButton, Panel, ProgressBar, Spinner, cx, toast } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { quickAdd } from "@/lib/cards";
import { computeLevel, saveResult, type Level, type MissedItem } from "@/lib/games/engine";
import { gameById } from "@/lib/games/registry";
import { levenshtein, normalize } from "@/lib/text";

export interface FinishPayload {
  score: number;
  total: number;
  missed: MissedItem[];
  extra?: ReactNode;
}

/** Loads the adaptive level and exposes finish() that saves the result. */
export function useGameSession(gameId: string) {
  const [level, setLevel] = useState<Level | null>(null);
  const started = useRef(0);
  const [result, setResult] = useState<(FinishPayload & { xp: number }) | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let alive = true;
    computeLevel(gameId).then((r) => alive && setLevel(r.level));
    return () => {
      alive = false;
    };
  }, [gameId, round]);

  useEffect(() => {
    started.current = Date.now();
  }, [round]);

  const finish = useCallback(
    async (p: FinishPayload) => {
      const xp = await saveResult(gameId, p.score, p.total, (Date.now() - started.current) / 1000).catch(() => 0);
      setResult({ ...p, xp });
    },
    [gameId],
  );

  const replay = useCallback(() => {
    setResult(null);
    setLevel(null);
    setRound((r) => r + 1);
  }, []);

  return { level, finish, result, replay, round };
}

export function GameHeader({ gameId, progress, right }: { gameId: string; progress?: number; right?: ReactNode }) {
  const t = useT();
  const g = gameById(gameId);
  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/games" className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label={t("Retour aux jeux", "Back to games")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <span className="text-2xl">{g?.emoji}</span>
        <h1 className="flex-1 truncate text-lg font-semibold">{g ? t(g.titleFr, g.titleEn) : gameId}</h1>
        {right}
      </div>
      {progress !== undefined && <ProgressBar value={progress} />}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16 text-ink-500">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function LevelBadge({ level }: { level: Level }) {
  const t = useT();
  const labels = { 1: t("Niveau facile", "Easy"), 2: t("Niveau moyen", "Medium"), 3: t("Niveau difficile", "Hard") };
  return <Badge tone={level === 1 ? "mint" : level === 2 ? "ink" : "coral"}>{labels[level]}</Badge>;
}

export function EndScreen({ gameId, result, onReplay }: { gameId: string; result: FinishPayload & { xp: number }; onReplay: () => void }) {
  const t = useT();
  const acc = result.total ? result.score / result.total : 0;
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const msg =
    acc >= 0.9 ? t("Excellent ! Mémorisation solide.", "Excellent! Solid recall.") : acc >= 0.7 ? t("Bien joué !", "Well done!") : acc >= 0.5 ? t("Pas mal — on consolide.", "Not bad — keep consolidating.") : t("Continue : c'est en se trompant qu'on retient.", "Keep going: mistakes help memory.");

  async function add(m: MissedItem) {
    setBusy(m.en);
    try {
      const r = await quickAdd(m.en, { fr: m.fr, source: "user", example: m.note });
      setAdded((s) => new Set(s).add(m.en));
      toast(r.merged ? t("Déjà dans tes flashcards — remis en révision", "Already in your deck — rescheduled") : t("Ajouté aux flashcards", "Added to flashcards"));
    } catch {
      toast(t("Impossible d'ajouter ce mot", "Could not add this item"), "err");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-pop space-y-4">
      <GameHeader gameId={gameId} />
      <Panel className="text-center">
        <div className="text-5xl">{acc >= 0.9 ? "🏆" : acc >= 0.7 ? "🎉" : acc >= 0.5 ? "💪" : "🌱"}</div>
        <p className="mt-3 text-xl font-semibold">{msg}</p>
        <div className="mt-4 flex justify-center gap-6">
          <div>
            <div className="text-3xl font-semibold tabular-nums">{result.score}/{result.total}</div>
            <div className="text-xs text-muted">{t("bonnes réponses", "correct")}</div>
          </div>
          <div>
            <div className="text-3xl font-semibold tabular-nums">{Math.round(acc * 100)}%</div>
            <div className="text-xs text-muted">{t("précision", "accuracy")}</div>
          </div>
          <div>
            <div className="text-3xl font-semibold tabular-nums text-ink-600 dark:text-ink-300">+{result.xp}</div>
            <div className="text-xs text-muted">XP</div>
          </div>
        </div>
        {result.extra && <div className="mt-3 text-sm text-muted">{result.extra}</div>}
      </Panel>

      {result.missed.length > 0 && (
        <Panel>
          <h2 className="font-semibold">🧠 {t("Rappel : à retenir", "Recap: to remember")}</h2>
          <p className="mb-3 text-sm text-muted">{t("Les éléments manqués reviendront plus vite dans tes révisions.", "Missed items will come back sooner in your reviews.")}</p>
          <ul className="divide-y divide-line">
            {dedupe(result.missed).map((m) => (
              <li key={m.en} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{m.en}</div>
                  <div className="text-sm text-muted">{m.fr}</div>
                  {m.note && <div className="mt-0.5 text-xs text-muted">{m.note}</div>}
                </div>
                {m.cardId ? (
                  <Badge tone="sun">{t("En révision", "In review")}</Badge>
                ) : added.has(m.en) ? (
                  <Badge tone="mint">✓ {t("Ajouté", "Added")}</Badge>
                ) : (
                  <Button size="sm" variant="secondary" loading={busy === m.en} onClick={() => add(m)}>
                    + {t("Flashcard", "Flashcard")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {result.missed.some((m) => m.cardId) && (
            <LinkButton href="/review" variant="outline" size="sm" className="mt-3">
              {t("Réviser maintenant", "Review now")}
            </LinkButton>
          )}
        </Panel>
      )}

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onReplay}>
          {t("Rejouer", "Play again")}
        </Button>
        <LinkButton href="/games" variant="secondary" className="flex-1">
          {t("Tous les jeux", "All games")}
        </LinkButton>
      </div>
    </div>
  );
}

function dedupe(m: MissedItem[]) {
  const seen = new Set<string>();
  return m.filter((x) => (seen.has(x.en) ? false : (seen.add(x.en), true)));
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="mb-4 rounded-xl border border-sun-400/60 bg-sun-100/60 p-3 text-sm text-amber-900 dark:bg-sun-500/10 dark:text-sun-100">{children}</div>;
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, "i am"], [/\b(you|we|they)'re\b/g, "$1 are"], [/\b(he|she|it|that|what|there|where)'s\b/g, "$1 is"],
  [/\b(i|you|we|they)'ve\b/g, "$1 have"], [/\b(i|you|he|she|we|they)'ll\b/g, "$1 will"], [/\b(i|you|he|she|we|they)'d\b/g, "$1 would"],
  [/\bcan't\b/g, "cannot"], [/\bwon't\b/g, "will not"], [/\b(\w+)n't\b/g, "$1 not"], [/\bcan not\b/g, "cannot"], [/\blet's\b/g, "let us"],
];
function expand(s: string) {
  let x = normalize(s).replace(/-/g, " ");
  for (const [re, rep] of CONTRACTIONS) x = x.replace(re, rep);
  return x.replace(/\s+/g, " ").trim();
}

/** Lenient comparison for whole sentences (punctuation, case and contractions ignored). */
export function compareSentence(input: string, target: string): "exact" | "close" | "wrong" {
  const a = expand(input);
  const b = expand(target);
  if (!a) return "wrong";
  if (a === b) return "exact";
  const tol = Math.max(1, Math.floor(b.length * 0.06));
  return levenshtein(a, b) <= tol ? "close" : "wrong";
}

export function ChoiceButton({ children, state, onClick, disabled }: { children: ReactNode; state?: "correct" | "wrong" | "dim"; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "w-full rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition active:scale-[0.99]",
        state === "correct" && "animate-pop border-mint-500 bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400",
        state === "wrong" && "animate-shake border-coral-500 bg-coral-100 text-coral-600 dark:bg-coral-600/20 dark:text-coral-400",
        state === "dim" && "border-line opacity-50",
        !state && "border-line bg-surface hover:border-ink-300 hover:bg-ink-50 dark:hover:bg-ink-900/40",
      )}
    >
      {children}
    </button>
  );
}
