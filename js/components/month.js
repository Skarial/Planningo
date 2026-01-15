// month.js : planning mensuel interactif (édition locale, offline-first)

import { suggestServices } from "../data/services.js";
import {
  getPlanningForMonth,
  savePlanningEntry,
  getAllServices,
} from "../data/storage.js";
import {
  getAllDaysOfMonth,
  getMonthLabelFR,
  formatDayNumber,
  isMonthLocked,
  getAdjacentMonths,
} from "../utils.js";
import { formatServiceLabel } from "../utils.js";
import { getPeriodeForDate } from "../utils/periods.js";
import { toISODateLocal } from "../utils.js";

// =======================
// ÉTAT LOCAL (AFFICHAGE)
// =======================

let displayedYear = new Date().getFullYear();
let displayedMonthIndex = new Date().getMonth();

// =======================
// RENDER
// =======================

export async function renderMonth() {
  const container = document.getElementById("view-month");
  if (!container) {
    console.error("Conteneur view-month introuvable");
    return;
  }

  container.innerHTML = "";

  // =======================
  // NAVIGATION MOIS
  // =======================

  const nav = document.createElement("div");
  nav.className = "month-nav";

  const prevMonthIndex =
    displayedMonthIndex === 0 ? 11 : displayedMonthIndex - 1;
  const prevMonthYear =
    displayedMonthIndex === 0 ? displayedYear - 1 : displayedYear;

  const nextMonthIndex =
    displayedMonthIndex === 11 ? 0 : displayedMonthIndex + 1;
  const nextMonthYear =
    displayedMonthIndex === 11 ? displayedYear + 1 : displayedYear;

  const prevBtn = document.createElement("button");
  prevBtn.className = "month-btn";
  prevBtn.textContent = `← ${getMonthLabelFR(prevMonthYear, prevMonthIndex)}`;

  prevBtn.onclick = () => {
    displayedMonthIndex--;
    if (displayedMonthIndex < 0) {
      displayedMonthIndex = 11;
      displayedYear--;
    }
    renderMonth();
  };

  const title = document.createElement("div");
  title.className = "month-current";
  title.innerHTML = `
    <div>${getMonthLabelFR(displayedYear, displayedMonthIndex)}</div>
    <div>${displayedYear}</div>
  `;

  const nextBtn = document.createElement("button");
  nextBtn.className = "month-btn";
  nextBtn.textContent = `${getMonthLabelFR(nextMonthYear, nextMonthIndex)} →`;

  nextBtn.onclick = () => {
    displayedMonthIndex++;
    if (displayedMonthIndex > 11) {
      displayedMonthIndex = 0;
      displayedYear++;
    }
    renderMonth();
  };

  nav.append(prevBtn, title, nextBtn);
  container.appendChild(nav);

  // =======================
  // DONNÉES
  // =======================

  const year = displayedYear;
  const monthIndex = displayedMonthIndex;
  const locked = isMonthLocked(year, monthIndex);

  // État strictement local au rendu
  const monthState = {};

  // Chargement des mois utiles (courant + adjacents)
  const monthsToLoad = getAdjacentMonths(year, monthIndex);
  for (const m of monthsToLoad) {
    const entries = await getPlanningForMonth(m);
    entries.forEach((e) => {
      monthState[e.date] = e;
    });
  }

  // Services chargés UNE SEULE FOIS
  const allServices = await getAllServices();
  if (!Array.isArray(allServices)) {
    console.error("allServices invalide", allServices);
    return;
  }

  // =======================
  // GRILLE CALENDAIRE
  // =======================

  const card = document.createElement("div");
  card.className = "card card-month";

  const grid = document.createElement("div");
  grid.className = "month-grid";

  card.appendChild(grid);
  container.appendChild(card);

  // En-têtes semaine
  ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].forEach((d) => {
    const h = document.createElement("div");
    h.className = "day-header";
    h.textContent = d;
    grid.appendChild(h);
  });

  const days = getAllDaysOfMonth(year, monthIndex);
  const firstDayIndex = (days[0].getDay() + 6) % 7;

  // Cases vides avant le 1er
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty-day";
    grid.appendChild(empty);
  }

  // =======================
  // JOURS DU MOIS
  // =======================

  for (const date of days) {
    const iso = toISODateLocal(date);

    if (!monthState[iso]) {
      monthState[iso] = {
        date: iso,
        serviceCode: "REPOS",
        locked: false,
        extra: false,
      };
    }

    const entry = monthState[iso];

    const day = document.createElement("div");
    day.className = "day";

    const num = document.createElement("div");
    num.className = "day-number";
    num.textContent = formatDayNumber(date);

    const label = document.createElement("div");
    label.className = "service-label";
    label.textContent = formatServiceLabel(entry.serviceCode);
    if (entry.serviceCode === "REPOS") label.classList.add("repos");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "service-input";
    input.value = entry.serviceCode;
    if (locked) input.disabled = true;

    const suggest = document.createElement("div");
    suggest.className = "suggest-list";
    suggest.style.display = "none";

    // Focus : reset propre
    input.onfocus = () => {
      input.value = "";
      input.classList.remove("repos");
      suggest.innerHTML = "";
      suggest.style.display = "none";
    };

    // Blur : masquer suggestions
    input.onblur = () => {
      setTimeout(() => {
        suggest.style.display = "none";
      }, 150);
    };

    // Bouton heures sup
    const extraBtn = document.createElement("button");
    extraBtn.className = "extra-btn";
    extraBtn.innerHTML = `⏱ €`;

    function updateExtra() {
      if (entry.serviceCode === "REPOS") {
        extraBtn.style.display = "none";
        entry.extra = false;
        savePlanningEntry(entry);
        return;
      }

      extraBtn.style.display = "block";
      extraBtn.disabled = locked;
      extraBtn.classList.toggle("active", entry.extra === true);
    }

    updateExtra();

    extraBtn.onclick = async () => {
      if (locked) return;
      entry.extra = !entry.extra;
      await savePlanningEntry(entry);
      updateExtra();
    };

    // =======================
    // SAISIE SERVICE (DEBOUNCE)
    // =======================

    const handleInput = debounce(async () => {
      const q = input.value.trim().toUpperCase();

      entry.serviceCode = q || "REPOS";
      label.textContent = formatServiceLabel(entry.serviceCode);
      await savePlanningEntry(entry);
      updateExtra();

      suggest.innerHTML = "";

      if (!q) {
        suggest.style.display = "none";
        return;
      }

      const results = await suggestServices({
        input: q,
        dateISO: iso,
        getAllServices: async () => allServices,
        getPeriodeForDate,
      });

      if (!Array.isArray(results) || results.length === 0) {
        suggest.style.display = "none";
        return;
      }

      results.forEach((service) => {
        const item = document.createElement("div");
        item.className = "suggest-item";
        item.textContent = service.code;

        item.onclick = async () => {
          input.value = service.code;
          entry.serviceCode = service.code;
          label.textContent = formatServiceLabel(service.code);
          await savePlanningEntry(entry);
          updateExtra();
          suggest.style.display = "none";
        };

        suggest.appendChild(item);
      });

      suggest.style.display = "block";
    }, 300);

    input.oninput = handleInput;

    const frag = document.createDocumentFragment();
    frag.append(num, label, input, suggest, extraBtn);
    day.appendChild(frag);

    grid.appendChild(day);
  }
}

// =======================
// OUTILS
// =======================

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
