"use client";
import Link from "next/link";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export default function MorePage() {
  const t = useT();
  const items: { href: string; icon: IconName; title: string }[] = [
    { href: "/session", icon: "session", title: t("Séance du jour", "Today's session") },
    { href: "/learn", icon: "sparkle", title: t("Nouveaux mots", "New words") },
    { href: "/themes", icon: "cards", title: t("Thèmes de vocabulaire", "Vocabulary themes") },
    { href: "/cards", icon: "cards", title: t("Mes flashcards", "My flashcards") },
    { href: "/cards/add", icon: "plus", title: t("Ajouter du vocabulaire", "Add vocabulary") },
    { href: "/around", icon: "sparkle", title: t("Autour de moi (nommer ce que je vois)", "Around me") },
    { href: "/translate", icon: "translate", title: t("Assistant de traduction", "Translation assistant") },
    { href: "/shop", icon: "sparkle", title: t("Boutique du touriste", "Tourist shop") },
    { href: "/stats", icon: "stats", title: t("Statistiques", "Statistics") },
    { href: "/tests", icon: "test", title: t("Tests de progression", "Progress tests") },
    { href: "/settings", icon: "settings", title: t("Réglages et données", "Settings & data") },
  ];
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Plus", "More")} />
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2">
              <Icon name={i.icon} size={20} className="text-ink-600 dark:text-ink-300" />
              <span className="flex-1">{i.title}</span>
              <span className="text-muted">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
