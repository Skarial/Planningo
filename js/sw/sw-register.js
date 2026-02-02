/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/sw/sw-register.js
let swRegistration = null;

export function registerServiceWorker(onUpdateAvailable) {
  if (!("serviceWorker" in navigator)) return;

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      swRegistration = await navigator.serviceWorker.register(
        "./service-worker.js",
      );

      console.log("[SW] enregistre");

      const notifyIfWaiting = () => {
        if (swRegistration.waiting && typeof onUpdateAvailable === "function") {
          onUpdateAvailable(swRegistration);
        }
      };

      // Affichage immediat si une version attend dj
      notifyIfWaiting();

      // Dtection fiable d'une nouvelle version
      swRegistration.addEventListener("updatefound", () => {
        const newWorker = swRegistration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            notifyIfWaiting();
          }
        });
      });

      // Check periodique pour une app qui reste ouverte
      const UPDATE_INTERVAL = 15 * 60 * 1000;
      setInterval(() => {
        swRegistration.update().catch(() => {});
      }, UPDATE_INTERVAL);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          swRegistration.update().catch(() => {});
        }
      });
    } catch (err) {
      console.error("[SW] echec enregistrement", err);
    }
  });
}

export function getServiceWorkerRegistration() {
  return swRegistration;
}


