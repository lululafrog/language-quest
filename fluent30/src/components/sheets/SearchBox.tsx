"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { useT } from "@/hooks/useT";
import { SEARCH_KIND_LABEL, groupResults, searchCards, searchStatic, type SearchResult } from "@/lib/curriculum/search";

/**
 * Global search box (sheets, lessons, grammar, verbs, expressions, the user's cards).
 * Results are shown instantly below the field, grouped by type.
 */
export function SearchBox({
  placeholder,
  autoFocus,
  onQueryChange,
  perGroup = 5,
  className,
}: {
  placeholder?: string;
  autoFocus?: boolean;
  onQueryChange?: (q: string) => void;
  perGroup?: number;
  className?: string;
}) {
  const t = useT();
  const id = useId();
  const [q, setQ] = useState("");
  const [cards, setCards] = useState<{ q: string; items: SearchResult[] }>({ q: "", items: [] });
  const trimmed = q.trim();
  const statics = useMemo(() => (trimmed.length >= 2 ? searchStatic(trimmed, 80) : []), [trimmed]);

  useEffect(() => {
    if (trimmed.length < 2) return;
    let alive = true;
    const h = setTimeout(() => {
      searchCards(trimmed)
        .then((items) => alive && setCards({ q: trimmed, items }))
        .catch(() => alive && setCards({ q: trimmed, items: [] }));
    }, 150);
    return () => {
      alive = false;
      clearTimeout(h);
    };
  }, [trimmed]);

  const groups = useMemo(() => {
    const own = cards.q === trimmed ? cards.items : [];
    return groupResults([...statics, ...own], perGroup);
  }, [statics, cards, trimmed, perGroup]);

  const update = (v: string) => {
    setQ(v);
    onQueryChange?.(v);
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {t("Rechercher", "Search")}
      </label>
      <div className="relative">
        <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && update("")}
          placeholder={placeholder ?? t("Rechercher une règle, un mot, un verbe…", "Search a rule, a word, a verb…")}
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full rounded-2xl border border-line bg-surface pl-10 pr-20 text-[15px] outline-none transition placeholder:text-muted focus:border-ink-400 focus:ring-2 focus:ring-ink-200 dark:focus:ring-ink-800"
        />
        {q && (
          <button type="button" onClick={() => update("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-2">
            {t("Effacer", "Clear")}
          </button>
        )}
      </div>

      {trimmed.length >= 2 && (
        <div className="mt-3" aria-live="polite">
          {groups.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              {t(`Aucun résultat pour « ${trimmed} ».`, `No results for “${trimmed}”.`)}
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <section key={g.kind}>
                  <h3 className="mb-1.5 flex items-baseline justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <span>{t(SEARCH_KIND_LABEL[g.kind].fr, SEARCH_KIND_LABEL[g.kind].en)}</span>
                    {g.total > g.items.length && <span className="font-normal normal-case tracking-normal">{g.items.length} / {g.total}</span>}
                  </h3>
                  <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line/70 bg-surface">
                    {g.items.map((r) => (
                      <li key={`${r.kind}-${r.id}`}>
                        <Link href={r.href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium">{r.title}</p>
                            {r.snippet && <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">{r.snippet}</p>}
                          </div>
                          <Icon name="chevron" size={16} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

