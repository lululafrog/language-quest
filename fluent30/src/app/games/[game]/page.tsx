"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, LinkButton } from "@/components/ui";
import { BuilderGame } from "@/components/games/BuilderGame";
import { EndScreen, Loading, useGameSession } from "@/components/games/common";
import { HangmanGame } from "@/components/games/HangmanGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { PairsGame } from "@/components/games/PairsGame";
import { PronunciationGame } from "@/components/games/PronunciationGame";
import { QuestionGame } from "@/components/games/QuestionGame";
import { ScrambleGame } from "@/components/games/ScrambleGame";
import { useT } from "@/hooks/useT";
import { loadGame, type Loaded, type WordContext } from "@/lib/games/loaders";
import { ModePicker } from "@/components/games/ModePicker";
import { resetSessionLog } from "@/lib/games/engine";
import { saveSettings } from "@/lib/db";
import { gameById } from "@/lib/games/registry";

export default function GamePage() {
  const t = useT();
  const { game } = useParams<{ game: string }>();
  const def = gameById(game);
  const { level, finish, result, replay, round } = useGameSession(game);
  const [data, setData] = useState<{ round: number; loaded: Loaded & { filledWithNew?: boolean } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // vocabulary games: mode chosen on the start screen (new words / review) and optional theme
  const search = useSearchParams();
  const [ctx, setCtx] = useState<WordContext | null>(() => {
    const m = search.get("mode");
    return m === "new" || m === "review" ? { mode: m, theme: search.get("theme") ?? undefined } : null;
  });
  const needsMode = !!def?.words && !ctx;

  useEffect(() => {
    if (!def || level === null || needsMode) return;
    let alive = true;
    resetSessionLog();
    loadGame(game, level, ctx ?? undefined)
      .then((loaded) => alive && setData({ round, loaded }))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [game, def, level, round, needsMode, ctx]);

  if (!def)
    return (
      <EmptyState icon="🎲" title={t("Ce jeu n'existe pas", "This game doesn't exist")}>
        <LinkButton href="/games" className="mt-3">{t("Tous les jeux", "All games")}</LinkButton>
      </EmptyState>
    );
  if (needsMode)
    return (
      <ModePicker
        gameId={game}
        onStart={(mode, theme) => {
          setData(null);
          setCtx({ mode, theme });
          void saveSettings({ gamePrefs: { mode, theme } });
        }}
      />
    );
  if (result)
    return (
      <EndScreen
        gameId={game}
        result={result}
        mode={ctx?.mode}
        onReplay={replay}
        onChangeMode={def.words ? () => { setCtx(null); replay(); } : undefined}
      />
    );
  if (error) return <EmptyState icon="⚠️" title={t("Impossible de charger le jeu", "Could not load the game")}>{error}</EmptyState>;
  if (!data || data.round !== round || level === null) return <Loading />;

  const d = data.loaded;
  const fillNotice = d.filledWithNew ? t("Tu as encore peu de mots à réviser : la partie est complétée avec de nouveaux mots de ton niveau.", "Few words to review yet: completed with new words at your level.") : undefined;
  const key = `${game}-${round}`;
  const empty = (
    <EmptyState icon="📭" title={t("Pas encore assez de mots pour ce jeu", "Not enough words for this game yet")}>
      {t("Apprends quelques nouveaux mots, puis reviens jouer.", "Learn a few new words, then come back.")}
      <div className="mt-4">
        <LinkButton href="/learn">{t("Nouveaux mots", "New words")}</LinkButton>
      </div>
    </EmptyState>
  );

  switch (d.kind) {
    case "questions":
      if (!d.built.questions.length) return empty;
      return <QuestionGame key={key} gameId={game} questions={d.built.questions} notice={d.built.notice ?? fillNotice} timeLimit={d.timeLimit} onFinish={finish} />;
    case "pairs":
      return d.items.length >= 3 ? <PairsGame key={key} gameId={game} items={d.items} notice={d.notice ?? fillNotice} onFinish={finish} /> : empty;
    case "memory":
      return d.items.length >= 3 ? <MemoryGame key={key} gameId={game} items={d.items} onFinish={finish} /> : empty;
    case "hangman":
      return d.words.length ? <HangmanGame key={key} gameId={game} words={d.words} level={level} onFinish={finish} /> : empty;
    case "scramble":
      return d.words.length ? <ScrambleGame key={key} gameId={game} words={d.words} onFinish={finish} /> : empty;
    case "builder":
      return d.sentences.length ? <BuilderGame key={key} gameId={game} sentences={d.sentences} onFinish={finish} /> : empty;
    case "pronunciation":
      return d.items.length ? <PronunciationGame key={key} gameId={game} items={d.items} onFinish={finish} /> : empty;
  }
}
