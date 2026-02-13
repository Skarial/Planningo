/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getConfig, getPlanningEntriesInRange, setConfig } from "../data/storage.js";
import {
  computeTaxRealMetrics,
  getTaxRealYearDateRangeISO,
  normalizeTaxRealYear,
  roundTaxReal,
} from "../domain/tax-real.js";

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);
}

async function computeTaxRealRecap() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const settingsEntry = await getConfig("tax_real_settings");
  const settings = settingsEntry?.value ?? {};
  const { startISO, endISO } = getTaxRealYearDateRangeISO(settings.year, now);

  const [entries, congesEntry] = await Promise.all([
    getPlanningEntriesInRange(startISO, endISO),
    getConfig("conges"),
  ]);

  const congesConfig = congesEntry?.value ?? null;
  return computeTaxRealMetrics({
    entries,
    congesConfig,
    rawYear: settings.year,
    rawDistanceKmOneWay: settings.distanceKmOneWay,
    nowDate: now,
  });
}

function createStaticRow(iconClass, label, valueText) {
  const row = document.createElement("div");
  row.className = "tax-real-row";

  const icon = document.createElement("span");
  icon.className = `tax-real-icon ${iconClass}`;
  icon.setAttribute("aria-hidden", "true");

  const labelNode = document.createElement("span");
  labelNode.className = "tax-real-label";
  labelNode.textContent = label;

  const value = document.createElement("strong");
  value.className = "tax-real-value";
  value.textContent = valueText;

  row.append(icon, labelNode, value);
  return row;
}

function createDistanceRow(distanceKm, onDistanceDelta) {
  const row = document.createElement("div");
  row.className = "tax-real-row";

  const icon = document.createElement("span");
  icon.className = "tax-real-icon tax-real-icon-pin";
  icon.setAttribute("aria-hidden", "true");

  const labelNode = document.createElement("span");
  labelNode.className = "tax-real-label";
  labelNode.textContent = "Distance (aller simple) :";

  const valueWrap = document.createElement("div");
  valueWrap.className = "tax-real-value-wrap";

  const controls = document.createElement("div");
  controls.className = "tax-real-distance-stepper";

  const btnUp = document.createElement("button");
  btnUp.type = "button";
  btnUp.className = "tax-real-step-btn";
  btnUp.setAttribute("aria-label", "Augmenter la distance");
  btnUp.textContent = "▲";

  const btnDown = document.createElement("button");
  btnDown.type = "button";
  btnDown.className = "tax-real-step-btn";
  btnDown.setAttribute("aria-label", "Diminuer la distance");
  btnDown.textContent = "▼";

  controls.append(btnUp, btnDown);

  const value = document.createElement("strong");
  value.className = "tax-real-value";
  value.textContent = `${formatNumber(distanceKm)} km`;

  valueWrap.append(controls, value);
  row.append(icon, labelNode, valueWrap);

  btnUp.addEventListener("click", () => onDistanceDelta(1));
  btnDown.addEventListener("click", () => onDistanceDelta(-1));

  return row;
}

function createYearControl(selectedYear, onYearDelta) {
  const row = document.createElement("div");
  row.className = "tax-real-year-row";

  const text = document.createElement("span");
  text.className = "tax-real-year-text";
  text.textContent = `(${selectedYear})`;

  const controls = document.createElement("div");
  controls.className = "tax-real-distance-stepper";

  const btnUp = document.createElement("button");
  btnUp.type = "button";
  btnUp.className = "tax-real-step-btn";
  btnUp.setAttribute("aria-label", "Année suivante");
  btnUp.textContent = "▲";

  const btnDown = document.createElement("button");
  btnDown.type = "button";
  btnDown.className = "tax-real-step-btn";
  btnDown.setAttribute("aria-label", "Année précédente");
  btnDown.textContent = "▼";

  controls.append(btnUp, btnDown);
  row.append(text, controls);

  btnUp.addEventListener("click", () => onYearDelta(1));
  btnDown.addEventListener("click", () => onYearDelta(-1));

  return row;
}

