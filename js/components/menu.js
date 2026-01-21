console.log("MENU.JS — CLEAN RESET LOGIC");

import { showHome, showDay, showMonth, showGuidedMonth } from "../router.js";
import { clearAllPlanning, clearPlanningMonth } from "../data/storage.js";
import { setConsultedDate } from "../state/consulted-date.js";
import { getConfig, setConfig } from "../data/storage.js";
import { APP_VERSION } from "../app.js";

// =======================
// SAISON — RESTAURATION
// =======================

async function loadSeasonForm() {
  const entry = await getConfig("saison");
  const saison = entry?.value;
  if (!saison) return;

  const start = document.getElementById("season-start");
  const end = document.getElementById("season-end");
  if (!start || !end) return;

  start.value = saison.saisonDebut || "";
  end.value = saison.saisonFin || "";
}

// =======================
// MENU
// =======================

export function initMenu() {
  // =======================
  // DOM — RESET
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
  // ÉTATS
  // =======================

  let isOpen = false;
  let resetState = "closed"; // closed | choice | month
  let resetDate = new Date();

  // =======================
  // RESET TOTAL — APPUI LONG
  // =======================

  let resetAllTimer = null;
  const RESET_ALL_DURATION = 2500;

  function startResetAllPress() {
    if (resetAllTimer) return;

    resetAllBtn.classList.add("pressing");

    resetAllTimer = setTimeout(async () => {
      resetAllTimer = null;
      resetAllBtn.classList.remove("pressing");

      await clearAllPlanning();
      showToast("Planning entièrement réinitialisé");

      resetState = "closed";
      renderResetPanel();
      closeMenu();
    }, RESET_ALL_DURATION);
  }

  function cancelResetAllPress() {
    resetAllBtn.classList.remove("pressing");
    if (resetAllTimer) {
      clearTimeout(resetAllTimer);
      resetAllTimer = null;
    }
  }

  resetAllBtn.addEventListener("mousedown", startResetAllPress);
  resetAllBtn.addEventListener("mouseup", cancelResetAllPress);
  resetAllBtn.addEventListener("mouseleave", cancelResetAllPress);
  resetAllBtn.addEventListener("touchstart", startResetAllPress);
  resetAllBtn.addEventListener("touchend", cancelResetAllPress);
  resetAllBtn.addEventListener("touchcancel", cancelResetAllPress);

  // =======================
  // MENU — DOM
  // =======================

  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");
  const toggle = document.getElementById("menu-toggle");

  if (!menu || !overlay || !toggle) return;

  toggle.classList.remove("hidden");
  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  menu.classList.remove("open");
  overlay.classList.remove("open");
  menu.setAttribute("aria-hidden", "true");

  // =======================
  // SAISON
  // =======================

  const seasonBtn = document.getElementById("menu-season");
  const seasonForm = document.getElementById("season-form");
  const seasonStart = document.getElementById("season-start");
  const seasonEnd = document.getElementById("season-end");
  const seasonSubmit = document.getElementById("season-submit");
  const seasonReset = document.getElementById("season-reset");

  loadSeasonForm();

  seasonBtn?.addEventListener("click", () => {
    seasonForm.classList.toggle("hidden");
  });

  seasonSubmit?.addEventListener("click", async () => {
    const start = seasonStart.value.trim();
    const end = seasonEnd.value.trim();

    await setConfig(
      "saison",
      start && end ? { saisonDebut: start, saisonFin: end } : {},
    );

    seasonForm.classList.add("hidden");
    closeMenu();
  });

  seasonReset?.addEventListener("click", async () => {
    await setConfig("saison", {});
    seasonStart.value = "";
    seasonEnd.value = "";
    seasonForm.classList.add("hidden");
    closeMenu();
    showHome();
  });

  // =======================
  // CONSULTATION DATE
  // =======================

  const consultBtn = document.getElementById("menu-consult-date");
  const consultForm = document.getElementById("consult-date-form");
  const consultInput = document.getElementById("consult-date-input");
  const consultSubmit = document.getElementById("consult-date-submit");

  consultBtn?.addEventListener("click", () => {
    consultForm.classList.toggle("hidden");
  });

  consultSubmit?.addEventListener("click", () => {
    if (!consultInput.value) return;
    setConsultedDate(consultInput.value);
    consultForm.classList.add("hidden");
    showDay();
    closeMenu();
  });

  // =======================
  // OUVERTURE / FERMETURE
  // =======================

  function openMenu() {
    menu.classList.add("open");
    overlay.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    isOpen = true;
  }

  function closeMenu() {
    menu.classList.remove("open");
    overlay.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");

    resetState = "closed";
    renderResetPanel();
    isOpen = false;
  }

  toggle.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  // =======================
  // RESET — MOIS
  // =======================

  function updateResetMonthLabel() {
    resetMonthLabel.textContent = resetDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
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
    resetState = "choice";
    renderResetPanel();
  });

  resetMonthBtn.addEventListener("click", () => {
    resetDate = new Date();
    resetState = "month";
    updateResetMonthLabel();
    renderResetPanel();
  });

  let holdTimer = null;
  const HOLD_DURATION = 1200;

  resetConfirmMonth.addEventListener("mousedown", startHold);
  resetConfirmMonth.addEventListener("touchstart", startHold);
  resetConfirmMonth.addEventListener("mouseup", cancelHold);
  resetConfirmMonth.addEventListener("mouseleave", cancelHold);
  resetConfirmMonth.addEventListener("touchend", cancelHold);
  resetConfirmMonth.addEventListener("touchcancel", cancelHold);

  function startHold(e) {
    e.preventDefault();
    if (holdTimer) return;

    resetConfirmMonth.classList.add("holding");

    holdTimer = setTimeout(async () => {
      holdTimer = null;
      resetConfirmMonth.classList.remove("holding");

      const monthISO = `${resetDate.getFullYear()}-${String(
        resetDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      await clearPlanningMonth(monthISO);
      showToast("Planning du mois réinitialisé");

      resetState = "closed";
      renderResetPanel();
      closeMenu();
    }, HOLD_DURATION);
  }

  function cancelHold() {
    if (!holdTimer) return;
    clearTimeout(holdTimer);
    holdTimer = null;
    resetConfirmMonth.classList.remove("holding");
  }

  // =======================
  // RESET — NAVIGATION MOIS
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

  // =======================
  // NAVIGATION
  // =======================

  menu.addEventListener("click", (e) => {
    if (resetState !== "closed") return;

    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
      case "home":
        showHome();
        break;
      case "day":
        showDay();
        break;
      case "month":
        showMonth();
        break;
      case "guided-month":
        showGuidedMonth();
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
