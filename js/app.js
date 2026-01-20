/*
  Application Planning PWA
  © 2026 – Tous droits réservés
  Code source original – usage interne / personnel
*/

export const APP_VERSION = "1.0.12";

import { registerServiceWorker } from "./sw/sw-register.js";
import { initServicesIfNeeded } from "./data/services-init.js";
import { showHome } from "./router.js";
import { initMenu } from "./components/menu.js";

// =======================
// INIT APP (UNIQUE)
// =======================

window.addEventListener("DOMContentLoaded", initApp);

// Quand l’utilisateur revient sur l’app (onglet / arrière-plan)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    checkWaitingServiceWorker();
  }
});

async function initApp() {
  await initServicesIfNeeded();
  initUI();
  initTimeLogic();

  // Enregistrement SW + callback update
  registerServiceWorker(onServiceWorkerUpdateAvailable);
}

function initUI() {
  initMenu();
  showHome();
}

function initTimeLogic() {
  scheduleMidnightRefresh();
}

// =======================
// RAFRAÎCHISSEMENT À MINUIT
// =======================

function scheduleMidnightRefresh() {
  const now = new Date();

  const nextMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    1,
  );

  const delay = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    console.log("Minuit détecté – nouvelle journée disponible");
    // ❌ aucun reload automatique
  }, delay);
}

// =======================
// SERVICE WORKER — UPDATE DISPONIBLE
// =======================

let pendingSWRegistration = null;

function onServiceWorkerUpdateAvailable(registration) {
  pendingSWRegistration = registration;
  showUpdateBanner(registration);
}

// Vérifie au retour si un SW est déjà en attente
async function checkWaitingServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.getRegistration();
  if (reg && reg.waiting) {
    pendingSWRegistration = reg;
    showUpdateBanner(reg);
  }
}

// =======================
// BANNIÈRE DE MISE À JOUR
// =======================

function showUpdateBanner(reg) {
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner visible";

  banner.innerHTML = `
    <div class="update-banner-text">
      Une nouvelle version de l’application est disponible.
    </div>
    <div class="update-banner-actions">
      <button class="update-banner-reload">Mettre à jour</button>
      <button class="update-banner-btn">Plus tard</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Validation volontaire
  banner.querySelector(".update-banner-reload").onclick = () => {
    if (!reg.waiting) return;

    reg.waiting.postMessage("SKIP_WAITING");

    // Reload uniquement quand le nouveau SW contrôle la page
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        window.location.reload();
      },
      { once: true },
    );
  };

  banner.querySelector(".update-banner-btn").onclick = () => {
    banner.remove();
  };
}

// =======================
// LOG & SÉCURITÉ DEV
// =======================

console.log("APP CHARGÉE – version", APP_VERSION);

window.addEventListener("error", (e) => {
  console.error("ERREUR NON CAPTURÉE :", e.message);
});




