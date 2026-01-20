// js/sw/sw-register.js

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return;
  }

  navigator.serviceWorker
    .register("/planning_pwa/service-worker.js", {
      scope: "/planning_pwa/",
    })
    .then((reg) => {
      console.log("[SW] enregistré");
    })
    .catch((err) => {
      console.error("[SW] échec enregistrement", err);
    });
}
