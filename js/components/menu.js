import { showHome, showDay, showMonth } from "../router.js";
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
  let isOpen = false;

  const menu = document.getElementById("side-menu");
  const overlay = document.getElementById("menu-overlay");
  const toggle = document.getElementById("menu-toggle");

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
    // 1) Suppression de la saison
    await setConfig("saison", {});

    // 2) Reset UI du formulaire
    seasonStart.value = "";
    seasonEnd.value = "";
    seasonForm.classList.add("hidden");

    // 3) Fermeture du menu
    closeMenu();

    // 4) RAFRAÎCHISSEMENT LOGIQUE DE L’APP
    // (sans reload, sans casser la PWA)
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
    isOpen = true;
  }

  function closeMenu() {
    // 1) Retirer le focus de l’élément actif (bouton du menu)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2) Fermer visuellement le menu
    menu.classList.remove("open");
    overlay.classList.remove("open");

    // 3) Marquer le menu comme caché pour l’accessibilité
    menu.setAttribute("aria-hidden", "true");

    isOpen = false;
  }

  toggle.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

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
        import("../router.js").then(({ showGuidedMonth }) => {
          showGuidedMonth();
        });
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
