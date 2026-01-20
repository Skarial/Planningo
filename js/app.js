/*
  Application Planning PWA
  © 2026 – Tous droits réservés
  Code source original – usage interne / personnel
*/
export const APP_VERSION = "1.0.8";
import { registerServiceWorker } from "./sw/sw-register.js";
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
  registerServiceWorker();
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
// SERVICE WORKER — ARCHI STANDARD
// =======================

function initServiceWorker() {
  if (
    !("serviceWorker" in navigator) ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1"
  ) {
    return;
  }

  async function initServiceWorker() {
    if (
      !("serviceWorker" in navigator) ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1"
    ) {
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register(
        "../service-worker.js",
        {
          scope: "../",
        },
      );

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateBanner(reg);
          }
        });
      });
    } catch (err) {
      console.error("SW registration failed:", err);
    }
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

  banner.querySelector(".update-banner-reload").onclick = async () => {
    const waiting = reg.waiting;
    if (!waiting) return;

    waiting.postMessage("SKIP_WAITING");

    // Rechargement uniquement quand le nouveau SW prend le contrôle
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
// LOG & SÉCURITÉ
// =======================

console.log("APP CHARGÉE – version", APP_VERSION);

window.addEventListener("error", (e) => {
  console.error("ERREUR NON CAPTURÉE :", e.message);
});
