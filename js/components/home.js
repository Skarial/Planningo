// home.js : vue Accueil - calendrier mensuel + jour actif

// VUE CENTRALE - Accueil (jour + calendrier mensuel)
// Cette vue remplace les anciennes pages :
// - consulter date
// - vue mensuelle dediee
import { HOME_MODE, getHomeMode, setHomeMode } from "../state/home-mode.js";
import { getAllServices } from "../data/storage.js";
import { savePlanningEntry } from "../data/storage.js";
import { renderHomeMonthCalendar } from "./home-month-calendar.js";

import { getPlanningEntry } from "../data/storage.js";

import { getActiveDateISO, setActiveDateISO } from "../state/active-date.js";

import { isDateInConges } from "../domain/conges.js";
import { toISODateLocal } from "../utils.js";
import { getConfig } from "../data/db.js";
import { initMonthFromDateISO } from "../state/month-navigation.js";
import { getPeriodState } from "../domain/periods.js";
import { getPeriodLabel } from "../utils/period-label.js";

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

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(minutes) {
  if (typeof minutes !== "number" || Number.isNaN(minutes) || minutes < 0) {
    return "";
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function buildServiceTimeLines(service, periodLabel) {
  if (!service || !Array.isArray(service.periodes)) return null;
  const matchingPeriod =
    service.periodes.find(
      (periode) =>
        periode &&
        periode.libelle === periodLabel &&
        Array.isArray(periode.plages) &&
        periode.plages.length > 0,
    ) ||
    service.periodes.find(
      (periode) =>
        periode &&
        Array.isArray(periode.plages) &&
        periode.plages.length > 0,
    );

  if (!matchingPeriod || !Array.isArray(matchingPeriod.plages)) {
    return null;
  }

  const lines = matchingPeriod.plages
    .map((plage) => {
      if (!plage || !plage.debut || !plage.fin) return null;
      return {
        text: `${plage.debut} – ${plage.fin}`,
        start: plage.debut,
        end: plage.fin,
      };
    })
    .filter(Boolean);

  if (lines.length === 0) return null;

  const totalMinutes = lines.reduce((sum, line) => {
    const start = parseTimeToMinutes(line.start);
    const end = parseTimeToMinutes(line.end);
    if (start == null || end == null) return sum;
    const diff = end - start;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  return {
    lines,
    duration: formatDuration(totalMinutes),
  };
}

// =======================
// RENDER PUBLIC
// =======================

function renderMonthNav(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "month-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "month-arrow arrow-left";

  const btnNext = document.createElement("button");
  btnNext.className = "month-arrow arrow-right";

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

  wrapper.append(btnPrev, btnNext);
  container.appendChild(wrapper);
}

function bindMonthSwipe(container) {
  if (container.__monthSwipeBound) return;
  container.__monthSwipeBound = true;

  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  container.addEventListener("touchstart", (e) => {
    if (getHomeMode() === HOME_MODE.EDIT_DAY) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
  });

  container.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isSwiping = false;
    }
  });

  container.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    if (Math.abs(deltaX) < 40) return;

    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, deltaX < 0 ? 1 : -1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });
}

// =======================
// CALCUL HEURES JOUR
// =======================

