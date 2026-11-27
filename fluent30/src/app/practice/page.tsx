"use client";
import Link from "next/link";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export default function PracticePage() {
  const t = useT();
  const items: { href: string; icon: IconName; title: string; desc: string; tone: string }[] = [
    { href: "/games", icon: "play", title: t("Mini-jeux", "Mini-games"), desc: t("20 jeux qui ciblent tes mots les plus fragiles", "20 games targeting your weakest words"), tone: "from-ink-500 to-ink-700" },
    { href: "/chat", icon: "chat", title: t("Conversation IA", "AI conversation"), desc: t("Scénarios réels, à l'écrit ou à l'oral", "Real-life scenarios, written or spoken"), tone: "from-coral-500 to-coral-600" },
    { href: "/verbs", icon: "verbs", title: t("Verbes essentiels", "Core verbs"), desc: t("get, take, make, have… et leurs expressions", "get, take, make, have… and their chunks"), tone: "from-sun-500 to-amber-600" },
    { href: "/grammar", icon: "grammar", title: t("Grammaire", "Grammar"), desc: t("Les temps et structures utiles à l'oral", "Tenses and structures for speaking"), tone: "from-mint-500 to-mint-600" },
    { href: "/listen", icon: "ear", title: t("Écoute & prononciation", "Listening & speaking"), desc: t("Dialogues, dictées, shadowing, accents", "Dialogues, dictation, shadowing, accents"), tone: "from-ink-400 to-coral-500" },
    { href: "/translate", icon: "translate", title: t("Assistant de traduction", "Translation assistant"), desc: t("Comprendre un message et bien y répondre", "Understand a message and reply well"), tone: "from-ink-700 to-ink-900" },
  ];
  return (
    <div>
      <PageHeader title={t("Pratiquer", "Practice")} subtitle={t("Choisis une activité", "Pick an activity")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-ink-300">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${i.tone}`}><Icon name={i.icon} size={24} /></span>
            <span className="min-w-0"><span className="block font-semibold">{i.title}</span><span className="block text-sm text-muted">{i.desc}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
