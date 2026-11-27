"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb, todayKey } from "@/lib/db";
import { aiWords, markKnown, nextNewWords, type Candidate } from "@/lib/learn";
import { cardFromSeed, ensureImage, lemmaOf, saveCard } from "@/lib/cards";
import { SEED_VOCAB } from "@/lib/data/vocab";
import { TIERS, themeEmoji, themeLabel } from "@/lib/data/types";
import { useSettings } from "@/hooks/useSettings";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { errorMessage } from "@/lib/api";
import { speak } from "@/lib/speech";
import { distractors, type PoolItem } from "@/lib/pool";
import { shuffle } from "@/lib/text";
import { Badge, Button, EmptyState, ErrorNote, LinkButton, PageHeader, Panel, ProgressBar, SpeakButton, cx, toast } from "@/components/ui";
import { WordImage } from "@/components/WordImage";
import type { Card } from "@/lib/types";

type Phase = "pick" | "intro" | "check" | "done";

export default function LearnPage() {
  const s = useSettings();
  const t = useT();
  const status = useStatus();
  const today = useLiveQuery(() => getDb().activity.get(todayKey()), []);
  const coverage = useLiveQuery(async () => {
    const db = getDb();
    const [cards, known] = await Promise.all([db.cards.toArray(), db.known.toArray()]);
    const set = new Set([...cards.map((c) => c.lemma), ...known.map((k) => k.lemma)]);
    return TIERS.map((tier) => {
      const inTier = SEED_VOCAB.filter((w) => w.rank <= tier.max);
      return { id: tier.id, label: tier.label, total: inTier.length, covered: inTier.filter((w) => set.has(lemmaOf(w.en))).length };
    });
  }, []);

  const [phase, setPhase] = useState<Phase>("pick");
  const [batch, setBatch] = useState<Candidate[]>([]);
  const [idx, setIdx] = useState(0);
  const [learned, setLearned] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const newToday = today?.newWords ?? 0;
  const remaining = Math.max(0, s.dailyNewWords - newToday);

  const start = useCallback(
    async (mode: "auto" | "more" | "ai-interests" | "ai-tier", tier?: number) => {
      setError("");
      setLoading(true);
      try {
        let c: Candidate[];
        if (mode === "ai-interests") c = await aiWords("interests", { interests: s.interests.map((i) => themeLabel(i)), count: 10 });
        else if (mode === "ai-tier") c = await aiWords("tier", { tier: tier ?? 3000, count: 10 });
        else c = await nextNewWords(mode === "auto" && remaining > 0 ? remaining : 5, s.interests);
        if (!c.length) {
          setError(t("Tu as couvert tout le vocabulaire intégré. Utilise la génération IA pour continuer (paliers 3 000 et avancé).", "You've covered all built-in vocabulary. Use AI generation to continue."));
          return;
        }
        setBatch(c);
        setIdx(0);
        setLearned([]);
        setPhase("intro");
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [remaining, s.interests, t],
  );

  const current = batch[idx];

  const next = useCallback(
    (l: Card[]) => {
      if (idx + 1 < batch.length) setIdx(idx + 1);
      else setPhase(l.length >= 2 ? "check" : "done");
    },
    [idx, batch.length],
  );

  const learn = async () => {
    if (!current) return;
    const card = cardFromSeed(current.word, current.origin === "frequent" ? "seed" : "user");
    const r = await saveCard(card);
    const l = [...learned, r.card];
    setLearned(l);
    if (s.autoImages && status?.images) void ensureImage(r.card, current.word.ex);
    next(l);
  };
  const known = async () => {
    if (!current) return;
    await markKnown([current.word.en]);
    toast(t("Marqué comme déjà connu", "Marked as known"), "info");
    next(learned);
  };

  // Auto-play pronunciation on each new word.
  useEffect(() => {
    if (phase === "intro" && current) speak(current.word.en);
  }, [phase, current]);

  if (!s.loaded) return null;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Nouveaux mots", "New words")} subtitle={t(`${newToday}/${s.dailyNewWords} aujourd'hui · 70 % mots fréquents, 30 % selon tes centres d'intérêt`, `${newToday}/${s.dailyNewWords} today · 70% frequent words, 30% your interests`)} back="/" />

      {phase === "pick" && (
        <div className="space-y-4">
          <Panel>
            <ProgressBar value={newToday} max={s.dailyNewWords} tone="sun" />
            <p className="mt-3 text-sm text-muted">
              {remaining > 0
                ? t(`Encore ${remaining} mot${remaining > 1 ? "s" : ""} pour atteindre ton objectif du jour.`, `${remaining} more word${remaining > 1 ? "s" : ""} to reach today's goal.`)
                : t("Objectif atteint ! Tu peux continuer si tu le souhaites — sans dépasser ce que tu peux réviser.", "Goal reached! You can keep going.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => start("auto")} loading={loading}>{remaining > 0 ? t(`Apprendre ${remaining} mots`, `Learn ${remaining} words`) : t("5 mots de plus", "5 more words")}</Button>
              {s.interests.length > 0 && status?.ai && (
                <Button variant="outline" onClick={() => start("ai-interests")} disabled={loading}>✨ {t("Mots selon mes centres d'intérêt", "Words for my interests")}</Button>
              )}
            </div>
            {!s.interests.length && <p className="mt-3 text-xs text-muted">{t("Astuce : choisis tes centres d'intérêt dans les réglages pour personnaliser 30 % des mots.", "Tip: pick your interests in settings to personalise 30% of words.")} <Link className="text-ink-600 underline" href="/settings">{t("Réglages", "Settings")}</Link></p>}
          </Panel>
          <ErrorNote>{error}</ErrorNote>
          <Panel>
            <h2 className="mb-3 font-semibold">{t("Paliers de vocabulaire", "Vocabulary tiers")}</h2>
            <ul className="space-y-3">
              {coverage?.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="tabular-nums text-muted">{c.total ? `${c.covered}/${c.total}` : t("via IA", "via AI")}</span>
                  </div>
                  {c.total > 0 ? (
                    <ProgressBar value={c.covered} max={c.total} className="mt-1.5" tone={c.covered >= c.total ? "mint" : "ink"} />
                  ) : status?.ai ? (
                    <Button size="sm" variant="secondary" className="mt-1.5" onClick={() => start("ai-tier", c.id)} disabled={loading}>{t("Générer 10 mots de ce palier", "Generate 10 words")}</Button>
                  ) : (
                    <p className="mt-1 text-xs text-muted">{t("Nécessite la clé IA (ANTHROPIC_API_KEY).", "Requires the AI key.")}</p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">{t("Le nombre de mots connus n'équivaut pas à un niveau CECRL : il ne mesure qu'une partie de tes compétences.", "Word counts are not CEFR levels.")}</p>
          </Panel>
        </div>
      )}

      {phase === "intro" && current && (
        <div className="animate-slide-up" key={current.word.en}>
          <div className="mb-3 flex items-center justify-between text-sm text-muted">
            <span>{idx + 1} / {batch.length}</span>
            <Badge tone={current.origin === "frequent" ? "ink" : "coral"}>{current.origin === "frequent" ? t(`Fréquent · n°${current.word.rank}`, `Frequent · #${current.word.rank}`) : t("Personnalisé", "Personal")}</Badge>
          </div>
          <ProgressBar value={idx} max={batch.length} className="mb-4" />
          <Panel className="text-center">
            <WordImage term={current.word.en} fr={current.word.fr} className="mx-auto mb-4 h-40 w-40" />
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl font-semibold tracking-tight">{current.word.en}</h2>
              <SpeakButton text={current.word.en} />
            </div>
            {current.word.ipa && <p className="mt-1 font-mono text-sm text-muted">{current.word.ipa}</p>}
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">{current.word.pos}</p>
            <p className="mt-4 text-xl text-ink-700 dark:text-ink-200">{current.word.fr}</p>
            {current.word.ex && (
              <div className="mt-5 rounded-xl bg-surface-2 p-3 text-left">
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-[15px]">{current.word.ex}</p>
                  <SpeakButton text={current.word.ex} size={16} />
                </div>
                {current.word.exFr && <p className="mt-1 text-sm text-muted">{current.word.exFr}</p>}
              </div>
            )}
            {current.word.themes?.length ? (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {current.word.themes.map((th) => <Badge key={th} tone="gray">{themeEmoji(th)} {themeLabel(th, s.immersion)}</Badge>)}
              </div>
            ) : null}
          </Panel>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={known}>{t("Je connais déjà", "I know it")}</Button>
            <Button onClick={learn}>{t("Apprendre", "Learn it")}</Button>
          </div>
        </div>
      )}

      {phase === "check" && <QuickCheck cards={learned} onDone={() => setPhase("done")} t={t} />}

      {phase === "done" && (
        <div className="space-y-4">
          {learned.length ? (
            <Panel className="text-center">
              <div className="text-4xl">🎉</div>
              <p className="mt-2 text-lg font-semibold">{t(`${learned.length} mot${learned.length > 1 ? "s" : ""} ajouté${learned.length > 1 ? "s" : ""} à tes révisions`, `${learned.length} word${learned.length > 1 ? "s" : ""} added to your reviews`)}</p>
              <p className="mt-1 text-sm text-muted">{t("La répétition espacée te les reproposera juste avant que tu ne les oublies.", "Spaced repetition will bring them back right before you forget.")}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <LinkButton href="/review">{t("Réviser maintenant", "Review now")}</LinkButton>
                <Button variant="outline" onClick={() => setPhase("pick")}>{t("Continuer", "Continue")}</Button>
              </div>
            </Panel>
          ) : (
            <EmptyState icon="👌" title={t("Aucun nouveau mot ajouté", "No new words added")}>
              <Button variant="outline" className="mt-3" onClick={() => setPhase("pick")}>{t("Retour", "Back")}</Button>
            </EmptyState>
          )}
        </div>
      )}
    </div>
  );
}

/** Immediate retrieval practice right after the first exposure (not graded in FSRS). */
function QuickCheck({ cards, onDone, t }: { cards: Card[]; onDone: () => void; t: (a: string, b: string) => string }) {
  const items = useMemo(() => shuffle(cards), [cards]);
  const pool: PoolItem[] = useMemo(() => cards.map((c) => ({ key: c.id, en: c.term, fr: c.fr, pos: c.pos, weakness: 0 })), [cards]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const item = items[i];
  const options = useMemo(() => {
    if (!item) return [];
    const target = pool.find((p) => p.key === item.id)!;
    return shuffle([item.fr, ...distractors(target, pool, 3, "fr")]);
  }, [item, pool]);
  if (!item) return null;
  return (
    <div className="animate-slide-up" key={item.id}>
      <p className="mb-2 text-sm text-muted">{t("Vérification rapide", "Quick check")} · {i + 1}/{items.length}</p>
      <Panel className="text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="text-2xl font-semibold">{item.term}</p>
          <SpeakButton text={item.term} />
        </div>
      </Panel>
      <div className="mt-3 grid gap-2">
        {options.map((o) => {
          const correct = o === item.fr;
          return (
            <button
              key={o}
              disabled={!!picked}
              onClick={() => setPicked(o)}
              className={cx("rounded-xl border px-4 py-3 text-left transition", !picked ? "border-line bg-surface hover:border-ink-300" : correct ? "border-mint-500 bg-mint-100 dark:bg-mint-600/20" : o === picked ? "animate-shake border-coral-500 bg-coral-100 dark:bg-coral-600/20" : "border-line bg-surface opacity-60")}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked && (
        <Button className="mt-4 w-full" onClick={() => { setPicked(null); if (i + 1 < items.length) setI(i + 1); else onDone(); }}>
          {t("Suivant", "Next")}
        </Button>
      )}
    </div>
  );
}

