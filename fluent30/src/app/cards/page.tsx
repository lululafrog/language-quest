"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { DURABLE_DAYS, State } from "@/lib/srs";
import { themeEmoji, themeLabel } from "@/lib/data/types";
import { useT } from "@/hooks/useT";
import { useSettings } from "@/hooks/useSettings";
import { normalize } from "@/lib/text";
import { Badge, EmptyState, LinkButton, PageHeader, Segmented, cx } from "@/components/ui";
import { WordImage } from "@/components/WordImage";

type Sort = "recent" | "alpha" | "weak" | "due";

export default function CardsPage() {
  const t = useT();
  const s = useSettings();
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recent");
  const data = useLiveQuery(async () => {
    const db = getDb();
    const [cards, srs] = await Promise.all([db.cards.toArray(), db.srs.where("skill").equals("recognition").toArray()]);
    return { cards, srs: new Map(srs.map((x) => [x.cardId, x])) };
  }, []);

  const themes = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of data?.cards ?? []) for (const th of c.themes) count.set(th, (count.get(th) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  const list = useMemo(() => {
    if (!data) return [];
    const nq = normalize(q);
    let l = data.cards.filter((c) => (!theme || c.themes.includes(theme)) && (!nq || normalize(`${c.term} ${c.fr} ${(c.variants ?? []).join(" ")}`).includes(nq)));
    const st = (id: string) => data.srs.get(id);
    if (sort === "alpha") l = l.sort((a, b) => a.term.localeCompare(b.term));
    else if (sort === "weak") l = l.sort((a, b) => (st(b.id)?.lapses ?? 0) - (st(a.id)?.lapses ?? 0) || (st(a.id)?.stability ?? 0) - (st(b.id)?.stability ?? 0));
    else if (sort === "due") l = l.sort((a, b) => (st(a.id)?.due ?? Infinity) - (st(b.id)?.due ?? Infinity));
    else l = l.sort((a, b) => b.createdAt - a.createdAt);
    return l;
  }, [data, q, theme, sort]);

  return (
    <div>
      <PageHeader
        title={t("Mes flashcards", "My flashcards")}
        subtitle={data ? t(`${data.cards.length} cartes · classées automatiquement par thème`, `${data.cards.length} cards · auto-sorted by theme`) : ""}
        back="/more"
        action={<LinkButton href="/cards/add" size="sm">+ {t("Ajouter", "Add")}</LinkButton>}
      />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Rechercher un mot, une traduction…", "Search a word or translation…")} className="mb-3 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-ink-400" />
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setTheme(null)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm", !theme ? "border-ink-500 bg-ink-50 text-ink-700 dark:bg-ink-900/60 dark:text-ink-200" : "border-line")}>{t("Tous", "All")}</button>
        {themes.map(([th, n]) => (
          <button key={th} onClick={() => setTheme(th === theme ? null : th)} className={cx("shrink-0 rounded-full border px-3 py-1.5 text-sm", theme === th ? "border-ink-500 bg-ink-50 text-ink-700 dark:bg-ink-900/60 dark:text-ink-200" : "border-line")}>
            {themeEmoji(th)} {themeLabel(th, s.immersion)} <span className="text-muted">{n}</span>
          </button>
        ))}
      </div>
      <Segmented<Sort> className="mb-4" value={sort} onChange={setSort} options={[{ value: "recent", label: t("Récents", "Recent") }, { value: "alpha", label: "A–Z" }, { value: "weak", label: t("Difficiles", "Hardest") }, { value: "due", label: t("Échéance", "Due") }]} />

      {data && !data.cards.length ? (
        <EmptyState icon="🗂️" title={t("Aucune flashcard pour l'instant", "No flashcards yet")}>
          {t("Ajoute un mot, une expression, une phrase ou une capture d'écran : l'IA complète le reste.", "Add a word, expression, sentence or screenshot — AI fills in the rest.")}
          <div className="mt-4 flex justify-center gap-2"><LinkButton href="/cards/add" size="sm">{t("Ajouter", "Add")}</LinkButton><LinkButton href="/learn" size="sm" variant="outline">{t("Mots fréquents", "Frequent words")}</LinkButton></div>
        </EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((c) => {
            const st = data?.srs.get(c.id);
            const durable = st && st.state === State.Review && st.stability >= DURABLE_DAYS;
            return (
              <li key={c.id}>
                <Link href={`/cards/${c.id}`} className={cx("flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition hover:border-ink-300", c.suspended && "opacity-50")}>
                  <WordImage term={c.term} card={c} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.term}</p>
                    <p className="truncate text-sm text-muted">{c.fr || t("(traduction manquante)", "(missing translation)")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {durable ? <Badge tone="mint">{t("mémorisé", "memorised")}</Badge> : st?.state === State.New ? <Badge tone="gray">{t("nouveau", "new")}</Badge> : <Badge tone="ink">{t("en cours", "learning")}</Badge>}
                    {(st?.lapses ?? 0) >= 2 && <span className="text-[11px] text-coral-600">{st!.lapses}× {t("oublié", "forgotten")}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
