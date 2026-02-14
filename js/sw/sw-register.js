/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/sw/sw-register.js
let swRegistration = null;
const SW_DIAGNOSTIC_KEY = "planningo_sw_diag";

function isServiceWorkerDiagnosticEnabled() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("swdiag") === "1") {
      localStorage.setItem(SW_DIAGNOSTIC_KEY, "1");
    } else if (params.get("swdiag") === "0") {
      localStorage.removeItem(SW_DIAGNOSTIC_KEY);
    }
    return localStorage.getItem(SW_DIAGNOSTIC_KEY) === "1";
  } catch {
    return false;
  }
}

function swDiagLog(...args) {
  if (!isServiceWorkerDiagnosticEnabled()) return;
  console.info("[SW-DIAG]", ...args);
}

function sendDiagnosticFlagToWorkers(registration) {
  const enabled = isServiceWorkerDiagnosticEnabled();
  const message = { type: "SW_DIAGNOSTIC_SET", enabled };
  [registration.active, registration.installing, registration.waiting].forEach((worker) => {
    if (!worker) return;
    try {
      worker.postMessage(message);
    } catch {}
  });
}

export function registerServiceWorker(onUpdateAvailable) {
  if (!("serviceWorker" in navigator)) return;

  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return;
  }

  const safeUpdateCheck = () => {
    if (!swRegistration) return;
    swRegistration.update().catch(() => {});
  };

  const scheduleFastChecks = () => {
    [1000, 5000, 15000].forEach((delayMs) => {
      setTimeout(() => {
        safeUpdateCheck();
      }, delayMs);
    });
  };

  const startRegistration = async () => {
    try {
      swRegistration = await navigator.serviceWorker.register("./service-worker.js", {
        updateViaCache: "none",
      });

      swDiagLog("registered", {
        scope: swRegistration.scope,
        scriptURL: swRegistration.active?.scriptURL || null,
      });
      sendDiagnosticFlagToWorkers(swRegistration);
      const notifiedWaitingWorkers = new WeakSet();

      const notifyIfWaiting = (reason = "unknown") => {
        const waiting = swRegistration.waiting;
        if (!waiting) return;
        if (notifiedWaitingWorkers.has(waiting)) return;
        notifiedWaitingWorkers.add(waiting);
        swDiagLog("waiting", {
          reason,
          scriptURL: waiting.scriptURL || null,
        });
        if (typeof onUpdateAvailable === "function") {
          onUpdateAvailable(swRegistration);
        }
      };

      // Affichage immediat si une version attend dj
      notifyIfWaiting("register");

      // Dtection fiable d'une nouvelle version
      swRegistration.addEventListener("updatefound", () => {
        swDiagLog("updatefound", {
          scope: swRegistration.scope,
        });
        const newWorker = swRegistration.installing;
        if (!newWorker) return;
        sendDiagnosticFlagToWorkers(swRegistration);

        newWorker.addEventListener("statechange", () => {
          swDiagLog("installing.statechange", {
            state: newWorker.state,
          });
          sendDiagnosticFlagToWorkers(swRegistration);
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            notifyIfWaiting("installed-statechange");
          }
        });
      });

      // Detection proactive rapide + check periodique pour une app ouverte
      scheduleFastChecks();
      safeUpdateCheck();
      const UPDATE_INTERVAL = 5 * 60 * 1000;
      setInterval(() => {
        safeUpdateCheck();
      }, UPDATE_INTERVAL);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          safeUpdateCheck();
        }
      });

      window.addEventListener("online", () => {
        safeUpdateCheck();
      });
    } catch (err) {
      console.error("[SW] echec enregistrement", err);
    }
  };

  startRegistration();
}

export function getServiceWorkerRegistration() {
  return swRegistration;
}
