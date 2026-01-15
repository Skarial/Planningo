/*
  Application Planning PWA
  © 2026 – Tous droits réservés
  Code source original – usage interne / personnel
*/

const APP_VERSION = "1.0.1";

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

  // déjà vu pour cette version → on ne montre rien
  if (lastSeenVersion === APP_VERSION) return;

  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.className = "update-banner";

  banner.innerHTML = `
  <div class="update-banner-text">
    Une mise à jour est disponible.<br>
    Fermez l'application depuis le multitâche pour l'appliquer.
    Sinon, elle sera installée automatiquement à la prochaine ouverture.
  </div>
  <button class="update-banner-btn">OK</button>
`;

  document.body.appendChild(banner);

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
