/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/summary.js

import { getPlanningEntriesInRange, getAllServices } from "../data/storage.js";
import { getConfig } from "../data/db.js";
import { isDateInConges } from "../domain/conges.js";
import { getPeriodStateForDate } from "../domain/periods.js";
import { getPeriodLabel } from "../utils/period-label.js";
import { hasPanier } from "../domain/service-panier.js";
import { getFixedServiceMinutes } from "../utils.js";
import { getHolidayNameForDate } from "../domain/holidays-fr.js";

function formatDuration(totalMinutes) {
  if (typeof totalMinutes !== "number" || totalMinutes < 0) return "00:00";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function shouldAddExtraMinutes(code) {
  if (!code) return false;
  const upper = String(code).toUpperCase();
  if (upper === "DM" || upper === "DAM" || upper === "FORMATION") return false;
  if (upper.startsWith("TAD")) return false;
  return true;
}

function getServiceMinutes(service, periodLabel) {
  if (!service || !Array.isArray(service.periodes)) return 0;

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
    return 0;
  }

  let total = matchingPeriod.plages.reduce((sum, plage) => {
    if (!plage || !plage.debut || !plage.fin) return sum;
    const start = parseTimeToMinutes(plage.debut);
    const end = parseTimeToMinutes(plage.fin);
    if (start == null || end == null) return sum;
    const diff = end - start;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  if (shouldAddExtraMinutes(service.code)) {
    total += 5;
  }

  return total;
}

function getServicePlageCount(service, periodLabel) {
  if (!service || !Array.isArray(service.periodes)) return 0;

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
    return 0;
  }

  return matchingPeriod.plages.filter(
    (plage) => plage && plage.debut && plage.fin,
  ).length;
}

function parseISO(input) {
  if (!input) return null;
  const parts = input.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function createStatus() {
  const status = document.createElement("div");
  status.className = "settings-status";
  status.hidden = true;
  return {
    node: status,
    show(text) {
      status.textContent = text;
      status.hidden = false;
      clearTimeout(status.__timer);
      status.__timer = setTimeout(() => {
        status.hidden = true;
      }, 2200);
    },
  };
}

export async function renderSummaryView() {
  const view = document.getElementById("view-summary");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Statistiques";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Choisir une p\u00e9riode pour r\u00e9sumer l\u2019activit\u00e9";

  header.append(title, subtitle);

  const formCard = document.createElement("div");
  formCard.className = "settings-card";

  const labelStart = document.createElement("label");
  labelStart.textContent = "D\u00e9but";
  const inputStart = document.createElement("input");
  inputStart.type = "date";

  const labelEnd = document.createElement("label");
  labelEnd.textContent = "Fin";
  const inputEnd = document.createElement("input");
  inputEnd.type = "date";

  const status = createStatus();

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const runBtn = document.createElement("button");
  runBtn.className = "settings-btn primary";
  runBtn.textContent = "Calculer";

  actions.append(runBtn);
  formCard.append(labelStart, inputStart, labelEnd, inputEnd, actions, status.node);

  const resultCard = document.createElement("div");
  resultCard.className = "settings-card";
  resultCard.id = "summary-results";

  const resultTitle = document.createElement("div");
  resultTitle.className = "summary-card-title";
  resultTitle.textContent = "R\u00e9sultats";

  const resultGrid = document.createElement("div");
  resultGrid.className = "summary-grid";

  resultCard.append(resultTitle, resultGrid);

  root.append(header, formCard, resultCard);
  view.appendChild(root);

  async function computeAndRender() {
    const startDate = parseISO(inputStart.value);
    const endDate = parseISO(inputEnd.value);

    if (!startDate || !endDate) {
      status.show("Dates invalides");
      return;
    }

    let start = startDate;
    let end = endDate;
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    const startISO = inputStart.value <= inputEnd.value ? inputStart.value : inputEnd.value;
    const endISO = inputStart.value <= inputEnd.value ? inputEnd.value : inputStart.value;

    const [servicesCatalog, congesEntry, saisonEntry, entries] = await Promise.all([
      getAllServices(),
      getConfig("conges"),
      getConfig("saison"),
      getPlanningEntriesInRange(startISO, endISO),
    ]);

    const congesConfig = congesEntry?.value ?? null;
    const saisonConfig = saisonEntry?.value ?? null;

    const serviceMap = new Map(
      servicesCatalog.map((service) => [
        typeof service.code === "string" ? service.code.toUpperCase() : "",
        service,
      ]),
    );

    const entryMap = new Map(entries.map((e) => [e.date, e]));

    let workedDays = 0;
    let workedHolidayDays = 0;
    let halfSundayDays = 0;
    let fullSundayDays = 0;
    let reposDays = 0;
    let congesDays = 0;
    let totalMinutes = 0;
    let extraMinutes = 0;
    let panierCount = 0;

    const cursor = new Date(start.getTime());
    while (cursor <= end) {
      const iso = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");

      if (isDateInConges(cursor, congesConfig)) {
        congesDays++;
      } else {
        const entry = entryMap.get(iso);
        if (entry && typeof entry.serviceCode === "string") {
          if (entry.serviceCode === "REPOS") {
            reposDays++;
          } else {
            workedDays++;
            if (getHolidayNameForDate(cursor)) {
              workedHolidayDays++;
            }

            if (cursor.getDay() === 0) {
              if (entry.startTime && entry.endTime) {
                halfSundayDays++;
              } else {
                const service =
                  serviceMap.get(entry.serviceCode.toUpperCase()) || null;
                const label = getPeriodLabel(
                  getPeriodStateForDate(saisonConfig, cursor),
                );
                const plageCount = getServicePlageCount(service, label);
                if (plageCount >= 2) {
                  fullSundayDays++;
                } else if (plageCount === 1) {
                  halfSundayDays++;
                }
              }
            }

            const fixedMinutes = getFixedServiceMinutes(entry.serviceCode);
            if (fixedMinutes != null) {
              totalMinutes += fixedMinutes;
              if (entry.extra) {
                extraMinutes += fixedMinutes;
              }
            } else {
              const service = serviceMap.get(entry.serviceCode.toUpperCase()) || null;
              const label = getPeriodLabel(
                getPeriodStateForDate(saisonConfig, cursor),
              );
              const minutes = getServiceMinutes(service, label);
              totalMinutes += minutes;
              if (entry.extra) {
                extraMinutes += minutes;
              }
            }

            if (hasPanier(entry.serviceCode)) {
              panierCount++;
            }
          }
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    resultGrid.innerHTML = "";

    const totalDuration = formatDuration(totalMinutes).replace(":", " : ");
    const extraDuration = formatDuration(extraMinutes).replace(":", " : ");
const rows = [
  ["Demi dimanche travaill\u00e9", halfSundayDays],
  ["Dimanche complet travaill\u00e9", fullSundayDays],
  ["Jours f\u00e9ri\u00e9s travaill\u00e9s", workedHolidayDays],
  ["Nombre de paniers", panierCount],
  ["Jours de repos", reposDays],
  ["Jours de cong\u00e9s", congesDays],
];

if (extraMinutes > 0) {
  rows.push(["Heures suppl\u00e9mentaires", extraDuration]);
}

rows.push(["Total jours travaill\u00e9s", workedDays]);
rows.push(["Total heures travaill\u00e9es", totalDuration]);

const filteredRows = rows.filter(([label, value]) => {
  if (label === "Total jours travaill\u00e9s") return true;
  if (label === "Total heures travaill\u00e9es") return true;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "");
    return normalized !== "00:00";
  }
  return true;
});

    filteredRows.forEach(([label, value], idx) => {
      const row = document.createElement("div");
      row.className = "summary-row";
      if (
        label === "Total jours travaill\u00e9s" ||
        label === "Total heures travaill\u00e9es"
      ) {
        row.classList.add("summary-total");
      }
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      resultGrid.appendChild(row);
    });
  }

  runBtn.addEventListener("click", computeAndRender);
}




