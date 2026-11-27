"use client";
import { grammarLessonForTopic } from "@/lib/data/grammar";
import Link from "next/link";
import type { ConversationReport } from "@/lib/types";
import { Panel, Badge } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { AddToCards } from "./AddToCards";

export function ReportView({ report }: { report: ConversationReport }) {
  const t = useT();
  const vocab = [
    ...report.newWords.map((w) => ({ term: w.term, fr: w.fr, example: w.example })),
    ...report.expressions.map((w) => ({ term: w.term, fr: w.fr, example: w.example })),
  ];
  return (
    <div className="space-y-4">
      <Panel className="bg-ink-50/60 dark:bg-ink-900/30">
        <h2 className="mb-1 font-semibold">📝 {t("Bilan de la conversation", "Conversation report")}</h2>
        <p className="text-[15px] leading-relaxed">{report.summary}</p>
      </Panel>

      <Panel>
        <h3 className="mb-3 font-semibold">{t("Erreurs à corriger", "Mistakes")} <Badge tone={report.errors.length ? "coral" : "mint"}>{report.errors.length}</Badge></h3>
        {report.errors.length === 0 ? (
          <p className="text-sm text-muted">{t("Aucune erreur notable. Bravo !", "No notable mistakes. Well done!")}</p>
        ) : (
          <ul className="space-y-3">
            {report.errors.map((e, i) => (
              <li key={i} className="rounded-xl bg-surface-2 p-3">
                <p className="text-sm text-coral-600 line-through decoration-coral-400/70 dark:text-coral-400">{e.original}</p>
                <p className="font-medium text-mint-600 dark:text-mint-400">{e.corrected}</p>
                <p className="mt-1 text-sm text-muted">{e.explanation}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {report.naturalAlternatives.length > 0 && (
        <Panel>
          <h3 className="mb-3 font-semibold">🗣️ {t("Formulations plus naturelles", "More natural phrasing")}</h3>
          <ul className="space-y-3">
            {report.naturalAlternatives.map((a, i) => (
              <li key={i} className="rounded-xl bg-surface-2 p-3">
                <p className="text-sm text-muted">{a.original}</p>
                <p className="font-medium">→ {a.natural}</p>
                {a.register && <Badge tone="sun" className="mt-1">{a.register}</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {vocab.length > 0 && (
        <Panel>
          <h3 className="mb-3 font-semibold">✨ {t("Mots et expressions à retenir", "Words & expressions to remember")}</h3>
          <AddToCards items={vocab} source="conversation" />
        </Panel>
      )}

      {report.grammarPoints.length > 0 && (
        <Panel>
          <h3 className="mb-2 font-semibold">📚 {t("Points de grammaire à réviser", "Grammar to review")}</h3>
          <ul className="mb-3 list-inside list-disc space-y-1 text-[15px]">
            {report.grammarPoints.map((g, i) => { const l = grammarLessonForTopic(g); return <li key={i}>{l ? <Link href={`/grammar/${l.id}`} className="text-ink-600 hover:underline dark:text-ink-300">{g}</Link> : g}</li>; })}
          </ul>
          <Link href="/grammar" className="text-sm font-medium text-ink-600 hover:underline dark:text-ink-300">{t("Ouvrir le parcours de grammaire →", "Open the grammar path →")}</Link>
        </Panel>
      )}
    </div>
  );
}
