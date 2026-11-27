"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useOnline } from "@/hooks/useOnline";
import { setSpeechPrefs, loadVoices } from "@/lib/speech";
import { trackActivity } from "@/lib/track";
import { startAutoSync } from "@/lib/sync";
import { Icon, type IconName } from "./icons";
import { Toaster, cx } from "./ui";
import { RewardWatcher } from "./game/RewardWatcher";
import { StampWatcher } from "./passport/StampWatcher";
import { CeremonyWatcher } from "./game/CeremonyWatcher";

type NavItem = { href: string; fr: string; en: string; icon: IconName };
type NavSection = NavItem & { match: string[]; children: NavItem[] };

/** The five sections of the app. Every screen belongs to exactly one of them. */
export const SECTIONS: NavSection[] = [
  { href: "/", fr: "Accueil", en: "Home", icon: "home", match: [], children: [] },
  {
    href: "/cours", fr: "Cours", en: "Course", icon: "course",
    match: ["/cours", "/grammar", "/courses", "/basics", "/verbs", "/tests"],
    children: [
      { href: "/cours", fr: "Parcours A1 → C1", en: "A1 → C1 path", icon: "path" },
      { href: "/cours/fiches", fr: "Fiches de révision", en: "Revision sheets", icon: "sheet" },
      { href: "/grammar", fr: "Grammaire", en: "Grammar", icon: "grammar" },
      { href: "/verbs", fr: "Verbes", en: "Verbs", icon: "verbs" },
      { href: "/tests", fr: "Évaluations", en: "Assessments", icon: "test" },
    ],
  },
  {
    href: "/library", fr: "Livres", en: "Books", icon: "book",
    match: ["/library", "/novels"],
    children: [],
  },
  {
    href: "/practice", fr: "Pratique", en: "Practice", icon: "practice",
    match: ["/practice", "/review", "/learn", "/cards", "/themes", "/around", "/games", "/listen", "/pronunciation", "/chat", "/translate", "/session"],
    children: [
      { href: "/review", fr: "Réviser", en: "Review", icon: "review" },
      { href: "/practice/mindmap", fr: "Carte mentale", en: "Mind map", icon: "layers" },
      { href: "/practice/real-life", fr: "My Real Life English", en: "My Real Life English", icon: "camera" },
      { href: "/practice/journal", fr: "Journal", en: "Journal", icon: "pen" },
      { href: "/practice/memories", fr: "Memory Cards", en: "Memory Cards", icon: "heart" },
      { href: "/games", fr: "Jeux", en: "Games", icon: "game" },
      { href: "/chat", fr: "Conversations IA", en: "AI conversations", icon: "chat" },
    ],
  },
  {
    href: "/profile", fr: "Mon univers", en: "My world", icon: "globe",
    match: ["/profile", "/world", "/more", "/shop", "/collection", "/achievements", "/stats", "/settings"],
    children: [
      { href: "/world", fr: "Carte du monde", en: "World map", icon: "map" },
      { href: "/shop", fr: "Dressing", en: "Wardrobe", icon: "shirt" },
      { href: "/profile/passport", fr: "Passeport", en: "Passport", icon: "passport" },
      { href: "/achievements", fr: "Trophées", en: "Trophies", icon: "trophy" },
      { href: "/stats", fr: "Progression", en: "Progress", icon: "chart" },
      { href: "/settings", fr: "Paramètres", en: "Settings", icon: "settings" },
    ],
  },
];

// /pronunciation belongs to Cours "Ressources" and Pratique; we show it under Pratique.
function sectionOf(path: string): string {
  if (path === "/") return "/";
  if (path.startsWith("/pronunciation")) return "/practice";
  const hit = SECTIONS.find((s) => s.match.some((m) => path === m || path.startsWith(m + "/")));
  return hit ? hit.href : "";
}

function childActive(path: string, href: string) {
  if (href === "/cours") return path === "/cours" || (path.startsWith("/cours/") && !path.startsWith("/cours/fiches"));
  return path === href || path.startsWith(href + "/");
}

const noopSubscribe = () => () => {};

