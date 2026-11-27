"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/db";
import { THEMES } from "@/lib/data/types";
import { useSettings } from "@/hooks/useSettings";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";
import { Logo } from "@/components/AppShell";
import type { Settings } from "@/lib/types";

const GOALS = [
  { id: "travel", label: "Voyager sans stress", emoji: "🧳" },
  { id: "conversation", label: "Tenir une vraie conversation", emoji: "💬" },
  { id: "work", label: "Anglais professionnel", emoji: "💼" },
  { id: "dating", label: "Rencontres", emoji: "💘" },
  { id: "reading", label: "Lire en version originale", emoji: "📚" },
  { id: "series", label: "Films et séries sans sous-titres", emoji: "🎬" },
  { id: "exam", label: "Préparer un examen", emoji: "🎓" },
];

export default function Onboarding() {
  const router = useRouter();
  const s = useSettings();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<Settings["sessionMinutes"]>(15);
  const [daily, setDaily] = useState(10);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const finish = async (placement: boolean) => {
    await saveSettings({ displayName: name.trim() || s.displayName, goals, interests, sessionMinutes: minutes, dailyNewWords: daily, onboarded: true });
    router.push(placement ? "/tests/placement" : "/learn");
  };

  const steps = [
    <div key="0" className="text-center">
      <div className="mx-auto mb-4 w-fit"><Logo size={64} /></div>
      <h1 className="text-2xl font-semibold">Bienvenue sur Fluent30</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">Ici, pas de cours scolaire : on apprend d&apos;abord l&apos;anglais le plus utile dans les vraies conversations (70 %), puis ce qui compte pour toi (30 %). Mémoire visuelle, répétition espacée, lecture et pratique quotidienne.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom (facultatif)" className="mx-auto mt-6 block w-full max-w-xs rounded-xl border border-line bg-surface px-4 py-3 text-center outline-none focus:border-ink-400" />
    </div>,
    <div key="1">
      <h2 className="text-xl font-semibold">Pourquoi apprends-tu l&apos;anglais ?</h2>
      <p className="mb-4 text-sm text-muted">Plusieurs choix possibles.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {GOALS.map((g) => (
          <button key={g.id} onClick={() => toggle(goals, setGoals, g.id)} className={cx("flex items-center gap-3 rounded-xl border p-3 text-left transition", goals.includes(g.id) ? "border-ink-500 bg-ink-50 dark:bg-ink-900/50" : "border-line bg-surface")}>
            <span className="text-2xl">{g.emoji}</span>{g.label}
          </button>
        ))}
      </div>
    </div>,
    <div key="2">
      <h2 className="text-xl font-semibold">Tes centres d&apos;intérêt</h2>
      <p className="mb-4 text-sm text-muted">Ils personnalisent 30 % du vocabulaire, les histoires et les conversations.</p>
      <div className="flex flex-wrap gap-2">
        {THEMES.filter((t) => !["grammar-words", "adjectives", "action-verbs", "phrasal-verbs", "idioms", "time"].includes(t.id)).map((t) => (
          <button key={t.id} onClick={() => toggle(interests, setInterests, t.id)} className={cx("rounded-full border px-3 py-2 text-sm transition", interests.includes(t.id) ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{t.emoji} {t.fr}</button>
        ))}
      </div>
    </div>,
    <div key="3">
      <h2 className="text-xl font-semibold">Ton rythme</h2>
      <p className="mb-4 text-sm text-muted">Mieux vaut un peu chaque jour que beaucoup une fois par semaine.</p>
      <p className="mb-2 text-sm font-medium">Séance quotidienne</p>
      <div className="grid grid-cols-5 gap-2">
        {([5, 10, 15, 30, 60] as const).map((m) => (
          <button key={m} onClick={() => setMinutes(m)} className={cx("rounded-xl border py-3 font-medium", minutes === m ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{m}′</button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-sm font-medium">Nouveaux mots par jour : <span className="tabular-nums">{daily}</span></p>
      <input type="range" min={3} max={30} value={daily} onChange={(e) => setDaily(Number(e.target.value))} className="w-full accent-ink-600" />
      <p className="text-xs text-muted">Recommandé : 10. Tu pourras toujours en apprendre plus.</p>
    </div>,
    <div key="4" className="text-center">
      <div className="text-5xl">🎯</div>
      <h2 className="mt-3 text-xl font-semibold">Un test de niveau ?</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">5 minutes pour repérer les mots que tu connais déjà, afin de ne pas perdre de temps à les réapprendre. C&apos;est facultatif.</p>
    </div>,
  ];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
      <ProgressBar value={step + 1} max={steps.length} className="mb-6" />
      <Panel className="animate-slide-up" key={step}>{steps[step]}</Panel>
      <div className="mt-4 flex justify-between gap-2">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>Retour</Button> : <span />}
        {step < steps.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>Continuer</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => finish(false)}>Plus tard</Button>
            <Button onClick={() => finish(true)}>Faire le test</Button>
          </div>
        )}
      </div>
    </div>
  );
}
