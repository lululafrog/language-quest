"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useT } from "@/hooks/useT";
import { useStatus } from "@/hooks/useStatus";
import { computeOverview } from "@/lib/progress";
import { LinkButton, ListGroup, ListRow, Panel, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export default function PracticePage() {
  const t = useT();
  const status = useStatus();
  const o = useLiveQuery(() => computeOverview(), []);
  const due = o?.dueNow ?? 0;
  const aiNote = status && !status.ai ? t("Analyse IA : clé API non configurée sur le serveur", "AI analysis: API key not configured") : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-5">
        <h1 className="t-display">{t("Pratique", "Practice")}</h1>
        <p className="mt-1 text-sm text-muted">{t("70 % du temps : utiliser l'anglais, pas seulement l'apprendre.", "70% of the time: using English, not just studying it.")}</p>
      </header>

      <Panel tone="highlight" className="mb-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-600 text-white"><Icon name="review" size={24} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{due ? t(`${due} mots t'attendent`, `${due} words are waiting`) : t("Tu es à jour", "You're up to date")}</p>
            <p className="text-sm text-muted">{due ? t("La répétition espacée les ramène au bon moment.", "Spaced repetition brings them back at the right time.") : t("Apprends de nouveaux mots ou joue pour les ancrer.", "Learn new words or play to anchor them.")}</p>
          </div>
        </div>
        {due > 0 ? (
          <LinkButton href="/review" className="mt-4 w-full">{t(`Réviser ${due} mots`, `Review ${due} words`)}</LinkButton>
        ) : (
          <LinkButton href="/learn" className="mt-4 w-full">{t("Apprendre de nouveaux mots", "Learn new words")}</LinkButton>
        )}
      </Panel>

      <SectionHeader title={t("Flashcards", "Flashcards")} />
      <ListGroup>
        <ListRow href="/review" icon={<Icon name="review" size={20} />} title={t("Réviser", "Review")} subtitle={due ? t(`${due} mots prêts`, `${due} words ready`) : t("Rien en attente", "Nothing due")} />
        <ListRow href="/learn" icon={<Icon name="sparkle" size={20} />} title={t("Nouveaux mots", "New words")} subtitle={t("70 % fréquents, 30 % tes centres d'intérêt", "70% frequent, 30% your interests")} />
        <ListRow href="/cards" icon={<Icon name="flashcards" size={20} />} title={t("Mes cartes", "My cards")} subtitle={o ? t(`${o.totalCards} cartes`, `${o.totalCards} cards`) : undefined} />
        <ListRow href="/practice/mindmap" tone="mint" icon={<Icon name="layers" size={20} />} title={t("Carte mentale", "Mind map")} subtitle={t("Ton vocabulaire par univers, points forts et manques", "Your vocabulary by topic, strengths and gaps")} />
      </ListGroup>

      <SectionHeader title={t("Ta vraie vie", "Your real life")} subtitle={t("Tes contenus restent privés", "Your content stays private")} />
      <ListGroup>
        <ListRow href="/practice/real-life" tone="sun" icon={<Icon name="camera" size={20} />} title="My Real Life English" subtitle={aiNote ?? t("Capture, message, menu, phrase entendue → mini-leçon", "Screenshot, message, menu, phrase heard → mini-lesson")} />
        <ListRow href="/practice/memories" tone="sun" icon={<Icon name="heart" size={20} />} title="Memory Cards" subtitle={aiNote ?? t("Tes photos deviennent des flashcards", "Your photos become flashcards")} />
        <ListRow href="/practice/journal" tone="sun" icon={<Icon name="pen" size={20} />} title="My English Journey" subtitle={t("Ton journal : version corrigée et version naturelle", "Your journal: corrected and natural versions")} />
        <ListRow href="/around" tone="sun" icon={<Icon name="eye" size={20} />} title={t("Autour de moi", "Around me")} subtitle={t("Mets un mot anglais sur ce que tu vois", "Name what you see in English")} />
      </ListGroup>

      <SectionHeader title={t("Jouer et parler", "Play and talk")} />
      <ListGroup>
        <ListRow href="/games" tone="coral" icon={<Icon name="game" size={20} />} title={t("Jeux", "Games")} subtitle={t("Sur tes mots les plus fragiles, avec explications", "On your weakest words, with explanations")} />
        <ListRow href="/chat" tone="coral" icon={<Icon name="chat" size={20} />} title={t("Conversations IA", "AI conversations")} subtitle={aiNote ?? t("Auberge, restaurant, rendez-vous, entretien…", "Hostel, restaurant, date, interview…")} />
      </ListGroup>

      <details className="group mt-6">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl px-1 py-2 text-[15px] font-semibold text-fg/80 hover:text-fg">
          {t("Plus d'outils", "More tools")}
          <Icon name="chevron" size={18} className="text-muted transition group-open:rotate-90" />
        </summary>
        <ListGroup className="mt-2">
          <ListRow href="/listen" icon={<Icon name="headphones" size={20} />} title={t("Écoute", "Listening")} subtitle={t("Dialogues, dictées, accents", "Dialogues, dictation, accents")} />
          <ListRow href="/pronunciation" icon={<Icon name="mic" size={20} />} title={t("Prononciation", "Pronunciation")} subtitle={t("Les pièges des francophones", "French speakers' traps")} />
          <ListRow href="/translate" icon={<Icon name="translate" size={20} />} title={t("Traducteur", "Translator")} subtitle={t("Comprendre un message et y répondre", "Understand a message and reply")} />
          <ListRow href="/cards/add" icon={<Icon name="plus" size={20} />} title={t("Ajouter un mot", "Add a word")} subtitle={t("Mot, phrase ou capture d'écran", "Word, sentence or screenshot")} />
          <ListRow href="/themes" icon={<Icon name="globe" size={20} />} title={t("Thèmes de vocabulaire", "Vocabulary themes")} subtitle={t("Indispensables, quotidien, passions", "Essentials, everyday life, passions")} />
        </ListGroup>
      </details>
    </div>
  );
}
