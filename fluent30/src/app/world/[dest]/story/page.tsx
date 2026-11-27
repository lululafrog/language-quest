"use client";
// Original short story set in a destination: read, listen, tap a word to hear it and see the glossary.
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { accentFor, atlasDestination } from "@/lib/atlas/engine";
import { getCatalog } from "@/lib/atlas/catalog";
import { speak, stopSpeaking } from "@/lib/speech";
import { Badge, EmptyState, Panel, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function StoryPage() {
  const { dest: id } = useParams<{ dest: string }>();
  const dest = atlasDestination(id);
  const entry = getCatalog(id);
  const [word, setWord] = useState<{ w: string; fr?: string } | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const story = dest?.story;
  const gloss = new Map((story?.glossary ?? []).map((g) => [g.en.toLowerCase(), g.fr]));

  if (!dest || !story) {
    return (
      <EmptyState title="Histoire introuvable">
        <Link href={`/world/${id}`} className="font-semibold text-ink-600 underline">Retour à la destination</Link>
      </EmptyState>
    );
  }
  const accent = accentFor(dest.id);
  const paragraphs = story.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const tap = (raw: string) => {
    const w = raw.replace(/[^A-Za-z'’-]/g, "").toLowerCase();
    if (!w) return;
    speak(w, { accent });
    const fr = gloss.get(w) ?? [...gloss.entries()].find(([k]) => k.split(" ").includes(w))?.[1];
    setWord({ w, fr });
  };

  return (
    <article className="mx-auto max-w-2xl space-y-4 pb-10">
      <Link href={`/world/${dest.id}`} className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium text-muted hover:bg-surface-2">
        <Icon name="arrow" size={16} className="rotate-180" /> {entry?.nameFr ?? "Destination"}
      </Link>
      <div>
        <p className="text-[13px] font-semibold text-muted">Histoire originale · Fluent30</p>
        <h1 className="font-display text-[26px] font-bold leading-tight">{story.title}</h1>
        <Badge tone="ink">Niveau {story.level}</Badge>
      </div>
      <p className="text-sm text-muted">Touche un mot pour l&apos;entendre ; les mots du glossaire affichent leur traduction.</p>
      <div className="space-y-4 font-[var(--font-display)] text-[17px] leading-[1.75]">
        {paragraphs.map((p, i) => (
          <div key={i} className="group relative">
            <p className={cx(playing === i && "rounded-lg bg-sun-100/60 dark:bg-sun-500/10")}>
              {p.split(/(\s+)/).map((tok, j) =>
                /\s+/.test(tok) ? tok : (
                  <button key={j} type="button" onClick={() => tap(tok)} className="rounded hover:bg-ink-50 focus:bg-ink-50 dark:hover:bg-ink-900/60">
                    {tok}
                  </button>
                ),
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                if (playing === i) {
                  stopSpeaking();
                  setPlaying(null);
                  return;
                }
                setPlaying(i);
                speak(p, { accent, onEnd: () => setPlaying(null) });
              }}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:underline dark:text-ink-300"
            >
              <Icon name="headphones" size={14} /> {playing === i ? "Arrêter" : "Écouter ce paragraphe"}
            </button>
          </div>
        ))}
      </div>

      {word && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 md:bottom-4">
          <Panel className="flex items-center gap-2 shadow-lg">
            <SpeakButton text={word.w} accent={accent} size={16} />
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{word.w}</span>
              <span className="text-sm text-muted"> — {word.fr ?? "pas dans le glossaire (ajoute-le depuis la bibliothèque ou le traducteur)"}</span>
            </span>
            <button type="button" onClick={() => setWord(null)} className="text-sm text-muted" aria-label="Fermer">×</button>
          </Panel>
        </div>
      )}

      {story.glossary.length > 0 && (
        <Panel className="space-y-2">
          <h2 className="font-semibold">Glossaire</h2>
          <ul className="grid gap-1 sm:grid-cols-2">
            {story.glossary.map((g) => (
              <li key={g.en} className="flex items-center gap-1 text-sm">
                <SpeakButton text={g.en} accent={accent} size={14} className="p-1" />
                <span className="font-medium">{g.en}</span> <span className="text-muted">— {g.fr}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </article>
  );
}
