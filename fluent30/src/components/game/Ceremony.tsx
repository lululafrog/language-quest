"use client";
// Finished-book ceremony: the closing book, light particles, confetti, the tourist celebrating,
// rewards (XP, coins, trophies, collectible card, exclusive outfits), recap and next books.
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookCover } from "@/components/library/BookCover";
import { Tourist } from "@/components/avatar/Tourist";
import { ReadingCard } from "@/components/collection/ReadingCard";
import { getGame } from "@/lib/game";
import { fallbackRecommendations, type CeremonyData } from "@/lib/collection";
import type { AchievementDef } from "@/lib/achievements";
import type { LibraryBook } from "@/lib/data/library";
import type { GameState } from "@/lib/types";
import { CoinIcon } from "./Coin";
import { Confetti } from "./RewardWatcher";
import { TrophyBadge } from "./TrophyBadge";
import { cx } from "@/components/ui";

type Step = "show" | "rewards" | "recap" | "next";

const CSS = `
@keyframes cer-in{0%{opacity:0;transform:scale(.6) translateY(30px)}100%{opacity:1;transform:none}}
@keyframes cer-close{0%{transform:rotateY(-155deg)}70%{transform:rotateY(8deg)}100%{transform:rotateY(0)}}
@keyframes cer-float{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-110vh) scale(1.2);opacity:0}}
@keyframes cer-glow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}
@keyframes cer-pop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.12);opacity:1}100%{transform:scale(1)}}
@keyframes tourist-jump-k{0%,100%{transform:translateY(0)}40%{transform:translateY(-14px)}60%{transform:translateY(-14px)}}
.tourist-jump{animation:tourist-jump-k 0.9s ease-in-out infinite;transform-origin:100px 220px}
.cer-book{transform-style:preserve-3d;perspective:900px}
.cer-flap{transform-origin:left center;animation:cer-close 1.6s cubic-bezier(.2,.8,.2,1) .3s both;backface-visibility:hidden}
`;

