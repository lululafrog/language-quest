"use client";
import { useSettings } from "./useSettings";

/** Bilingual UI: French by default, English in immersion mode. Usage: t("Réviser", "Review"). */
export function useT() {
  const { immersion } = useSettings();
  return (fr: string, en: string) => (immersion ? en : fr);
}
