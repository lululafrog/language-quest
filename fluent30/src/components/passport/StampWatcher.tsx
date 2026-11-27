"use client";
// Grants passport stamps as soon as their condition is met (on launch, after lessons/books, and every few minutes).
import { useEffect } from "react";
import { claimStamps } from "@/lib/passport";
import { on } from "@/lib/events";
import { toast } from "@/components/ui";

export function StampWatcher() {
  useEffect(() => {
    let busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const fresh = await claimStamps();
        for (const d of fresh) toast(`Nouveau tampon : ${d.nameFr} (+${d.coins} pièces)`);
      } catch {
        /* storage unavailable: retry later */
      } finally {
        busy = false;
      }
    };
    const t0 = setTimeout(check, 2500);
    const iv = setInterval(check, 120_000);
    const offs = [on("book:finished", check), on("chapter:finished", check), on("quiz:done", check), on("lesson:done", check)];
    const vis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", vis);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
      offs.forEach((f) => f?.());
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return null;
}
