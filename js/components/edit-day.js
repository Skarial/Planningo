/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getConfig } from "../data/db.js";
import { getAllServices, getPlanningEntry, savePlanningEntry } from "../data/storage.js";
import {
  buildSaveEntryPayload,
  formatFormationMinutes,
  formatMajorExtraMinutes,
  formatMissingMinutes,
  formatNonMajorExtraMinutes,
  getInitialFormationMinutes,
  getInitialMajorExtraMinutes,
  getInitialMissingMinutes,
  getInitialNonMajorExtraMinutes,
  getInitialPanierEnabled,
  getInitialServiceCode,
  normalizeServiceCode,
  parseFormationInputMinutes,
  parseMajorExtraInputMinutes,
  parseMissingInputMinutes,
  parseNonMajorExtraInputMinutes,
  resolvePanierEnabled,
  shouldMarkAlarmResync,
} from "../domain/day-edit.js";
import { isDateInConges } from "../domain/conges.js";
import { getPeriodStateForDate } from "../domain/periods.js";
import { getServiceSuggestions } from "../domain/service-suggestions.js";
import { markAlarmResyncPending } from "../state/alarm-resync.js";
import { getAlarmSyncEnabled } from "../state/alarm-feature.js";
import { getUiMode } from "../state/ui-mode.js";
import { getServiceDisplayName } from "../utils.js";

