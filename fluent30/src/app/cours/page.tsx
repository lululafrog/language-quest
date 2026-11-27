"use client";
import Link from "next/link";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { saveSettings } from "@/lib/db";
import { CEFR_LEVELS, LEVEL_INFO, SHEETS, THEME_MODULES, lessonsOfLevel, type CefrLevel, type Lesson } from "@/lib/curriculum";
import { lessonProgressMap, levelProgress, nextPathLesson } from "@/lib/curriculum/progress";
import { EmptyState, LinkButton, ListGroup, ListRow, Panel, ProgressBar, SectionHeader, cx } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function CoursHub() {
  const t = useT();
  const s = useSettings();
  const [picked, setPicked] = useState<CefrLevel | null>(null);
  const level: CefrLevel = picked ?? s.pathLevel ?? "A1";
  const progress = useLiveQuery(() => levelProgress(), []);
  const map = useLiveQuery(() => lessonProgressMap(), []);
  const next = useLiveQuery(async () => (await nextPathLesson(level)) ?? null, [level]);

  const choose = (l: CefrLevel) => {
    setPicked(l);
    void saveSettings({ pathLevel: l });
  };

  const lessons = lessonsOfLevel(level);
  const units: { unit: string; lessons: Lesson[] }[] = [];
  for (const l of lessons) {
    const u = units.find((x) => x.unit === l.unit);
    if (u) u.lessons.push(l);
    else units.push({ unit: l.unit, lessons: [l] });
  }
  const lp = progress?.[level] ?? { done: 0, total: lessons.length };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="t-display">{t("Cours", "Course")}</h1>
        <p className="mt-1 text-sm text-muted">{t("Un parcours progressif : 30 % d'explication, 70 % de pratique.", "A step-by-step path: 30% explanation, 70% practice.")}</p>
      </header>

      {/* Level path */}
      <div className="mb-4 grid grid-cols-5 gap-1.5" role="tablist" aria-label={t("Niveau", "Level")}>
        {CEFR_LEVELS.map((l) => {
          const p = progress?.[l];
          const pct = p && p.total ? p.done / p.total : 0;
          return (
            <button key={l} role="tab" aria-selected={l === level} onClick={() => choose(l)} className={cx("rounded-2xl border px-1 py-2.5 text-center transition", l === level ? "border-ink-600 bg-ink-600 text-white" : "border-line bg-surface hover:border-ink-300")}>
              <span className="block text-[15px] font-semibold">{l}</span>
              <span className={cx("mx-auto mt-1.5 block h-1 w-8 overflow-hidden rounded-full", l === level ? "bg-white/25" : "bg-surface-2")}>
                <span className={cx("block h-full rounded-full", l === level ? "bg-white" : "bg-mint-500")} style={{ width: `${Math.round(pct * 100)}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      <Panel tone="highlight">
        <p className="t-eyebrow">{t(`Niveau ${level}`, `Level ${level}`)}</p>
        <p className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{LEVEL_INFO[level].title}</p>
        <p className="mt-0.5 text-sm text-muted">{LEVEL_INFO[level].promise}</p>
        {lp.total > 0 && (
          <>
            <ProgressBar value={lp.done} max={lp.total} tone="mint" className="mt-3" />
            <p className="mt-1.5 text-xs text-muted">{t(`${lp.done} / ${lp.total} leçons validées`, `${lp.done} / ${lp.total} lessons passed`)}</p>
          </>
        )}
        {next && next.level === level ? (
          <LinkButton href={`/cours/${next.id}`} className="mt-4 w-full sm:w-auto">{t("Continuer :", "Continue:")} {next.title}</LinkButton>
        ) : lp.total > 0 && lp.done === lp.total ? (
          <p className="mt-3 text-sm font-medium text-mint-600 dark:text-mint-400">{t("Niveau terminé. Passe au suivant ou valide-le avec un test.", "Level complete. Move on or confirm it with a test.")}</p>
        ) : null}
      </Panel>

      {units.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon="📝" title={t("Leçons en cours de rédaction", "Lessons being written")}>
            {t("Les leçons de ce niveau ne sont pas encore disponibles. Les ressources ci-dessous restent accessibles.", "Lessons for this level are not available yet. The resources below remain available.")}
          </EmptyState>
        </div>
      ) : (
        units.map((u, ui) => (
          <section key={u.unit}>
            <SectionHeader title={u.unit} subtitle={t(`Unité ${ui + 1} · ${u.lessons.length} leçon${u.lessons.length > 1 ? "s" : ""}`, `Unit ${ui + 1} · ${u.lessons.length} lesson${u.lessons.length > 1 ? "s" : ""}`)} />
            <ListGroup>
              {u.lessons.map((l) => {
                const st = map?.get(l.id)?.status;
                return (
                  <ListRow
                    key={l.id}
                    href={`/cours/${l.id}`}
                    tone={st === "done" ? "mint" : st === "started" ? "sun" : "gray"}
                    icon={st === "done" ? <Icon name="check" size={18} strokeWidth={2.4} /> : st === "started" ? <Icon name="clock" size={18} /> : <span className="text-sm font-semibold tabular-nums">{l.order}</span>}
                    title={l.title}
                    subtitle={`${l.minutes} min${st === "done" ? t(" · validée", " · passed") : st === "started" ? t(" · en cours", " · in progress") : ""}`}
                  />
                );
              })}
            </ListGroup>
          </section>
        ))
      )}

      {/* Real life */}
      <SectionHeader title={t("Vie réelle", "Real life")} subtitle={t("Situations concrètes, avec les registres (formel → familier).", "Real situations, with registers (formal → casual).")} />
      {THEME_MODULES.length ? (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
          {THEME_MODULES.map((m) => {
            const st = map?.get(m.id)?.status;
            return (
              <Link key={m.id} href={`/cours/${m.id}`} className="card-shadow w-44 shrink-0 rounded-3xl border border-line/70 bg-surface p-4 transition hover:border-ink-300">
                <span className="flex items-center justify-between">
                  <Icon name="globe" size={20} className="text-ink-500" />
                  {st === "done" && <Icon name="check" size={16} className="text-mint-500" strokeWidth={2.4} />}
                </span>
                <span className="mt-3 block text-[15px] font-medium leading-snug">{m.title}</span>
                <span className="mt-1 block text-xs text-muted">{m.minutes} min</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Panel tone="subtle"><p className="text-sm text-muted">{t("Les modules de vie réelle arrivent bientôt.", "Real-life modules are coming soon.")}</p></Panel>
      )}

      {/* Essential vocabulary */}
      <SectionHeader title={t("Vocabulaire essentiel", "Essential vocabulary")} />
      <ListGroup>
        <ListRow href="/learn" tone="mint" icon={<Icon name="sparkle" size={20} />} title={t("Les mots les plus fréquents", "The most frequent words")} subtitle={t("Par paliers : 100, 500, 1 000, 2 000 mots", "In tiers: 100, 500, 1,000, 2,000 words")} />
        <ListRow href="/themes" tone="mint" icon={<Icon name="globe" size={20} />} title={t("Vocabulaire par thème", "Vocabulary by theme")} subtitle={t("Indispensables d'abord, puis tes centres d'intérêt", "Essentials first, then your interests")} />
      </ListGroup>

      {/* Sheets */}
      <SectionHeader title={t("Fiches de révision", "Revision sheets")} />
      <ListGroup>
        <ListRow href="/cours/fiches" icon={<Icon name="search" size={20} />} title={t("Rechercher une fiche", "Search a sheet")} subtitle={SHEETS.length ? t(`${SHEETS.length} fiches : temps, modaux, prépositions, faux amis…`, `${SHEETS.length} sheets: tenses, modals, prepositions…`) : t("Temps, modaux, prépositions, faux amis…", "Tenses, modals, prepositions…")} />
      </ListGroup>

      {/* Assessments */}
      <SectionHeader title={t("Évaluations", "Assessments")} />
      <ListGroup>
        <ListRow href="/tests/cefr" icon={<Icon name="target" size={20} />} title={t("Test de niveau CECRL", "CEFR level test")} subtitle={t("Situe-toi de A1 à C1", "Find your level from A1 to C1")} />
        <ListRow href="/tests" icon={<Icon name="test" size={20} />} title={t("Tous les tests", "All tests")} subtitle={t("Placement, hebdomadaire, mensuel", "Placement, weekly, monthly")} />
      </ListGroup>

      {/* Resources */}
      <SectionHeader title={t("Ressources", "Resources")} />
      <ListGroup>
        <ListRow href="/grammar" tone="gray" icon={<Icon name="grammar" size={20} />} title={t("Grammaire", "Grammar")} subtitle={t("Leçons avec frises et exercices", "Lessons with timelines and drills")} />
        <ListRow href="/courses" tone="gray" icon={<Icon name="sheet" size={20} />} title={t("Fiches de règles", "Rule sheets")} />
        <ListRow href="/basics" tone="gray" icon={<Icon name="layers" size={20} />} title={t("Les bases", "The basics")} subtitle={t("Nombres, heure, jours, émotions", "Numbers, time, days, emotions")} />
        <ListRow href="/verbs" tone="gray" icon={<Icon name="verbs" size={20} />} title={t("Verbes essentiels", "Core verbs")} />
        <ListRow href="/verbs/irregular" tone="gray" icon={<Icon name="bolt" size={20} />} title={t("Verbes irréguliers", "Irregular verbs")} />
        <ListRow href="/pronunciation" tone="gray" icon={<Icon name="mic" size={20} />} title={t("Prononciation", "Pronunciation")} />
      </ListGroup>
    </div>
  );
}
