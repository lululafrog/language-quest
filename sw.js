// Service worker : tout est mis en cache pour fonctionner hors connexion.
const CACHE = 'language-quest-v8';
const ASSETS = [
  './',
  'icon-192.png',
  'icon-512.png',
  'icon.svg',
  'index.html',
  'js/app.js',
  'js/cards.js',
  'js/csv.js',
  'js/dialog.js',
  'js/data/english.js',
  'js/data/games.js',
  'js/data/grammar.js',
  'js/data/indonesian.js',
  'js/data/scenes.js',
  'js/exercises.js',
  'js/firebase-config.js',
  'js/fsrs.js',
  'js/gen.js',
  'js/i18n.js',
  'js/net/fb.js',
  'js/screens/classonline.js',
  'js/screens/classroom.js',
  'js/screens/flashcards.js',
  'js/screens/games.js',
  'js/screens/home.js',
  'js/screens/learn.js',
  'js/screens/multiplayer.js',
  'js/screens/photo.js',
  'js/screens/student.js',
  'js/screens/touch.js',
  'js/speech.js',
  'js/store.js',
  'js/ui.js',
  'js/vendor/preact-htm.js',
  'manifest.webmanifest',
  'styles.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
