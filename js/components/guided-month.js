// js/components/guided-month.js

import { getServiceSuggestions } from "../domain/service-suggestions.js";
import { getUiMode } from "../state/ui-mode.js";

import {
  getAllServices,
  savePlanningEntry,
  getPlanningEntry,
} from "../data/storage.js";

import { getConfig } from "../data/db.js";
import { toISODateLocal } from "../utils.js";
import { showHome } from "../router.js";
import { getGuidedStartDay, isDateInConges } from "../domain/conges.js";

function capitalizeFirst(input) {
  if (typeof input !== "string" || input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

// =======================
// VUE : PRÉPARER MOIS SUIVANT
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

  return base; // fallback de sécurité
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

      // ✅ JOUR CONSIDÉRÉ COMME REMPLI MÊME SI REPOS
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
      }
    }

    return {
      workDays,
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

  const servicesContainer = document.createElement("div");
  servicesContainer.className = "guided-services";
  root.appendChild(servicesContainer);

  async function renderCompletedView() {
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
    dayNumber.textContent = "✓";
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
    btnMonth.className = "guided-action";
    btnMonth.textContent = "Voir le planning du mois";
    btnMonth.onclick = () => {
      guidedMonthDate = null;
      showHome();
    };

    const btnHome = document.createElement("button");
    btnHome.className = "guided-action ghost";
    btnHome.textContent = "Retour à l’accueil";
    btnHome.onclick = () => {
      guidedMonthDate = null;
      showHome();
    };

    servicesContainer.append(title, subtitle, statsList, btnNextGuided, btnMonth, btnHome);
  }

  await resumeCurrentDayFromDB();
  // =======================
  // CONGÉS — AJUSTEMENT DÉMARRAGE
  // =======================

  const guidedStartDay = await getGuidedStartDay(year, monthIndex);

  // mois entièrement en congés
  if (guidedStartDay === null) {
    currentDay = daysInMonth + 1;
  } else {
    // si aucun jour encore saisi, forcer le départ
    if (currentDay === 1 && guidedStartDay > 1) {
      currentDay = guidedStartDay;
    }
  }

  await renderDay();

  // =======================
  // RENDER JOUR
  // =======================

  async function renderDay() {
    // =======================
    // CONGÉS — SAUT AUTOMATIQUE
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

    const primaryGrid = document.createElement("div");
    primaryGrid.className = "guided-primary-grid";
    servicesContainer.appendChild(primaryGrid);

    grouped.REPOS.forEach((code) => addServiceButton(code, primaryGrid));
    grouped.DM.forEach((code) => addServiceButton(code, primaryGrid));
    grouped.DAM.forEach((code) => addServiceButton(code, primaryGrid));
    grouped.ANNEXE.forEach((code) => addServiceButton(code, primaryGrid));

    if (grouped.TAD.length > 0) {
      const btnTAD = document.createElement("button");
      btnTAD.textContent = "TAD";
      btnTAD.className = "guided-btn";
      btnTAD.onclick = () => renderTAD(grouped.TAD);
      primaryGrid.appendChild(btnTAD);
    }

    const otherGrid = document.createElement("div");
    otherGrid.className = "guided-lines-grid";
    servicesContainer.appendChild(otherGrid);

    Object.keys(grouped.LIGNES)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((line) => {
        const btn = document.createElement("button");
        btn.textContent = `Ligne ${line}`;
        btn.className = "guided-btn";
        if (selectedLine === line) {
          btn.classList.add("active");
        }
        btn.onclick = () => renderLine(line);
        otherGrid.appendChild(btn);
      });

    // Bouton annuler jour précédent
    if (currentDay > 1) {
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "← Annuler le jour précédent";
      cancelBtn.className = "guided-cancel-btn";

      cancelBtn.onclick = async () => {
        // Jour à annuler = jour précédent
        const dayToUndo = currentDay - 1;

        if (dayToUndo < 1) return;

        const date = new Date(year, monthIndex, dayToUndo);
        const iso = toISODateLocal(date);

        // 🔁 ROLLBACK DB : retour à REPOS
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

      servicesContainer.appendChild(cancelBtn);
    }
  }

  function renderLine(line) {
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

  function addServiceButton(code, target) {
    const btn = document.createElement("button");
    btn.textContent = code;
    btn.className = "guided-btn";

    btn.onclick = async () => {
      const date = new Date(year, monthIndex, currentDay);
      const iso = toISODateLocal(date);

      // 🔁 Conversion TADx → TDx pour l’enregistrement
      const serviceCodeToSave = code.startsWith("TAD")
        ? code.replace(/^TAD/, "TD")
        : code;

      await savePlanningEntry({
        date: iso,
        serviceCode: serviceCodeToSave,
        locked: false,
        extra: false,
      });

      currentDay++;
      await renderDay();
    };

    target.appendChild(btn);
  }
}
