/*
  Application Planning PWA
  © 2026 – Tous droits réservés
  Code source original – usage interne / personnel
*/

const APP_VERSION = "1.0.2";

const __APP_SIGNATURE__ = {
  created: "2026-01",
  context: "internal tool / personal project",
};

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
    1 // sécurité
  );

  const delay = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    console.log("Minuit détecté – rafraîchissement automatique");
    window.location.reload();
  }, delay);
}

// =======================
// SERVICE WORKER + DÉTECTION UPDATE
// =======================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const reg = await navigator.serviceWorker.register("./service-worker.js");

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          showUpdateBannerOncePerVersion();
        }
      });
    });
  });
}

// =======================
// NOTIFICATION (1 FOIS PAR VERSION)
// =======================

function showUpdateBannerOncePerVersion() {
  const lastSeenVersion = localStorage.getItem("lastSeenAppVersion");

  // Déjà vu pour cette version → rien à faire
  if (lastSeenVersion === APP_VERSION) return;

  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner";

  banner.innerHTML = `
    <div class="update-banner-text">
      Une mise à jour est disponible.
    </div>
    <div class="update-banner-actions">
      <button class="update-banner-reload">Recharger maintenant</button>
      <button class="update-banner-btn">Plus tard</button>
    </div>
  `;

  document.body.appendChild(banner);

  // Recharger immédiatement
  banner.querySelector(".update-banner-reload").onclick = () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
    window.location.reload();
  };

  // Ignorer pour cette version
  banner.querySelector(".update-banner-btn").onclick = () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
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
