"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { analyseCapture, kindLabel, type RealLifeAnalysis } from "@/lib/reallife";
import { useMediaUrl } from "@/lib/media";
import { ApiError, errorMessage } from "@/lib/api";
import { useSettings } from "@/hooks/useSettings";
import { usePersonalAiConsent } from "@/components/privacy/ConsentDialog";
import { AnalysisView } from "@/components/reallife/AnalysisView";
import { Button, EmptyState, ErrorNote, PageHeader, Panel, ServiceNotice, Spinner } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function CapturePage() {
  const { id } = useParams<{ id: string }>();
  const s = useSettings();
  const cap = useLiveQuery(async () => (await getDb().captures.get(id)) ?? null, [id]);
  const media = useMediaUrl(cap?.mediaKey);
  const { ask, dialog } = usePersonalAiConsent();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg: string; notConfigured: boolean } | null>(null);
  const auto = useRef(false);

  const run = async (force = false) => {
    if (!(await ask())) return;
    setBusy(true);
    setErr(null);
    try {
      await analyseCapture(id, { level: s.pathLevel, force });
    } catch (e) {
      setErr({ msg: errorMessage(e), notConfigured: e instanceof ApiError && e.notConfigured });
    } finally {
      setBusy(false);
    }
  };

  // First visit after import: analyse automatically (consent was given on the import screen).
  useEffect(() => {
    if (!cap || cap.analysis || auto.current || !s.loaded) return;
    auto.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot analysis after import
    if (s.personalAiConsent) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, s.loaded, s.personalAiConsent]);

  if (cap === undefined) return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  if (cap === null) return <EmptyState icon="" title="Import introuvable">Il a peut-être été supprimé.</EmptyState>;

  return (
    <div className="mx-auto max-w-2xl">
      {dialog}
      <PageHeader
        title={cap.title}
        subtitle={`${kindLabel(cap.kind)} · ${new Date(cap.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`}
        back="/practice/real-life"
        action={cap.analysis ? (
          <Button variant="ghost" size="sm" onClick={() => run(true)} disabled={busy} aria-label="Relancer l'analyse">
            <Icon name="sparkle" size={16} /> Réanalyser
          </Button>
        ) : undefined}
      />
      {media && cap.mediaKey && (
        <Panel className="mb-4 p-2">
          {cap.kind === "voice" ? (
            <audio controls src={media} className="w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL
            <img src={media} alt="Contenu importé" className="max-h-64 w-full rounded-xl object-contain" />
          )}
        </Panel>
      )}
      {err && (err.notConfigured ? <ServiceNotice service="L'analyse par l'IA" envVar="ANTHROPIC_API_KEY" /> : <ErrorNote>{err.msg}</ErrorNote>)}
      {busy && (
        <Panel className="flex items-center gap-3">
          <Spinner />
          <p className="text-[15px]">Analyse en cours : traduction, expressions, mini-leçon…</p>
        </Panel>
      )}
      {!busy && !cap.analysis && (
        <Panel className="space-y-3">
          {cap.input && <p className="whitespace-pre-line text-[15px]">{cap.input}</p>}
          <Button className="w-full" onClick={() => run()}>
            <Icon name="sparkle" size={18} /> Analyser
          </Button>
        </Panel>
      )}
      {!busy && cap.analysis != null && <AnalysisView cap={cap} a={cap.analysis as RealLifeAnalysis} />}
    </div>
  );
}