export function AppShell({ children }: { children: ReactNode }) {
  // The app is local-first (IndexedDB): pages render on the client only, which also avoids
  // hydration mismatches from randomised exercises.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const path = usePathname();
  const settings = useSettings();
  const online = useOnline();
  const immersive = path.startsWith("/library/read");

  // Theme
  useEffect(() => {
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (settings.loaded) localStorage.setItem("fluent30.theme", settings.theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme, settings.loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", !!settings.reduceMotion);
  }, [settings.reduceMotion]);

  // Text size (accessibility): every size is in rem, so scaling the root scales the whole UI.
  useEffect(() => {
    const k = settings.textScale ?? 1;
    document.documentElement.style.fontSize = k === 1 ? "" : `${Math.round(k * 100)}%`;
  }, [settings.textScale]);

  useEffect(() => {
    document.documentElement.lang = settings.immersion ? "en" : "fr";
  }, [settings.immersion]);

  // Voice preferences
  useEffect(() => {
    setSpeechPrefs({ accent: settings.accent, voiceURI: settings.voiceURI, rate: settings.speechRate });
    void loadVoices();
  }, [settings.accent, settings.voiceURI, settings.speechRate]);

  // Service worker (offline support)
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return startAutoSync();
  }, []);

  // Learning time: counts seconds while the tab is visible and the user interacted recently.
  const lastInteraction = useRef(0);
  useEffect(() => {
    lastInteraction.current = Date.now();
    const bump = () => (lastInteraction.current = Date.now());
    const evts = ["pointerdown", "keydown", "scroll", "touchstart"];
    evts.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    let pending = 0;
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInteraction.current < 120_000) pending += 5;
      if (pending >= 30) {
        void trackActivity({ seconds: pending });
        pending = 0;
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      evts.forEach((e) => window.removeEventListener(e, bump));
      if (pending) void trackActivity({ seconds: pending });
    };
  }, []);

  const t = (fr: string, en: string) => (settings.immersion ? en : fr);
  const current = sectionOf(path);

  if (immersive) {
    return (
      <>
        {mounted ? children : null}
        <Toaster />
        {mounted && <CeremonyWatcher />}
      </>
    );
  }

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar (tablet/desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/70 bg-surface/80 px-3 py-5 backdrop-blur-xl md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-3">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Fluent30</span>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {SECTIONS.map((sec) => {
            const active = current === sec.href;
            return (
              <div key={sec.href}>
                <Link href={sec.href} aria-current={active ? "page" : undefined} className={cx("flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition", active ? "bg-ink-50 font-semibold text-ink-700 dark:bg-ink-900/60 dark:text-ink-200" : "font-medium text-fg/80 hover:bg-surface-2 hover:text-fg")}>
                  <Icon name={sec.icon} size={20} />
                  {t(sec.fr, sec.en)}
                </Link>
                {active && sec.children.length > 0 && (
                  <div className="mb-2 ml-[22px] mt-1 space-y-0.5 border-l border-line pl-3">
                    {sec.children.map((c) => (
                      <Link key={c.href} href={c.href} className={cx("block rounded-lg px-2.5 py-1.5 text-[13.5px] transition", childActive(path, c.href) ? "font-medium text-ink-700 dark:text-ink-200" : "text-muted hover:text-fg")}>
                        {t(c.fr, c.en)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {!online && <p className="mt-3 rounded-lg bg-sun-100 px-3 py-2 text-xs text-sun-800 dark:bg-sun-500/15 dark:text-sun-100">{t("Hors ligne — vos données restent disponibles.", "Offline — your data is still available.")}</p>}
      </aside>

      <div className="min-w-0 flex-1">
        {!online && <div className="bg-sun-100 px-4 py-1.5 text-center text-xs text-sun-800 md:hidden dark:bg-sun-500/15 dark:text-sun-100">{t("Hors ligne — flashcards et livres téléchargés disponibles", "Offline — flashcards and downloaded books available")}</div>}
        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 sm:px-6 md:pb-12 md:pt-8">{mounted ? children : <div className="space-y-4"><div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" /><div className="h-40 animate-pulse rounded-2xl bg-surface-2" /></div>}</main>
      </div>

      {/* Bottom nav (mobile): floating bar */}
      <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-lg grid-cols-5 rounded-[26px] border border-line/70 bg-surface/95 p-1.5 shadow-lg shadow-ink-900/10 backdrop-blur-xl">
          {SECTIONS.map((n) => {
            const active = current === n.href;
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cx("flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11px] font-semibold transition", active ? "bg-ink-600 text-white" : "text-muted active:bg-surface-2")}>
                <Icon name={n.icon} size={22} />
                {t(n.fr, n.en)}
              </Link>
            );
          })}
        </div>
      </nav>
      <Toaster />
      {mounted && <RewardWatcher />}
      {mounted && <StampWatcher />}
      {mounted && <CeremonyWatcher />}
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#2e5a7b" />
      <path d="M18 44V20h18M18 32h13" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="45" cy="42" r="7" fill="#d97d59" />
    </svg>
  );
}
