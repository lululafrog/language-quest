"use client";
import { useEffect, useRef, useState } from "react";
import type { Dialogue } from "@/lib/data/types";
import { ACCENT_LABELS, speak, stopSpeaking, type Accent } from "@/lib/speech";
import { lookupLocal } from "@/lib/lexicon";
import { tokenize } from "@/lib/text";
import { quickAdd } from "@/lib/cards";
import { errorMessage } from "@/lib/api";
import { trackActivity } from "@/lib/track";
import { Button, Panel, Segmented, cx, toast } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { useDialogueVoices, speakWith } from "./voices";

export type SubMode = "en" | "both" | "fr" | "hidden";

export function AudioControls({ accent, setAccent, rate, setRate, accents }: { accent: string; setAccent: (a: string) => void; rate: number; setRate: (r: number) => void; accents: string[] }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted">{t("Accent", "Accent")}</span>
        <select value={accent} onChange={(e) => setAccent(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-sm">
          {(accents.length ? accents : [accent]).map((a) => (
            <option key={a} value={a}>{ACCENT_LABELS[a as Accent] ?? a}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 items-center gap-2 text-sm" style={{ minWidth: 200 }}>
        <span className="text-muted">{t("Vitesse", "Speed")}</span>
        <input type="range" min={0.5} max={1.5} step={0.05} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="flex-1 accent-ink-600" aria-label={t("Vitesse", "Speed")} />
        <span className="w-12 tabular-nums">{rate.toFixed(2)}×</span>
      </label>
    </div>
  );
}

export function Player({ dialogue, accent, setAccent, rate, setRate }: { dialogue: Dialogue; accent: string; setAccent: (a: string) => void; rate: number; setRate: (r: number) => void }) {
  const t = useT();
  const { a, b, accents, ready } = useDialogueVoices(accent);
  const [sub, setSub] = useState<SubMode>("en");
  const [playing, setPlaying] = useState<number | null>(null);
  const [charIdx, setCharIdx] = useState<number>(-1);
  const [picked, setPicked] = useState<{ word: string; sentence: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const token = useRef(0);
  const counted = useRef(false);

  useEffect(() => () => { token.current++; stopSpeaking(); }, []);

  function playLine(i: number, chain: boolean) {
    const my = ++token.current;
    const line = dialogue.lines[i];
    if (!line) {
      setPlaying(null);
      setCharIdx(-1);
      if (!counted.current) {
        counted.current = true;
        void trackActivity({ xp: 3 });
      }
      return;
    }
    setPlaying(i);
    setCharIdx(-1);
    speakWith(line.en, line.speaker === "A" ? a : b, {
      rate,
      onBoundary: (c) => my === token.current && setCharIdx(c),
      onEnd: () => {
        if (my !== token.current) return;
        if (chain) setTimeout(() => my === token.current && playLine(i + 1, true), 350);
        else { setPlaying(null); setCharIdx(-1); }
      },
    });
  }

  function stop() {
    token.current++;
    stopSpeaking();
    setPlaying(null);
    setCharIdx(-1);
  }

  async function addPicked() {
    if (!picked) return;
    setAdding(true);
    try {
      const r = await quickAdd(picked.word, { context: picked.sentence, source: "user" });
      toast(r.merged ? t("Déjà dans vos flashcards", "Already in your flashcards") : t(`« ${r.card.term} » ajouté`, `“${r.card.term}” added`));
    } catch (e) {
      toast(errorMessage(e), "err");
    } finally {
      setAdding(false);
    }
  }

  const local = picked ? lookupLocal(picked.word) : null;

  return (
    <div className="space-y-4">
      <Panel className="space-y-4">
        <AudioControls accent={accent} setAccent={setAccent} rate={rate} setRate={setRate} accents={accents} />
        <div className="flex flex-wrap items-center gap-2">
          {playing === null ? (
            <Button onClick={() => playLine(0, true)} disabled={!ready}>▶ {t("Écouter le dialogue", "Play dialogue")}</Button>
          ) : (
            <Button variant="secondary" onClick={stop}>■ {t("Arrêter", "Stop")}</Button>
          )}
          <Segmented
            value={sub}
            onChange={setSub}
            options={[
              { value: "en", label: "EN" },
              { value: "both", label: "EN+FR" },
              { value: "fr", label: "FR" },
              { value: "hidden", label: t("Masqués", "Hidden") },
            ]}
          />
        </div>
        {!ready && <p className="text-sm text-muted">{t("Aucune voix anglaise disponible pour la synthèse vocale sur cet appareil.", "No English text-to-speech voice is available on this device.")}</p>}
        {ready && a && b && a !== b && <p className="text-xs text-muted">{t("Voix", "Voices")} : A = {a.name} · B = {b.name}</p>}
      </Panel>

      <div className="space-y-2">
        {dialogue.lines.map((line, i) => {
          const active = playing === i;
          let offset = 0;
          return (
            <div key={i} className={cx("flex gap-3 rounded-2xl border p-3 transition", active ? "border-ink-400 bg-ink-50/70 dark:bg-ink-900/40" : "border-line bg-surface")}>
              <span className={cx("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", line.speaker === "A" ? "bg-ink-500" : "bg-coral-500")}>{line.speaker}</span>
              <div className="min-w-0 flex-1">
                {(sub === "en" || sub === "both") && (
                  <p className="text-[16.5px] leading-relaxed">
                    {tokenize(line.en).map((tok, k) => {
                      const start = offset;
                      offset += tok.text.length;
                      if (!tok.word) return <span key={k}>{tok.text}</span>;
                      const hl = active && charIdx >= start && charIdx < start + tok.text.length;
                      return (
                        <span
                          key={k}
                          role="button"
                          tabIndex={0}
                          onClick={() => { speak(tok.text, { accent, rate }); setPicked({ word: tok.text, sentence: line.en }); }}
                          onKeyDown={(e) => e.key === "Enter" && setPicked({ word: tok.text, sentence: line.en })}
                          className={cx("reader-word", hl && "active")}
                        >
                          {tok.text}
                        </span>
                      );
                    })}
                  </p>
                )}
                {(sub === "fr" || sub === "both") && <p className={cx("text-muted", sub === "both" ? "mt-0.5 text-sm" : "text-[15.5px]")}>{line.fr}</p>}
                {sub === "hidden" && <p className="select-none text-muted blur-[5px]" aria-hidden>{line.en}</p>}
              </div>
              <button onClick={() => playLine(i, false)} className="self-start rounded-full p-2 text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-900/60" aria-label={t("Réécouter cette réplique", "Replay this line")} title={t("Réécouter", "Replay")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.5 15a9 9 0 102.1-9.4L1 10" /></svg>
              </button>
            </div>
          );
        })}
      </div>

      {picked && (
        <div className="sticky bottom-20 z-10 animate-slide-up md:bottom-4">
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{picked.word}{local && local.isInflected && <span className="ml-1 text-sm font-normal text-muted">({t("de", "from")} {local.lemma})</span>}</p>
              <p className="truncate text-sm text-muted">{local ? `${local.fr}${local.pos ? ` · ${local.pos}` : ""}` : t("Pas dans le dictionnaire hors ligne — l'ajout utilisera l'IA si elle est configurée.", "Not in the offline dictionary.")}</p>
            </div>
            <button onClick={() => speak(picked.word, { accent, rate })} className="rounded-full p-2 text-ink-600 hover:bg-ink-50 dark:text-ink-300" aria-label={t("Écouter", "Listen")}>🔊</button>
            <Button size="sm" onClick={addPicked} loading={adding}>+ {t("Flashcard", "Flashcard")}</Button>
            <button onClick={() => setPicked(null)} className="rounded-lg p-1 text-muted hover:bg-surface-2" aria-label={t("Fermer", "Close")}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
