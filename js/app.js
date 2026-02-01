// js/app.js
/*
  Application Planningo
*/
export const APP_VERSION = "2.0.2";

import { DB_VERSION, getConfig } from "./data/db.js";
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

  // 4b️⃣ Debug : version DB (console uniquement)
  console.info(`[DB] version ${DB_VERSION}`);

  // 5️⃣ Bloquer le "pull-to-refresh" mobile
  disablePullToRefresh();

  // 6️⃣ Bloquer zoom natif (double tap / pinch)
  disableNativeZoom();

  // Toast migration (si necessaire)
  window.addEventListener("db:migrated", () => {
    showToast("Migration terminée");
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 240);
  }, 1800);
}

function disablePullToRefresh() {
  let startY = 0;

  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY;
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!e.touches || e.touches.length === 0) return;
      if (!e.cancelable) return;
      const currentY = e.touches[0].clientY;
      const pullingDown = currentY > startY;

      if (window.scrollY === 0 && pullingDown) {
        e.preventDefault();
      }
    },
    { passive: false },
  );
}

// Bloque double-tap zoom + pinch sur iOS (best effort)
function disableNativeZoom() {
  let lastTouchEnd = 0;

  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );

  document.addEventListener(
    "gesturestart",
    (e) => {
      e.preventDefault();
    },
    { passive: false },
  );
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