function buildRecapCard(data, onDistanceDelta, onYearDelta) {
  const card = document.createElement("div");
  card.className = "settings-card tax-real-card tax-real-card-main";

  const title = document.createElement("div");
  title.className = "tax-real-card-title";
  title.textContent = "Estimation Kilométrique";
  const yearControl = createYearControl(data.selectedYear, onYearDelta);

  const list = document.createElement("div");
  list.className = "tax-real-list";

  list.append(
    createDistanceRow(data.distanceOneWayKm, onDistanceDelta),
    createStaticRow("tax-real-icon-calendar", "Jours travaillés :", formatNumber(data.workedDays)),
    createStaticRow(
      "tax-real-icon-car",
      "Km estimés (aller-retour) :",
      `${formatNumber(data.estimatedRoundTripKm)} km`,
    ),
  );

  const foot = document.createElement("p");
  foot.className = "tax-real-footnote";
  foot.textContent = "Estimation indicative basée sur vos saisies.";

  card.append(title, yearControl, list, foot);
  return card;
}

function buildProjectionCard(data) {
  const card = document.createElement("div");
  card.className = "settings-card tax-real-card tax-real-card-projection tax-real-card-bottom";

  const projection = document.createElement("div");
  projection.className = "tax-real-projection-row";
  projection.innerHTML = `
    <span>Projection annuelle :</span>
    <strong>${formatNumber(data.annualProjectionKm)} km</strong>
  `;

  const title = document.createElement("div");
  title.className = "tax-real-progress-title";
  title.textContent = "Progression de l'année :";

  const row = document.createElement("div");
  row.className = "tax-real-progress-row";

  const track = document.createElement("div");
  track.className = "tax-real-progress-track";

  const fill = document.createElement("div");
  fill.className = "tax-real-progress-fill";
  fill.style.width = `${Math.max(0, Math.min(100, data.yearProgressPct))}%`;
  track.appendChild(fill);

  const value = document.createElement("strong");
  value.className = "tax-real-progress-value";
  value.textContent = `${formatNumber(data.yearProgressPct)} %`;

  row.append(track, value);
  card.append(projection, title, row);
  return card;
}

export async function renderTaxRealView(options = {}) {
  const { container = null, showHeader = true } = options;
  const view = container || document.getElementById("view-tax-real");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = showHeader
    ? "settings-view settings-page-variant tax-real-view"
    : "settings-view compact settings-page-variant tax-real-view";

  if (showHeader) {
    const header = document.createElement("div");
    header.className = "settings-header";

    const title = document.createElement("div");
    title.className = "settings-title";
    title.textContent = "Frais réels";

    const subtitle = document.createElement("div");
    subtitle.className = "settings-subtitle";
    subtitle.textContent = "Récapitulatif kilométrique";

    header.append(title, subtitle);
    root.appendChild(header);
  }

  const stack = document.createElement("div");
  stack.className = "tax-real-stack";

  const recapHost = document.createElement("div");
  recapHost.className = "tax-real-recap-host";

  async function patchTaxRealSettings(patch) {
    const settingsEntry = await getConfig("tax_real_settings");
    const currentSettings =
      settingsEntry && settingsEntry.value && typeof settingsEntry.value === "object"
        ? settingsEntry.value
        : {};

    await setConfig("tax_real_settings", {
      ...currentSettings,
      ...patch,
    });
  }

  async function saveDistance(nextDistanceKm) {
    const safeDistance = Math.max(1, roundTaxReal(nextDistanceKm, 0));
    await patchTaxRealSettings({ distanceKmOneWay: safeDistance });
  }

  async function saveYear(nextYear) {
    const safeYear = normalizeTaxRealYear(nextYear);
    await patchTaxRealSettings({ year: safeYear });
  }

  async function renderRecap() {
    recapHost.innerHTML = "";
    const data = await computeTaxRealRecap();

    const onDistanceDelta = async (delta) => {
      const nextDistance = Math.max(1, data.distanceOneWayKm + delta);
      await saveDistance(nextDistance);
      await renderRecap();
    };

    const onYearDelta = async (delta) => {
      const nextYear = data.selectedYear + delta;
      await saveYear(nextYear);
      await renderRecap();
    };

    recapHost.append(buildRecapCard(data, onDistanceDelta, onYearDelta), buildProjectionCard(data));
  }

  await renderRecap();
  stack.appendChild(recapHost);

  const updated = document.createElement("p");
  updated.className = "tax-real-updated";
  updated.textContent = "Mis à jour : aujourd'hui";
  stack.appendChild(updated);

  root.appendChild(stack);
  view.appendChild(root);
}
