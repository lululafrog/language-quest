"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { useT } from "@/hooks/useT";
import { Badge, PageHeader, Panel } from "@/components/ui";

const WEEK = 7 * 86400000;

export default function TestsPage() {
  const t = useT();
  const [now] = useState(() => Date.now());
  const tests = useLiveQuery(() => getDb().tests.orderBy("at").reverse().toArray(), []);
  const last = (type: string) => tests?.find((x) => x.type === type);
  const due = (type: string, period: number) => {
    const l = last(type);
    return !l || now - l.at > period;
  };
  const cards = [
    { href: "/tests/placement", type: "placement", title: t("Test de niveau", "Placement test"), desc: t("Repère le vocabulaire déjà connu et ton niveau de grammaire (~5 min).", "Find known vocabulary (~5 min)."), period: Infinity },
    { href: "/tests/weekly", type: "weekly", title: t("Test hebdomadaire", "Weekly test"), desc: t("Vocabulaire, production écrite, écoute, grammaire (~5 min).", "Vocabulary, writing, listening, grammar (~5 min)."), period: WEEK },
    { href: "/tests/monthly", type: "monthly", title: t("Test mensuel", "Monthly test"), desc: t("Bilan complet avec compréhension écrite (~12 min).", "Full review with reading (~12 min)."), period: 30 * 86400000 },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("Tests de progression", "Progress tests")} subtitle={t("Pour mesurer tes progrès réels, pas seulement ton activité.", "Measure real progress, not just activity.")} back="/more" />
      <div className="space-y-3">
        {cards.map((c) => {
          const l = last(c.type);
          return (
            <Link key={c.href} href={c.href} className="block rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-300">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{c.title}</p>
                {c.period !== Infinity && due(c.type, c.period) ? <Badge tone="coral">{t("à faire", "due")}</Badge> : l ? <Badge tone="mint">{t("fait", "done")}</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{c.desc}</p>
              {l && <p className="mt-1 text-xs text-muted">{t("Dernier :", "Last:")} {new Date(l.at).toLocaleDateString()}</p>}
            </Link>
          );
        })}
      </div>
      {tests && tests.length > 0 && (
        <Panel className="mt-5">
          <h2 className="mb-2 font-semibold">{t("Historique", "History")}</h2>
          <ul className="divide-y divide-line text-sm">
            {tests.slice(0, 20).map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2">
                <span>{x.type === "placement" ? t("Niveau", "Placement") : x.type === "weekly" ? t("Hebdo", "Weekly") : t("Mensuel", "Monthly")} · {new Date(x.at).toLocaleDateString()}</span>
                <span className="text-muted">{Object.values(x.scores).length ? `${Math.round((Object.values(x.scores).reduce((a, b) => a + (b ?? 0), 0) / Object.values(x.scores).length) * 100)} %` : "—"}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
