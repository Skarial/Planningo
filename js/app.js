/*
  Application Planning PWA
*/
export const APP_VERSION = "1.0.106";

import { getConfig } from "./data/db.js";
import { showActivationScreen } from "./components/activationScreen.js";

import {
  registerServiceWorker,
  getServiceWorkerRegistration,
} from "./sw/sw-register.js";

import { initServicesIfNeeded } from "./data/services-init.js";
import { showHome } from "./router.js";
import { initMenu } from "./components/menu.js";

// =======================
// INIT
// =======================

window.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  // 0️⃣ Vérification activation (BLOQUANTE)
  const activation = await getConfig("activation_ok");

  if (!activation || activation.value !== "true") {
    await showActivationScreen();
    return;
  }

  // 1️⃣ Affichage normal
  initMenu();
  showHome();

  // 2️⃣ Tâches non bloquantes
  initServicesIfNeeded(); // sans await
  await registerServiceWorker();
  watchServiceWorkerUpdates();
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("update-reload")
    ?.addEventListener("click", async () => {
      const reg = getServiceWorkerRegistration();

      if (reg?.waiting) {
        // 1️⃣ forcer l’activation du nouveau SW
        reg.waiting.postMessage("SKIP_WAITING");

        // 2️⃣ attendre qu’il prenne le contrôle
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          location.reload();
        });

        return;
      }

      // fallback sécurité
      location.reload();
    });
});

// =======================
// BANNIÈRE
// =======================

function showUpdateBanner() {
  const banner = document.getElementById("update-banner");
  if (!banner) return;

  banner.classList.remove("hidden");
}

async function watchServiceWorkerUpdates() {
  const reg = await getServiceWorkerRegistration();
  if (!reg) return;

  // SW déjà prêt
  if (reg.waiting) {
    showUpdateBanner();
  }

  // Nouveau SW détecté plus tard
  reg.addEventListener("updatefound", () => {
    const newWorker = reg.installing;
    if (!newWorker) return;

    newWorker.addEventListener("statechange", () => {
      if (
        newWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        showUpdateBanner();
      }
    });
  });
}










