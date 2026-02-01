// js/app.js
/*
  Application Planningo
*/
export const APP_VERSION = "1.0.132";

import { getConfig } from "./data/db.js";
import { showActivationScreen } from "./components/activationScreen.js";

import { registerServiceWorker } from "./sw/sw-register.js";

import { initServicesIfNeeded } from "./data/services-init.js";
import { getActiveDateISO, setActiveDateISO } from "./state/active-date.js";
import { toISODateLocal } from "./utils.js";

import { showHome } from "./router.js";
import { initMenu } from "./components/menu.js";

// =======================
// INIT
// =======================

window.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  // 0️⃣ Activation (bloquante)
  const activation = await getConfig("activation_ok");
  const imported = await getConfig("imported_ok");
  if (activation?.value !== "true" && imported?.value !== "true") {
    await showActivationScreen();
    return;
  }

  // 1️⃣ Date active (source unique)
  if (!getActiveDateISO()) {
    setActiveDateISO(toISODateLocal(new Date()));
  }

  // 2️⃣ UI principale
  initMenu();
  showHome();

  // 3️⃣ Services non bloquants
  initServicesIfNeeded();

  // 4️⃣ Service Worker + bannière
  await registerServiceWorker(showUpdateBanner);
}

// =======================
// BANNIÈRE DE MISE À JOUR
// =======================

function showUpdateBanner(registration) {
  if (!registration?.waiting) return;

  // Sécurité : ne jamais dupliquer
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner";

  banner.innerHTML = `
    <div class="update-content">
      <div class="update-text">
        <strong>Mise à jour disponible</strong>
        <span>Une nouvelle version de l’application est prête.</span>
      </div>
      <div class="update-actions">
        <button class="btn-primary" id="update-reload">Mettre à jour</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("update-reload").addEventListener("click", () => {
    registration.waiting.postMessage("SKIP_WAITING");

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      location.reload();
    });
  });
}





