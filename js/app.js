// js/app.js
/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

/*
  Application Planningo
*/
export const APP_VERSION = "2.0.90";

import {
  DB_VERSION,
} from "./data/db.js";

import { registerServiceWorker } from "./sw/sw-register.js";

import { initServicesIfNeeded } from "./data/services-init.js";
import { getActiveDateISO, setActiveDateISO } from "./state/active-date.js";
import { toISODateLocal } from "./utils.js";

import {
  applyRouteGuardFromLocation,
  getEditDayDateFromLocation,
  showEditDayView,
  showExchangesView,
  showHome,
} from "./router.js";
import { initMenu } from "./components/menu.js";
import { installRuntimeDebugLogging } from "./debug/runtime-log.js";

const CONTROLLED_RELOAD_KEY = "planningo_controlled_reload";
const SW_DIAGNOSTIC_KEY = "planningo_sw_diag";
const SW_RELOAD_FALLBACK_MS = 4500;
let viewportObserversBound = false;
let swReloadInFlight = false;
let appRouteBindingsReady = false;

function isServiceWorkerDiagnosticEnabled() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("swdiag") === "1") {
      localStorage.setItem(SW_DIAGNOSTIC_KEY, "1");
    } else if (params.get("swdiag") === "0") {
      localStorage.removeItem(SW_DIAGNOSTIC_KEY);
    }
    return localStorage.getItem(SW_DIAGNOSTIC_KEY) === "1";
  } catch {
    return false;
  }
}

function swDiagLog(...args) {
  if (!isServiceWorkerDiagnosticEnabled()) return;
  console.info("[SW-DIAG]", ...args);
}

function triggerControlledReload(reason) {
  if (swReloadInFlight) {
    swDiagLog("reload ignored (already in flight)", { reason });
    return;
  }
  swReloadInFlight = true;
  swDiagLog("reload triggered", { reason });
  location.reload();
}

// =======================
// INIT
// =======================

window.addEventListener("DOMContentLoaded", () => {
  installRuntimeDebugLogging();
  updateViewportHeightVar();
  initApp();
});
window.addEventListener("pageshow", () => {
  updateViewportHeightVar();
  resetScrollState();
});

async function initApp() {
  bindViewportObservers();
  updateViewportHeightVar();
  resetScrollState();
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // 0 Date active (source unique)
  if (!getActiveDateISO()) {
    setActiveDateISO(toISODateLocal(new Date()));
  }

  // 0b Banner version (si changement)
  notifyVersionChange();

  // 1 UI principale
  initMenu();
  bindAppRouteListeners();
  renderRouteFromLocation();
  prewarmSecondaryViews();
  if (consumeControlledReloadMarker()) {
    stabilizeViewportAfterControlledReload();
  }

  // 2 Services non bloquants
  initServicesIfNeeded();

  // 3 Service Worker + bannire
  await registerServiceWorker(showUpdateBanner);
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      swDiagLog("controllerchange");
    });
  }

  // 3b Debug : version DB (console uniquement)
  console.info(`[DB] version ${DB_VERSION}`);

  // 4 Bloquer le "pull-to-refresh" mobile
  disablePullToRefresh();

  // 5 Bloquer zoom natif (double tap / pinch)
  disableNativeZoom();
  disableFullscreen();

  // Toast migration (si necessaire)
  window.addEventListener("db:migrated", () => {
    showToast("Migration terminée");
  });
}

function renderRouteFromLocation() {
  const routeGuard = applyRouteGuardFromLocation();
  if (routeGuard.resolvedView === "exchanges") {
    showExchangesView();
    return;
  }

  const editDayDateISO = getEditDayDateFromLocation();
  if (editDayDateISO) {
    showEditDayView(editDayDateISO, { updateHash: false });
    return;
  }

  showHome();
}

function bindAppRouteListeners() {
  if (appRouteBindingsReady) return;
  appRouteBindingsReady = true;

  window.addEventListener("hashchange", () => {
    renderRouteFromLocation();
  });

  window.addEventListener("popstate", () => {
    renderRouteFromLocation();
  });
}

