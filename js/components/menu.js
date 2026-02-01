/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/menu.js

import { setUiMode, UI_MODE } from "../state/ui-mode.js";
import {
  refreshCurrentView,
  showHome,
  showGuidedMonth,
  showCongesView,
  showSeasonView,
  showSuggestionsView,
  showSummaryView,
  showPhoneChangeView,
  showLegalView,
} from "../router.js";

import { clearAllPlanning, clearPlanningMonth } from "../data/storage.js";
import { APP_VERSION } from "../app.js";

// =======================
// MENU
// =======================

function afficherResetEnHaut() {
  const resetPanel = document.getElementById("reset-panel");
  if (!resetPanel) return;

  resetPanel.scrollIntoView({
    block: "start",
    behavior: "auto",
  });
}

function capitalizeFirst(input) {
  if (typeof input !== "string" || input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function initMenu() {
  // =======================
  // DOM â€” RESET
  // =======================

  const resetBtn = document.getElementById("menu-reset");
  const resetPanel = document.getElementById("reset-panel");
  const resetAllBtn = document.getElementById("reset-all");
  const resetMonthBtn = document.getElementById("reset-month");

  const resetMonthPicker = document.getElementById("reset-month-picker");
  const resetMonthLabel = document.getElementById("reset-month-label");
  const resetPrevMonth = document.getElementById("reset-prev-month");
  const resetNextMonth = document.getElementById("reset-next-month");
  const resetConfirmMonth = document.getElementById("reset-confirm-month");

  // =======================
  // ETATS
  // =======================

  let isOpen = false;
  let resetState = "closed"; // closed | choice | month
  let resetDate = new Date();
  let touchStartX = 0;
  let touchStartY = 0;
  let currentTranslateX = 0;
  let isSwiping = false;

  // =======================
  // RESET TOTAL â€” APPUI LONG (FIABLE)
  // =======================

  let resetAllTimer = null;
  const RESET_ALL_DURATION = 1200;

  function startResetAllPress(e) {
    e.preventDefault();
    e.stopPropagation();

    if (resetAllTimer) return;

    resetAllBtn.classList.add("holding");
    menu.classList.add("long-pressing");

    resetAllTimer = setTimeout(async () => {
      resetAllTimer = null;
      resetAllBtn.classList.remove("holding");
      menu.classList.remove("long-pressing");

      await clearAllPlanning();
      showToast("Planning entierement reinitialise");

      refreshCurrentView();

      resetState = "closed";
      renderResetPanel();
      closeMenu();
    }, RESET_ALL_DURATION);
  }

  function cancelResetAllPress() {
    if (!resetAllTimer) return;

    clearTimeout(resetAllTimer);
    resetAllTimer = null;
    resetAllBtn.classList.remove("holding");
    menu.classList.remove("long-pressing");
  }

  resetAllBtn.addEventListener("pointerdown", startResetAllPress);
  resetAllBtn.addEventListener("pointerup", cancelResetAllPress);
  resetAllBtn.addEventListener("pointercancel", cancelResetAllPress);

  // =======================
  // MENU â€” DOM
  // =======================

  const menu = document.getElementById("side-menu");

  const overlay = document.getElementById("menu-overlay");
  const toggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("menu-close");

  if (!menu || !overlay || !toggle || !closeBtn) return;

  if (!menu.querySelector(".menu-long-press-bar")) {
    const bar = document.createElement("div");
    bar.className = "menu-long-press-bar";
    menu.appendChild(bar);
  }

  toggle.classList.remove("hidden");
  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  menu.classList.remove("open");
  overlay.classList.remove("open");
  menu.inert = true;

  // =======================
  // OUTILS (VUES DEDIEES)
  // =======================

  const congesBtn = document.getElementById("menu-conges");
  const seasonBtn = document.getElementById("menu-season");
  const suggestionsBtn = document.getElementById("menu-suggestions");
  const summaryBtn = document.getElementById("menu-summary");
  const phoneBtn = document.getElementById("menu-phone-change");
  const alarmBtn = document.getElementById("menu-alarm");
  const legalBtn = document.getElementById("menu-legal");

  congesBtn.addEventListener("click", () => {
    showCongesView();
    closeMenu();
  });

  seasonBtn.addEventListener("click", () => {
    showSeasonView();
    closeMenu();
  });

  suggestionsBtn.addEventListener("click", () => {
    showSuggestionsView();
    closeMenu();
  });

  summaryBtn.addEventListener("click", () => {
    showSummaryView();
    closeMenu();
  });

  alarmBtn.addEventListener("click", () => {
    showToast("Bient\u00f4t disponible");
  });

  phoneBtn.addEventListener("click", () => {
    showPhoneChangeView();
    closeMenu();
  });

  legalBtn.addEventListener("click", () => {
    showLegalView();
    closeMenu();
  });

  // =======================
  // CONSULTATION DATE
  // =======================

  const consultBtn = document.getElementById("menu-consult-date");
  const consultForm = document.getElementById("consult-date-form");
  const consultInput = document.getElementById("consult-date-input");
  const consultSubmit = document.getElementById("consult-date-submit");

  consultBtn.addEventListener("click", () => {
    consultForm.classList.toggle("hidden");
  });

  consultSubmit.addEventListener("click", () => {
    if (!consultInput.value) return;

    consultForm.classList.add("hidden");

    // Nouveau comportement : on fixe la date active, puis Home
    import("../state/active-date.js").then(({ setActiveDateISO }) => {
      setActiveDateISO(consultInput.value);
      showHome();
    });

    closeMenu();
  });

  // =======================
  // OUVERTURE / FERMETURE
  // =======================

  function openMenu() {
    menu.classList.add("open");
    overlay.classList.add("open");

    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");

    isOpen = true;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (document.activeElement) {
      document.activeElement.blur();
    }

    menu.classList.remove("open");
    overlay.classList.remove("open");
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");

    resetState = "closed";
    renderResetPanel();

    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    menu.style.transform = "";
    menu.style.transition = "";
    currentTranslateX = 0;

    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  // =======================
  // SWIPE GAUCHE â€” FERMETURE MENU
  // =======================

  menu.addEventListener("touchstart", (e) => {
    if (!isOpen) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = true;

    menu.style.transition = "none";
  });

  menu.addEventListener("touchmove", (e) => {
    if (!isOpen || !isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // si geste vertical -> abandon swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isSwiping = false;
      menu.style.transition = "";
      return;
    }

    // swipe gauche uniquement
    if (deltaX < 0) {
      currentTranslateX = deltaX;
      menu.style.transform = `translateX(${deltaX}px)`;
    }
  });

  menu.addEventListener("touchend", () => {
    if (!isOpen) return;

    menu.style.transition = "transform 0.25s ease";
    const threshold = -menu.offsetWidth * 0.3;

    if (currentTranslateX < threshold) {
      closeMenu();
    } else {
      menu.style.transform = "translateX(0)";
    }

    isSwiping = false;
    currentTranslateX = 0;
  });

  // =======================
  // RESET â€” MOIS
  // =======================

  function updateResetMonthLabel() {
    resetMonthLabel.textContent = capitalizeFirst(
      resetDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    );
  }

  function renderResetPanel() {
    resetPanel.classList.add("hidden");
    resetMonthPicker.classList.add("hidden");
    resetConfirmMonth.classList.add("hidden");

    if (resetState === "choice") resetPanel.classList.remove("hidden");
    if (resetState === "month") {
      resetPanel.classList.remove("hidden");
      resetMonthPicker.classList.remove("hidden");
      resetConfirmMonth.classList.remove("hidden");
    }
  }

  resetBtn.addEventListener("click", () => {
    if (resetState === "choice" || resetState === "month") {
      resetState = "closed";
      renderResetPanel();
      return;
    }

    resetState = "choice";
    renderResetPanel();
    afficherResetEnHaut();
  });

  resetMonthBtn.addEventListener("click", () => {
    resetDate = new Date();
    resetState = "month";
    updateResetMonthLabel();
    renderResetPanel();
    afficherResetEnHaut();
  });

  let holdTimer = null;
  const HOLD_DURATION = 1200;

  resetConfirmMonth.addEventListener("pointerdown", startHold);
  resetConfirmMonth.addEventListener("pointerup", cancelHold);
  resetConfirmMonth.addEventListener("pointercancel", cancelHold);

  function startHold(e) {
    e.preventDefault();
    e.stopPropagation();

    resetConfirmMonth.setPointerCapture(e.pointerId);

    if (holdTimer) return;

    resetConfirmMonth.classList.add("holding");
    menu.classList.add("long-pressing");

    holdTimer = setTimeout(async () => {
      holdTimer = null;
      resetConfirmMonth.classList.remove("holding");
      menu.classList.remove("long-pressing");

      const monthISO = `${resetDate.getFullYear()}-${String(
        resetDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      await clearPlanningMonth(monthISO);
      showToast("Planning du mois reinitialise");

      refreshCurrentView();

      resetState = "closed";
      renderResetPanel();
      closeMenu();
    }, HOLD_DURATION);
  }

  function cancelHold(e) {
    if (e.pointerId !== undefined) {
      resetConfirmMonth.releasePointerCapture(e.pointerId);
    }

    if (!holdTimer) return;

    clearTimeout(holdTimer);
    holdTimer = null;
    resetConfirmMonth.classList.remove("holding");
    menu.classList.remove("long-pressing");
  }

  // =======================
  // RESET â€” NAVIGATION MOIS
  // =======================

  resetPrevMonth.addEventListener("click", (e) => {
    e.stopPropagation();

    resetDate.setMonth(resetDate.getMonth() - 1);
    updateResetMonthLabel();
  });

  resetNextMonth.addEventListener("click", (e) => {
    e.stopPropagation();

    resetDate.setMonth(resetDate.getMonth() + 1);
    updateResetMonthLabel();
  });

  function setActiveMenu(action) {
    const buttons = menu.querySelectorAll("button[data-action]");
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.action === action);
    });
  }

  setActiveMenu("home");

  // =======================
  // NAVIGATION
  // =======================

  menu.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;

    if (resetState !== "closed") return;

    switch (action) {
      case "home":
        setUiMode(UI_MODE.CONSULTATION);
        showHome();
        setActiveMenu("home");
        break;

      case "day":
        break;

      case "guided-month":
        setUiMode(UI_MODE.SAISIE_MENSUELLE);

        showGuidedMonth();
        setActiveMenu("guided-month");
        break;

      case "tetribus":
        import("../router.js").then(({ showTetribusView }) => {
          showTetribusView();
          setActiveMenu("tetribus");
        });
        break;
    }

    closeMenu();
  });

  // =======================
  // VERSION
  // =======================

  const versionEl = document.getElementById("app-version");
  if (versionEl) {
    versionEl.textContent = `Version ${APP_VERSION}`;
  }
}

// =======================
// TOAST
// =======================

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

