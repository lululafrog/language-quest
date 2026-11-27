import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluent30 — coach d'anglais",
    short_name: "Fluent30",
    description: "Vocabulaire utile, répétition espacée, lecture interactive et conversation pour francophones.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#5a3fe0",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
