"use client";
// Free production (written or spoken), validated by MEANING: every key idea present in any natural wording.
import { useState } from "react";
import type { Mechanic } from "@/lib/atlas/types";
import { checkProduce, type ProduceCheck } from "@/lib/atlas/select";
import { listenOnce, recognitionErrorFr, recognitionSupported } from "@/lib/speech";
import { postApi, ApiError, errorMessage } from "@/lib/api";
import { Button, ErrorNote, ServiceNotice, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";
import { MechTitle, Verdict, useOnce, type OnDone } from "./shared";

interface AiCorrection {
  corrected: string;
  moreNatural: string;
  isAlreadyCorrect: boolean;
  changes: { original: string; corrected: string; explanationFr: string }[];
}

export function Produce({ ex, onDone }: { ex: Extract<Mechanic, { type: "produce" }>; onDone: OnDone }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<ProduceCheck | null>(null);
  const [listening, setListening] = useState(false);
  const [micErr, setMicErr] = useState("");
  const [ai, setAi] = useState<AiCorrection | null>(null);
  const [aiErr, setAiErr] = useState<{ msg: string; nc: boolean } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const done = useOnce(onDone);

  const dictate = async () => {
    setMicErr("");
    setListening(true);
    try {
      const r = await listenOnce("en-US").promise;
      setText((t) => (t ? `${t} ${r.transcript}` : r.transcript));
    } catch (e) {
      setMicErr(recognitionErrorFr(e));
    } finally {
      setListening(false);
    }
  };

  const check = () => {
    const r = checkProduce(text, ex);
    setRes(r);
    done({ correct: r.ok });
  };

  const askAi = async () => {
    setAiErr(null);
    setAiBusy(true);
    try {
      setAi(await postApi<AiCorrection>("/api/ai/correct", { text }));
    } catch (e) {
      setAiErr({ msg: errorMessage(e), nc: e instanceof ApiError && e.notConfigured });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <MechTitle title={ex.title} />
      <div>
        <p className="text-[16px] font-semibold">{ex.prompt}</p>
        <p className="text-[14px] text-muted">{ex.fr}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!res}
        rows={4}
        placeholder="Écris (ou dicte) ta réponse en anglais…"
        spellCheck={false}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[16px] outline-none focus:border-ink-400 focus:ring-2 focus:ring-ink-200 disabled:opacity-80 dark:focus:ring-ink-800"
      />
      {!res && (
        <div className="flex flex-wrap items-center gap-2">
          {recognitionSupported() && (
            <Button variant="secondary" onClick={dictate} disabled={listening}>
              <Icon name="mic" size={17} /> {listening ? "Je t'écoute…" : "Dicter"}
            </Button>
          )}
          <Button className="flex-1" onClick={check} disabled={!text.trim()}>
            Valider
          </Button>
        </div>
      )}
      {micErr && <p className="text-sm text-coral-600">{micErr}</p>}
      {!res && <p className="text-[13px] text-muted">Au moins {ex.minWords} mots. Toutes les formulations naturelles sont acceptées : on vérifie que tes idées sont là.</p>}
      {res && (
        <Verdict ok={res.ok} title={res.ok ? "Message clair et complet" : "Il manque quelque chose"}>
          <ul className="space-y-1 text-[14.5px]">
            {ex.mustInclude.map((g, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name={res.groups[i] ? "check" : "eye"} size={16} className={cx("mt-0.5 shrink-0", res.groups[i] ? "text-mint-600" : "text-coral-600")} />
                <span>
                  Idée {i + 1} {res.groups[i] ? "présente" : "absente"} — par exemple : <em>{g.slice(0, 3).join(" / ")}</em>
                </span>
              </li>
            ))}
            {!res.enoughWords && <li className="text-coral-600">{res.words} mots — vise au moins {ex.minWords} mots.</li>}
          </ul>
          <p className="text-[14px]"><span className="font-semibold">Astuce : </span>{ex.tip}</p>
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-muted">Exemples de réponses naturelles</p>
            {ex.samples.map((s, i) => (
              <p key={i} className="flex items-start gap-1 text-[14.5px]">
                <span>{s}</span>
                <SpeakButton text={s} size={14} className="-my-1 p-1" />
              </p>
            ))}
          </div>
        </Verdict>
      )}
      {res && !ai && (
        <button type="button" onClick={askAi} disabled={aiBusy} className="text-sm font-semibold text-ink-600 hover:underline disabled:opacity-60 dark:text-ink-300">
          {aiBusy ? "Analyse…" : "Avis de l'IA sur ma phrase"}
        </button>
      )}
      {aiErr && (aiErr.nc ? <ServiceNotice service="La correction par l'IA" alternative="Compare ta réponse avec les exemples proposés ci-dessus." /> : <ErrorNote>{aiErr.msg}</ErrorNote>)}
      {ai && (
        <div className="space-y-1.5 rounded-2xl border border-line p-3 text-[14.5px]">
          {ai.isAlreadyCorrect ? <p className="font-semibold text-mint-600">Ta phrase est correcte.</p> : <p><span className="text-muted">Corrigé : </span>{ai.corrected}</p>}
          {ai.moreNatural && ai.moreNatural !== ai.corrected && <p><span className="text-muted">Plus naturel : </span>{ai.moreNatural}</p>}
          {ai.changes.slice(0, 4).map((c, i) => (
            <p key={i} className="text-[13.5px] text-fg/80">
              <s>{c.original}</s> → <strong>{c.corrected}</strong> : {c.explanationFr}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
