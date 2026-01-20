/*
  Application Planning PWA
  © 2026 – Tous droits réservés
  Code source original – usage interne / personnel
*/
export const APP_VERSION = "1.0.8";

import { initServicesIfNeeded } from "./data/services-init.js";
import { showHome } from "./router.js";
import { initMenu } from "./components/menu.js";

// =======================
// INIT APP (UNIQUE)
// =======================

window.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  await initServicesIfNeeded();
  initUI();
  initTimeLogic();
  initServiceWorker();
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
// SERVICE WORKER — CYCLE MAÎTRISÉ
// =======================

let swRegistration = null;
let updatePending = false;

function initServiceWorker() {
  if (
    !("serviceWorker" in navigator) ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {
    return;
  }

  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register(
      `./service-worker.js?v=${APP_VERSION}`,
    );

    swRegistration = reg;

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_READY") {
        updatePending = true;
        showUpdateBanner();
      }
    });
  });
}

// =======================
// BANNIÈRE DE MISE À JOUR
// =======================

function showUpdateBanner() {
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

  // Mise à jour volontaire
  banner.querySelector(".update-banner-reload").onclick = () => {
    if (!swRegistration) return;

    const worker =
      swRegistration.waiting ||
      swRegistration.installing ||
      swRegistration.active;

    if (!worker) return;

    worker.postMessage("ACTIVATE_NEW_SW");

    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Ignorer pour cette session
  banner.querySelector(".update-banner-btn").onclick = () => {
    banner.remove();
  };
}

// =======================
// LOG & SÉCURITÉ
// =======================

console.log("APP CHARGÉE – version", APP_VERSION);

window.addEventListener("error", (e) => {
  console.error("ERREUR NON CAPTURÉE :", e.message);
});
