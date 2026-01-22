/*
  Application Planning PWA
*/
export const APP_VERSION = "1.0.46";

import { registerServiceWorker } from "./sw/sw-register.js";
import { initServicesIfNeeded } from "./data/services-init.js";
import { showHome } from "./router.js";
import { initMenu } from "./components/menu.js";

// =======================
// INIT
// =======================

window.addEventListener("DOMContentLoaded", initApp);
document.addEventListener("visibilitychange", onVisibilityReturn);
if ("requestIdleCallback" in window) {
  requestIdleCallback(() => {
    checkAndNotifyUpdate();
  });
} else {
  setTimeout(() => {
    checkAndNotifyUpdate();
  }, 1500);
}

async function initApp() {
  // 1️⃣ Affichage immédiat
  initMenu();
  showHome();

  // 2️⃣ Tâches non bloquantes
  initServicesIfNeeded(); // sans await
  registerServiceWorker(); // sans attendre
}

// =======================
// UPDATE DETECTION (ROBUSTE)
// =======================

function checkAndNotifyUpdate() {
  const lastSeen = localStorage.getItem("lastSeenAppVersion");

  if (lastSeen !== APP_VERSION) {
    showUpdateBanner();
  }
}

function onVisibilityReturn() {
  if (document.visibilityState === "visible") {
    checkAndNotifyUpdate();
  }
}

// =======================
// BANNIÈRE
// =======================

function showUpdateBanner() {
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner visible";

  banner.innerHTML = `
  <div class="update-banner-text">
    Une nouvelle version est disponible.
  </div>
  <div class="update-banner-actions">
    <button id="update-now" class="update-btn update-btn-primary">
      Mettre à jour
    </button>
    <button id="update-later" class="update-btn update-btn-secondary">
      Plus tard
    </button>
  </div>
`;

  document.body.appendChild(banner);

  document.getElementById("update-now").onclick = () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
    window.location.reload();
  };

  document.getElementById("update-later").onclick = () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
    banner.remove();
  };
}










