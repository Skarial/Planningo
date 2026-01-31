// home.js : vue Accueil — calendrier mensuel + jour actif

// VUE CENTRALE — Accueil (jour + calendrier mensuel)
// Cette vue remplace les anciennes pages :
// - consulter date
// - planning mensuel
import { renderMonthCalendar } from "./month-calendar.js";
import { HOME_MODE, getHomeMode, setHomeMode } from "../state/home-mode.js";
import { getServiceSuggestions } from "../domain/service-suggestions.js";
import { getAllServices } from "../data/storage.js";
import { savePlanningEntry } from "../data/storage.js";

import { getPlanningEntry } from "../data/storage.js";

import { getActiveDateISO, setActiveDateISO } from "../state/active-date.js";

import { isDateInConges } from "../domain/conges.js";
import { toISODateLocal } from "../utils.js";
import { getConfig } from "../data/db.js";
import { initMonthFromDateISO } from "../state/month-navigation.js";

function parseISODateLocal(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function shiftMonth(date, delta) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const targetMonth = month + delta;

  const day = date.getDate();

  // dernier jour du mois cible
  const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();

  const safeDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(year, targetMonth, safeDay);
}

// =======================
// RENDER PUBLIC
// =======================

function renderTodayButton(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "today-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "today-arrow arrow-left";

  const btn = document.createElement("button");
  btn.className = "today-reset-btn";
  btn.textContent = "Revenir à aujourd’hui";

  const btnNext = document.createElement("button");
  btnNext.className = "today-arrow arrow-right";

  btnPrev.addEventListener("click", () => {
    if (getHomeMode() === HOME_MODE.EDIT_DAY) return;

    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, -1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });

  btnNext.addEventListener("click", () => {
    if (getHomeMode() === HOME_MODE.EDIT_DAY) return;

    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, +1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });

  btn.addEventListener("click", () => {
    if (getHomeMode() === HOME_MODE.EDIT_DAY) return;

    setActiveDateISO(toISODateLocal(new Date()));
    renderHome();
  });

  wrapper.append(btnPrev, btn, btnNext);
  container.appendChild(wrapper);

  updateTodayButtonVisibility(container);
}

function updateTodayButtonVisibility(container) {
  const wrapper = container.querySelector(".today-nav");
  if (!wrapper) return;

  const resetBtn = wrapper.querySelector(".today-reset-btn");
  if (!resetBtn) return;

  const activeISO = getActiveDateISO();
  if (!activeISO) return;

  const activeDate = parseISODateLocal(activeISO);
  const today = new Date();

  const isSameMonth =
    activeDate.getFullYear() === today.getFullYear() &&
    activeDate.getMonth() === today.getMonth();

  resetBtn.style.visibility = isSameMonth ? "hidden" : "visible";
}

// =======================
// CALCUL HEURES JOUR
// =======================

function renderHomeCalendar(container) {
  renderMonthCalendar(container, {
    getServiceForDateISO: (iso) => getPlanningEntry(iso),
    isDateInConges: (date) => {
      const congesEntry = window.__homeCongesConfig;
      return isDateInConges(date, congesEntry);
    },
    onDaySelected: (iso) => {
      if (getHomeMode() === HOME_MODE.EDIT_DAY) return;

      setActiveDateISO(iso);
      initMonthFromDateISO(iso);
      renderHome();
    },
  });
}

