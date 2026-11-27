"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDueQueue, gradeCard, previewIntervals, type QueueItem } from "@/lib/srs";
import { checkAnswer } from "@/lib/text";
import { speak } from "@/lib/speech";
import { useT } from "@/hooks/useT";
import { useSettings } from "@/hooks/useSettings";
import { Badge, Button, EmptyState, LinkButton, PageHeader, Panel, ProgressBar, Segmented, SpeakButton, cx } from "@/components/ui";
import { WordImage } from "@/components/WordImage";
import type { Grade, Skill } from "@/lib/types";
import { themeLabel } from "@/lib/data/types";
import { courseForWord, type CourseLink } from "@/lib/connect";

type Filter = "all" | Skill;

export default function ReviewPage() {
  const t = useT();
  const s = useSettings();
  const [filter, setFilter] = useState<Filter>("all");
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<"exact" | "close" | "wrong" | null>(null);
  const [stats, setStats] = useState({ done: 0, good: 0, again: 0 });
  const shownAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [forgotLink, setForgotLink] = useState<{ term: string; link: CourseLink } | null>(null);

  const load = useCallback(async (f: Filter) => {
    const q = await getDueQueue(200, f === "all" ? undefined : [f]);
    setQueue(q);
    setPos(0);
    setFlipped(false);
    setStats({ done: 0, good: 0, again: 0 });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from IndexedDB
    void load(filter);
  }, [filter, load]);

  const item = queue?.[pos];
  const intervals = useMemo(() => (item ? previewIntervals(item.state) : null), [item]);

  useEffect(() => {
    shownAt.current = Date.now();
    if (item?.state.skill === "listening") speak(item.card.term);
  }, [item]);

  const flip = useCallback(() => {
    if (!item) return;
    if (!flipped && item.state.skill === "production" && typed.trim()) setVerdict(checkAnswer(typed, [item.card.term, ...(item.card.variants ?? [])]));
    setFlipped(true);
    if (item.state.skill !== "listening") speak(item.card.term);
  }, [item, flipped, typed]);

  const answer = useCallback(
    async (g: Grade) => {
      if (!item || busy) return;
      setBusy(true);
      const nextState = await gradeCard(item.card.id, item.state.skill, g, { ms: Date.now() - shownAt.current });
      setStats((x) => ({ done: x.done + 1, good: x.good + (g >= 3 ? 1 : 0), again: x.again + (g === 1 ? 1 : 0) }));
      // Forgotten cards come back at the end of this session (short-term learning step).
      if (g === 1 && queue) setQueue([...queue, { card: item.card, state: nextState }]);
      // Forgotten word linked to a lesson → offer a quick way back to the course.
      const link = g === 1 ? courseForWord(item.card.themes, item.card.kind) : null;
      setForgotLink(link ? { term: item.card.term, link } : null);
      setFlipped(false);
      setTyped("");
      setVerdict(null);
      setPos((p) => p + 1);
      setBusy(false);
    },
    [item, busy, queue],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") {
        if (e.key === "Enter") flip();
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!flipped) flip();
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) void answer(Number(e.key) as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, answer, flipped]);

  const header = (
    <PageHeader
      title={t("Révisions", "Reviews")}
      subtitle={t("Répétition espacée FSRS · reconnaissance, production et écoute évaluées séparément", "FSRS spaced repetition · recognition, production and listening tracked separately")}
      back="/"
    />
  );

  if (!queue) return <div className="mx-auto max-w-xl">{header}<div className="h-72 animate-pulse rounded-3xl bg-surface-2" /></div>;

  const filterBar = (
    <Segmented<Filter>
      className="mb-4 w-full overflow-x-auto no-scrollbar"
      value={filter}
      onChange={setFilter}
      options={[
        { value: "all", label: t("Tout", "All") },
        { value: "recognition", label: t("Reconnaître", "Recognise") },
        { value: "production", label: t("Produire", "Produce") },
        { value: "listening", label: t("Écouter", "Listen") },
      ]}
    />
  );

  if (!item) {
    return (
      <div className="mx-auto max-w-xl">
        {header}
        {filterBar}
        {stats.done > 0 ? (
          <Panel className="text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-2 text-lg font-semibold">{t("Révisions terminées !", "Reviews done!")}</p>
            <p className="mt-1 text-sm text-muted">{t(`${stats.done} cartes · ${Math.round((stats.good / stats.done) * 100)} % de réussite`, `${stats.done} cards · ${Math.round((stats.good / stats.done) * 100)}% success`)}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <LinkButton href="/learn">{t("Apprendre de nouveaux mots", "Learn new words")}</LinkButton>
              <LinkButton href="/games" variant="outline">{t("Jouer", "Play")}</LinkButton>
            </div>
          </Panel>
        ) : (
          <EmptyState icon="🌿" title={t("Aucune carte à réviser pour le moment", "Nothing to review right now")}>
            {t("Reviens plus tard ou ajoute de nouveaux mots.", "Come back later or add new words.")}
            <div className="mt-4 flex justify-center gap-2">
              <LinkButton href="/learn" size="sm">{t("Nouveaux mots", "New words")}</LinkButton>
              <LinkButton href="/cards/add" size="sm" variant="outline">{t("Ajouter un mot", "Add a word")}</LinkButton>
            </div>
          </EmptyState>
        )}
      </div>
    );
  }

  const { card, state } = item;
  const skill = state.skill;
  const skillLabel = skill === "recognition" ? t("Reconnaissance", "Recognition") : skill === "production" ? t("Production", "Production") : t("Compréhension orale", "Listening");

  return (
    <div className="mx-auto max-w-xl">
      {header}
      {filterBar}
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>{pos + 1} / {queue.length}</span>
        <Badge tone={skill === "recognition" ? "ink" : skill === "production" ? "coral" : "mint"}>{skillLabel}</Badge>
      </div>
      <ProgressBar value={pos} max={queue.length} className="mb-4" />

      <div className="flip" onClick={() => !flipped && skill !== "production" && flip()}>
        <div className={cx("flip-inner relative min-h-[22rem]", flipped && "flipped")}>
          {/* Front */}
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-line bg-surface p-6 text-center shadow-sm">
            {skill === "recognition" && (
              <>
                <p className="text-xs uppercase tracking-wide text-muted">{t("Que signifie…", "What does it mean…")}</p>
                <div className="mt-3 flex items-center gap-2">
                  <h2 className="text-3xl font-semibold tracking-tight">{card.term}</h2>
                  <SpeakButton text={card.term} />
                </div>
                {card.example && <p className="mt-4 text-[15px] italic text-muted">“{card.example}”</p>}
                <p className="mt-8 text-sm text-muted">{t("Touchez pour retourner", "Tap to flip")}</p>
              </>
            )}
            {skill === "listening" && (
              <>
                <p className="text-xs uppercase tracking-wide text-muted">{t("Écoute et retrouve le sens", "Listen and recall the meaning")}</p>
                <button onClick={(e) => { e.stopPropagation(); speak(card.term); }} className="mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-ink-600 text-white shadow-lg shadow-ink-600/30 transition active:scale-95" aria-label={t("Réécouter", "Replay")}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5z" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); speak(card.term, { rate: 0.6 }); }} className="mt-3 text-sm text-ink-600 underline dark:text-ink-300">{t("Plus lentement", "Slower")}</button>
                <p className="mt-6 text-sm text-muted">{t("Touchez la carte pour voir la réponse", "Tap the card to reveal")}</p>
              </>
            )}
            {skill === "production" && (
              <>
                <p className="text-xs uppercase tracking-wide text-muted">{t("Dis-le en anglais", "Say it in English")}</p>
                <h2 className="mt-3 text-2xl font-semibold">{card.fr}</h2>
                {card.exampleFr && <p className="mt-3 text-sm italic text-muted">“{card.exampleFr}”</p>}
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t("Tape ta réponse (facultatif)", "Type your answer (optional)")}
                  className="mt-6 w-full max-w-xs rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-lg outline-none focus:border-ink-400"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <Button className="mt-3" onClick={(e) => { e.stopPropagation(); flip(); }}>{t("Voir la réponse", "Show answer")}</Button>
              </>
            )}
          </div>

          {/* Back */}
          <div className="flip-face flip-back absolute inset-0 flex flex-col overflow-y-auto rounded-3xl border border-line bg-surface p-6 text-center shadow-sm">
            <WordImage term={card.term} card={card} className="mx-auto mb-3 h-28 w-28" />
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-semibold">{card.term}</h2>
              <SpeakButton text={card.term} />
            </div>
            {(card.ipa || card.pos) && <p className="text-sm text-muted">{card.ipa && <span className="font-mono">{s.accent === "en-US" && card.ipaUS ? card.ipaUS : card.ipa}</span>}{card.ipa && card.pos ? " · " : ""}{card.pos}</p>}
            <p className="mt-3 text-xl text-ink-700 dark:text-ink-200">{card.fr}</p>
            {verdict && (
              <p className={cx("mt-2 text-sm font-medium", verdict === "exact" ? "text-mint-600" : verdict === "close" ? "text-amber-600" : "text-coral-600")}>
                {verdict === "exact" ? t("✓ Parfait", "✓ Perfect") : verdict === "close" ? t(`≈ Presque : « ${typed} »`, `≈ Almost: “${typed}”`) : t(`✗ Ta réponse : « ${typed} »`, `✗ Your answer: “${typed}”`)}
              </p>
            )}
            {card.definition && <p className="mt-2 text-sm text-muted">{card.definition}</p>}
            {card.example && (
              <div className="mx-auto mt-3 max-w-sm rounded-xl bg-surface-2 p-3 text-left text-sm">
                <p>{card.example}</p>
                {card.exampleFr && <p className="mt-1 text-muted">{card.exampleFr}</p>}
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-1">
              {card.themes.slice(0, 3).map((th) => <Badge key={th} tone="gray">{themeLabel(th, s.immersion)}</Badge>)}
            </div>
            <Link href={`/cards/${card.id}`} onClick={(e) => e.stopPropagation()} className="mt-3 text-xs text-muted underline">{t("Modifier la carte", "Edit card")}</Link>
          </div>
        </div>
      </div>

      {flipped && intervals ? (
        <div className="mt-4 grid grid-cols-4 gap-2 animate-fade">
          {([
            [1, t("Oublié", "Again"), "bg-coral-500 hover:bg-coral-600"],
            [2, t("Difficile", "Hard"), "bg-amber-500 hover:bg-amber-600"],
            [3, t("Bien", "Good"), "bg-mint-600 hover:bg-mint-500"],
            [4, t("Facile", "Easy"), "bg-ink-600 hover:bg-ink-700"],
          ] as [Grade, string, string][]).map(([g, label, cls]) => (
            <button key={g} disabled={busy} onClick={() => answer(g)} className={cx("flex flex-col items-center rounded-xl py-2.5 text-white transition active:scale-95", cls)}>
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-[11px] opacity-85">{intervals[g]}</span>
            </button>
          ))}
        </div>
      ) : (
        skill !== "production" && <Button className="mt-4 w-full" size="lg" onClick={flip}>{t("Voir la réponse", "Show answer")}</Button>
      )}
      {forgotLink && (
        <p className="mt-3 text-center text-xs text-muted">
          {t(`« ${forgotLink.term} » oublié ? `, `Forgot “${forgotLink.term}”? `)}
          <Link href={forgotLink.link.href} className="font-medium text-ink-600 underline dark:text-ink-300">
            {t("Revoir le cours", "Review the lesson")} · {forgotLink.link.title}
          </Link>
        </p>
      )}
      <p className="mt-3 hidden text-center text-xs text-muted sm:block">{t("Raccourcis : Espace pour retourner, 1-4 pour répondre", "Shortcuts: Space to flip, 1-4 to answer")}</p>
    </div>
  );
}
