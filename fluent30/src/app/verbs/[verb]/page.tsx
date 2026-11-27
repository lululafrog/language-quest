"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Badge, Button, EmptyState, PageHeader, Panel, SpeakButton, cx, toast } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { getDb } from "@/lib/db";
import { isDurable } from "@/lib/srs";
import { lemmaOf } from "@/lib/cards";
import { verbByBase, POLYVALENT_VERBS, CORE_VERBS } from "@/lib/data/verbs";
import { addToDeck, itemCard, verbCard } from "@/components/verbs/verbCards";
import { VerbExercises } from "@/components/verbs/VerbExercises";
import type { Card } from "@/lib/types";

type Item = { en: string; fr: string; example: string; exampleFr?: string };

export default function VerbDetailPage() {
  const t = useT();
  const params = useParams<{ verb: string }>();
  const base = decodeURIComponent(params.verb ?? "").toLowerCase();
  const verb = verbByBase(base);

  const saved = useLiveQuery(async () => {
    const db = getDb();
    const cards = await db.cards.toArray();
    const states = await db.srs.where("skill").equals("recognition").toArray();
    const byCard = new Map(states.map((s) => [s.cardId, s]));
    const map = new Map<string, { card: Card; durable: boolean }>();
    for (const c of cards) map.set(c.lemma, { card: c, durable: !!byCard.get(c.id) && isDurable(byCard.get(c.id)!) });
    return map;
  }, []);

  const [busy, setBusy] = useState<string | null>(null);

  if (!verb)
    return (
      <div>
        <PageHeader title={t("Verbe introuvable", "Verb not found")} back="/verbs" />
        <EmptyState icon="🔎" title={t(`« ${base} » ne fait pas partie du parcours.`, `"${base}" isn't part of the track.`)}>
          <Link href="/verbs" className="text-ink-600 underline">{t("Voir tous les verbes", "See all verbs")}</Link>
        </EmptyState>
      </div>
    );

  const add = async (key: string, card: Card) => {
    setBusy(key);
    try {
      const r = await addToDeck(card);
      toast(r.merged ? t("Déjà dans vos flashcards — révision reprogrammée", "Already in your flashcards — rescheduled") : t(`« ${card.term} » ajouté aux flashcards`, `"${card.term}" added to flashcards`));
    } catch {
      toast(t("Impossible d'ajouter la carte", "Couldn't add the card"), "err");
    } finally {
      setBusy(null);
    }
  };

  const status = (term: string) => saved?.get(lemmaOf(term));
  const idx = CORE_VERBS.findIndex((v) => v.base === verb.base);
  const prev = CORE_VERBS[idx - 1];
  const next = CORE_VERBS[idx + 1];
  const forms: [string, string][] = [
    [t("Infinitif", "Infinitive"), verb.base],
    [t("3e personne", "3rd person"), verb.third],
    [t("Prétérit", "Past simple"), verb.past],
    [t("Participe passé", "Past participle"), verb.pp],
    [t("Forme en -ing", "-ing form"), verb.ing],
  ];
  const verbStatus = status(verb.base);

  return (
    <div className="space-y-5">
      <PageHeader
        back="/verbs"
        title={
          <span className="flex flex-wrap items-center gap-2">
            {verb.base}
            <span className="text-lg font-normal text-muted">{verb.ipa}</span>
            <SpeakButton text={verb.base} />
          </span>
        }
        subtitle={verb.fr}
        action={
          <AddButton
            label={t("Ajouter le verbe", "Add verb")} status={verbStatus} busy={busy === "verb"}
            onClick={() => void add("verb", verbCard(verb))}
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        {verb.irregular ? <Badge tone="sun">{t("Verbe irrégulier", "Irregular verb")}</Badge> : <Badge tone="gray">{t("Verbe régulier", "Regular verb")}</Badge>}
        {POLYVALENT_VERBS.includes(verb.base) && <Badge tone="ink">⚡ {t("Verbe polyvalent : apprenez ses expressions !", "Multi-use verb: learn its expressions!")}</Badge>}
      </div>

      <Panel>
        <h2 className="mb-3 text-lg font-semibold">{t("Formes", "Forms")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {forms.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-surface-2 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="font-semibold">{value}</span>
                <SpeakButton text={value.split("/")[0].replace(/\(.*?\)/g, "").trim()} size={16} className="p-1" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {verb.tips && (
        <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4 text-[15px] leading-relaxed dark:border-ink-800 dark:bg-ink-900/40">
          <div className="mb-1 font-semibold">🇫🇷 {t("Pour les francophones", "Tips for French speakers")}</div>
          {verb.tips}
        </div>
      )}

      <Panel>
        <h2 className="mb-3 text-lg font-semibold">{t("Significations principales", "Main meanings")}</h2>
        <ul className="divide-y divide-line">
          {verb.meanings.map((mn, i) => (
            <li key={i} className="py-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{mn.fr}</span>
                <span className="text-sm text-muted">— {mn.en}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[15px]">
                <em>{mn.example}</em>
                <SpeakButton text={mn.example} size={16} className="p-1" />
              </div>
              <div className="text-sm text-muted">{mn.exampleFr}</div>
            </li>
          ))}
        </ul>
      </Panel>

      <ItemList
        title={t("Expressions courantes", "Common expressions")} items={verb.expressions} phrasal={false}
        status={status} busy={busy} onAdd={(key, it) => void add(key, itemCard(it, false))}
      />
      <ItemList
        title={t("Phrasal verbs", "Phrasal verbs")} items={verb.phrasal} phrasal
        status={status} busy={busy} onAdd={(key, it) => void add(key, itemCard(it, true))}
      />

      <VerbExercises verb={verb} />

      <div className="flex justify-between gap-3">
        {prev ? <Link href={`/verbs/${prev.base}`} className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2">← {prev.base}</Link> : <span />}
        {next && <Link href={`/verbs/${next.base}`} className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2">{next.base} →</Link>}
      </div>
    </div>
  );
}

function AddButton({ label, status, busy, onClick }: { label: string; status?: { durable: boolean }; busy: boolean; onClick: () => void }) {
  const t = useT();
  if (status)
    return <Badge tone={status.durable ? "mint" : "ink"} className="shrink-0">{status.durable ? `✓ ${t("Mémorisé", "Memorised")}` : `✓ ${t("Dans mes cartes", "In my cards")}`}</Badge>;
  return (
    <Button size="sm" variant="secondary" loading={busy} onClick={onClick} className="shrink-0">
      + {label}
    </Button>
  );
}

function ItemList({ title, items, phrasal, status, busy, onAdd }: { title: string; items: Item[]; phrasal: boolean; status: (term: string) => { durable: boolean } | undefined; busy: string | null; onAdd: (key: string, it: Item) => void }) {
  const t = useT();
  if (!items.length) return null;
  return (
    <Panel>
      <h2 className="mb-3 text-lg font-semibold">{title} <span className="text-sm font-normal text-muted">({items.length})</span></h2>
      <ul className="divide-y divide-line">
        {items.map((it) => {
          const key = `${phrasal ? "p" : "e"}:${it.en}`;
          const st = status(it.en);
          return (
            <li key={key} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-semibold">{it.en}</span>
                  <SpeakButton text={it.en.split("/")[0]} size={15} className="p-1" />
                  <span className="text-sm text-muted">{it.fr}</span>
                </div>
                <div className={cx("mt-0.5 flex items-center gap-1 text-[15px]")}>
                  <em className="text-fg/90">{it.example}</em>
                  <SpeakButton text={it.example} size={15} className="p-1" />
                </div>
                {it.exampleFr && <div className="text-sm text-muted">{it.exampleFr}</div>}
              </div>
              <AddButton label={t("Ajouter", "Add")} status={st} busy={busy === key} onClick={() => onAdd(key, it)} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
