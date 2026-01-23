/*
  Application Planning PWA
*/
export const APP_VERSION = "1.0.96";

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
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("update-reload")?.addEventListener("click", () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
    location.reload();
  });

  document.getElementById("update-later")?.addEventListener("click", () => {
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);
    hideUpdateBanner();
  });
});

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
  const banner = document.getElementById("update-banner");
  if (!banner) return;

  banner.classList.remove("hidden");
}

function hideUpdateBanner() {
  const banner = document.getElementById("update-banner");
  if (!banner) return;

  banner.classList.add("hidden");
}






























