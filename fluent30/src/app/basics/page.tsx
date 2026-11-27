"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { BASIC_LESSONS, allItems } from "@/lib/data/basics";
import { COURSES } from "@/lib/data/courses";
import { useT } from "@/hooks/useT";
import { PageHeader, cx } from "@/components/ui";
import { Visual } from "@/components/basics/Visual";

export default function BasicsHub() {
  const t = useT();
  const results = useLiveQuery(async () => {
    const games = await getDb().games.where("gameId").startsWith("basics:").toArray();
    const best = new Map<string, number>();
    for (const g of games) best.set(g.gameId, Math.max(best.get(g.gameId) ?? 0, g.total ? g.score / g.total : 0));
    return best;
  }, []);

  return (
    <div>
      <PageHeader title={t("Les bases", "The basics")} subtitle={t("Les 20 % de l'anglais qui servent 80 % du temps : nombres, heure, jours, émotions… en images, avec l'audio.", "The essential 20%: numbers, time, days, emotions… with pictures and audio.")} back="/cours" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BASIC_LESSONS.map((l) => {
          const best = results?.get(`basics:${l.id}`) ?? (l.id === "time" ? results?.get("basics:clock") : undefined);
          const preview = allItems(l).find((i) => i.visual && i.visual.kind !== "big")?.visual;
          return (
            <Link key={l.id} href={`/basics/${l.id}`} className={cx("group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-lg shadow-ink-900/10 transition hover:-translate-y-0.5 active:scale-[0.98]", l.tone)}>
              <span className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/15" />
              <span className="relative flex items-start justify-between">
                <span className="text-4xl drop-shadow-sm">{l.emoji}</span>
                {preview && <span className="h-12 w-12 rounded-2xl bg-white/90 p-1 shadow"><Visual v={preview} /></span>}
              </span>
              <span className="relative mt-3">
                <span className="block text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{t(l.title, l.titleEn)}</span>
                <span className="mt-0.5 block text-xs text-white/85">{allItems(l).length} {t("mots et phrases", "words & phrases")}</span>
                {best !== undefined && <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/25"><span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(best * 100)}%` }} /></span>}
              </span>
            </Link>
          );
        })}
      </div>

      <Link href="/courses" className="card-shadow mt-6 flex items-center gap-4 rounded-3xl border border-line/70 bg-surface p-4 transition hover:border-ink-300">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-500 to-ink-700 text-3xl">📘</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold" style={{ fontFamily: "var(--font-display)" }}>{t("Les cours : les règles pour bien parler", "Lessons: the rules of spoken English")}</span>
          <span className="block text-sm text-muted">{t(`${COURSES.length} fiches courtes à lire, avec exemples audio et mini-quiz`, `${COURSES.length} short readable lessons`)}</span>
        </span>
        <span className="text-muted">›</span>
      </Link>
    </div>
  );
}
