"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useT } from "@/hooks/useT";
import { useStatus } from "@/hooks/useStatus";
import { computeOverview } from "@/lib/progress";
import { FilterChips, LinkButton, ListGroup, ListRow, Panel, SectionHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

type Cat = "vocab" | "games" | "listen" | "speak" | "talk";

export default function PracticePage() {
  const t = useT();
  const status = useStatus();
  const o = useLiveQuery(() => computeOverview(), []);
  const [cat, setCat] = useState<Cat>("vocab");
  const due = o?.dueNow ?? 0;
  const aiNote = status && !status.ai ? t("Nécessite une clé API (non configurée)", "Requires an API key (not configured)") : undefined;

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

      <FilterChips<Cat>
        value={cat}
        onChange={setCat}
        options={[
          { value: "vocab", label: t("Vocabulaire", "Vocabulary") },
          { value: "games", label: t("Jeux", "Games") },
          { value: "listen", label: t("Écoute", "Listening") },
          { value: "speak", label: t("Prononciation", "Pronunciation") },
          { value: "talk", label: t("Conversation", "Conversation") },
        ]}
      />

      {cat === "vocab" && (
        <>
          <SectionHeader title={t("Vocabulaire", "Vocabulary")} />
          <ListGroup>
            <ListRow href="/review" icon={<Icon name="review" size={20} />} title={t("Réviser", "Review")} subtitle={due ? t(`${due} mots prêts`, `${due} words ready`) : t("Rien en attente", "Nothing due")} />
            <ListRow href="/learn" icon={<Icon name="sparkle" size={20} />} title={t("Nouveaux mots", "New words")} subtitle={t("70 % fréquents, 30 % tes centres d'intérêt", "70% frequent, 30% your interests")} />
            <ListRow href="/cards" icon={<Icon name="flashcards" size={20} />} title={t("Mes flashcards", "My flashcards")} subtitle={o ? t(`${o.totalCards} cartes`, `${o.totalCards} cards`) : undefined} />
            <ListRow href="/cards/add" icon={<Icon name="plus" size={20} />} title={t("Ajouter un mot", "Add a word")} subtitle={t("Mot, phrase ou capture d'écran", "Word, sentence or screenshot")} />
            <ListRow href="/themes" icon={<Icon name="layers" size={20} />} title={t("Thèmes", "Themes")} subtitle={t("Indispensables, quotidien, passions", "Essentials, everyday life, passions")} />
            <ListRow href="/around" icon={<Icon name="eye" size={20} />} title={t("Autour de moi", "Around me")} subtitle={t("Mets un mot anglais sur ce que tu vois", "Name what you see in English")} />
          </ListGroup>
        </>
      )}
      {cat === "games" && (
        <>
          <SectionHeader title={t("Jeux", "Games")} />
          <ListGroup>
            <ListRow href="/games" icon={<Icon name="game" size={20} />} title={t("Mini-jeux", "Mini-games")} subtitle={t("20 jeux sur tes mots les plus fragiles", "20 games on your weakest words")} />
          </ListGroup>
        </>
      )}
      {cat === "listen" && (
        <>
          <SectionHeader title={t("Écoute", "Listening")} />
          <ListGroup>
            <ListRow href="/listen" icon={<Icon name="headphones" size={20} />} title={t("Écoute", "Listening")} subtitle={t("Dialogues, dictées, accents", "Dialogues, dictation, accents")} />
          </ListGroup>
        </>
      )}
      {cat === "speak" && (
        <>
          <SectionHeader title={t("Prononciation", "Pronunciation")} />
          <ListGroup>
            <ListRow href="/pronunciation" icon={<Icon name="mic" size={20} />} title={t("Cours de prononciation", "Pronunciation course")} subtitle={t("Les pièges des francophones", "French speakers' traps")} />
          </ListGroup>
        </>
      )}
      {cat === "talk" && (
        <>
          <SectionHeader title={t("Conversation", "Conversation")} />
          <ListGroup>
            <ListRow href="/chat" icon={<Icon name="chat" size={20} />} title={t("Parler avec l'IA", "Talk with AI")} subtitle={aiNote ?? t("Jeux de rôle : restaurant, voyage, entretien…", "Role-plays: restaurant, travel, interview…")} />
            <ListRow href="/translate" icon={<Icon name="translate" size={20} />} title={t("Assistant de traduction", "Translation assistant")} subtitle={t("Comprendre un message et y répondre", "Understand a message and reply")} />
          </ListGroup>
        </>
      )}
    </div>
  );
}
