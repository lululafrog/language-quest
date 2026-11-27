"use client";
// One postcard: write your own English message, get it corrected, save, and share it if you wish.
import Link from "next/link";
import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { getGame } from "@/lib/game";
import { ApiError, errorMessage, postApi } from "@/lib/api";
import { ownedRewards } from "@/lib/atlas/progress";
import { Postcard, postcardToPng } from "@/components/atlas/Postcard";
import { postcardData } from "@/components/atlas/postcardData";
import { Button, EmptyState, ErrorNote, PageHeader, Panel, ServiceNotice, toast } from "@/components/ui";
import { Icon } from "@/components/icons";

interface Correction {
  corrected: string;
  moreNatural: string;
  isAlreadyCorrect: boolean;
  changes: { original: string; corrected: string; explanationFr: string }[];
}

export default function PostcardPage() {
  const { dest } = useParams<{ dest: string }>();
  const svgRef = useRef<SVGSVGElement>(null);
  const data = useLiveQuery(async () => {
    const [row, game, owned] = await Promise.all([getDb().postcards.get(dest), getGame(), ownedRewards()]);
    return { row: row ?? null, game, owned };
  }, [dest]);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fix, setFix] = useState<Correction | null>(null);
  const [err, setErr] = useState<{ msg: string; nc: boolean } | null>(null);

  if (!data) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-surface-2" />;
  if (!data.row) {
    return (
      <EmptyState title="Pas encore de carte postale">
        <p className="text-sm text-muted">Elle arrive quand la destination est validée.</p>
        <Link href={`/world/${dest}`} className="font-semibold text-ink-600 underline">Voir la destination</Link>
      </EmptyState>
    );
  }
  const row = data.row;
  const text = draft ?? row.corrected ?? row.message;
  const pc = postcardData(row, data.game, data.owned, text);
  if (!pc) return null;

  const save = async (message: string, corrected?: string) => {
    await getDb().postcards.update(row.id, { message, corrected, updatedAt: Date.now() });
    setDraft(null);
    toast("Carte postale enregistrée");
  };

  const correct = async () => {
    setErr(null);
    setFix(null);
    setBusy(true);
    try {
      setFix(await postApi<Correction>("/api/ai/correct", { text }));
    } catch (e) {
      setErr({ msg: errorMessage(e), nc: e instanceof ApiError && e.notConfigured });
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!svgRef.current) return;
    if (!confirm("Partager cette carte postale ? Elle contient ton personnage et ton message, rien d'autre.")) return;
    try {
      const blob = await postcardToPng(svgRef.current);
      const file = new File([blob], `postcard-${row.destId}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: `Postcard from ${pc.nameEn}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast("Image téléchargée");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Impossible de créer l'image", "err");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
      <PageHeader title={`Carte postale · ${pc.nameFr}`} back="/world/postcards" />
      <div className="overflow-hidden rounded-2xl border border-line card-shadow">
        <Postcard ref={svgRef} data={pc} className="h-auto w-full" />
      </div>

      <Panel className="space-y-3">
        <label className="block">
          <span className="text-sm font-semibold">Ton message (en anglais)</span>
          <textarea
            value={text}
            onChange={(e) => { setDraft(e.target.value); setFix(null); }}
            rows={3}
            maxLength={220}
            className="mt-1 w-full rounded-2xl border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-ink-400"
          />
        </label>
        <p className="text-xs text-muted">Exemple : « I explored this country, learned how to bargain at a local market and made new friends. »</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={correct} loading={busy} disabled={!text.trim()}>Corriger</Button>
          <Button onClick={() => save(text)} disabled={draft === null}>Enregistrer</Button>
        </div>
        {err && (err.nc ? <ServiceNotice service="La correction" alternative="Ta carte reste enregistrée avec ton message tel quel." /> : <ErrorNote>{err.msg}</ErrorNote>)}
        {fix && (
          <div className="space-y-2 rounded-2xl bg-surface-2 p-3 text-sm">
            {fix.isAlreadyCorrect ? <p className="font-semibold text-mint-600">Ton message est correct.</p> : <p><span className="font-semibold">Corrigé :</span> {fix.corrected}</p>}
            {fix.moreNatural && fix.moreNatural !== fix.corrected && <p><span className="font-semibold">Plus naturel :</span> {fix.moreNatural}</p>}
            {fix.changes.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-5 text-muted">
                {fix.changes.slice(0, 5).map((c, i) => <li key={i}>{c.original} → {c.corrected} : {c.explanationFr}</li>)}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              {!fix.isAlreadyCorrect && <Button size="sm" onClick={() => save(text, fix.corrected)}>Utiliser la version corrigée</Button>}
              {fix.moreNatural && fix.moreNatural !== fix.corrected && <Button size="sm" variant="secondary" onClick={() => save(text, fix.moreNatural)}>Utiliser la version naturelle</Button>}
            </div>
          </div>
        )}
      </Panel>

      <Button variant="outline" className="w-full" onClick={share}><Icon name="share" size={18} /> Partager ou télécharger</Button>
      <p className="text-center text-xs text-muted">Rien n&apos;est publié automatiquement : la carte ne quitte ton appareil que si tu la partages.</p>
    </div>
  );
}
