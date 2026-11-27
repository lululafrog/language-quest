"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { COURSES, type Course } from "@/lib/data/courses";
import { useT } from "@/hooks/useT";
import { Badge, PageHeader, Segmented, cx } from "@/components/ui";

type Filter = "all" | Course["category"];
const CAT_TONE: Record<Course["category"], string> = { grammaire: "from-ink-500 to-ink-700", vocabulaire: "from-[#fb923c] to-[#ea580c]", prononciation: "from-mint-400 to-mint-600" };

export default function CoursesPage() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>("all");
  const best = useLiveQuery(async () => {
    const games = await getDb().games.where("gameId").startsWith("course:").toArray();
    const m = new Map<string, number>();
    for (const g of games) m.set(g.gameId.slice(7), Math.max(m.get(g.gameId.slice(7)) ?? 0, g.total ? g.score / g.total : 0));
    return m;
  }, []);
  const list = COURSES.filter((c) => filter === "all" || c.category === filter);
  const done = COURSES.filter((c) => (best?.get(c.slug) ?? 0) >= 0.8).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("Les cours", "Lessons")} subtitle={t(`Les règles pour bien parler anglais, en fiches courtes. ${done}/${COURSES.length} maîtrisées.`, `The rules of spoken English. ${done}/${COURSES.length} mastered.`)} back="/basics" />
      <Segmented<Filter> className="mb-4" value={filter} onChange={setFilter} options={[{ value: "all", label: t("Tous", "All") }, { value: "grammaire", label: t("Grammaire", "Grammar") }, { value: "vocabulaire", label: t("Vocabulaire", "Vocabulary") }, { value: "prononciation", label: t("Prononciation", "Pronunciation") }]} />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((c) => {
          const b = best?.get(c.slug);
          return (
            <Link key={c.slug} href={`/courses/${c.slug}`} className="card-shadow flex gap-3 rounded-3xl border border-line/70 bg-surface p-3.5 transition hover:-translate-y-0.5 hover:border-ink-300">
              <span className={cx("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl", CAT_TONE[c.category])}>{c.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>{c.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{c.summary}</span>
                <span className="mt-1.5 flex items-center gap-1.5">
                  <Badge tone="gray" className="text-[10px]">{c.level}</Badge>
                  {b !== undefined && <Badge tone={b >= 0.8 ? "mint" : "sun"} className="text-[10px]">{b >= 0.8 ? "✓ " : ""}{Math.round(b * 100)} %</Badge>}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