function parseISODateLocal(dateISO) {
  const [year, month, day] = String(dateISO)
    .split("-")
    .map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function formatDateFr(dateISO) {
  const date = parseISODateLocal(dateISO);
  if (Number.isNaN(date.getTime())) return dateISO;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function navigateHome() {
  const baseUrl = `${location.pathname}${location.search}`;
  if (location.hash) {
    history.pushState(null, "", baseUrl);
  }
  import("../router.js").then(({ showHome }) => showHome());
}

export async function renderEditDayView(container, { dateISO } = {}) {
  const iso =
    typeof dateISO === "string" ? dateISO.trim().replace(/\//g, "-") : "";
  container.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view settings-page-variant edit-day-view";
  container.appendChild(root);

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Modifier le jour";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = `Date : ${formatDateFr(iso || dateISO || "")}`;

  header.append(title, subtitle);
  root.appendChild(header);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const card = document.createElement("div");
    card.className = "settings-card";

    const message = document.createElement("p");
    message.className = "settings-note";
    message.textContent = "Date invalide.";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "settings-btn";
    backBtn.textContent = "Retour";
    backBtn.addEventListener("click", navigateHome);

    card.append(message, backBtn);
    root.appendChild(card);
    return;
  }

  subtitle.textContent = `Date : ${formatDateFr(iso)}`;

  const card = document.createElement("div");
  card.className = "settings-card";
  const summary = document.createElement("p");
  summary.className = "settings-note";
  summary.textContent = "Chargement du jour...";

  const inputLabel = document.createElement("label");
  inputLabel.textContent = "Code service";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "settings-input";
  input.placeholder = "Code service (ex : 2910, DM, REPOS)";
  input.autocomplete = "off";

  const formationLabel = document.createElement("label");
  formationLabel.textContent = "Dur\u00E9e formation (heures:minutes)";
  formationLabel.hidden = true;

  const formationInput = document.createElement("input");
  formationInput.type = "text";
  formationInput.className = "settings-input";
  formationInput.placeholder = "HH:MM (ex : 07:00)";
  formationInput.inputMode = "text";
  formationInput.autocomplete = "off";
  formationInput.hidden = true;

  const extraLabel = document.createElement("label");
  extraLabel.textContent = "Heures suppl\u00E9mentaires (minutes)";

  const extraTypeRow = document.createElement("div");
  extraTypeRow.className = "settings-period-grid";
  extraTypeRow.style.gridTemplateColumns = "1fr 1fr";

  const majorTypeBtn = document.createElement("button");
  majorTypeBtn.type = "button";
  majorTypeBtn.className = "settings-btn";
  majorTypeBtn.textContent = "Major\u00E9es";

  const nonMajorTypeBtn = document.createElement("button");
  nonMajorTypeBtn.type = "button";
  nonMajorTypeBtn.className = "settings-btn";
  nonMajorTypeBtn.textContent = "Non major\u00E9es";

  extraTypeRow.append(majorTypeBtn, nonMajorTypeBtn);

  const extraInput = document.createElement("input");
  extraInput.type = "text";
  extraInput.className = "settings-input";
  extraInput.placeholder = "Nombre de minutes (ex : 60)";
  extraInput.inputMode = "numeric";
  extraInput.autocomplete = "off";

  const missingLabel = document.createElement("label");
  missingLabel.textContent = "Heures non effectu\u00E9es d\u00E9duites (minutes)";

  const missingInput = document.createElement("input");
  missingInput.type = "text";
  missingInput.className = "settings-input";
  missingInput.placeholder = "Nombre de minutes (ex : 30)";
  missingInput.inputMode = "numeric";
  missingInput.autocomplete = "off";

  const panierRow = document.createElement("label");
  panierRow.className = "settings-toggle";
  const panierLabel = document.createElement("span");
  panierLabel.textContent = "Panier";
  const panierToggle = document.createElement("input");
  panierToggle.type = "checkbox";
  panierRow.append(panierLabel, panierToggle);

  const suggestions = document.createElement("div");
  suggestions.className = "settings-periods";

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "settings-btn";
  cancelBtn.textContent = "Annuler";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "settings-btn primary";
  saveBtn.textContent = "Enregistrer";

  actions.append(cancelBtn, saveBtn);
  card.append(
    summary,
    inputLabel,
    input,
    formationLabel,
    formationInput,
    extraLabel,
    extraTypeRow,
    extraInput,
    missingLabel,
    missingInput,
    panierRow,
    suggestions,
    actions,
  );
  root.appendChild(card);

  let isPrefilled = false;
  function clearPrefilledServiceOnFirstEntry() {
    if (!isPrefilled) return;
    input.value = "";
    isPrefilled = false;
  }

  input.addEventListener("beforeinput", (event) => {
    if (!isPrefilled) return;
    const inputType = String(event?.inputType || "");
    if (inputType.startsWith("insert")) {
      clearPrefilledServiceOnFirstEntry();
    }
  });

  // Fallback mobile claviers: certains ne déclenchent pas beforeinput correctement.
  input.addEventListener("keydown", (event) => {
    if (!isPrefilled) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (typeof event.key === "string" && event.key.length === 1) {
      clearPrefilledServiceOnFirstEntry();
    }
  });

  input.addEventListener("paste", () => {
    clearPrefilledServiceOnFirstEntry();
  });

  const [entry, servicesCatalog, prefsEntry, saisonEntry, congesEntry] = await Promise.all([
    getPlanningEntry(iso),
    getAllServices(),
    getConfig("suggestions_prefs"),
    getConfig("saison"),
    getConfig("conges"),
  ]);
  const isCongesDay = isDateInConges(
    parseISODateLocal(iso),
    congesEntry?.value ?? null,
  );

  const initialCode = getInitialServiceCode(entry);
  input.value = initialCode;
  isPrefilled = initialCode.length > 0;
  panierToggle.checked = getInitialPanierEnabled(entry);
  let majorExtraRaw = getInitialMajorExtraMinutes(entry);
  let nonMajorExtraRaw = getInitialNonMajorExtraMinutes(entry);
  let missingRaw = getInitialMissingMinutes(entry);
  let formationRaw = getInitialFormationMinutes(entry);
  formationInput.value = formationRaw;
  missingInput.value = missingRaw;
  let selectedExtraType = majorExtraRaw
    ? "major"
    : nonMajorExtraRaw
      ? "nonMajor"
      : "major";

  function updateExtraTypeButtons() {
    majorTypeBtn.classList.toggle("primary", selectedExtraType === "major");
    nonMajorTypeBtn.classList.toggle("primary", selectedExtraType === "nonMajor");
  }

  function storeCurrentExtraInput() {
    if (selectedExtraType === "major") {
      majorExtraRaw = extraInput.value;
      nonMajorExtraRaw = "";
    } else {
      nonMajorExtraRaw = extraInput.value;
      majorExtraRaw = "";
    }
  }

  function switchExtraType(nextType) {
    if (nextType === selectedExtraType) return;
    const currentRaw = extraInput.value;
    if (nextType === "major") {
      majorExtraRaw = currentRaw;
      nonMajorExtraRaw = "";
    } else {
      nonMajorExtraRaw = currentRaw;
      majorExtraRaw = "";
    }
    selectedExtraType = nextType;
    syncExtraInputFromState();
    renderSummaryText();
  }

  function syncExtraInputFromState() {
    extraInput.value =
      selectedExtraType === "major" ? majorExtraRaw : nonMajorExtraRaw;
    extraInput.placeholder =
      selectedExtraType === "major"
        ? "Nombre de minutes majorees (ex : 60)"
        : "Nombre de minutes non majorees (ex : 90)";
    updateExtraTypeButtons();
  }

  function syncFormationInputVisibility() {
    const isFormation = normalizeServiceCode(input.value) === "FORMATION";
    const visible = isFormation && !isCongesDay;
    formationLabel.hidden = !visible;
    formationInput.hidden = !visible;
    if (visible) {
      formationInput.value = formationRaw;
    }
  }

  if (isCongesDay) {
    panierToggle.checked = false;
    panierToggle.disabled = true;
    majorExtraRaw = "";
    nonMajorExtraRaw = "";
    extraInput.value = "";
    extraInput.disabled = true;
    missingRaw = "";
    missingInput.value = "";
    missingInput.disabled = true;
    majorTypeBtn.disabled = true;
    nonMajorTypeBtn.disabled = true;
    formationRaw = "";
    formationInput.value = "";
    formationInput.disabled = true;
  }

  syncExtraInputFromState();
  syncFormationInputVisibility();

  function renderSummaryText() {
    const normalizedCode = normalizeServiceCode(input.value);
    if (!normalizedCode) {
      summary.textContent = "Service actuel : aucun";
      return;
    }

    const majorMinutes = parseMajorExtraInputMinutes(majorExtraRaw);
    const nonMajorMinutes = parseNonMajorExtraInputMinutes(nonMajorExtraRaw);
    const missingMinutes = parseMissingInputMinutes(missingRaw);
    const formationMinutes = parseFormationInputMinutes(formationRaw);
    const details = [];
    if (isCongesDay) {
      details.push(
        "Cong\u00E9s: panier, heures suppl\u00E9mentaires et heures non effectu\u00E9es indisponibles",
      );
    } else if (selectedExtraType === "major" && majorMinutes > 0) {
      details.push(
        `Heures suppl\u00E9mentaires : ${formatMajorExtraMinutes(majorMinutes)}`,
      );
    } else if (selectedExtraType === "nonMajor" && nonMajorMinutes > 0) {
      details.push(
        `Heures suppl\u00E9mentaires non major\u00E9es : ${formatNonMajorExtraMinutes(nonMajorMinutes)}`,
      );
    }

    if (!isCongesDay && missingMinutes > 0) {
      details.push(`Heures non effectu\u00E9es : ${formatMissingMinutes(missingMinutes)}`);
    }

    if (normalizedCode === "FORMATION" && formationMinutes > 0) {
      details.push(`Dur\u00E9e formation : ${formatFormationMinutes(formationMinutes)}`);
    }

    summary.textContent = `Service actuel : ${getServiceDisplayName(normalizedCode)}${
      panierToggle.checked ? " - Panier: oui" : " - Panier: non"
    }${details.length > 0 ? ` - ${details.join(" - ")}` : ""}`;
  }

  renderSummaryText();

  const grouped = getServiceSuggestions({
    servicesCatalog,
    saisonConfig: saisonEntry?.value ?? null,
    date: parseISODateLocal(iso),
    prefs: prefsEntry?.value ?? null,
    mode: getUiMode(),
  });

  const allCodesRaw = [
    ...grouped.REPOS,
    ...grouped.DM,
    ...grouped.DAM,
    ...grouped.FORMATION,
    ...grouped.TAD,
    ...Object.values(grouped.LIGNES).flat(),
  ];
  const allCodes = Array.from(
    new Set(allCodesRaw.map((code) => String(code).toUpperCase())),
  ).sort();

  function renderSuggestionsFiltered(filterValue) {
    suggestions.innerHTML = "";
    const filter = normalizeServiceCode(filterValue);
    if (!filter) return;

    const matches = allCodes.filter((code) => code.startsWith(filter));
    if (matches.length === 0) return;

    const grid = document.createElement("div");
    grid.className = "guided-lines-grid edit-day-suggestions-grid";

    matches.forEach((code) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "guided-btn guided-btn-secondary";
      btn.textContent = getServiceDisplayName(code, { short: true });
      btn.addEventListener("click", () => {
        input.value = code;
        panierToggle.checked = resolvePanierEnabled(code);
        syncFormationInputVisibility();
        renderSummaryText();
        suggestions.innerHTML = "";
      });
      grid.appendChild(btn);
    });

    suggestions.appendChild(grid);
  }

  input.addEventListener("input", () => {
    panierToggle.checked = resolvePanierEnabled(input.value);
    syncFormationInputVisibility();
    renderSummaryText();
    renderSuggestionsFiltered(input.value);
  });
  extraInput.addEventListener("input", () => {
    storeCurrentExtraInput();
    renderSummaryText();
  });
  missingInput.addEventListener("input", () => {
    missingRaw = missingInput.value;
    renderSummaryText();
  });
  formationInput.addEventListener("input", () => {
    formationRaw = formationInput.value;
    renderSummaryText();
  });

  majorTypeBtn.addEventListener("click", () => {
    switchExtraType("major");
  });

  nonMajorTypeBtn.addEventListener("click", () => {
    switchExtraType("nonMajor");
  });
  panierToggle.addEventListener("change", renderSummaryText);
  renderSuggestionsFiltered(input.value);

  cancelBtn.addEventListener("click", () => {
    navigateHome();
  });

  saveBtn.addEventListener("click", async () => {
    storeCurrentExtraInput();
    const previousEntry = await getPlanningEntry(iso);
    const payload = buildSaveEntryPayload({
      dateISO: iso,
      rawCode: input.value,
      previousEntry,
      panierEnabled: panierToggle.checked,
      rawFormationMinutes: formationRaw,
      rawMajorExtraMinutes: selectedExtraType === "major" ? majorExtraRaw : "",
      rawNonMajorExtraMinutes:
        selectedExtraType === "nonMajor" ? nonMajorExtraRaw : "",
      rawMissingMinutes: missingRaw,
      isCongesDay,
    });
    await savePlanningEntry(payload);

    const alarmSyncEnabled = await getAlarmSyncEnabled();
    if (alarmSyncEnabled && shouldMarkAlarmResync(payload.serviceCode)) {
      markAlarmResyncPending();
    }

    navigateHome();
  });
}