export async function renderHome() {
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  container.innerHTML = "";
  const top = document.createElement("div");
  top.className = "home-top";

  const bottom = document.createElement("div");
  bottom.className = "home-bottom";

  const daySummary = document.createElement("div");
  daySummary.className = "home-day-summary";
  top.appendChild(daySummary);

  const spacer = document.createElement("div");
  spacer.className = "home-spacer";

  container.append(top, spacer, bottom);

  // CONFIG CONGES (cache)
  if (!window.__homeCongesConfig) {
    const congesEntry = await getConfig("conges");
    window.__homeCongesConfig = congesEntry?.value ?? null;
  }

  if (!window.__homeSaisonConfig) {
    const saisonEntry = await getConfig("saison");
    window.__homeSaisonConfig = saisonEntry?.value ?? null;
  }

  initMonthFromDateISO(getActiveDateISO());

  bindMonthSwipe(container);

  // =======================
  // DAY HEADER - JOUR ACTIF
  // =======================

  const iso = getActiveDateISO();
  if (iso) {
    const date = new Date(iso);
    const isCongesDay = isDateInConges(date, window.__homeCongesConfig);

    const section = document.createElement("section");
    section.className = "day-header";

    const left = document.createElement("div");
    left.className = "day-header-left";

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-header-day";
    dayNumber.textContent = date.getDate();

    const month = document.createElement("div");
    month.className = "day-header-month";
    month.textContent = date
      .toLocaleDateString("fr-FR", { month: "long" })
      .toUpperCase();

    const year = document.createElement("div");
    year.className = "day-header-year";
    year.textContent = date.getFullYear();

    left.append(dayNumber, month, year);

    const right = document.createElement("div");
    right.className = "day-header-right";

    const editBtn = document.createElement("button");
    editBtn.id = "edit-btn";
    editBtn.className = "edit-btn";
    editBtn.textContent =
      getHomeMode() === HOME_MODE.EDIT_DAY ? "Fermer" : "Éditer";
    editBtn.onclick = () => {
      setHomeMode(
        getHomeMode() === HOME_MODE.EDIT_DAY
          ? HOME_MODE.VIEW
          : HOME_MODE.EDIT_DAY,
      );
      renderHome();
    };

    right.appendChild(editBtn);

    const service = document.createElement("div");
    service.className = "day-header-service";
    service.hidden = true;

    const time = document.createElement("div");
    time.className = "day-header-time";
    time.hidden = true;

    const duration = document.createElement("div");
    duration.className = "day-header-duration";
    duration.hidden = true;

    const weekday = document.createElement("div");
    weekday.className = "day-header-weekday";
    weekday.textContent = date.toLocaleDateString("fr-FR", {
      weekday: "short",
    });

    right.append(service, time, duration, weekday);

    section.append(left, right);
    daySummary.appendChild(section);

    // chargement service reel
    getPlanningEntry(iso).then((entry) => {
      if (!entry || !entry.serviceCode) {
        if (isCongesDay) {
          service.hidden = false;
          service.textContent = "Congés";
          service.classList.add("conges");
        }
        return;
      }

      service.hidden = false;
      service.textContent = entry.serviceCode;

      if (entry.serviceCode === "REPOS") {
        service.classList.add("repos");
        time.hidden = true;
        time.textContent = "";
        duration.hidden = true;
        duration.textContent = "";
        return;
      }

      if (entry?.startTime && entry?.endTime) {
        time.hidden = false;
        time.textContent = `${entry.startTime} – ${entry.endTime}`;
      }

      if (entry?.duration) {
        duration.hidden = false;
        duration.textContent = entry.duration;
      }

      if (entry?.startTime && entry?.endTime) return;

      getAllServices().then((services) => {
        const serviceCode = entry.serviceCode.toUpperCase();
        const matchedService = services.find(
          (item) =>
            item &&
            typeof item.code === "string" &&
            item.code.toUpperCase() === serviceCode,
        );

        const periodLabel = getPeriodLabel(
          getPeriodState(window.__homeSaisonConfig),
        );
        const timeInfo = buildServiceTimeLines(matchedService, periodLabel);

        if (timeInfo) {
          time.hidden = false;
          time.innerHTML = "";
          timeInfo.lines.forEach((line) => {
            const row = document.createElement("div");
            row.textContent = line.text;
            time.appendChild(row);
          });

          if (timeInfo.duration) {
            duration.hidden = false;
            duration.textContent = timeInfo.duration;
          }
        }
      });
    });
  }

  // NAV MOIS (AU-DESSUS DU CALENDRIER)
  const monthNav = document.createElement("div");
  monthNav.className = "month-nav";
  renderMonthNav(monthNav);
  bottom.appendChild(monthNav);

  // CALENDRIER HOME - rendu circulaire
  const calendarAnchor = document.createElement("div");
  calendarAnchor.id = "home-calendar-anchor";
  bottom.appendChild(calendarAnchor);

  renderHomeMonthCalendar(calendarAnchor, {
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

  // =======================
  // EDITION DU JOUR ACTIF (INLINE)
  // =======================

  if (getHomeMode() === HOME_MODE.EDIT_DAY) {
    const panel = document.createElement("div");
    panel.className = "edit-panel";
    panel.style.pointerEvents = "auto";

    const label = document.createElement("div");
    label.className = "edit-panel-label";

    const iso = getActiveDateISO();
    const [y, m, d] = iso.split("-");

    label.textContent = `Jour sélectionné : ${d}/${m}/${y}`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-panel-input";
    input.placeholder = "Code service (ex : 2910, DM, REPOS)";
    input.autocomplete = "off";

    const suggestContainer = document.createElement("div");
    suggestContainer.className = "edit-panel-suggestions";

    panel.append(label, input, suggestContainer);
    top.appendChild(panel);

    // Preremplissage asynchrone du service existant
    (async () => {
      const entry = await getPlanningEntry(iso);
      if (entry && typeof entry.serviceCode === "string") {
        input.value = entry.serviceCode;
      }
    })();

    (async () => {
      const servicesCatalog = await getAllServices();
      const baseCodes = ["REPOS", "DM", "DAM", "ANNEXE", "TAD"];
      const serviceCodes = servicesCatalog
        .map((service) => service?.code)
        .filter((code) => typeof code === "string" && code.trim() !== "");

      const allCodes = Array.from(
        new Set([...baseCodes, ...serviceCodes].map((code) => code.toUpperCase())),
      ).sort();

      function renderSuggestionsFiltered(filter) {
        suggestContainer.innerHTML = "";
        const f = filter.trim().toUpperCase();
        if (!f) return;

        allCodes
          .filter((code) => code.startsWith(f))
          .forEach((code) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "suggest-btn";
            btn.textContent = code;

            btn.onclick = async () => {
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
          });
      }

      renderSuggestionsFiltered(input.value);
      input.addEventListener("input", () => {
        renderSuggestionsFiltered(input.value);
      });
    })();

    input.focus();
  }
}
