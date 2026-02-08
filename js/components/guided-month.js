// js/components/guided-month.js

import { getServiceSuggestions } from "../domain/service-suggestions.js";
import { getUiMode } from "../state/ui-mode.js";

import {
  getAllServices,
  savePlanningEntry,
  getPlanningEntry,
} from "../data/storage.js";

import { getConfig } from "../data/db.js";
import { getServiceDisplayName, toISODateLocal } from "../utils.js";
import { showAlarmView, showHome } from "../router.js";
import { getGuidedStartDay, isDateInConges } from "../domain/conges.js";
import { hasPanier } from "../domain/service-panier.js";
import { markAlarmResyncPending } from "../state/alarm-resync.js";

function capitalizeFirst(input) {
  if (typeof input !== "string" || input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

function isMorningServiceCode(serviceCode) {
  if (typeof serviceCode !== "string") return false;
  const normalized = serviceCode.trim().toUpperCase();
  if (!normalized) return false;
  if (normalized === "DM") return true;
  if (normalized === "DAM") return false;
  if (!/^\d{3,}$/.test(normalized)) return false;
  return Number(normalized) % 2 === 1;
}

// =======================
// VUE : PRPARER MOIS SUIVANT
// =======================
async function findFirstIncompleteMonth(startDate) {
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  for (let i = 0; i < 12; i++) {
    const testDate = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const year = testDate.getFullYear();
    const monthIndex = testDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      const iso = toISODateLocal(date);
      const entry = await getPlanningEntry(iso);

      if (!entry || entry.serviceCode === "") {
        return testDate;
      }
    }
  }

  return base; // fallback de scurit
}

let guidedMonthDate = null;
let selectedLine = null;
let groupedSuggestions = null;

export async function showGuidedMonth(forcedDate = null) {
  const view = document.getElementById("view-guided-month");
  if (!view) return;

  // Masquer les autres vues

  view.innerHTML = "";

  // =======================
  // CALCUL MOIS SUIVANT
  // =======================

  if (forcedDate) {
    guidedMonthDate = new Date(forcedDate);
  } else if (!guidedMonthDate) {
    const today = new Date();
    guidedMonthDate = await findFirstIncompleteMonth(today);
  }

  const targetDate = new Date(guidedMonthDate);

  const year = targetDate.getFullYear();
  const monthIndex = targetDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let currentDay = 1;

  async function resumeCurrentDayFromDB() {
    for (let d = daysInMonth; d >= 1; d--) {
      const date = new Date(year, monthIndex, d);
      const iso = toISODateLocal(date);

      const entry = await getPlanningEntry(iso);

      //  JOUR CONSIDR COMME REMPLI MME SI REPOS
      if (entry && typeof entry.serviceCode === "string") {
        currentDay = d + 1;
        return;
      }
    }

    // Aucun jour rempli
    currentDay = 1;
  }

  async function computeMonthStats() {
    let workDays = 0;
    let reposDays = 0;
    let congesDays = 0;
    let panierCount = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      if (isDateInConges(date, congesConfig)) {
        congesDays++;
        continue;
      }

      const iso = toISODateLocal(date);
      const entry = await getPlanningEntry(iso);
      if (!entry || !entry.serviceCode) continue;

      if (entry.serviceCode === "REPOS") {
        reposDays++;
      } else {
        workDays++;
        if (hasPanier(entry.serviceCode)) {
          panierCount++;
        }
      }
    }

    return {
      workDays,
      panierCount,
      reposDays,
      congesDays,
      totalDays: workDays + reposDays + congesDays,
    };
  }

  // =======================
  // CHARGEMENT SERVICES
  // =======================

  const allServices = await getAllServices();

  const saisonEntry = await getConfig("saison");
  const saisonConfig = saisonEntry?.value ?? null;
  const congesEntry = await getConfig("conges");
  const congesConfig = congesEntry?.value ?? null;
  const prefsEntry = await getConfig("suggestions_prefs");
  const suggestionsPrefs = prefsEntry?.value ?? null;

  // =======================
  // UI
  // =======================

  const root = document.createElement("div");
  root.className = "guided-root";
  view.appendChild(root);

  const header = document.createElement("div");
  header.className = "guided-header";

  const monthLabel = document.createElement("div");
  monthLabel.className = "guided-month-label";
  monthLabel.textContent = capitalizeFirst(
    targetDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
  );

  const dayNumber = document.createElement("div");
  dayNumber.id = "guided-day-number";
  dayNumber.className = "guided-day-number";

  const weekdayLabel = document.createElement("div");
  weekdayLabel.className = "guided-weekday";

  header.append(monthLabel, dayNumber, weekdayLabel);
  root.appendChild(header);

  const saisieContent = document.createElement("div");
  saisieContent.className = "saisie-content";
  root.appendChild(saisieContent);

  const servicesContainer = document.createElement("div");
  servicesContainer.className = "guided-services";
  saisieContent.appendChild(servicesContainer);

  async function renderCompletedView() {
    root.classList.add("guided-complete-mode");
    const nextMonthDate = new Date(targetDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const nextMonthLabel = capitalizeFirst(
      nextMonthDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    );

    const stats = await computeMonthStats();

    servicesContainer.innerHTML = "";
    dayNumber.textContent = "\u2713";
    dayNumber.classList.add("guided-day-complete");
    weekdayLabel.textContent = "";

    const title = document.createElement("div");
    title.className = "guided-complete-title";
    title.textContent = "Mois entièrement préparé";

    const subtitle = document.createElement("div");
    subtitle.className = "guided-complete-subtitle";
    subtitle.textContent = `${stats.totalDays} jours planifiés`;

    const statsList = document.createElement("div");
    statsList.className = "guided-stats";

    function addStat(label, value) {
      const row = document.createElement("div");
      row.className = "guided-stat-row";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      statsList.appendChild(row);
    }

    addStat("Jours de travail", stats.workDays);
    addStat("Nombre de paniers", stats.panierCount);
    addStat("Jours de repos", stats.reposDays);
    addStat("Jours de congés", stats.congesDays);

    const btnNextGuided = document.createElement("button");
    btnNextGuided.className = "guided-action primary";
    btnNextGuided.textContent = `Préparer le mois ${nextMonthLabel}`;
    btnNextGuided.onclick = () => {
      const next = new Date(targetDate);
      next.setMonth(next.getMonth() + 1);
      showGuidedMonth(next);
    };

    const btnMonth = document.createElement("button");
    btnMonth.className = "guided-action ghost";
    btnMonth.textContent = "Voir mon planning";
    btnMonth.onclick = () => {
      guidedMonthDate = null;
      showHome();
    };

    const btnSyncAlarm = document.createElement("button");
    btnSyncAlarm.className = "guided-action alarm-sync-action";
    const alarmLabel = document.createElement("span");
    alarmLabel.textContent = "Synchroniser le reveil";
    const androidBadge = document.createElement("span");
    androidBadge.className = "menu-badge";
    androidBadge.textContent = "Android";
    btnSyncAlarm.append(alarmLabel, androidBadge);
    btnSyncAlarm.onclick = () => {
      showAlarmView({ autoImport: true });
    };

    servicesContainer.append(
      title,
      subtitle,
      statsList,
      btnNextGuided,
      btnSyncAlarm,
      btnMonth,
    );
  }

  await resumeCurrentDayFromDB();
  // =======================
  // CONGS  AJUSTEMENT DMARRAGE
  // =======================

  const guidedStartDay = await getGuidedStartDay(year, monthIndex);

  // mois entirement en congs
  if (guidedStartDay === null) {
    currentDay = daysInMonth + 1;
  } else {
    // si aucun jour encore saisi, forcer le dpart
    if (currentDay === 1 && guidedStartDay > 1) {
      currentDay = guidedStartDay;
    }
  }

  await renderDay();

  // =======================
  // RENDER JOUR
  // =======================

  async function renderDay() {
    root.classList.remove("guided-complete-mode");
    selectedLine = null;
    // =======================
    // CONGS  SAUT AUTOMATIQUE
    // =======================

    while (currentDay <= daysInMonth) {
      const testDate = new Date(year, monthIndex, currentDay);

      const inConges = isDateInConges(testDate, congesConfig);

      if (!inConges) break;

      currentDay++;
    }

    if (currentDay > daysInMonth) {
      renderCompletedView();
      return;
    }

    dayNumber.textContent = currentDay;
    dayNumber.classList.remove("guided-day-complete");
    const weekdayLong = new Date(
      year,
      monthIndex,
      currentDay,
    ).toLocaleDateString("fr-FR", { weekday: "long" });
    weekdayLabel.textContent =
      weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1);
    servicesContainer.innerHTML = "";
    const currentDate = new Date(year, monthIndex, currentDay);

    const grouped = await getServiceSuggestions({
      servicesCatalog: allServices,
      saisonConfig,
      date: currentDate,
      prefs: suggestionsPrefs,
      mode: getUiMode(),
    });
    groupedSuggestions = grouped;

    const primaryLabel = document.createElement("div");
    primaryLabel.className = "guided-section-label";
    primaryLabel.textContent = "Types";
    servicesContainer.appendChild(primaryLabel);

    const primaryGrid = document.createElement("div");
    primaryGrid.className = "guided-primary-grid";
    servicesContainer.appendChild(primaryGrid);

    grouped.REPOS.forEach((code) => addServiceButton(code, primaryGrid, "guided-btn-primary"));
    grouped.DM.forEach((code) => addServiceButton(code, primaryGrid, "guided-btn-primary"));
    grouped.DAM.forEach((code) => addServiceButton(code, primaryGrid, "guided-btn-primary"));
    grouped.FORMATION.forEach((code) => addServiceButton(code, primaryGrid, "guided-btn-primary"));

    if (grouped.TAD.length > 0) {
      const btnTAD = document.createElement("button");
      btnTAD.textContent = "TAD";
      btnTAD.className = "guided-btn guided-btn-primary";
      btnTAD.onclick = () => renderTAD(grouped.TAD);
      primaryGrid.appendChild(btnTAD);
    }

    const linesLabel = document.createElement("div");
    linesLabel.className = "guided-section-label";
    linesLabel.textContent = "Lignes";
    servicesContainer.appendChild(linesLabel);

    const otherGrid = document.createElement("div");
    otherGrid.className = "guided-lines-grid";
    servicesContainer.appendChild(otherGrid);

    Object.keys(grouped.LIGNES)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((line) => {
        const btn = document.createElement("button");
        btn.textContent = `Ligne ${line}`;
        btn.className = "guided-btn guided-btn-secondary";
        if (selectedLine === line) {
          btn.classList.add("active");
        }
        btn.onclick = () => renderLine(line);
        otherGrid.appendChild(btn);
      });

    const cancelSlot = document.createElement("div");
    cancelSlot.className = "guided-cancel-slot";
    servicesContainer.appendChild(cancelSlot);

    // Bouton annuler jour prcdent
    if (currentDay > 1) {
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "← Annuler le jour précédent";
      cancelBtn.className = "guided-cancel-btn";

      cancelBtn.onclick = async () => {
        // Jour  annuler = jour prcdent
        const dayToUndo = currentDay - 1;

        if (dayToUndo < 1) return;

        const date = new Date(year, monthIndex, dayToUndo);
        const iso = toISODateLocal(date);

        //  ROLLBACK DB : retour  REPOS
        await savePlanningEntry({
          date: iso,
          serviceCode: "REPOS",
          locked: false,
          extra: false,
        });

        // Retour UI
        currentDay--;
        await renderDay();
      };

      cancelSlot.appendChild(cancelBtn);
    }
  }

  function renderLine(line) {
    root.classList.remove("guided-complete-mode");
    servicesContainer.innerHTML = "";
    selectedLine = line;

    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.className = "guided-btn ghost guided-back-btn";
    back.onclick = renderDay;
    servicesContainer.appendChild(back);

    const lineGrid = document.createElement("div");
    lineGrid.className = "guided-lines-grid";
    servicesContainer.appendChild(lineGrid);

    groupedSuggestions?.LIGNES?.[line]?.forEach((service) => {
      const code = typeof service === "string" ? service : service?.code;
      if (!code) return;
      addServiceButton(code, lineGrid);
    });
  }

  function renderTAD(tadServices) {
    root.classList.remove("guided-complete-mode");
    servicesContainer.innerHTML = "";

    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.className = "guided-btn ghost guided-back-btn";
    back.onclick = renderDay;
    servicesContainer.appendChild(back);

    const tadGrid = document.createElement("div");
    tadGrid.className = "guided-lines-grid";
    servicesContainer.appendChild(tadGrid);

    tadServices.forEach((code) => {
      addServiceButton(code, tadGrid);
    });
  }

  // =======================
  // BOUTON SERVICE = ENREGISTRE + JOUR SUIVANT
  // =======================

  function addServiceButton(code, target, extraClass = "") {
    const btn = document.createElement("button");
    btn.textContent = getServiceDisplayName(code, { short: true });
    btn.className = `guided-btn ${extraClass}`.trim();

    btn.onclick = async () => {
      const date = new Date(year, monthIndex, currentDay);
      const iso = toISODateLocal(date);

      //  Conversion TADx  TDx pour lenregistrement
      const serviceCodeToSave = code.startsWith("TAD")
        ? code.replace(/^TAD/, "TD")
        : code;

      await savePlanningEntry({
        date: iso,
        serviceCode: serviceCodeToSave,
        locked: false,
        extra: false,
      });
      if (isMorningServiceCode(serviceCodeToSave)) {
        markAlarmResyncPending();
      }

      selectedLine = null;
      currentDay++;
      await renderDay();
    };

    target.appendChild(btn);
  }
}




