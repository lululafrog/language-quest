"use client";
// On-device text recognition (Tesseract.js, open source, Apache-2.0). The image never leaves the device.
// The engine (~3 MB) and the English language data (~10 MB, downloaded once from the jsDelivr/tessdata CDN,
// then cached by the browser) are loaded only when the learner uses it.

export interface LocalOcrResult {
  text: string;
  confidence: number; // 0..100
  engine: "tesseract";
}

export async function readTextOnDevice(image: Blob, onProgress?: (p: number) => void): Promise<LocalOcrResult> {
  type Worker = { recognize: (img: Blob) => Promise<{ data: { text: string; confidence: number } }>; terminate: () => Promise<unknown> };
  const ref: { worker: Worker | null } = { worker: null };
  try {
    const { createWorker } = await import("tesseract.js");
    ref.worker = (await createWorker("eng", 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") onProgress?.(m.progress);
      },
    })) as unknown as Worker;
    const { data } = await ref.worker.recognize(image);
    const text = data.text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) throw new Error("empty");
    return { text, confidence: data.confidence, engine: "tesseract" };
  } catch (e) {
    if (e instanceof Error && e.message === "empty") throw new Error("Aucun texte lisible n'a été trouvé sur cette image.");
    throw new Error(
      typeof navigator !== "undefined" && !navigator.onLine
        ? "La lecture sur l'appareil a besoin d'une connexion la première fois (téléchargement du lecteur de texte)."
        : "La lecture du texte sur l'appareil n'a pas fonctionné. Essaie avec une image plus nette.",
    );
  } finally {
    await ref.worker?.terminate().catch(() => {});
  }
}
