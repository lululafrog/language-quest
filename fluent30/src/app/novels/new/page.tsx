"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createNovel, ERAS, GENRES, MOODS, type NovelPrefs } from "@/lib/novels";
import { currentLevel } from "@/lib/progress";
import { errorMessage } from "@/lib/api";
import { useStatus } from "@/hooks/useStatus";
import { useT } from "@/hooks/useT";
import { Button, ErrorNote, PageHeader, Panel, ProgressBar, Spinner, cx } from "@/components/ui";
import { AiRequired } from "@/components/novels/AiRequired";

const LEVELS = [
  { id: "A1", fr: "Débutant", en: "Beginner" },
  { id: "A2", fr: "Élémentaire", en: "Elementary" },
  { id: "B1", fr: "Intermédiaire", en: "Intermediate" },
  { id: "B2", fr: "Intermédiaire avancé", en: "Upper-intermediate" },
  { id: "C1", fr: "Avancé", en: "Advanced" },
  { id: "C2", fr: "Comme en VO", en: "Native-like" },
];
const PLACES = ["London", "New York", "Paris", "a small Scottish island", "Bali", "Tokyo", "the Wild West", "a space station", "an enchanted forest", "a cruise ship"];
const STEPS = 8;

export default function NewNovelPage() {
  const t = useT();
  const router = useRouter();
  const status = useStatus();
  const [step, setStep] = useState(0);
  const [genre, setGenre] = useState("");
  const [level, setLevel] = useState("");
  const [setting, setSetting] = useState("");
  const [era, setEra] = useState(ERAS[0].en);
  const [heroName, setHeroName] = useState("");
  const [heroTraits, setHeroTraits] = useState("");
  const [mood, setMood] = useState("");
  const [chapterWords, setChapterWords] = useState(700);
  const [chapters, setChapters] = useState(8);
  const [interactive, setInteractive] = useState(false);
  const [busy, setBusy] = useState<null | "plan" | "chapter">(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void currentLevel().then((l) => alive && setLevel((cur) => cur || l));
    return () => {
      alive = false;
    };
  }, []);

  const canNext = [!!genre, !!level, !!setting.trim() && !!era, !!heroName.trim(), !!mood, true, true, true][step];

  const create = async () => {
    setError("");
    const prefs: NovelPrefs = {
      genre, level, setting: setting.trim(), era,
      hero: `${heroName.trim()}${heroTraits.trim() ? ` — ${heroTraits.trim()}` : ""}`,
      mood, chapterWords, chapters, interactive,
    };
    try {
      const n = await createNovel(prefs, setBusy);
      router.push(`/novels/${n.id}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  };

  if (status && !status.ai) {
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title={t("Créer mon roman", "Create my novel")} back="/novels" />
        <AiRequired />
      </div>
    );
  }

  if (busy) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-ink-500 to-coral-500 text-5xl shadow-xl shadow-ink-600/30">
          <span className="animate-pulse">{busy === "plan" ? "🪄" : "✍️"}</span>
        </div>
        <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {busy === "plan" ? t("J'imagine ton histoire…", "Imagining your story…") : t("J'écris le chapitre 1…", "Writing chapter 1…")}
        </p>
        <p className="mt-2 text-sm text-muted">{busy === "plan" ? t("Personnages, lieux, intrigue et couverture.", "Characters, places, plot and cover.") : t("Cela peut prendre une minute.", "This can take a minute.")}</p>
        <Spinner className="mt-5 h-6 w-6 text-ink-500" />
      </div>
    );
  }

  const chip = (active: boolean) => cx("rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] font-medium transition active:scale-[0.98]", active ? "border-ink-500 bg-ink-50 text-ink-800 dark:bg-ink-900/50 dark:text-ink-100" : "border-line bg-surface");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("Créer mon roman", "Create my novel")} subtitle={t("Ton histoire, ton niveau, tes règles.", "Your story, your level, your rules.")} back="/novels" />
      <ProgressBar value={step + 1} max={STEPS} className="mb-4" />
      <Panel className="animate-slide-up" key={step}>
        {step === 0 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Quel genre de roman ?", "Which genre?")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => <button key={g.id} onClick={() => setGenre(g.en)} className={chip(genre === g.en)}><span className="mr-1.5 text-xl">{g.emoji}</span>{t(g.fr, g.en)}</button>)}
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="mb-1 text-lg font-bold">{t("À quel niveau d'anglais ?", "Which English level?")}</h2>
            <p className="mb-3 text-sm text-muted">{t("Pré-sélectionné d'après ta progression.", "Pre-selected from your progress.")}</p>
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map((l) => <button key={l.id} onClick={() => setLevel(l.id)} className={chip(level === l.id)}><span className="font-bold">{l.id}</span> <span className="text-sm text-muted">· {t(l.fr, l.en)}</span></button>)}
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Où et quand ?", "Where and when?")}</h2>
            <input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder={t("Lieu (en anglais ou en français)", "Place")} className="mb-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-ink-400" />
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PLACES.map((p) => <button key={p} onClick={() => setSetting(p)} className={cx("rounded-full border px-3 py-1 text-sm", setting === p ? "border-ink-500 bg-ink-600 text-white" : "border-line bg-surface")}>{p}</button>)}
            </div>
            <p className="mb-2 text-sm font-medium">{t("Époque", "Era")}</p>
            <div className="grid grid-cols-2 gap-2">
              {ERAS.map((e) => <button key={e.en} onClick={() => setEra(e.en)} className={chip(era === e.en)}>{t(e.fr, e.en)}</button>)}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Ton personnage principal", "Your main character")}</h2>
            <input value={heroName} onChange={(e) => setHeroName(e.target.value)} placeholder={t("Prénom (ex. : Lou, Max…)", "Name")} className="mb-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-ink-400" />
            <textarea value={heroTraits} onChange={(e) => setHeroTraits(e.target.value)} rows={3} placeholder={t("Qui est-ce ? (ex. : une infirmière française de 30 ans, curieuse et un peu maladroite, qui part travailler à Londres)", "Who is it?")} className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-ink-400" />
            <p className="mt-2 text-xs text-muted">{t("Astuce : un héros qui te ressemble rend l'histoire encore plus prenante.", "Tip: a hero like you makes it even more gripping.")}</p>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Quelle ambiance ?", "Which mood?")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => <button key={m.en} onClick={() => setMood(m.en)} className={chip(mood === m.en)}>{t(m.fr, m.en)}</button>)}
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h2 className="mb-4 text-lg font-bold">{t("Quelle longueur ?", "How long?")}</h2>
            <label className="block text-sm font-medium">{t("Longueur d'un chapitre", "Chapter length")} : <span className="tabular-nums">{chapterWords}</span> {t("mots", "words")} <span className="text-muted">(~{Math.max(1, Math.round(chapterWords / 180))} min)</span></label>
            <input type="range" min={300} max={1500} step={100} value={chapterWords} onChange={(e) => setChapterWords(Number(e.target.value))} className="mt-2 w-full accent-ink-600" />
            <label className="mt-5 block text-sm font-medium">{t("Nombre de chapitres", "Number of chapters")} : <span className="tabular-nums">{chapters}</span></label>
            <input type="range" min={3} max={20} value={chapters} onChange={(e) => setChapters(Number(e.target.value))} className="mt-2 w-full accent-ink-600" />
            <p className="mt-3 text-xs text-muted">{t("Les chapitres sont écrits un par un, quand tu le demandes.", "Chapters are written one at a time, when you ask.")}</p>
          </>
        )}
        {step === 6 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Histoire classique ou interactive ?", "Classic or interactive?")}</h2>
            <div className="grid gap-2">
              <button onClick={() => setInteractive(false)} className={chip(!interactive)}>📖 <b>{t("Classique", "Classic")}</b><span className="block text-sm text-muted">{t("Tu lis, l'IA raconte.", "You read, the AI tells the story.")}</span></button>
              <button onClick={() => setInteractive(true)} className={chip(interactive)}>🔀 <b>{t("Interactive", "Interactive")}</b><span className="block text-sm text-muted">{t("À la fin de chaque chapitre, tu choisis ce que fait ton héros : la suite change selon tes décisions.", "You choose what happens next.")}</span></button>
            </div>
          </>
        )}
        {step === 7 && (
          <>
            <h2 className="mb-3 text-lg font-bold">{t("Récapitulatif", "Summary")}</h2>
            <ul className="space-y-1.5 text-[15px]">
              <li>🎭 {genre} · {mood}</li>
              <li>🎓 {level}</li>
              <li>📍 {setting} · {era}</li>
              <li>🦸 {heroName}{heroTraits ? ` — ${heroTraits}` : ""}</li>
              <li>📏 {chapters} × ~{chapterWords} {t("mots", "words")}</li>
              <li>{interactive ? "🔀 " + t("Interactive", "Interactive") : "📖 " + t("Classique", "Classic")}</li>
            </ul>
            <p className="mt-3 text-xs text-muted">{t("Les mots que tu as du mal à retenir seront glissés naturellement dans l'histoire.", "Words you struggle with will be woven in naturally.")}</p>
          </>
        )}
      </Panel>
      <ErrorNote>{error}</ErrorNote>
      <div className="mt-4 flex justify-between gap-2">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>{t("Retour", "Back")}</Button> : <span />}
        {step < STEPS - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>{t("Continuer", "Continue")}</Button>
        ) : (
          <Button onClick={create} disabled={!status?.ai}>✨ {t("Écrire mon roman", "Write my novel")}</Button>
        )}
      </div>
    </div>
  );
}
