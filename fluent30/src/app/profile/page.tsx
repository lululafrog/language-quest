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
import { ListGroup, ListRow, Metric, Panel, ProgressBar, SectionHeader } from "@/components/ui";
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
      <h1 className="t-display mb-5">{t("Profil", "Profile")}</h1>

      <Panel className="flex items-center gap-4">
        <Link href="/shop" className="w-24 shrink-0 overflow-hidden rounded-2xl bg-ink-50 dark:bg-ink-900/60 sm:w-28" aria-label={t("Habiller mon voyageur", "Dress my traveller")}>
          <Tourist equipped={game.equipped} appearance={game.appearance} animate={!s.reduceMotion} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>{s.displayName || t("Mon voyageur", "My traveller")}</p>
          <p className="text-sm text-muted">{t("Niveau", "Level")} {lv.level} · {levelTitle(lv.level)}</p>
          <ProgressBar value={lv.current} max={lv.needed} tone="sun" className="mt-2" />
          <p className="mt-1 text-xs text-muted">{lv.current} / {lv.needed} XP</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric value={<span className="inline-flex items-center gap-1"><CoinIcon size={16} />{game.coins}</span>} label={t("pièces", "coins")} />
            <Metric value={<span className="inline-flex items-center gap-1"><Icon name="flame" size={16} className="text-coral-500" />{o.streak}</span>} label={t("jours de suite", "day streak")} />
            <Metric value={o.memorized} label={t("mots ancrés", "words anchored")} />
          </div>
        </div>
      </Panel>

      <PassportProgress className="mt-4" />

      <SectionHeader title={t("Mon voyageur", "My traveller")} />
      <ListGroup>
        <ListRow href="/shop" tone="coral" icon={<Icon name="shirt" size={20} />} title={t("Dressing", "Wardrobe")} subtitle={t("Vêtements et accessoires à gagner", "Clothes and accessories to earn")} />
        <ListRow href="/profile/passport" tone="sun" icon={<Icon name="passport" size={20} />} title={t("Mon passeport", "My passport")} subtitle={t("Tampons, destinations et souvenirs", "Stamps, destinations and souvenirs")} />
        <ListRow href="/achievements" tone="sun" icon={<Icon name="trophy" size={20} />} title={t("Trophées & objectifs", "Trophies & goals")} subtitle={t("Vitrine à trophées, objectifs de la semaine", "Trophy case, weekly goals")} />
        <ListRow href="/collection" tone="sun" icon={<Icon name="book" size={20} />} title={t("Ma collection de livres", "My book collection")} subtitle={t("Étagères et cartes de lecture", "Shelves and reading cards")} />
      </ListGroup>

      <SectionHeader title={t("Défis du jour", "Today's challenges")} />
      <QuestList />

      <SectionHeader title={t("Objectifs", "Goals")} />
      <GoalsCard compact />

      <SectionHeader title={t("Progression", "Progress")} />
      <ListGroup>
        <ListRow href="/stats" icon={<Icon name="chart" size={20} />} title={t("Statistiques", "Statistics")} subtitle={t("Vocabulaire, compétences, erreurs, niveau estimé", "Vocabulary, skills, mistakes, estimated level")} />
        <ListRow href="/tests" icon={<Icon name="test" size={20} />} title={t("Tests", "Tests")} subtitle={t("Placement, hebdomadaire, mensuel, CECRL", "Placement, weekly, monthly, CEFR")} />
      </ListGroup>

      <SectionHeader title={t("Compte", "Account")} />
      <ListGroup>
        <ListRow href="/settings" tone="gray" icon={<Icon name="settings" size={20} />} title={t("Paramètres", "Settings")} subtitle={t("Rythme, voix, thème, données, compte", "Pace, voice, theme, data, account")} />
        <ListRow href="/onboarding" tone="gray" icon={<Icon name="target" size={20} />} title={t("Refaire la personnalisation", "Redo personalisation")} subtitle={t("Niveau, objectifs, centres d'intérêt", "Level, goals, interests")} />
      </ListGroup>
    </div>
  );
}
