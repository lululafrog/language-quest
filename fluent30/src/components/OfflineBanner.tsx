"use client";
// Small, unobtrusive banner while the device is offline. Data stays on the device; the sync layer
// (src/lib/sync.ts) runs again automatically on the browser's "online" event.
import { useSyncExternalStore } from "react";
import { Icon } from "./icons";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-[60] flex justify-center px-3 pb-1 pt-[calc(env(safe-area-inset-top)+6px)]">
      <p className="flex items-center gap-2 rounded-full bg-ink-800/90 px-3.5 py-1.5 text-[13px] font-medium text-white shadow-lg backdrop-blur dark:bg-ink-200/90 dark:text-ink-900">
        <Icon name="globe" size={15} />
        Hors connexion · révisions et cours disponibles, synchro au retour du réseau
      </p>
    </div>
  );
}
