"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Badge, PageHeader, Panel, ProgressBar, cx } from "@/components/ui";
import { useT } from "@/hooks/useT";
import { getDb } from "@/lib/db";
import { isDurable } from "@/lib/srs";
import { CORE_VERBS, POLYVALENT_VERBS } from "@/lib/data/verbs";
import { verbLemmas } from "@/components/verbs/verbCards";
import { normalize } from "@/lib/text";

export default function VerbsPage() {
  const t = useT();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "polyvalent" | "todo" | "mastered">("all");

  const data = useLiveQuery(async () => {
    const db = getDb();
    const cards = await db.cards.where("source").equals("verbs").toArray();
    const states = await db.srs.where("skill").equals("recognition").toArray();
    return { cards, states };
  }, []);

  const progress = useMemo(() => {
    const map = new Map<string, { saved: number; durable: number; total: number; mastered: boolean }>();
    const byCard = new Map((data?.states ?? []).map((s) => [s.cardId, s]));
    for (const v of CORE_VERBS) {
      const lemmas = verbLemmas(v);
      const mine = (data?.cards ?? []).filter((c) => lemmas.has(c.lemma));
      const durable = mine.filter((c) => {
        const s = byCard.get(c.id);
        return s && isDurable(s);
      }).length;
      map.set(v.base, { saved: mine.length, durable, total: lemmas.size, mastered: mine.length > 0 && durable === mine.length });
    }
    return map;
  }, [data]);

  const masteredCount = [...progress.values()].filter((p) => p.mastered).length;
  const list = CORE_VERBS.filter((v) => {
    const n = normalize(q);
    if (n && !normalize(`${v.base} ${v.fr} ${v.past} ${v.pp}`).includes(n)) return false;
    const p = progress.get(v.base);
    if (filter === "polyvalent") return POLYVALENT_VERBS.includes(v.base);
    if (filter === "mastered") return p?.mastered;
    if (filter === "todo") return !p?.mastered;
    return true;
  });

  return (
    <div>
      <PageHeader
        title={t("Verbes essentiels", "Core verbs")}
        subtitle={t("Les verbes les plus fréquents de l'anglais parlé, avec leurs vrais usages.", "The most frequent verbs in spoken English, with how they're really used.")}
      />
      <Link href="/verbs/irregular" className="mb-4 flex items-center gap-3 rounded-2xl border border-ink-200 bg-gradient-to-r from-ink-50 to-transparent p-4 transition hover:border-ink-400 dark:border-ink-800 dark:from-ink-900/50">
        <span className="text-2xl">🔁</span>
        <span className="flex-1"><span className="block font-semibold">{t("Verbes irréguliers", "Irregular verbs")}</span><span className="block text-sm text-muted">{t("Les plus importants d'abord, par familles, avec quiz", "Most important first, by family, with quizzes")}</span></span>
        <span className="text-muted">›</span>
      </Link>
      <Panel className="mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{t("Verbes maîtrisés", "Verbs mastered")}</span>
          <span className="tabular-nums text-muted">{masteredCount}/{CORE_VERBS.length}</span>
        </div>
        <ProgressBar className="mt-2" value={masteredCount} max={CORE_VERBS.length} tone="mint" />
        <p className="mt-2 text-xs text-muted">
          {t("Un verbe est maîtrisé quand toutes les cartes que vous avez ajoutées depuis sa fiche sont mémorisées durablement (stabilité ≥ 21 jours).", "A verb is mastered when every card you added from its page is durably memorised (stability ≥ 21 days).")}
        </p>
      </Panel>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q} onChange={(e) => setQ(e.target.value)} type="search"
          placeholder={t("Rechercher un verbe (anglais ou français)…", "Search a verb…")}
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 outline-none focus:border-ink-400"
        />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {([
            ["all", t("Tous", "All")],
            ["polyvalent", t("Polyvalents", "Multi-use")],
            ["todo", t("À travailler", "To work on")],
            ["mastered", t("Maîtrisés", "Mastered")],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} className={cx("shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition", filter === k ? "bg-ink-600 text-white" : "bg-surface-2 text-muted hover:text-fg")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const p = progress.get(v.base);
          const poly = POLYVALENT_VERBS.includes(v.base);
          return (
            <Link key={v.base} href={`/verbs/${v.base}`} className={cx("group rounded-2xl border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-md", poly ? "border-ink-300 dark:border-ink-700" : "border-line")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xl font-semibold tracking-tight">{v.base}</div>
                  <div className="text-sm text-muted">{v.fr}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {p?.mastered && <Badge tone="mint">✓ {t("Maîtrisé", "Mastered")}</Badge>}
                  {poly && <Badge tone="ink">⚡ {t("Polyvalent", "Multi-use")}</Badge>}
                  {v.irregular && <Badge tone="sun">{t("Irrégulier", "Irregular")}</Badge>}
                </div>
              </div>
              <div className="mt-3 text-xs text-muted">{v.base} · {v.past} · {v.pp}</div>
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={p?.saved ?? 0} max={p?.total ?? 1} className="h-1.5" />
                <span className="shrink-0 text-[11px] tabular-nums text-muted">{p?.saved ?? 0}/{p?.total ?? 0}</span>
              </div>
            </Link>
          );
        })}
      </div>
      {!list.length && <p className="mt-8 text-center text-sm text-muted">{t("Aucun verbe trouvé.", "No verb found.")}</p>}
    </div>
  );
}
