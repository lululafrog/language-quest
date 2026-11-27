"use client";
// Asks once before personal content (photos, screenshots, journal, voice) is sent to the AI service.
import { useCallback, useRef, useState } from "react";
import { saveSettings } from "@/lib/db";
import { useSettings } from "@/hooks/useSettings";
import { Button, Sheet } from "@/components/ui";

export function usePersonalAiConsent() {
  const s = useSettings();
  const [open, setOpen] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const ask = useCallback((): Promise<boolean> => {
    if (s.personalAiConsent) return Promise.resolve(true);
    setOpen(true);
    return new Promise((res) => (resolver.current = res));
  }, [s.personalAiConsent]);

  const close = (ok: boolean) => {
    setOpen(false);
    if (ok) void saveSettings({ personalAiConsent: true });
    resolver.current?.(ok);
    resolver.current = null;
  };

  const dialog = (
    <Sheet open={open} onClose={() => close(false)} title="Analyse par l'IA">
      <div className="space-y-3 text-[15px] leading-relaxed">
        <p>Pour analyser ce contenu, Fluent30 l&apos;envoie au service d&apos;IA (Anthropic) le temps du traitement.</p>
        <ul className="list-disc space-y-1 pl-5 text-fg/80">
          <li>Rien n&apos;est conservé par le serveur de Fluent30 ; tes photos et enregistrements restent sur ton appareil.</li>
          <li>Ton contenu n&apos;est jamais utilisé pour entraîner un modèle.</li>
          <li>Tu peux retirer ce consentement à tout moment dans Paramètres → Mes données, et tout supprimer.</li>
        </ul>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="secondary" onClick={() => close(false)}>Pas maintenant</Button>
          <Button onClick={() => close(true)}>J&apos;accepte</Button>
        </div>
      </div>
    </Sheet>
  );
  return { ask, dialog, granted: !!s.personalAiConsent };
}
