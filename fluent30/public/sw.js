// Fluent30 service worker: offline app shell + runtime caching of pages and static assets.
// User data lives in IndexedDB and is always available offline.
const VERSION = "fluent30-v2";
const SHELL = ["/", "/review", "/learn", "/cards", "/library", "/practice", "/games", "/verbs", "/grammar", "/more", "/stats", "/settings", "/session", "/listen", "/offline.html", "/icon.svg", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== SHARE_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Share target (manifest.share_target, POST multipart to /share): keep the shared file/text in a
// private cache for the Real Life English page, which reads and deletes it immediately.
const SHARE_CACHE = "fluent30-share";
async function handleShare(req) {
  try {
    const form = await req.formData();
    const file = form.get("image");
    const text = [form.get("title"), form.get("text"), form.get("url")].filter((v) => typeof v === "string" && v.trim()).join("\n");
    const c = await caches.open(SHARE_CACHE);
    if (file && typeof file !== "string" && file.size) {
      await c.put("/__shared/file", new Response(file, { headers: { "Content-Type": file.type || "image/jpeg" } }));
      if (text) await c.put("/__shared/text", new Response(text));
      return Response.redirect("/practice/real-life?sharedFile=1", 303);
    }
    if (text) {
      await c.put("/__shared/text", new Response(text));
      return Response.redirect("/practice/real-life?shared=1", 303);
    }
  } catch {
    /* fall through to the import page */
  }
  return Response.redirect("/practice/real-life", 303);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method === "POST" && new URL(req.url).pathname === "/share") {
    e.respondWith(handleShare(req));
    return;
  }
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache API responses here

  // Static assets: cache first.
  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|webp|ico|woff2?|mjs|gz)$/.test(url.pathname)) {
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
