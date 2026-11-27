"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/hooks/useT";
import { computeOverview } from "@/lib/progress";
import { getGame, levelFromXp, levelTitle } from "@/lib/game";
import { Tourist } from "@/components/avatar/Tourist";
import { CoinIcon } from "@/components/game/Coin";
import { QuestList } from "@/components/game/QuestList";
import { GoalsCard } from "@/components/game/GoalsCard";
import { ListGroup, ListRow, Metric, Panel, ProgressBar, SectionHeader, Segmented } from "@/components/ui";
import { saveSettings } from "@/lib/db";
import { Icon } from "@/components/icons";
import { PassportProgress } from "@/components/passport/PassportProgress";

export default function ProfileHub() {
  const t = useT();
  const s = useSettings();
  const o = useLiveQuery(() => computeOverview(), []);
  const game = useLiveQuery(() => getGame(), []);

  if (!o || !game) return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-surface-2" />;
  const lv = levelFromXp(o.days.reduce((a, d) => a + (d.xp ?? 0), 0));

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="t-display">{t("Mon univers", "My world")}</h1>
        <p className="mt-1 text-sm text-muted">Your life. Your English. Your adventure.</p>
      </header>

      <Panel className="flex items-center gap-4">
        <Link href="/shop" className="w-24 shrink-0 overflow-hidden rounded-2xl bg-sun-100 dark:bg-ink-900/60 sm:w-28" aria-label={t("Habiller mon voyageur", "Dress my traveller")}>
          <Tourist equipped={game.equipped} appearance={game.appearance} animate={!s.reduceMotion} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{s.displayName || t("Mon voyageur", "My traveller")}</p>
          <p className="text-sm text-muted">{t("Niveau", "Level")} {lv.level} · {levelTitle(lv.level)}</p>
          <ProgressBar value={lv.current} max={lv.needed} tone="sun" className="mt-2" />
          <p className="mt-1 text-xs text-muted">{lv.current} / {lv.needed} XP</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric value={<span className="inline-flex items-center gap-1"><CoinIcon size={16} />{game.coins}</span>} label={t("pièces", "coins")} />
            <Metric value={<span className="inline-flex items-center gap-1"><Icon name="flame" size={16} className="text-coral-500" />{o.streak}</span>} label={t("jours", "days")} />
            <Metric value={o.memorized} label={t("mots ancrés", "words")} />
          </div>
        </div>
      </Panel>

      <SectionHeader title={t("Mon voyage", "My journey")} />
      <ListGroup>
        <ListRow href="/world" tone="mint" icon={<Icon name="map" size={20} />} title={t("Carte du monde", "World map")} subtitle={t("Destinations, lieux et missions en anglais", "Destinations, places and missions in English")} />
      </ListGroup>
      <PassportProgress className="mt-3" />

      <SectionHeader title={t("Mon voyageur", "My traveller")} />
      <ListGroup>
        <ListRow href="/shop" tone="coral" icon={<Icon name="shirt" size={20} />} title={t("Dressing", "Wardrobe")} subtitle={t("Tenues, collections et accessoires gagnés", "Outfits, collections and earned accessories")} />
      </ListGroup>

      <SectionHeader title={t("Mes souvenirs", "My memories")} />
      <ListGroup>
        <ListRow href="/practice/memories" tone="sun" icon={<Icon name="heart" size={20} />} title={t("Album de souvenirs", "Memory album")} subtitle={t("Tes photos devenues vocabulaire", "Your photos turned into vocabulary")} />
        <ListRow href="/collection" tone="sun" icon={<Icon name="book" size={20} />} title={t("Ma bibliothèque", "My bookshelf")} subtitle={t("Livres terminés et cartes de lecture", "Finished books and reading cards")} />
        <ListRow href="/achievements" tone="sun" icon={<Icon name="trophy" size={20} />} title={t("Trophées & objectifs", "Trophies & goals")} subtitle={t("Vitrine à trophées, objectifs de la semaine", "Trophy case, weekly goals")} />
      </ListGroup>

      <SectionHeader title={t("Défis du jour", "Today's challenges")} />
      <QuestList />

      <SectionHeader title={t("Objectifs", "Goals")} />
      <GoalsCard compact />

      <SectionHeader title={t("Progression", "Progress")} />
      <ListGroup>
        <ListRow href="/stats" icon={<Icon name="chart" size={20} />} title={t("Statistiques", "Statistics")} subtitle={t("Vocabulaire, compétences, erreurs, niveau estimé", "Vocabulary, skills, mistakes, estimated level")} />
        <ListRow href="/tests" icon={<Icon name="test" size={20} />} title={t("Évaluations", "Assessments")} subtitle={t("Placement, hebdomadaire, mensuel, CECRL", "Placement, weekly, monthly, CEFR")} />
      </ListGroup>

      <SectionHeader title={t("Paramètres", "Settings")} />
      <Panel tone="subtle" className="mb-3">
        <p className="text-sm font-semibold">{t("Taille du texte", "Text size")}</p>
        <Segmented<number>
          className="mt-2 flex w-full [&>button]:flex-1"
          value={s.textScale ?? 1}
          onChange={(v) => void saveSettings({ textScale: v })}
          options={[
            { value: 0.9, label: <span className="text-[13px]">A</span> },
            { value: 1, label: <span className="text-[15px]">A</span> },
            { value: 1.15, label: <span className="text-[17px]">A</span> },
            { value: 1.3, label: <span className="text-[19px] font-semibold">A</span> },
          ]}
        />
      </Panel>
      <ListGroup>
        <ListRow href="/settings" tone="gray" icon={<Icon name="settings" size={20} />} title={t("Paramètres", "Settings")} subtitle={t("Rythme, voix, thème, animations, données, compte", "Pace, voice, theme, animations, data, account")} />
        <ListRow href="/onboarding" tone="gray" icon={<Icon name="target" size={20} />} title={t("Refaire la personnalisation", "Redo personalisation")} subtitle={t("Niveau, objectifs, centres d'intérêt", "Level, goals, interests")} />
      </ListGroup>
    </div>
  );
}
