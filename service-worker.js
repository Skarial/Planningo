/* =====================================================
   SERVICE WORKER — PWA PLANNING (ARCHI STANDARD)
   - cache versionné
   - activation volontaire uniquement
   - aucune communication éphémère
   ===================================================== */

const APP_VERSION = "__APP_VERSION__";
const CACHE_PREFIX = "planning-pwa-cache-";
const CACHE_NAME = CACHE_PREFIX + APP_VERSION;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  // PAS de skipWaiting automatique
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
            .map((n) => caches.delete(n)),
        ),
      ),
  );
  // PAS de clients.claim()
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  event.respondWith(caches.match(req).then((c) => c || fetch(req)));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
