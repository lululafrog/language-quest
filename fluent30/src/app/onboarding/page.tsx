"use client";
// Onboarding v2: 7 short, skippable steps → name, quick adaptive level check, goals,
// daily time & words, interests, avatar, then a "Ton parcours" summary.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings, saveSettings } from "@/lib/db";
import { THEMES } from "@/lib/data/types";
import { GRAMMAR_ITEMS, type McqItem } from "@/lib/data/test-bank";
import { LEVEL_INFO, PATH, type CefrLevel } from "@/lib/curriculum";
import { Button, Panel, ProgressBar, cx } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { Logo } from "@/components/AppShell";
import type { Appearance, Settings } from "@/lib/types";
import { DEFAULT_APPEARANCE, Tourist } from "@/components/avatar/Tourist";
import { AppearanceEditor } from "@/components/avatar/AppearanceEditor";
import { getGame, saveAppearance } from "@/lib/game";
import { WORLD } from "@/lib/data/world";
import { DESTINATIONS } from "@/lib/data/destinations";
import { CEFR_LEVELS } from "@/lib/curriculum/types";
import { Stamp } from "@/components/passport/Stamp";
import { DestinationScene } from "@/components/world/art";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
const STEP_NAMES = ["Bienvenue", "Niveau", "Objectifs", "Rythme", "Intérêts", "Personnage", "Destination", "Passeport", "Parcours"];

const GOALS: { id: string; label: string; icon: IconName }[] = [
  { id: "travel", label: "Voyager sans stress", icon: "globe" },
  { id: "conversation", label: "Tenir une vraie conversation", icon: "chat" },
  { id: "work", label: "Anglais professionnel", icon: "target" },
  { id: "dating", label: "Rencontres", icon: "heart" },
  { id: "reading", label: "Lire en version originale", icon: "book" },
  { id: "series", label: "Films et séries sans sous-titres", icon: "play" },
  { id: "exam", label: "Préparer un examen", icon: "test" },
];

const TIMES: { m: Settings["sessionMinutes"]; label: string }[] = [
  { m: 5, label: "Express" },
  { m: 10, label: "Léger" },
  { m: 15, label: "Régulier" },
  { m: 20, label: "Motivé" },
  { m: 30, label: "Intensif" },
];

const PLAN_PREVIEW: Record<number, string> = {
  5: "2 min de révision · 3 min de cours",
  10: "3 min de révision · 5 min de cours · 2 min de pratique",
  15: "3 min de révision · 5 min de cours · 4 min de pratique ciblée · 3 min de lecture ou d'écoute",
  20: "4 min de révision · 3 min de nouveaux mots · 6 min de cours · 4 min de pratique · 3 min de lecture",
  30: "révision, nouveaux mots, cours, pratique, lecture et conversation",
};

const QUIZ_LEN = 8;

