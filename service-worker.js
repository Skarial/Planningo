/* =====================================================
   Copyright (c) 2026 Jordan
   All Rights Reserved.
   See LICENSE for terms.
   ===================================================== */

/* =====================================================
   SERVICE WORKER - PWA PLANNING
   - cache versionne
   - activation volontaire
   - compatible bump-version.ps1
   ===================================================== */

const CACHE_PREFIX = "planning-pwa-cache-";
const CACHE_VERSION = "__APP_VERSION__";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
let SW_DIAGNOSTIC_ENABLED = false;

function swDiagLog(...args) {
  if (!SW_DIAGNOSTIC_ENABLED) return;
  console.info("[SW-DIAG]", ...args);
}

const ESSENTIAL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./css/style.css",
  "./css/tetribus.css",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/images/breakfast.png",
  "./js/app.js",
  "./js/router.js",
  "./js/sw/sw-register.js",
  "./js/utils.js",
  "./js/debug/runtime-log.js",
  "./js/components/menu.js",
  "./js/adapters/activation.web.js",
  "./js/components/activationScreen.js",
  "./js/data/db.js",
  "./js/data/device.js",
  "./js/data/import-db.js",
  "./js/data/services-catalog.js",
  "./js/data/services-init.js",
  "./js/data/services.js",
  "./js/data/storage.abstract.js",
  "./js/data/storage.file.js",
  "./js/data/storage.interface.js",
  "./js/data/storage.js",
  "./js/data/storage.memory.js",
  "./js/data/storage.selector.js",
  "./js/state/active-date.js",
  "./js/state/home-mode.js",
  "./js/state/month-calendar-state.js",
  "./js/state/month-navigation.js",
  "./js/state/ui-mode.js",
  "./js/domain/activation.js",
  "./js/domain/conges.js",
  "./js/domain/day-status.js",
  "./js/domain/holidays-fr.js",
  "./js/domain/periods.js",
  "./js/domain/service-model.js",
  "./js/domain/service-panier.js",
  "./js/domain/service-suggestions.js",
  "./js/domain/services-availability.js",
  "./js/utils/period-label.js",
  "./js/components/home.js",
  "./js/components/home-month-calendar.js",
];

// =======================
// INSTALL - telechargement silencieux
// =======================

self.addEventListener("install", (event) => {
  swDiagLog("install", { cacheName: CACHE_NAME });
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        ESSENTIAL_ASSETS.map((asset) =>
          cache.add(asset).catch(() => null),
        ),
      ),
    ),
  );
  // no skipWaiting here
});

// =======================
// ACTIVATE - nettoyage + prise de controle
// =======================

self.addEventListener("activate", (event) => {
  swDiagLog("activate:start", { cacheName: CACHE_NAME });
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
      .then(() => self.clients.claim())
      .then(() => {
        swDiagLog("activate:claimed", { cacheName: CACHE_NAME });
      }),
  );
});

// =======================
// FETCH - strategie simple et robuste
// =======================

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  // Navigation : app-shell immediat depuis le cache, puis refresh en fond.
  // Objectif : ouverture la plus rapide possible sur mobile.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedShell = await cache.match("./index.html");

        if (cachedShell) {
          event.waitUntil(
            fetch("./index.html", { cache: "no-cache" })
              .then((res) => {
                if (res && res.ok) {
                  return cache.put("./index.html", res.clone());
                }
              })
              .catch(() => {}),
          );
          return cachedShell;
        }

        return fetch(req).catch(() => caches.match("./index.html"));
      })(),
    );
    return;
  }

  // JS & CSS : stale-while-revalidate (ultra reactif + auto-refresh du cache)
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);

        const networkPromise = fetch(req)
          .then((res) => {
            if (isSameOrigin && res && res.ok) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const networkRes = await networkPromise;
        if (networkRes) return networkRes;
        return caches.match(req);
      })(),
    );
    return;
  }

  // Autres assets : cache-first + mise en cache a la volee
  event.respondWith(
    caches.match(req).then(
      (res) =>
        res ||
        fetch(req).then((networkRes) => {
          if (isSameOrigin && networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        }),
    ),
  );
});

// =======================
// MESSAGE - activation volontaire
// =======================

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && typeof data === "object" && data.type === "SW_DIAGNOSTIC_SET") {
    SW_DIAGNOSTIC_ENABLED = Boolean(data.enabled);
    swDiagLog("diagnostic", {
      enabled: SW_DIAGNOSTIC_ENABLED,
      cacheName: CACHE_NAME,
    });
    return;
  }

  if (event.data === "SKIP_WAITING") {
    swDiagLog("message:SKIP_WAITING");
    self.skipWaiting();
  }
});














































