function fmtTime(sec: number) {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

export function Ceremony({ data, trophies, reduceMotion, onClose }: { data: CeremonyData; trophies: AchievementDef[]; reduceMotion: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("show");
  const [game, setGame] = useState<GameState | null>(null);
  const [recs, setRecs] = useState<LibraryBook[]>([]);
  const lib = data.lib;
  const coverBook = { title: data.book.title, author: data.book.author, cat: lib?.cat, level: lib?.level ?? data.book.level, cover: lib?.cover };

  useEffect(() => {
    void getGame().then(setGame);
    void (async () => {
      try {
        const mod = await import("@/lib/recommend");
        const r = await mod.recommendBooks(6);
        const list = r.map((x) => x.book).filter((b) => b.id !== lib?.id).slice(0, 3);
        if (list.length) return setRecs(list);
      } catch {
        /* fallback below */
      }
      setRecs(await fallbackRecommendations(lib, 3));
    })();
  }, [lib]);

  useEffect(() => {
    if (step !== "show" || reduceMotion) return;
    const t = setTimeout(() => setStep("rewards"), 2600);
    return () => clearTimeout(t);
  }, [step, reduceMotion]);

  const s = data.entry.stats;
  const anim = !reduceMotion;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-gradient-to-b from-[#120F2E] via-[#1E1850] to-[#2E2A6B] p-4 text-white" role="dialog" aria-modal="true" aria-label="Livre terminé">
      <style>{CSS}</style>
      {anim && <Confetti count={60} />}
      {anim && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 26 }, (_, i) => (
            <span key={i} className="absolute bottom-[-20px] rounded-full" style={{ left: `${(i * 37) % 100}%`, width: 6 + (i % 4) * 3, height: 6 + (i % 4) * 3, background: "radial-gradient(circle, #FFF6C9 0%, #FFD166 40%, transparent 70%)", animation: `cer-float ${5 + (i % 5)}s linear ${(i % 7) * 0.6}s infinite` }} />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md py-6">
        {step === "show" && (
          <div className="flex flex-col items-center text-center" style={anim ? { animation: "cer-in .7s ease-out both" } : undefined}>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sun-400">{data.reread ? "Relu !" : "Livre terminé"}</p>
            <div className="relative mt-6">
              <div className="absolute -inset-10 rounded-full bg-sun-400/30 blur-3xl" style={anim ? { animation: "cer-glow 2.4s ease-in-out infinite" } : undefined} />
              <div className="cer-book relative w-44">
                <div className="absolute inset-0 translate-x-1.5 translate-y-1 rounded-[14px] bg-[#F5EEDC] shadow-2xl" />
                <div className={cx("relative", anim && "cer-flap")}>
                  <BookCover book={coverBook} className="w-full drop-shadow-2xl" />
                </div>
              </div>
            </div>
            <h2 className="mt-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{data.book.title}</h2>
            {lib?.titleFr && <p className="text-sm text-white/70">{lib.titleFr}</p>}
            {reduceMotion && <button onClick={() => setStep("rewards")} className="mt-6 h-11 rounded-xl bg-white px-6 font-semibold text-ink-800">Voir mes récompenses</button>}
          </div>
        )}

        {step === "rewards" && (
          <div className="flex flex-col items-center text-center" style={anim ? { animation: "cer-in .5s ease-out both" } : undefined}>
            {game && <div className="w-36 overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white/10"><Tourist equipped={game.equipped} appearance={game.appearance} celebrate animate={anim} /></div>}
            <h2 className="mt-4 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Bravo !</h2>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-white/15 px-4 py-2 text-lg font-bold" style={anim ? { animation: "cer-pop .6s .1s both" } : undefined}>+{data.xp} XP</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-4 py-2 text-lg font-bold text-amber-900" style={anim ? { animation: "cer-pop .6s .3s both" } : undefined}>+{data.coins} <CoinIcon size={20} /></span>
            </div>
            <div className="mt-5 w-48" style={anim ? { animation: "cer-pop .7s .5s both" } : undefined}>
              <ReadingCard entry={data.entry} />
            </div>
            <p className="mt-2 text-xs text-white/60">{data.reread ? "Ta carte de lecture est mise à jour." : "Nouvelle carte de lecture à collectionner !"}</p>
            {trophies.length > 0 && (
              <div className="mt-5 w-full rounded-2xl bg-white/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-sun-400">Trophée débloqué</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {trophies.map((a) => (
                    <div key={a.id} className="w-24 text-center" style={anim ? { animation: "cer-pop .6s .8s both" } : undefined}>
                      <TrophyBadge a={a} className="mx-auto w-16" />
                      <p className="mt-1 text-[11px] font-semibold leading-tight">{a.fr}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.items.length > 0 && (
              <div className="mt-4 w-full rounded-2xl bg-white/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-mint-400">Collection exclusive débloquée</p>
                <p className="mt-1 text-sm">{data.items.map((i) => i.fr).join(" · ")}</p>
                <Link href="/shop" onClick={onClose} className="mt-2 inline-block text-sm font-semibold text-sun-400 underline">Habiller mon personnage</Link>
              </div>
            )}
            <button onClick={() => setStep("recap")} className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-ink-800">Voir mon bilan</button>
          </div>
        )}

        {step === "recap" && (
          <div style={anim ? { animation: "cer-in .4s ease-out both" } : undefined}>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-sun-400">Ton bilan</p>
            <p className="mt-3 text-center text-lg leading-snug" style={{ fontFamily: "var(--font-display)" }}>{data.message}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                ["Mots anglais lus", s.wordsRead.toLocaleString("fr-FR")],
                ["Temps de lecture", fmtTime(s.readingSeconds)],
                ["Nouveaux mots notés", String(s.newWords)],
                ["Déjà mémorisés", String(s.memorized)],
                ["Expressions apprises", String(s.expressions)],
                ["Quiz de chapitres", s.quizAvg == null ? "—" : `${Math.round(s.quizAvg * 100)} %`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white/10 p-3">
                  <p className="text-2xl font-bold tabular-nums">{v}</p>
                  <p className="text-xs text-white/70">{k}</p>
                </div>
              ))}
            </div>
            {s.lookupsPer100 != null && (
              <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">
                Compréhension : tu as cherché en moyenne <b>{s.lookupsPer100}</b> mot{s.lookupsPer100 > 1 ? "s" : ""} pour 100 mots lus.{" "}
                {s.lookupsPer100 < 2 ? "Tu lis presque sans aide : ce niveau est confortable pour toi." : s.lookupsPer100 < 5 ? "Le bon équilibre pour progresser." : "Un vrai défi relevé : le prochain livre sera plus facile."}
              </p>
            )}
            <button onClick={() => setStep("next")} className="mt-6 h-12 w-full rounded-xl bg-white font-semibold text-ink-800">Et maintenant ?</button>
          </div>
        )}

        {step === "next" && (
          <div style={anim ? { animation: "cer-in .4s ease-out both" } : undefined}>
            <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-sun-400">Tes prochaines lectures</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {recs.map((b) => (
                <Link key={b.id} href="/library" onClick={onClose} className="text-center">
                  <BookCover book={b} className="w-full rounded-lg shadow-lg" />
                  <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{b.title}</p>
                  <p className="text-[10px] text-white/60">{b.level}</p>
                </Link>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Link href="/collection" onClick={onClose} className="flex h-12 items-center justify-center rounded-xl bg-white/15 font-semibold">Ma collection</Link>
              <button onClick={onClose} className="h-12 rounded-xl bg-white font-semibold text-ink-800">Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
