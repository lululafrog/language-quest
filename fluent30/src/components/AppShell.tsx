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

type NavItem = { href: string; fr: string; en: string; icon: IconName };

export const MAIN_NAV: NavItem[] = [
  { href: "/", fr: "Accueil", en: "Home", icon: "home" },
  { href: "/review", fr: "Réviser", en: "Review", icon: "review" },
  { href: "/library", fr: "Lire", en: "Read", icon: "book" },
  { href: "/practice", fr: "Pratiquer", en: "Practice", icon: "play" },
  { href: "/more", fr: "Plus", en: "More", icon: "more" },
];

export const ALL_NAV: NavItem[] = [
  { href: "/", fr: "Accueil", en: "Home", icon: "home" },
  { href: "/session", fr: "Séance du jour", en: "Today's session", icon: "session" },
  { href: "/learn", fr: "Nouveaux mots", en: "New words", icon: "sparkle" },
  { href: "/review", fr: "Réviser", en: "Review", icon: "review" },
  { href: "/themes", fr: "Thèmes", en: "Themes", icon: "cards" },
  { href: "/around", fr: "Autour de moi", en: "Around me", icon: "sparkle" },
  { href: "/cards", fr: "Mes flashcards", en: "My flashcards", icon: "cards" },
  { href: "/library", fr: "Bibliothèque", en: "Library", icon: "book" },
  { href: "/games", fr: "Mini-jeux", en: "Games", icon: "play" },
  { href: "/verbs", fr: "Verbes essentiels", en: "Core verbs", icon: "verbs" },
  { href: "/grammar", fr: "Grammaire", en: "Grammar", icon: "grammar" },
  { href: "/chat", fr: "Conversation IA", en: "AI conversation", icon: "chat" },
  { href: "/listen", fr: "Écoute & prononciation", en: "Listening & speaking", icon: "ear" },
  { href: "/translate", fr: "Traduction", en: "Translator", icon: "translate" },
  { href: "/shop", fr: "Boutique", en: "Shop", icon: "sparkle" },
  { href: "/stats", fr: "Statistiques", en: "Statistics", icon: "stats" },
  { href: "/tests", fr: "Tests", en: "Tests", icon: "test" },
  { href: "/settings", fr: "Réglages", en: "Settings", icon: "settings" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/practice") return ["/practice", "/games", "/grammar", "/verbs", "/chat", "/listen", "/pronunciation"].some((p) => path.startsWith(p));
  if (href === "/more") return ["/more", "/cards", "/translate", "/stats", "/settings", "/tests", "/shop"].some((p) => path.startsWith(p));
  if (href === "/review") return path.startsWith("/review") || path.startsWith("/learn") || path.startsWith("/session");
  return path.startsWith(href);
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

  if (immersive) {
    return (
      <>
        {mounted ? children : null}
        <Toaster />
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar">
          {ALL_NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={cx("flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] transition", active ? "bg-ink-50 font-medium text-ink-700 dark:bg-ink-900/60 dark:text-ink-200" : "text-muted hover:bg-surface-2 hover:text-fg")}>
                <Icon name={n.icon} size={19} />
                {t(n.fr, n.en)}
              </Link>
            );
          })}
        </nav>
        {!online && <p className="mt-3 rounded-lg bg-sun-100 px-3 py-2 text-xs text-amber-800 dark:bg-sun-500/15 dark:text-sun-100">{t("Hors ligne — vos données restent disponibles.", "Offline — your data is still available.")}</p>}
      </aside>

      <div className="min-w-0 flex-1">
        {!online && <div className="bg-sun-100 px-4 py-1.5 text-center text-xs text-amber-800 md:hidden dark:bg-sun-500/15 dark:text-sun-100">{t("Hors ligne — flashcards et livres téléchargés disponibles", "Offline — flashcards and downloaded books available")}</div>}
        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-5 sm:px-6 md:pb-12 md:pt-8">{mounted ? children : <div className="space-y-4"><div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" /><div className="h-40 animate-pulse rounded-2xl bg-surface-2" /></div>}</main>
      </div>

      {/* Bottom nav (mobile): floating bar */}
      <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-lg grid-cols-5 rounded-[26px] border border-line/70 bg-surface/90 p-1.5 shadow-xl shadow-ink-900/10 backdrop-blur-xl">
          {MAIN_NAV.map((n) => {
            const active = isActive(path, n.href);
            return (
              <Link key={n.href} href={n.href} className={cx("flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[11px] font-semibold transition", active ? "bg-ink-600 text-white shadow-md shadow-ink-600/30" : "text-muted active:bg-surface-2")}>
                <Icon name={n.icon} size={22} />
                {t(n.fr, n.en)}
              </Link>
            );
          })}
        </div>
      </nav>
      <Toaster />
      {mounted && <RewardWatcher />}
    </div>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#5a3fe0" />
      <path d="M18 44V20h18M18 32h13" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="45" cy="42" r="7" fill="#ff7a6b" />
    </svg>
  );
}