export async function renderHome() {
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  container.innerHTML = "";

  // CONFIG CONGÉS (cache)
  if (!window.__homeCongesConfig) {
    const congesEntry = await getConfig("conges");
    window.__homeCongesConfig = congesEntry?.value ?? null;
  }

  initMonthFromDateISO(getActiveDateISO());

  // HEADER
  const header = document.createElement("div");
  header.className = "home-header";

  container.appendChild(header);

  renderTodayButton(header);
  // =======================
  // DAY HEADER — JOUR ACTIF (VIEW)
  // =======================

  if (getHomeMode() === HOME_MODE.VIEW) {
    const iso = getActiveDateISO();
    if (iso) {
      const date = new Date(iso);

      const section = document.createElement("section");
      section.className = "day-header";

      const left = document.createElement("div");
      left.className = "day-header-left";

      const dayNumber = document.createElement("div");
      dayNumber.className = "day-header-day";
      dayNumber.textContent = date.getDate();

      const month = document.createElement("div");
      month.className = "day-header-month";
      month.textContent = date.toLocaleDateString("fr-FR", { month: "long" });

      const year = document.createElement("div");
      year.className = "day-header-year";
      year.textContent = date.getFullYear();

      left.append(dayNumber, month, year);

      const right = document.createElement("div");
      right.className = "day-header-right";

      const service = document.createElement("div");
      service.className = "day-header-service";
      service.textContent = "—";

      const time = document.createElement("div");
      time.className = "day-header-time";

      const duration = document.createElement("div");
      duration.className = "day-header-duration";

      const weekday = document.createElement("div");
      weekday.className = "day-header-weekday";
      weekday.textContent = date.toLocaleDateString("fr-FR", {
        weekday: "short",
      });

      right.append(service, time, duration, weekday);

      section.append(left, right);
      container.appendChild(section);

      // chargement service réel
      getPlanningEntry(iso).then((entry) => {
        if (!entry) return;

        if (entry.serviceCode) {
          service.textContent = entry.serviceCode;

          if (entry.serviceCode === "REPOS") {
            service.classList.add("repos");
          }
        }

        if (entry.startTime && entry.endTime) {
          time.textContent = `${entry.startTime} – ${entry.endTime}`;
        }

        if (entry.duration) {
          duration.textContent = entry.duration;
        }
      });
    }
  }

  // BOUTON ÉDITER
  const editBtn = document.createElement("button");
  editBtn.id = "edit-btn";
  editBtn.className = "edit-btn";
  editBtn.textContent = "Éditer";
  editBtn.onclick = () => {
    setHomeMode(HOME_MODE.EDIT_DAY);
    renderHome();
  };

  header.appendChild(editBtn);
  if (getHomeMode() === HOME_MODE.EDIT_DAY) {
    const backBtn = document.createElement("button");
    backBtn.className = "edit-back-btn";
    backBtn.textContent = "← Retour";

    backBtn.onclick = () => {
      setHomeMode(HOME_MODE.VIEW);
      renderHome();
    };

    header.appendChild(backBtn);
  }

  // CALENDRIER
  const calendarAnchor = document.createElement("div");
  calendarAnchor.id = "home-calendar-anchor";
  container.appendChild(calendarAnchor);

  renderHomeCalendar(calendarAnchor);
  calendarAnchor.style.pointerEvents = "auto";

  // =======================
  // ÉDITION DU JOUR ACTIF (INLINE)
  // =======================

  if (getHomeMode() === HOME_MODE.EDIT_DAY) {
    const editZone = document.createElement("div");
    editZone.className = "edit-day-zone";
    editZone.style.pointerEvents = "auto";

    const label = document.createElement("div");
    label.className = "edit-day-label";

    const iso = getActiveDateISO();
    const [y, m, d] = iso.split("-");

    label.textContent = `Jour sélectionné : ${d}/${m}/${y}`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-day-input";
    input.placeholder = "Code service (ex : 2910, DM, REPOS)";
    input.autocomplete = "off";

    // Préremplissage asynchrone du service existant
    (async () => {
      const iso = getActiveDateISO();
      const entry = await getPlanningEntry(iso);

      if (entry && typeof entry.serviceCode === "string") {
        input.value = entry.serviceCode;
      }
    })();

    editZone.append(label, input);
    // =======================
    // SUGGESTIONS SERVICES (LECTURE SEULE)
    // =======================

    const suggestContainer = document.createElement("div");
    suggestContainer.className = "edit-day-suggestions";
    editZone.appendChild(suggestContainer);

    (async () => {
      const servicesCatalog = await getAllServices();
      const suggestions = getServiceSuggestions({
        servicesCatalog,
        saisonConfig: null,
        date: new Date(getActiveDateISO()),
        mode: "HOME_EDIT",
      });

      function renderSuggestionsFiltered(filter) {
        suggestContainer.innerHTML = "";

        const f = filter.trim().toUpperCase();

        // 🔒 UX : aucune suggestion si champ vide
        if (!f) {
          return;
        }

        function match(code) {
          if (!f) return true;
          return code.startsWith(f);
        }

        function addSuggestionButton(code) {
          if (!match(code)) return;

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "suggest-btn";
          btn.textContent = code;

          btn.onclick = async () => {
            const iso = getActiveDateISO();

            await savePlanningEntry({
              date: iso,
              serviceCode: code,
              locked: false,
              extra: false,
            });

            setHomeMode(HOME_MODE.VIEW);
            renderHome();
          };

          suggestContainer.appendChild(btn);
        }

        suggestions.REPOS.forEach(addSuggestionButton);
        suggestions.DM.forEach(addSuggestionButton);
        suggestions.DAM.forEach(addSuggestionButton);
        suggestions.ANNEXE.forEach(addSuggestionButton);
        suggestions.TAD.forEach(addSuggestionButton);

        Object.keys(suggestions.LIGNES)
          .sort()
          .forEach((line) => {
            suggestions.LIGNES[line].forEach(addSuggestionButton);
          });
      }

      // rendu initial (champ vide)
      renderSuggestionsFiltered("");

      // filtrage dynamique
      input.addEventListener("input", () => {
        renderSuggestionsFiltered(input.value);
      });
    })();

    container.appendChild(editZone);

    // Focus immédiat pour saisie rapide
    input.focus();
  }
}
