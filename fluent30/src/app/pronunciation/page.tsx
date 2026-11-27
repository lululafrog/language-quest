"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { getPronLesson, PRON_LESSONS } from "@/lib/data/pronunciation";
import { readLastBilan } from "@/components/pronunciation/progress";
import { recognitionSupported } from "@/lib/speech";
import { useT } from "@/hooks/useT";
import { Badge, LinkButton, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";

export default function PronunciationHub() {
  const t = useT();
  const [bilan] = useState(() => readLastBilan());
  const [rec] = useState(() => recognitionSupported());
  const best = useLiveQuery(async () => {
    const rows = await getDb().games.where("gameId").startsWith("pron:").toArray();
    const m = new Map<string, number>();
    for (const r of rows) if (r.total) m.set(r.gameId.slice(5), Math.max(m.get(r.gameId.slice(5)) ?? 0, r.score / r.total));
    return m;
  }, []);

  const weak = bilan
    ? Object.entries(bilan.byLesson)
        .filter(([, [ok, n]]) => n && ok / n < 0.7)
        .sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])
    : [];
  const done = PRON_LESSONS.filter((l) => (best?.get(l.id) ?? 0) >= 0.8).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t("Prononciation", "Pronunciation")} subtitle={t("Les erreurs typiques des francophones, classées par impact sur la compréhension.", "Typical French-speaker mistakes, ranked by impact.")} back="/practice" />

      <Panel className="relative overflow-hidden bg-gradient-to-br from-ink-600 to-ink-800 text-white">
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">{t("Exercice global", "Global exercise")}</p>
        <p className="mt-1 text-xl font-semibold">{t("Bilan de prononciation", "Pronunciation check-up")}</p>
        <p className="mt-1 text-sm text-white/80">{t("~20 questions : sons confondus, accent tonique, terminaisons, lecture à voix haute. Résultat par point de prononciation, avec les leçons à travailler.", "~20 questions with results per sound.")}</p>
        <LinkButton href="/pronunciation/bilan" variant="secondary" className="mt-4 bg-white text-ink-800 hover:bg-ink-50">{bilan ? t("Refaire le bilan", "Retake") : t("Commencer le bilan", "Start")}</LinkButton>
        {bilan && <p className="mt-2 text-xs text-white/70">{t("Dernier bilan :", "Last:")} {new Date(bilan.at).toLocaleDateString()}</p>}
      </Panel>

      {!rec && <p className="rounded-xl bg-sun-100 px-3 py-2 text-sm text-amber-800 dark:bg-sun-500/15 dark:text-sun-100">{t("La reconnaissance vocale n'est pas disponible dans ce navigateur : les exercices d'écoute fonctionnent, mais les exercices « Répéter » passent en auto-évaluation. Elle est disponible dans Chrome, Edge et Safari.", "Speech recognition unavailable in this browser.")}</p>}

      {weak.length > 0 && (
        <Panel>
          <h2 className="mb-2 font-semibold">{t("Tes points faibles", "Your weak points")}</h2>
          <ul className="space-y-2">
            {weak.map(([id, [ok, n]]) => {
              const l = getPronLesson(id);
              if (!l) return null;
              return (
                <li key={id}>
                  <Link href={`/pronunciation/${id}`} className="flex items-center justify-between rounded-xl bg-coral-100/60 px-3 py-2 hover:bg-coral-100 dark:bg-coral-600/10">
                    <span>{l.emoji} {t(l.title, l.titleEn)}</span>
                    <span className="text-sm tabular-nums text-coral-600">{ok}/{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("Leçons", "Lessons")}</h2>
        <span className="text-sm text-muted">{done}/{PRON_LESSONS.length} {t("réussies", "passed")}</span>
      </div>
      <ProgressBar value={done} max={PRON_LESSONS.length} tone="mint" />
      <ol className="grid gap-2 sm:grid-cols-2">
        {PRON_LESSONS.map((l, i) => {
          const b = best?.get(l.id);
          return (
            <li key={l.id}>
              <Link href={`/pronunciation/${l.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300">
                <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl", b !== undefined && b >= 0.8 ? "bg-mint-100 dark:bg-mint-600/20" : "bg-surface-2")}>{l.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{i + 1}. {t(l.title, l.titleEn)}</span>
                  <span className="font-mono text-xs text-muted">{l.sound}</span>
                </span>
                {b !== undefined && <Badge tone={b >= 0.8 ? "mint" : b >= 0.5 ? "sun" : "coral"}>{Math.round(b * 100)} %</Badge>}
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="text-center text-xs text-muted">{t("Les retours de prononciation sont indicatifs : la reconnaissance vocale du navigateur n'est pas un phonéticien.", "Feedback is indicative.")}</p>
    </div>
  );
}
