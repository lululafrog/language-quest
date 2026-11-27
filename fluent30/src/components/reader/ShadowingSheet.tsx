"use client";
import { useState } from "react";
import { listenOnce, recognitionErrorFr, recognitionSupported, speak } from "@/lib/speech";
import { speechSimilarity } from "@/lib/text";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, Sheet } from "@/components/ui";

/** Shadowing: listen to a sentence of the book, then repeat it (indicative feedback). */
export function ShadowingSheet({ sentences, accent, rate, onClose }: { sentences: string[]; accent: string; rate: number; onClose: () => void }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [res, setRes] = useState<{ score: number; words: { word: string; ok: boolean }[]; heard: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const s = sentences[i];

  const listen = (slow = false) => speak(s, { accent, rate: slow ? Math.max(0.5, rate - 0.3) : rate });
  const repeat = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await listenOnce(accent === "en-GB" ? "en-GB" : "en-US").promise;
      const sim = speechSimilarity(r.transcript, s);
      setRes({ ...sim, heard: r.transcript });
    } catch (e) {
      setErr(recognitionErrorFr(e));
    } finally {
      setBusy(false);
    }
  };
  const go = (d: number) => {
    setRes(null);
    setErr("");
    setI((x) => Math.max(0, Math.min(sentences.length - 1, x + d)));
  };

  return (
    <Sheet open onClose={onClose} title={t("Shadowing", "Shadowing")}>
      {!s ? (
        <p className="text-sm text-muted">{t("Aucune phrase dans ce passage.", "No sentence here.")}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted">{t("Écoute la phrase, puis répète-la en imitant le rythme et l'intonation.", "Listen, then repeat copying the rhythm.")} · {i + 1}/{sentences.length}</p>
          <p className="rounded-xl bg-surface-2 p-4 font-serif text-lg leading-relaxed">
            {res ? res.words.map((w, k) => <span key={k} className={w.ok ? "text-mint-600" : "text-coral-600 underline"}>{w.word} </span>) : s}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => listen()}>🔊 {t("Écouter", "Listen")}</Button>
            <Button variant="ghost" onClick={() => listen(true)}>🐢 {t("Lentement", "Slowly")}</Button>
            {recognitionSupported() ? <Button onClick={repeat} loading={busy}>🎙️ {busy ? t("Je t'écoute…", "Listening…") : t("Répéter", "Repeat")}</Button> : <span className="text-xs text-muted">{t("Micro indisponible sur ce navigateur : répète à voix haute.", "No speech recognition here.")}</span>}
          </div>
          {err && <ErrorNote>{err}</ErrorNote>}
          {res && <p className="text-sm">{t(`Score indicatif : ${Math.round(res.score * 100)} % · entendu : « ${res.heard} »`, `Indicative score: ${Math.round(res.score * 100)}%`)}</p>}
          <p className="text-[11px] text-muted">{t("La reconnaissance vocale du navigateur donne un retour indicatif, pas une évaluation phonétique.", "Indicative feedback only.")}</p>
          <div className="flex justify-between">
            <Button variant="ghost" disabled={i === 0} onClick={() => go(-1)}>← {t("Précédente", "Previous")}</Button>
            <Button variant="ghost" disabled={i >= sentences.length - 1} onClick={() => go(1)}>{t("Suivante", "Next")} →</Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
