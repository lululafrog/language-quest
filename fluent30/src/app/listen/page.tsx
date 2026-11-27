"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { DIALOGUES } from "@/lib/data/dialogues";
import { themeEmoji } from "@/lib/data/types";
import { recognitionSupported, ttsSupported } from "@/lib/speech";
import { PageHeader, Panel, Segmented, Badge } from "@/components/ui";
import { useT } from "@/hooks/useT";

const LEVELS = ["all", "A1", "A2", "B1", "B2", "C1"] as const;

export default function ListenHome() {
  const t = useT();
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const results = useLiveQuery(() => getDb().games.where("gameId").startsWith("listen:").toArray(), []);
  const best = new Map<string, number>();
  for (const r of results ?? []) {
    const id = r.gameId.split(":")[2];
    best.set(id, Math.max(best.get(id) ?? 0, r.total ? r.score / r.total : 0));
  }
  const list = DIALOGUES.filter((d) => level === "all" || d.level === level);
  const [support] = useState(() => (typeof window === "undefined" ? { tts: true, rec: true } : { tts: ttsSupported(), rec: recognitionSupported() }));

  return (
    <div>
      <PageHeader title={t("Écoute & prononciation", "Listening & speaking")} subtitle={t("Dialogues courts, dictées, répétition, shadowing et quiz d'écoute.", "Short dialogues, dictation, repetition, shadowing and listening quizzes.")} />

      <Panel className="mb-5">
        <div className="grid gap-3 text-sm sm:grid-cols-4">
          <div><p className="font-medium">🎧 {t("Écouter", "Listen")}</p><p className="text-muted">{t("Sous-titres interactifs, vitesse réglable, plusieurs accents.", "Interactive subtitles, adjustable speed, several accents.")}</p></div>
          <div><p className="font-medium">✍️ {t("Dictée", "Dictation")}</p><p className="text-muted">{t("Écrivez ce que vous entendez, mot à mot.", "Write what you hear, word by word.")}</p></div>
          <div><p className="font-medium">🎙️ {t("Répéter & shadowing", "Repeat & shadowing")}</p><p className="text-muted">{t("Retour indicatif sur votre prononciation.", "Indicative feedback on your pronunciation.")}</p></div>
          <div><p className="font-medium">❓ Quiz</p><p className="text-muted">{t("Quelle phrase avez-vous entendue ?", "Which sentence did you hear?")}</p></div>
        </div>
        {(!support.tts || !support.rec) && (
          <p className="mt-3 rounded-lg bg-sun-100 px-3 py-2 text-xs text-amber-800 dark:bg-sun-500/15 dark:text-sun-100">
            {!support.tts && t("La synthèse vocale n'est pas disponible dans ce navigateur. ", "Text-to-speech is not available in this browser. ")}
            {!support.rec && t("La reconnaissance vocale n'est pas disponible ici (Chrome, Edge ou Safari recommandés) : les exercices de prononciation utiliseront la transcription serveur si elle est configurée.", "Speech recognition isn't available here: pronunciation exercises will use server transcription if configured.")}
          </p>
        )}
      </Panel>

      <Segmented className="mb-4" value={level} onChange={setLevel} options={LEVELS.map((l) => ({ value: l, label: l === "all" ? t("Tous", "All") : l }))} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => {
          const b = best.get(d.id);
          return (
            <Link key={d.id} href={`/listen/${d.id}`} className="group rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-ink-300">
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{themeEmoji(d.theme)}</span>
                <Badge tone={d.level.startsWith("A") ? "mint" : d.level.startsWith("B") ? "ink" : "coral"}>{d.level}</Badge>
              </div>
              <p className="mt-2 font-semibold group-hover:text-ink-700 dark:group-hover:text-ink-200">{t(d.titleFr, d.title)}</p>
              <p className="text-sm text-muted">{t(d.title, d.titleFr)} · {d.lines.length} {t("répliques", "lines")}</p>
              {b !== undefined && <p className="mt-2 text-xs font-medium text-mint-600">✓ {t("Meilleur score", "Best score")} {Math.round(b * 100)} %</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
