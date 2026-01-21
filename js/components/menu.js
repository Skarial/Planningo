console.log("MENU.JS VERSION RESET STATE ACTIVE");

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

  let touchStartX = 0;
  let touchStartY = 0;
  let currentTranslateX = 0;
  let isSwiping = false;

  let resetState = "closed"; // "closed" | "choice" | "month"
  let resetDate = new Date();

  // =======================
  // DOM — MENU
  // =======================

  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");
  const toggle = document.getElementById("menu-toggle");
  // =======================
  // NORMALISATION ÉTAT MENU (ANTI-CACHE)
  // =======================

  toggle.classList.remove("hidden");
  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  menu.classList.remove("open");
  overlay.classList.remove("open");
  menu.setAttribute("aria-hidden", "true");

  if (!menu || !overlay || !toggle) {
    console.error("Menu DOM manquant");
    return;
  }

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

  if (seasonBtn && seasonForm) {
    seasonBtn.addEventListener("click", () => {
      seasonForm.classList.toggle("hidden");
    });
  }

  if (seasonSubmit && seasonStart && seasonEnd && seasonForm) {
    seasonSubmit.addEventListener("click", async () => {
      const start = seasonStart.value.trim();
      const end = seasonEnd.value.trim();

      if (!start || !end) {
        await setConfig("saison", {});
      } else {
        await setConfig("saison", {
          saisonDebut: start,
          saisonFin: end,
        });
      }

      seasonForm.classList.add("hidden");
      closeMenu();
    });
  }

  seasonReset.addEventListener("click", async () => {
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

  if (consultBtn && consultForm && consultInput && consultSubmit) {
    consultBtn.addEventListener("click", () => {
      consultForm.classList.toggle("hidden");
    });

    consultSubmit.addEventListener("click", () => {
      if (!consultInput.value) return;

      setConsultedDate(consultInput.value);
      consultForm.classList.add("hidden");
      showDay();
      closeMenu();
    });
  }

  // =======================
  // OUVERTURE / FERMETURE
  // =======================

  function openMenu() {
    menu.classList.add("open");
    overlay.classList.add("open");
    menu.setAttribute("aria-hidden", "false");

    menu.style.transition = "transform 0.25s ease";
    menu.style.transform = "translateX(0)";

    isOpen = true;
  }

  function closeMenu() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    menu.classList.remove("open");
    overlay.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");

    isOpen = false;
    resetState = "closed";
    renderResetPanel();
    menu.style.transition = "";
    menu.style.transform = "";
    currentTranslateX = 0;
  }

  toggle.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);
  // =======================
  // SWIPE GAUCHE — ANIMATION PROGRESSIVE
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

    // Si le geste est vertical → on abandonne le swipe
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isSwiping = false;
      menu.style.transition = "";
      return;
    }

    // On limite au swipe gauche
    if (deltaX < 0) {
      currentTranslateX = deltaX;
      menu.style.transform = `translateX(${deltaX}px)`;
    }
  });

  menu.addEventListener("touchend", () => {
    if (!isOpen) return;

    menu.style.transition = "transform 0.25s ease";

    // seuil de fermeture (30% de la largeur du menu)
    const closeThreshold = -menu.offsetWidth * 0.3;

    if (currentTranslateX < closeThreshold) {
      closeMenu();
    } else {
      // retour à la position ouverte
      menu.style.transform = "translateX(0)";
    }

    isSwiping = false;
    currentTranslateX = 0;
  });

  menu.addEventListener("touchend", () => {
    isSwiping = false;
  });

  // =======================
  // RESET — LOGIQUE
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

    if (resetState === "choice") {
      resetPanel.classList.remove("hidden");
    }

    if (resetState === "month") {
      resetPanel.classList.remove("hidden");
      resetMonthPicker.classList.remove("hidden");
      resetConfirmMonth.classList.remove("hidden");
    }
  }

  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetState = "choice";
    renderResetPanel();
  });

  resetAllBtn.addEventListener("click", async () => {
    const ok = confirm(
      "Cette action supprimera tout le planning.\nAction irréversible.\n\nConfirmer ?",
    );

    if (!ok) return;

    await clearAllPlanning();
    alert("Planning entièrement réinitialisé.");

    resetState = "closed";
    renderResetPanel();
    closeMenu();
  });

  resetMonthBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetDate = new Date();
    resetState = "month";
    updateResetMonthLabel();
    renderResetPanel();
  });

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

  resetConfirmMonth.addEventListener("click", async (e) => {
    e.stopPropagation();

    const monthISO = `${resetDate.getFullYear()}-${String(
      resetDate.getMonth() + 1,
    ).padStart(2, "0")}`;

    const ok = confirm(
      `Supprimer définitivement le planning de ${resetMonthLabel.textContent} ?`,
    );

    if (!ok) return;

    await clearPlanningMonth(monthISO);
    alert("Planning du mois réinitialisé.");

    resetState = "closed";
    renderResetPanel();
    closeMenu();
  });

  // =======================
  // NAVIGATION
  // =======================

  menu.addEventListener("click", (e) => {
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
      case "tetribus":
        import("../router.js").then(({ showTetribusView }) => {
          showTetribusView();
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
