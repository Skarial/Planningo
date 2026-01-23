/* =====================================================
   SERVICE WORKER — PWA PLANNING
   - cache versionné
   - activation volontaire
   - compatible bump-version.ps1
   ===================================================== */

const CACHE_PREFIX = "planning-pwa-cache-";
const CACHE_VERSION = "__APP_VERSION__";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.webmanifest",
];

// =======================
// INSTALL — téléchargement silencieux
// =======================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  // ❌ pas de skipWaiting ici
});

// =======================
// ACTIVATE — nettoyage + prise de contrôle
// =======================

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
      )
      .then(() => self.clients.claim()),
  );
});

// =======================
// FETCH — stratégie simple et robuste
// =======================

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navigation : réseau prioritaire + fallback
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  // Assets : cache-first
  event.respondWith(caches.match(req).then((res) => res || fetch(req)));
});

// =======================
// MESSAGE — activation volontaire
// =======================

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

















