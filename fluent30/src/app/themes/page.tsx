"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { THEME_GROUPS, type Theme } from "@/lib/data/types";
import { themesProgress } from "@/lib/themes";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { PageHeader, cx } from "@/components/ui";

const GROUP_STYLE: Record<Theme["priority"], string> = {
  1: "from-coral-400 to-coral-600",
  2: "from-ink-400 to-ink-600",
  3: "from-mint-400 to-mint-600",
  4: "from-sun-400 to-amber-500",
};

export default function ThemesPage() {
  const t = useT();
  const s = useSettings();
  const progress = useLiveQuery(() => themesProgress(), []);
  if (!progress || !s.loaded) return <div className="h-96 animate-pulse rounded-3xl bg-surface-2" />;

  const toggleInterest = (id: string) => saveSettings({ interests: s.interests.includes(id) ? s.interests.filter((x) => x !== id) : [...s.interests, id] });

  return (
    <div>
      <PageHeader
        title={t("Thèmes de vocabulaire", "Vocabulary themes")}
        subtitle={t("Classés par priorité : commence par les indispensables. Le ♥ marque tes centres d'intérêt (ils passent en priorité dans tes nouveaux mots).", "Ranked by priority. ♥ marks your interests.")}
        back="/"
      />
      <div className="space-y-6">
        {([1, 2, 3, 4] as const).map((prio) => {
          const items = progress.filter((p) => p.theme.priority === prio && p.total > 0);
          const g = THEME_GROUPS[prio];
          return (
            <section key={prio}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className={cx("rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-bold text-white", GROUP_STYLE[prio])}>{t(`Priorité ${prio}`, `Priority ${prio}`)}</span>
                <h2 className="text-lg font-bold">{s.immersion ? g.en : g.fr}</h2>
              </div>
              <p className="mb-3 text-sm text-muted">{g.descFr}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map(({ theme, total, learned }) => {
                  const pct = total ? Math.round((learned / total) * 100) : 0;
                  const fav = s.interests.includes(theme.id);
                  return (
                    <div key={theme.id} className="card-shadow relative flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-surface">
                      <Link href={`/learn?theme=${theme.id}`} className="flex flex-1 flex-col p-3.5 pb-2 transition active:scale-[0.98]">
                        <span className="text-3xl">{theme.emoji}</span>
                        <span className="mt-2 text-[15px] font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{s.immersion ? theme.en : theme.fr}</span>
                        <span className="mt-auto pt-2 text-xs text-muted">{learned}/{total} {t("mots", "words")}</span>
                      </Link>
                      <div className="h-1.5 bg-surface-2"><div className={cx("h-full bg-gradient-to-r", GROUP_STYLE[prio])} style={{ width: `${pct}%` }} /></div>
                      <button onClick={() => toggleInterest(theme.id)} aria-label={t("Centre d'intérêt", "Interest")} className={cx("absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-lg transition", fav ? "bg-coral-100 text-coral-500 dark:bg-coral-600/20" : "text-line hover:text-coral-400")}>
                        {fav ? "♥" : "♡"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
