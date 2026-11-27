// Fluent30 service worker: offline app shell + runtime caching of pages and static assets.
// User data lives in IndexedDB and is always available offline.
const VERSION = "fluent30-v1";
const SHELL = ["/", "/review", "/learn", "/cards", "/library", "/practice", "/games", "/verbs", "/grammar", "/more", "/stats", "/settings", "/session", "/listen", "/offline.html", "/icon.svg", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache API responses here

  // Static assets: cache first.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|webp|ico|woff2?|mjs)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
    return;
  }

  // Pages & RSC payloads: network first, fall back to cache, then offline page.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => (await caches.match(req)) || (await caches.match(url.pathname)) || (req.mode === "navigate" ? caches.match("/offline.html") : Response.error()))
  );
});
