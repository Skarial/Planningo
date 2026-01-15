console.log("menu.js chargé");

import { showHome, showDay, showMonth } from "../router.js";
import { setConsultedDate } from "../state/consulted-date.js";
import { getConfig, setConfig } from "../data/storage.js";

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
  // PÉRIODE SAISONNIÈRE
  // =======================

  const seasonBtn = document.getElementById("menu-season");
  const seasonForm = document.getElementById("season-form");
  const seasonStart = document.getElementById("season-start");
  const seasonEnd = document.getElementById("season-end");
  const seasonSubmit = document.getElementById("season-submit");

  if (seasonBtn && seasonForm && seasonStart && seasonEnd && seasonSubmit) {
    seasonBtn.addEventListener("click", () => {
      seasonForm.classList.toggle("hidden");
    });

    seasonSubmit.addEventListener("click", async () => {
      if (!seasonStart.value || !seasonEnd.value) return;

      const config = await getConfig();
      config.saisonDebut = seasonStart.value;
      config.saisonFin = seasonEnd.value;
      await setConfig(config);

      seasonForm.classList.add("hidden");
      closeMenu();
    });
  }

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
    isOpen = false;
  }

  toggle.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  menu.addEventListener("click", async (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
      case "month":
        showMonth();
        break;

      case "day":
        showDay();
        break;

      case "season": {
        const start = prompt("Début période saisonnière (YYYY-MM-DD)");
        if (!start) break;

        const end = prompt("Fin période saisonnière (YYYY-MM-DD)");
        if (!end) break;

        const config = await getConfig();
        config.saisonDebut = start;
        config.saisonFin = end;
        await setConfig(config);

        alert("Période saisonnière enregistrée");
        break;
      }
    }

    closeMenu();
  });
}
