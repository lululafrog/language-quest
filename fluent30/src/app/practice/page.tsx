"use client";
import Link from "next/link";
import { useT } from "@/hooks/useT";
import { PageHeader } from "@/components/ui";

export default function PracticePage() {
  const t = useT();
  const items: { href: string; emoji: string; title: string; desc: string; tone: string; big?: boolean }[] = [
    { href: "/games", emoji: "🎮", title: t("Mini-jeux", "Mini-games"), desc: t("20 jeux sur tes mots les plus fragiles", "20 games on your weakest words"), tone: "from-ink-500 via-ink-600 to-ink-800", big: true },
    { href: "/chat", emoji: "💬", title: t("Parler avec l'IA", "Talk with AI"), desc: t("Restaurant, voyage, flirt… à l'écrit ou à l'oral", "Real-life role-plays"), tone: "from-coral-400 via-coral-500 to-coral-600", big: true },
    { href: "/themes", emoji: "🗂️", title: t("Thèmes de vocabulaire", "Vocabulary themes"), desc: t("Indispensables, quotidien, tes passions", "Essentials, everyday life, your passions"), tone: "from-[#fb923c] to-[#ea580c]", big: true },
    { href: "/around", emoji: "👀", title: t("Autour de moi", "Around me"), desc: t("Mets un mot anglais sur ce que tu vois", "Name what you see in English"), tone: "from-[#34d399] to-[#059669]", big: true },
    { href: "/pronunciation", emoji: "🗣️", title: t("Prononciation", "Pronunciation"), desc: t("Les pièges des francophones", "French speakers' traps"), tone: "from-mint-400 to-mint-600" },
    { href: "/verbs/irregular", emoji: "🔁", title: t("Verbes irréguliers", "Irregular verbs"), desc: "go – went – gone", tone: "from-sun-400 to-amber-500" },
    { href: "/verbs", emoji: "⚡", title: t("Verbes essentiels", "Core verbs"), desc: "get, take, make…", tone: "from-ink-400 to-ink-600" },
    { href: "/grammar", emoji: "✍️", title: t("Grammaire", "Grammar"), desc: t("Les temps, en visuel", "Tenses, visually"), tone: "from-[#8b5cf6] to-[#6d28d9]" },
    { href: "/listen", emoji: "🎧", title: t("Écoute", "Listening"), desc: t("Dialogues, dictées, accents", "Dialogues, dictation"), tone: "from-[#38bdf8] to-[#2563eb]" },
    { href: "/translate", emoji: "🌍", title: t("Traducteur", "Translator"), desc: t("Comprendre et répondre", "Understand & reply"), tone: "from-[#f472b6] to-[#db2777]" },
  ];
  return (
    <div>
      <PageHeader title={t("Pratiquer", "Practice")} subtitle={t("Choisis ton activité du moment", "Pick your activity")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-lg shadow-ink-900/10 transition hover:-translate-y-0.5 active:scale-[0.98] ${i.tone} ${i.big ? "col-span-2 min-h-36 sm:col-span-2" : "min-h-36"}`}
          >
            <span className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/15" />
            <span className={`relative ${i.big ? "text-5xl" : "text-4xl"} drop-shadow-sm transition group-hover:scale-110`}>{i.emoji}</span>
            <span className="relative mt-3">
              <span className="block text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{i.title}</span>
              <span className="mt-0.5 block text-sm text-white/85">{i.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