function resetScrollState() {
  updateViewportHeightVar();
  document.body.classList.remove("menu-open");
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  window.scrollTo(0, 0);
  const appMain = document.getElementById("app-main");
  if (appMain) {
    appMain.scrollTop = 0;
  }
  document.querySelectorAll("#app-main > section").forEach((section) => {
    section.scrollTop = 0;
  });
  const resetLater = () => {
    updateViewportHeightVar();
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    window.scrollTo(0, 0);
    if (appMain) {
      appMain.scrollTop = 0;
    }
    document.querySelectorAll("#app-main > section").forEach((section) => {
      section.scrollTop = 0;
    });
  };
  requestAnimationFrame(resetLater);
  setTimeout(resetLater, 250);
}

function bindViewportObservers() {
  if (viewportObserversBound) return;
  viewportObserversBound = true;

  window.addEventListener(
    "resize",
    () => {
      updateViewportHeightVar();
    },
    { passive: true },
  );

  window.addEventListener(
    "orientationchange",
    () => {
      updateViewportHeightVar();
      resetScrollState();
    },
    { passive: true },
  );

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      () => {
        updateViewportHeightVar();
      },
      { passive: true },
    );
  }
}

function getViewportHeight() {
  const vv = window.visualViewport?.height;
  if (typeof vv === "number" && vv > 0) {
    return vv;
  }

  if (typeof window.innerHeight === "number" && window.innerHeight > 0) {
    return window.innerHeight;
  }

  if (document.documentElement?.clientHeight > 0) {
    return document.documentElement.clientHeight;
  }

  return 0;
}

function updateViewportHeightVar() {
  const vh = getViewportHeight();
  if (!Number.isFinite(vh) || vh <= 0) return;
  document.documentElement.style.setProperty("--app-vh", `${vh * 0.01}px`);
}

function markControlledReloadPending() {
  try {
    sessionStorage.setItem(CONTROLLED_RELOAD_KEY, "1");
  } catch {}
}

function consumeControlledReloadMarker() {
  try {
    const marked = sessionStorage.getItem(CONTROLLED_RELOAD_KEY) === "1";
    if (marked) {
      sessionStorage.removeItem(CONTROLLED_RELOAD_KEY);
    }
    return marked;
  } catch {
    return false;
  }
}

function stabilizeViewportAfterControlledReload() {
  updateViewportHeightVar();
  resetScrollState();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const homeView = document.getElementById("view-home");
      if (homeView) {
        // Force un recalcul de layout complet avant de reset le scroll.
        void homeView.offsetHeight;
      }
      updateViewportHeightVar();
      resetScrollState();
    });
  });

  setTimeout(() => {
    updateViewportHeightVar();
    resetScrollState();
  }, 180);
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

  function isScrollableElement(el) {
    if (!el || el === document.body || el === document.documentElement) {
      return false;
    }
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if (overflowY !== "auto" && overflowY !== "scroll") return false;
    return el.scrollHeight > el.clientHeight;
  }

  function isInsideScrollableArea(target) {
    if (!target || !target.closest) return false;
    let node = target;
    while (node && node !== document.body) {
      if (isScrollableElement(node)) return true;
      node = node.parentElement;
    }
    return false;
  }

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
      if (isInsideScrollableArea(e.target)) return;
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

function disableFullscreen() {
  function exitIfFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  document.addEventListener("fullscreenchange", exitIfFullscreen);
  document.addEventListener("webkitfullscreenchange", exitIfFullscreen);

  const proto = HTMLElement.prototype;
  if (proto.requestFullscreen) {
    const original = proto.requestFullscreen;
    proto.requestFullscreen = function (...args) {
      return original.call(this, ...args).catch(() => {});
    };
  }
  if (proto.webkitRequestFullscreen) {
    const originalWebkit = proto.webkitRequestFullscreen;
    proto.webkitRequestFullscreen = function (...args) {
      return originalWebkit.call(this, ...args);
    };
  }
}

// =======================
// BANNIRE DE MISE  JOUR
// =======================

function notifyVersionChange() {
  const key = "planningo_app_version";
  const lastVersion = localStorage.getItem(key);
  localStorage.setItem(key, APP_VERSION);

  if (!lastVersion || lastVersion === APP_VERSION) return;
  showVersionBanner(lastVersion, APP_VERSION);
}

