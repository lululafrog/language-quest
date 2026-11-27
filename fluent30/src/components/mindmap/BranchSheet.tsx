"use client";
// Detail of one branch of the vocabulary map: words by mastery, expressions, links, suggestions.
import Link from "next/link";
import { useMemo, useState } from "react";
import { branchLinks, type Branch } from "@/lib/mindmap";
import { MASTERY_INFO, MASTERY_ORDER, type MasteryLevel } from "@/lib/mastery";
import type { Card } from "@/lib/types";
import { FilterChips, LinkButton, ProgressBar, Sheet, SpeakButton, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

const DOT: Record<MasteryLevel, string> = {
  employe: "bg-mint-600",
  reconnu: "bg-mint-400",
  decouvert: "bg-sun-400",
  oublie: "bg-coral-500",
};

function WordRow({ card, level }: { card: Card; level?: MasteryLevel }) {
  return (
    <div className="flex items-center gap-1 py-1.5">
      <SpeakButton text={card.term} size={15} className="-ml-1 shrink-0 p-1.5" />
      <Link href={`/cards/${card.id}`} className="min-w-0 flex-1 hover:underline">
        <span className="block truncate text-[15px] font-medium">{card.term}</span>
        <span className="block truncate text-[13px] text-muted">{card.fr}</span>
      </Link>
      {level && <span className={cx("h-2 w-2 shrink-0 rounded-full", DOT[level])} title={MASTERY_INFO[level].label} />}
    </div>
  );
}

export function BranchSheet({ branch, all, onClose }: { branch: Branch | null; all: Card[]; onClose: () => void }) {
  const [tab, setTab] = useState<MasteryLevel>("employe");
  const links = useMemo(() => (branch ? branchLinks(branch, all) : null), [branch, all]);
  if (!branch || !links) return null;
  const words = branch.words.filter((w) => w.level === tab);
  const levelOf = new Map(branch.words.map((w) => [w.card.id, w.level]));
  const pct = branch.reference ? Math.round((branch.covered / branch.reference) * 100) : null;

  return (
    <Sheet open onClose={onClose} title={branch.cat.label} wide>
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2 text-center">
          {MASTERY_ORDER.map((l) => (
            <div key={l} className="rounded-2xl bg-surface-2 px-1 py-2">
              <div className="text-lg font-semibold tabular-nums">{branch.counts[l]}</div>
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted">
                <span className={cx("h-1.5 w-1.5 rounded-full", DOT[l])} />
                {MASTERY_INFO[l].label}
              </div>
            </div>
          ))}
        </div>

        {pct !== null && (
          <div>
            <div className="mb-1 flex justify-between text-[13px] text-muted">
              <span>Mots fréquents de ce domaine que tu as déjà</span>
              <span className="tabular-nums">{branch.covered}/{branch.reference}</span>
            </div>
            <ProgressBar value={branch.covered} max={branch.reference} tone="mint" />
          </div>
        )}

        <section>
          <FilterChips
            value={tab}
            onChange={setTab}
            options={MASTERY_ORDER.map((l) => ({ value: l, label: `${MASTERY_INFO[l].short} · ${branch.counts[l]}` }))}
          />
          <p className="mt-2 text-[13px] text-muted">{MASTERY_INFO[tab].desc}</p>
          <div className="mt-1 divide-y divide-line/60">
            {words.length ? words.slice(0, 60).map((w) => <WordRow key={w.card.id} card={w.card} />) : <p className="py-3 text-sm text-muted">Aucun mot dans cette catégorie pour l&apos;instant.</p>}
          </div>
          {words.length > 60 && <p className="pt-1 text-xs text-muted">… et {words.length - 60} autres (voir Mes flashcards).</p>}
        </section>

        {links.expressions.length > 0 && (
          <section>
            <h3 className="mb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Expressions associées</h3>
            <div className="divide-y divide-line/60">
              {links.expressions.slice(0, 12).map((c) => <WordRow key={c.id} card={c} level={levelOf.get(c.id)} />)}
            </div>
          </section>
        )}

        {links.pairs.length > 0 && (
          <section>
            <h3 className="mb-2 text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Connexions entre tes mots</h3>
            <ul className="space-y-1.5">
              {links.pairs.slice(0, 14).map((p, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-2 text-[14.5px]">
                  <Link href={`/cards/${p.a.id}`} className="font-medium hover:underline">{p.a.term}</Link>
                  <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold", p.kind === "antonyme" ? "bg-coral-100 text-coral-600 dark:bg-coral-600/20 dark:text-coral-400" : p.kind === "synonyme" ? "bg-mint-100 text-mint-600 dark:bg-mint-600/20 dark:text-mint-400" : "bg-ink-50 text-ink-600 dark:bg-ink-900/60 dark:text-ink-300")}>
                    {p.kind}
                  </span>
                  <Link href={`/cards/${p.b.id}`} className="font-medium hover:underline">{p.b.term}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {branch.missing.length > 0 && (
          <section>
            <h3 className="mb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-muted">Mots fréquents à découvrir</h3>
            <div className="flex flex-wrap gap-1.5">
              {branch.missing.map((w) => (
                <span key={w.en} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[13px]" title={w.fr}>
                  {w.en} <span className="text-muted">· {w.fr.split(/[,;]/)[0]}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <LinkButton href={`/learn?theme=${branch.cat.learnTheme}`} className="w-full">
            <Icon name="sparkle" size={18} /> Apprendre des mots de ce domaine
          </LinkButton>
          <LinkButton href="/review" variant="secondary" className="w-full">
            <Icon name="flashcards" size={18} /> Réviser mes mots
          </LinkButton>
          <LinkButton href="/games" variant="secondary" className="w-full">
            <Icon name="game" size={18} /> Jouer avec mes mots
          </LinkButton>
          {branch.cat.module && (
            <LinkButton href={`/cours/${branch.cat.module}`} variant="secondary" className="w-full">
              <Icon name="course" size={18} /> Cours « vie réelle » lié
            </LinkButton>
          )}
        </div>
      </div>
    </Sheet>
  );
}
