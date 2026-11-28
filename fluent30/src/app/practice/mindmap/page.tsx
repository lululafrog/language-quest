"use client";
// The mind map now lives in the vocabulary space (interactive, zoomable): /vocab, "Carte" view.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSettings } from "@/lib/db";

export default function MindMapRedirect() {
  const router = useRouter();
  useEffect(() => {
    saveSettings({ vocabView: "map" }).finally(() => router.replace("/vocab#explorer"));
  }, [router]);
  return null;
}
