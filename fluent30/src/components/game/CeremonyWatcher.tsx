"use client";
// Listens to reading events: finished books (ceremony), chapters, quizzes, saved words (achievements).
import { useEffect, useRef, useState } from "react";
import { on } from "@/lib/events";
import { getDb } from "@/lib/db";
import { finishBook, type CeremonyData } from "@/lib/collection";
import { evaluateAchievements, unlockAchievement, type AchievementDef } from "@/lib/achievements";
import { gentleStreak } from "@/lib/goals";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "@/components/ui";
import { Ceremony } from "./Ceremony";

async function streakNow() {
  return gentleStreak(await getDb().activity.toArray()).streak;
}

export function CeremonyWatcher() {
  const s = useSettings();
  const [cer, setCer] = useState<{ data: CeremonyData; trophies: AchievementDef[] } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const announce = (list: AchievementDef[]) => list.forEach((a) => toast(`🏆 Trophée : ${a.fr} (+${a.coins} pièces)`));
    // At start-up: unlock anything already earned.
    const t0 = setTimeout(() => void streakNow().then(evaluateAchievements).then(announce), 2500);
    let wordTimer: ReturnType<typeof setTimeout> | null = null;
    const offs = [
      on("book:finished", async ({ bookId }) => {
        if (busy.current) return;
        busy.current = true;
        try {
          const data = await finishBook(bookId);
          if (data) {
            const trophies = await evaluateAchievements(await streakNow());
            setCer({ data, trophies });
          }
        } finally {
          busy.current = false;
        }
      }),
      on("chapter:finished", async () => {
        const first = await unlockAchievement("first-chapter");
        const more = await evaluateAchievements(await streakNow());
        announce([...(first ? [first] : []), ...more]);
      }),
      on("quiz:done", async () => announce(await evaluateAchievements(await streakNow()))),
      on("word:saved", () => {
        if (wordTimer) clearTimeout(wordTimer);
        wordTimer = setTimeout(async () => announce(await evaluateAchievements(await streakNow())), 4000);
      }),
    ];
    return () => {
      clearTimeout(t0);
      if (wordTimer) clearTimeout(wordTimer);
      offs.forEach((o) => o());
    };
  }, []);

  if (!cer) return null;
  return <Ceremony data={cer.data} trophies={cer.trophies} reduceMotion={!!s.reduceMotion} onClose={() => setCer(null)} />;
}