function showVersionBanner(prevVersion, nextVersion) {
  if (document.getElementById("version-banner")) return;

  const banner = document.createElement("div");
  banner.id = "version-banner";
  banner.className = "update-banner";

  banner.innerHTML = `
    <div class="update-content">
      <div class="update-text">
        <strong>Mise à jour installée</strong>
        <span>Version ${prevVersion} -> ${nextVersion}</span>
      </div>
      <div class="update-actions">
        <button class="btn-primary" id="version-reload">Mettre à jour</button>
        <button class="btn-secondary" id="version-dismiss">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("version-dismiss").addEventListener("click", () => {
    banner.remove();
  });

  document.getElementById("version-reload").addEventListener("click", () => {
    markControlledReloadPending();
    triggerControlledReload("version-banner");
  });
}


function showUpdateBanner(registration) {
  if (!registration?.waiting) {
    swDiagLog("update banner skipped (no waiting worker)");
    return;
  }

  // Securite : ne jamais dupliquer
  if (document.getElementById("update-banner")) {
    swDiagLog("update banner already displayed");
    return;
  }

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner";

  banner.innerHTML = `
    <div class="update-content">
      <div class="update-text">
        <strong>Mise à jour disponible</strong>
        <span>Une nouvelle version de l'application est prête.</span>
      </div>
      <div class="update-actions">
        <button class="btn-secondary" id="update-dismiss">Plus tard</button>
        <button class="btn-primary" id="update-reload">Mettre à jour</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
  swDiagLog("update banner displayed", {
    waitingScriptURL: registration.waiting?.scriptURL || null,
  });

  const reloadButton = document.getElementById("update-reload");
  const dismissButton = document.getElementById("update-dismiss");
  let resolved = false;
  let fallbackTimer = null;

  const cleanup = () => {
    navigator.serviceWorker.removeEventListener(
      "controllerchange",
      onControllerChange,
    );
    if (fallbackTimer !== null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const finalizeReload = (reason) => {
    if (resolved) return;
    resolved = true;
    cleanup();
    markControlledReloadPending();
    banner.remove();
    triggerControlledReload(reason);
  };

  const onControllerChange = () => {
    finalizeReload("controllerchange");
  };

  reloadButton.addEventListener("click", () => {
    if (resolved) return;
    swDiagLog("update button clicked", {
      hasWaitingWorker: Boolean(registration.waiting),
    });
    reloadButton.disabled = true;
    dismissButton.disabled = true;

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    fallbackTimer = setTimeout(() => {
      swDiagLog("controllerchange timeout fallback", {
        timeoutMs: SW_RELOAD_FALLBACK_MS,
      });
      finalizeReload("controllerchange-timeout");
    }, SW_RELOAD_FALLBACK_MS);

    try {
      if (!registration.waiting) {
        swDiagLog("missing waiting worker when update clicked");
        finalizeReload("waiting-missing");
        return;
      }
      registration.waiting.postMessage("SKIP_WAITING");
      swDiagLog("SKIP_WAITING sent");
    } catch (error) {
      swDiagLog("SKIP_WAITING failed", {
        message: error?.message || String(error),
      });
      finalizeReload("skip-waiting-error");
    }
  });

  dismissButton.addEventListener("click", () => {
    cleanup();
    swDiagLog("update dismissed");
    banner.remove();
  });
}

function prewarmSecondaryViews() {
  const preload = () => {
    const modules = [
      () => import("./components/guided-month.js"),
      () => import("./components/conges-periods.js"),
      () => import("./components/suggestions.js"),
      () => import("./components/summary.js"),
      () => import("./components/alarm.js"),
      () => import("./components/phone-change.js"),
      () => import("./components/legal.js"),
      () => import("./components/reset.js"),
      () => import("./components/consult-date.js"),
      () => import("./components/conges.js"),
      () => import("./components/season.js"),
    ];

    modules.reduce(
      (promise, load) =>
        promise.then(() => load().catch(() => {})),
      Promise.resolve(),
    );
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(preload, { timeout: 5000 });
    return;
  }

  setTimeout(preload, 1200);
}


















































































































