import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluent30 — coach d'anglais",
    short_name: "Fluent30",
    description: "Vocabulaire utile, répétition espacée, lecture interactive et conversation pour francophones.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#2e5a7b",
    lang: "fr",
    // Share a screenshot, a photo or a text from another app straight into "My Real Life English".
    // Handled by public/sw.js (and by src/app/share/route.ts when the service worker is not active yet).
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: { title: "title", text: "text", url: "url", files: [{ name: "image", accept: ["image/*"] }] },
    },
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