// Adaptive staircase: start at A2, go up after a right answer, down after a wrong one.
function pickItem(level: number, used: Set<string>): McqItem | undefined {
  for (const d of [0, -1, 1, -2, 2]) {
    const lv = LEVELS[Math.min(4, Math.max(0, level + d))];
    const pool = GRAMMAR_ITEMS.filter((it) => it.level === lv && !used.has(it.id));
    if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  return undefined;
}

function estimate(answers: { level: CefrLevel; ok: boolean }[]): CefrLevel {
  let best = 0;
  LEVELS.forEach((lv, i) => {
    const at = answers.filter((a) => a.level === lv);
    const ok = at.filter((a) => a.ok).length;
    if (ok > 0 && ok / at.length >= 0.5) best = i;
  });
  return LEVELS[best];
}

function LevelCheck({ onDone }: { onDone: (lv: CefrLevel) => void }) {
  const [level, setLevel] = useState(1);
  const [used] = useState(() => new Set<string>());
  const [answers, setAnswers] = useState<{ level: CefrLevel; ok: boolean }[]>([]);
  const [item, setItem] = useState<McqItem | undefined>(() => pickItem(1, used));
  const [picked, setPicked] = useState<number | null>(null);

  if (!item) return null;
  const answer = (i: number | -1) => {
    if (picked !== null) return;
    setPicked(i);
    used.add(item.id);
    const ok = i === item.answer;
    const next = [...answers, { level: item.level, ok }];
    setAnswers(next);
    setTimeout(() => {
      if (next.length >= QUIZ_LEN) return onDone(estimate(next));
      const nl = Math.min(4, Math.max(0, LEVELS.indexOf(item.level) + (ok ? 1 : -1)));
      setLevel(nl);
      setItem(pickItem(nl, used));
      setPicked(null);
    }, ok ? 650 : 1600);
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>
          Question {answers.length + (picked === null ? 1 : 0)}/{QUIZ_LEN}
        </span>
        <span>Niveau testé : {LEVELS[level]}</span>
      </div>
      <p className="mb-4 text-lg font-medium">{item.prompt.replace("___", "_____")}</p>
      <div className="grid gap-2">
        {item.options.map((o, i) => (
          <button
            key={o}
            onClick={() => answer(i)}
            className={cx(
              "rounded-xl border px-4 py-3 text-left transition",
              picked === null && "border-line bg-surface hover:border-ink-300",
              picked !== null && i === item.answer && "border-mint-500 bg-mint-100/70 dark:bg-mint-600/15",
              picked !== null && picked === i && i !== item.answer && "border-coral-500 bg-coral-100/70 dark:bg-coral-600/15",
              picked !== null && picked !== i && i !== item.answer && "border-line opacity-60",
            )}
          >
            {o}
          </button>
        ))}
        <button onClick={() => answer(-1)} className="py-2 text-sm text-muted hover:underline" disabled={picked !== null}>
          Je ne sais pas
        </button>
      </div>
      {picked !== null && picked !== item.answer && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">{item.explanation}</p>}
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [levelMode, setLevelMode] = useState<"ask" | "quiz" | "choose" | "result">("ask");
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [minutes, setMinutes] = useState<Settings["sessionMinutes"]>(15);
  const [daily, setDaily] = useState(10);
  const [look, setLook] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [saving, setSaving] = useState(false);
  const [home, setHome] = useState("london");
  const loaded = useRef(false);

  // Coming back to the onboarding keeps what was already chosen (existing data preserved).
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    void Promise.all([getSettings(), getGame()]).then(([s, g]) => {
      if (s.displayName) setName(s.displayName);
      if (s.pathLevel) setLevel(s.pathLevel);
      if (s.goals?.length) setGoals(s.goals);
      if (s.interests?.length) setInterests(s.interests);
      if (s.sessionMinutes) setMinutes(s.sessionMinutes);
      if (s.dailyNewWords) setDaily(s.dailyNewWords);
      if (g.appearance) setLook(g.appearance);
      if (s.homeDestination) setHome(s.homeDestination);
    });
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const lv = level ?? "A1";
  const firstLesson = useMemo(() => PATH.find((l) => l.level === lv), [lv]);

  // First destination: London is always open; others once the chosen level reaches theirs.
  const openDests = WORLD.filter((d) => d.id === "london" || CEFR_LEVELS.indexOf(lv) >= CEFR_LEVELS.indexOf(d.level));
  const homeDest = openDests.find((d) => d.id === home) ?? WORLD[0];
  const homeStamp = DESTINATIONS.find((d) => d.id === homeDest.id);
  const firstMission = homeDest.missions[0];

  const finish = async (to: "home" | "lesson" | "cefr" | "mission") => {
    setSaving(true);
    await saveAppearance(look);
    await saveSettings({ displayName: name.trim() || undefined, pathLevel: lv, goals, interests, sessionMinutes: minutes, dailyNewWords: daily, homeDestination: homeDest.id, onboarded: true });
    router.push(
      to === "mission" ? `/world/mission/${firstMission.id}` : to === "lesson" && firstLesson ? `/cours/${firstLesson.id}` : to === "cefr" ? "/tests/cefr" : "/",
    );
  };

  const chip = (active: boolean) => cx("rounded-xl border px-3 py-2.5 text-sm transition", active ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface hover:border-ink-300");

  const screens = [
    // 1. Welcome + name
    <div key="welcome" className="text-center">
      <div className="mx-auto mb-4 w-fit">
        <Logo size={56} />
      </div>
      <h1 className="font-display text-2xl font-semibold">Bienvenue sur Fluent30</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">Un vrai parcours d&apos;anglais, du niveau A1 au C1, pensé pour les francophones : des cours courts, beaucoup de pratique, et un programme du jour adapté à ton temps.</p>
      <label className="mx-auto mt-6 block max-w-xs text-left text-sm font-medium">
        Comment t&apos;appelles-tu ?
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom (facultatif)" className="mt-1 block w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-ink-400" />
      </label>
    </div>,

    // 2. Level
    <div key="level">
      <h2 className="text-xl font-semibold">Ton niveau d&apos;anglais</h2>
      {levelMode === "ask" && (
        <>
          <p className="mb-4 text-sm text-muted">Un mini-test de 8 questions qui s&apos;adapte à tes réponses (2 minutes). Il sert seulement à choisir ton point de départ : tu pourras changer à tout moment.</p>
          <div className="grid gap-2">
            <Button onClick={() => setLevelMode("quiz")}>Faire le mini-test</Button>
            <Button variant="outline" onClick={() => setLevelMode("choose")}>
              Je préfère choisir mon niveau
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setLevel("A1");
                setStep(2);
              }}
            >
              Je débute complètement
            </Button>
          </div>
          {level && <p className="mt-3 text-center text-sm text-muted">Niveau actuel enregistré : {level}</p>}
        </>
      )}
      {levelMode === "quiz" && (
        <div className="mt-3">
          <LevelCheck
            onDone={(l) => {
              setLevel(l);
              setLevelMode("result");
            }}
          />
        </div>
      )}
      {levelMode === "result" && level && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted">Point de départ conseillé</p>
          <p className="font-display text-5xl font-semibold text-ink-600">{level}</p>
          <p className="mt-1 font-medium">{LEVEL_INFO[level].title}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{LEVEL_INFO[level].promise}</p>
          <p className="mt-4 text-xs text-muted">
            Estimation rapide basée sur la grammaire. Pour une évaluation complète (vocabulaire, lecture, écoute) :{" "}
            <Link href="/tests/cefr" className="underline">
              test CECRL complet
            </Link>
            .
          </p>
          <button onClick={() => setLevelMode("choose")} className="mt-2 text-sm text-ink-600 underline">
            Ajuster moi-même
          </button>
        </div>
      )}
      {levelMode === "choose" && (
        <div className="mt-3 grid gap-2">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => setLevel(l)} className={cx("flex items-center gap-3 rounded-xl border p-3 text-left transition", level === l ? "border-ink-500 bg-ink-50 dark:bg-ink-900/40" : "border-line bg-surface")}>
              <span className="w-10 font-display text-lg font-semibold text-ink-600">{l}</span>
              <span className="min-w-0">
                <span className="block font-medium">{LEVEL_INFO[l].title}</span>
                <span className="block text-xs text-muted">{LEVEL_INFO[l].promise}</span>
              </span>
            </button>
          ))}
          <p className="text-center text-xs text-muted">
            Pas sûr ?{" "}
            <button onClick={() => setLevelMode("quiz")} className="underline">
              Faire le mini-test
            </button>{" "}
            ou le{" "}
            <Link href="/tests/cefr" className="underline">
              test complet
            </Link>
            .
          </p>
        </div>
      )}
    </div>,

    // 3. Goals
    <div key="goals">
      <h2 className="text-xl font-semibold">Pourquoi apprends-tu l&apos;anglais ?</h2>
      <p className="mb-4 text-sm text-muted">Plusieurs choix possibles : tes modules de la vie réelle et tes exemples s&apos;adapteront.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {GOALS.map((g) => (
          <button key={g.id} onClick={() => toggle(goals, setGoals, g.id)} className={cx("flex items-center gap-3 rounded-xl border p-3 text-left transition", goals.includes(g.id) ? "border-ink-500 bg-ink-50 dark:bg-ink-900/40" : "border-line bg-surface")}>
            <Icon name={g.icon} size={20} className={goals.includes(g.id) ? "text-ink-600" : "text-muted"} />
            {g.label}
          </button>
        ))}
      </div>
    </div>,

    // 4. Time & words per day
    <div key="time">
      <h2 className="text-xl font-semibold">Ton rythme</h2>
      <p className="mb-4 text-sm text-muted">Un peu chaque jour vaut mieux que beaucoup une fois par semaine.</p>
      <p className="mb-2 text-sm font-medium">Temps par jour</p>
      <div className="grid grid-cols-5 gap-2">
        {TIMES.map((t) => (
          <button key={t.m} onClick={() => setMinutes(t.m)} className={cx(chip(minutes === t.m), "flex flex-col items-center py-3")}>
            <span className="font-semibold tabular-nums">{t.m} min</span>
            <span className={cx("text-[10px]", minutes === t.m ? "text-white/80" : "text-muted")}>{t.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Chaque jour : {PLAN_PREVIEW[minutes] ?? PLAN_PREVIEW[30]}.</p>
      <p className="mb-2 mt-5 text-sm font-medium">Nouveaux mots par jour</p>
      <div className="grid grid-cols-4 gap-2">
        {[5, 10, 15, 20].map((n) => (
          <button key={n} onClick={() => setDaily(n)} className={chip(daily === n)}>
            <span className="tabular-nums">{n}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">Recommandé : 10. Tu pourras toujours en apprendre davantage.</p>
    </div>,

    // 5. Interests
    <div key="interests">
      <h2 className="text-xl font-semibold">Tes centres d&apos;intérêt</h2>
      <p className="mb-4 text-sm text-muted">Les thèmes indispensables (se présenter, demander son chemin, hôtel, urgences…) sont déjà prioritaires. Tes passions passent juste après.</p>
      <div className="flex flex-wrap gap-2">
        {THEMES.filter((t) => t.priority === 2 || t.priority === 3).map((t) => (
          <button key={t.id} onClick={() => toggle(interests, setInterests, t.id)} className={cx(chip(interests.includes(t.id)), "rounded-full")}>
            {t.fr}
          </button>
        ))}
      </div>
    </div>,

    // 6. Avatar
    <div key="avatar">
      <h2 className="text-xl font-semibold">Ton personnage</h2>
      <p className="mb-4 text-sm text-muted">Ton compagnon de voyage : il collectionne les tampons de ton passeport et s&apos;habille avec les pièces gagnées.</p>
      <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
        <div className="mx-auto w-36 overflow-hidden rounded-3xl border border-line sm:w-full">
          <Tourist appearance={look} />
        </div>
        <AppearanceEditor value={look} onChange={setLook} />
      </div>
    </div>,

    // 7. First destination
    <div key="destination">
      <h2 className="text-xl font-semibold">Ta première destination</h2>
      <p className="mb-4 text-sm text-muted">Chaque ville est une série de missions d&apos;anglais concrètes. Les autres s&apos;ouvriront quand tu auras les compétences.</p>
      <div className="grid gap-2">
        {openDests.map((d) => (
          <button key={d.id} type="button" onClick={() => setHome(d.id)} className={cx("grid grid-cols-[112px_1fr] items-center overflow-hidden rounded-2xl border text-left transition", homeDest.id === d.id ? "border-ink-500 ring-2 ring-ink-200 dark:ring-ink-800" : "border-line hover:border-ink-300")}>
            <DestinationScene dest={d} />
            <span className="block p-3">
              <span className="block font-semibold">{d.nameFr} <span className="text-xs font-normal text-muted">· {d.level} · {d.accentLabel}</span></span>
              <span className="block text-sm text-muted">{d.tagline}</span>
            </span>
          </button>
        ))}
      </div>
    </div>,

    // 8. Passport handover
    <div key="passport" className="text-center">
      <h2 className="text-xl font-semibold">Voici ton passeport</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Il se remplit de tampons à chaque vraie progression : missions, cours, livres, régularité. Un jour manqué n&apos;efface jamais rien.</p>
      <div className="mx-auto mt-5 w-fit rounded-3xl border border-line bg-surface-2 px-8 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Passport · Passeport</p>
        <p className="mt-1 font-display text-lg font-semibold">{name.trim() || "Voyageur"}</p>
        <div className="mx-auto mt-3 w-28 overflow-hidden rounded-2xl border border-line bg-surface">
          <Tourist appearance={look} />
        </div>
        {homeStamp && (
          <div className="mt-4">
            <Stamp dest={homeStamp} locked size={84} className="mx-auto" />
            <p className="mt-1 text-xs text-muted">Premier tampon à gagner : {homeDest.nameFr}</p>
          </div>
        )}
      </div>
    </div>,

    // 9. Summary
    <div key="summary">
      <h2 className="text-xl font-semibold">{name.trim() ? `${name.trim()}, voici ton parcours` : "Ton parcours"}</h2>
      <ol className="mt-4 space-y-3">
        <li className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-600 text-sm font-semibold text-white">{lv}</span>
          <div className="min-w-0">
            <p className="font-medium">{LEVEL_INFO[lv].title}</p>
            <p className="text-sm text-muted">{LEVEL_INFO[lv].promise}</p>
            {firstLesson && <p className="mt-0.5 text-sm">Premier cours : {firstLesson.title}</p>}
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
            <Icon name="clock" size={18} />
          </span>
          <div>
            <p className="font-medium">{minutes} minutes par jour</p>
            <p className="text-sm text-muted">{PLAN_PREVIEW[minutes] ?? PLAN_PREVIEW[30]}</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
            <Icon name="cards" size={18} />
          </span>
          <div>
            <p className="font-medium">{daily} nouveaux mots par jour</p>
            <p className="text-sm text-muted">Révisés au bon moment grâce à la répétition espacée.</p>
          </div>
        </li>
        {goals.length > 0 && (
          <li className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
              <Icon name="target" size={18} />
            </span>
            <div>
              <p className="font-medium">Objectifs</p>
              <p className="text-sm text-muted">{goals.map((g) => GOALS.find((x) => x.id === g)?.label).filter(Boolean).join(" · ")}</p>
            </div>
          </li>
        )}
        <li className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2">
            <Icon name="passport" size={18} />
          </span>
          <div>
            <p className="font-medium">Ton passeport</p>
            <p className="text-sm text-muted">Destination de départ : {homeDest.nameFr}. Première mission : {firstMission.title}.</p>
          </div>
        </li>
      </ol>
      <div className="mt-6 grid gap-2">
        <Button onClick={() => finish("mission")} loading={saving}>
          Partir pour {homeDest.nameFr} : {firstMission.title}
        </Button>
        {firstLesson && (
          <Button variant="outline" onClick={() => finish("lesson")} loading={saving}>
            Commencer par le cours : {firstLesson.title}
          </Button>
        )}
        <Button variant="ghost" onClick={() => finish("home")} loading={saving}>
          Voir mon programme du jour
        </Button>
      </div>
    </div>,
  ];

  const last = screens.length - 1;
  const canContinue = step !== 1 || levelMode !== "quiz";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center py-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          Étape {step + 1}/{screens.length} · {STEP_NAMES[step]}
        </span>
        {step < last && (
          <button onClick={() => setStep(last)} className="hover:underline">
            Passer l&apos;introduction
          </button>
        )}
      </div>
      <ProgressBar value={step + 1} max={screens.length} className="mb-5" />
      <Panel className="animate-slide-up" key={step}>
        {screens[step]}
      </Panel>
      {step < last && (
        <div className="mt-4 flex justify-between gap-2">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Retour
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step + 1)}>
                Passer
              </Button>
            )}
            {canContinue && <Button onClick={() => setStep(step + 1)}>Continuer</Button>}
          </div>
        </div>
      )}
    </div>
  );
}
