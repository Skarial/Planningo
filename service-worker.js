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

const CORE_ASSETS = [
  "./",
  "./LICENSE",
  "./NOTICE",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./css/style.css",
  "./css/tetribus.css",
  "./index.html",
  "./js/adapters/activation.web.js",
  "./js/app.js",
  "./js/components/activationScreen.js",
  "./js/components/alarm.js",
  "./js/components/conges.js",
  "./js/components/conges-periods.js",
  "./js/components/guided-month.js",
  "./js/components/home-month-calendar.js",
  "./js/components/home.js",
  "./js/components/legal.js",
  "./js/components/menu.js",
  "./js/components/phone-change.js",
  "./js/components/season.js",
  "./js/components/suggestions.js",
  "./js/components/summary.js",
  "./js/components/tetribus.js",
  "./js/data/db.js",
  "./js/data/device.js",
  "./js/data/export-db.js",
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
  "./js/domain/activation.js",
  "./js/domain/alarm-plan.js",
  "./js/domain/conges.js",
  "./js/domain/day-status.js",
  "./js/domain/holidays-fr.js",
  "./js/domain/periods.js",
  "./js/domain/service-model.js",
  "./js/domain/service-panier.js",
  "./js/domain/service-suggestions.js",
  "./js/domain/services-availability.js",
  "./js/games/tetribus/tetribus.game.js",
  "./js/games/tetribus/tetribus.render.js",
  "./js/router.js",
  "./js/state/active-date.js",
  "./js/state/home-mode.js",
  "./js/state/month-calendar-state.js",
  "./js/state/month-navigation.js",
  "./js/state/ui-mode.js",
  "./js/sw/sw-register.js",
  "./js/utils.js",
  "./js/utils/period-label.js",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./assets/images/breakfast.png",
];

// =======================
// INSTALL - telechargement silencieux
// =======================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)),
  );
  // no skipWaiting here
});

// =======================
// ACTIVATE - nettoyage + prise de controle
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
// FETCH - strategie simple et robuste
// =======================

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isSameOrigin = new URL(req.url).origin === self.location.origin;

  // Navigation : reseau prioritaire
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }

  // JS & CSS : reseau d'abord, cache en fallback et mise en cache
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (isSameOrigin && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req)),
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
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});




























