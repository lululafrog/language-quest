"use client";
// Carte mentale du vocabulaire : l'univers des mots de l'apprenant, branche par branche,
// avec la maîtrise réelle (découvert / reconnu / employé / oublié), les points forts et les manques.
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { buildMindMap, strengthsAndGaps, type Branch } from "@/lib/mindmap";
import { MASTERY_INFO, MASTERY_ORDER } from "@/lib/mastery";
import { useSettings } from "@/hooks/useSettings";
import { MindMapSvg } from "@/components/mindmap/MindMapSvg";
import { BranchSheet } from "@/components/mindmap/BranchSheet";
import { LinkButton, ListGroup, ListRow, PageHeader, Panel, ProgressBar, SectionHeader, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

const DOT = { employe: "bg-mint-600", reconnu: "bg-mint-400", decouvert: "bg-sun-400", oublie: "bg-coral-500" } as const;

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0;
}

export default function MindMapPage() {
  const s = useSettings();
  const map = useLiveQuery(() => buildMindMap(), []);
  const [sel, setSel] = useState<string | null>(null);
  const all = useMemo(() => (map ? [...map.cards.values()].map((n) => n.card) : []), [map]);
  const sg = useMemo(() => (map ? strengthsAndGaps(map) : null), [map]);

  if (!map || !sg) return <div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const t = map.total;
  const selected: Branch | null = map.branches.find((b) => b.cat.id === sel) ?? null;

  if (t.total === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader title="Carte mentale" subtitle="L'univers de tes mots, branche par branche." back="/practice" />
        <Panel className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400">
            <Icon name="layers" size={26} />
          </div>
          <p className="text-lg font-semibold">Ta carte est encore vierge</p>
          <p className="text-[15px] text-muted">Chaque mot que tu apprends ou ajoutes viendra se ranger ici, dans le bon domaine. Elle grandit au rythme de ce que tu sais vraiment.</p>
          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            <LinkButton href="/learn" className="w-full">Apprendre mes premiers mots</LinkButton>
            <LinkButton href="/cards/add" variant="secondary" className="w-full">Ajouter un mot</LinkButton>
          </div>
        </Panel>
      </div>
    );
  }

  const ordered = [...map.branches].sort((a, b) => b.counts.total - a.counts.total);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Carte mentale" subtitle="Touche une branche pour voir tes mots." back="/practice" />

      <Panel className="space-y-3">
        <MindMapSvg branches={map.branches} onSelect={setSel} selected={sel} reduceMotion={s.reduceMotion} />
        <div className="grid grid-cols-4 gap-2 text-center">
          {MASTERY_ORDER.map((l) => (
            <div key={l}>
              <div className="text-xl font-semibold tabular-nums">{t[l]}</div>
              <div className="flex items-center justify-center gap-1 text-[11.5px] text-muted">
                <span className={cx("h-1.5 w-1.5 rounded-full", DOT[l])} />
                {MASTERY_INFO[l].label}
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          {MASTERY_ORDER.map((l) => <div key={l} className={DOT[l]} style={{ width: `${pct(t[l], t.total)}%` }} />)}
        </div>
      </Panel>

      {(sg.strong.length > 0 || sg.gaps.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sg.strong.length > 0 && (
            <Panel tone="subtle" className="space-y-2">
              <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-muted"><Icon name="trophy" size={16} /> Tes points forts</p>
              {sg.strong.map((b) => (
                <button key={b.cat.id} type="button" onClick={() => setSel(b.cat.id)} className="block w-full text-left">
                  <div className="flex justify-between text-[14.5px]"><span className="font-medium">{b.cat.label}</span><span className="tabular-nums text-muted">{b.counts.employe + b.counts.reconnu} solides</span></div>
                  <ProgressBar value={b.strength} max={1} tone="mint" className="mt-1" />
                </button>
              ))}
            </Panel>
          )}
          {sg.gaps.length > 0 && (
            <Panel tone="subtle" className="space-y-2">
              <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.08em] text-muted"><Icon name="target" size={16} /> À développer</p>
              {sg.gaps.map((b) => (
                <div key={b.cat.id} className="flex items-center justify-between gap-2 text-[14.5px]">
                  <button type="button" onClick={() => setSel(b.cat.id)} className="min-w-0 text-left">
                    <span className="block font-medium">{b.cat.label}</span>
                    <span className="block text-[12.5px] text-muted">{b.covered}/{b.reference} mots fréquents</span>
                  </button>
                  <Link href={`/learn?theme=${b.cat.learnTheme}`} className="shrink-0 text-sm font-semibold text-ink-600 hover:underline dark:text-ink-300">Apprendre</Link>
                </div>
              ))}
            </Panel>
          )}
        </div>
      )}

      <section>
        <SectionHeader title="Toutes les branches" subtitle="Un mot peut appartenir à plusieurs domaines." />
        <ListGroup>
          {ordered.map((b) => (
            <ListRow
              key={b.cat.id}
              onClick={() => setSel(b.cat.id)}
              icon={<span className="text-sm font-semibold tabular-nums">{b.counts.total}</span>}
              tone={b.counts.total ? "mint" : "gray"}
              title={b.cat.label}
              subtitle={b.counts.total ? `${b.counts.employe} employés · ${b.counts.reconnu} reconnus · ${b.counts.decouvert} découverts${b.counts.oublie ? ` · ${b.counts.oublie} à reprendre` : ""}` : "Aucun mot encore"}
            />
          ))}
        </ListGroup>
      </section>

      <Panel tone="subtle" className="space-y-2 text-[14px]">
        <p className="font-semibold">Comment lire ta carte</p>
        {MASTERY_ORDER.map((l) => (
          <p key={l} className="flex gap-2">
            <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[l])} />
            <span><strong>{MASTERY_INFO[l].label}</strong> — {MASTERY_INFO[l].desc}</span>
          </p>
        ))}
        <p className="text-muted">Le niveau vient de tes vraies réponses en révision (répétition espacée), jamais du simple fait d&apos;avoir vu un mot. Tu peux changer le domaine d&apos;un mot depuis sa fiche.</p>
      </Panel>

      <BranchSheet branch={selected} all={all} onClose={() => setSel(null)} />
    </div>
  );
}
