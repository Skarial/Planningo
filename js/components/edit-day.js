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
  card.className = "settings-card edit-day-card";
  const summary = document.createElement("div");
  summary.className = "edit-day-summary-block";

  const summaryLine1 = document.createElement("p");
  summaryLine1.className = "edit-day-summary-line edit-day-summary-line-primary";
  summaryLine1.textContent = "Service actuel : chargement...";

  const summaryLine2 = document.createElement("p");
  summaryLine2.className = "edit-day-summary-line edit-day-summary-line-meta";
  summaryLine2.innerHTML = "Panier : <strong>Non</strong>";

  const summaryLine3 = document.createElement("p");
  summaryLine3.className = "edit-day-summary-line edit-day-summary-line-meta";
  summaryLine3.innerHTML = "Heures suppl\u00E9mentaires major\u00E9es : <strong>00:00</strong>";

  const summaryLine4 = document.createElement("p");
  summaryLine4.className = "edit-day-summary-line edit-day-summary-line-meta";
  summaryLine4.innerHTML = "Heures d\u00E9duites : <strong>00:00</strong>";

  summary.append(summaryLine1, summaryLine2, summaryLine3, summaryLine4);

  const serviceSection = document.createElement("section");
  serviceSection.className = "edit-day-section";

  const serviceTitle = document.createElement("p");
  serviceTitle.className = "edit-day-section-title";
  serviceTitle.textContent = "Service";

  const inputLabel = document.createElement("label");
  inputLabel.textContent = "Code service";
  inputLabel.className = "edit-day-label";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "settings-input";
  input.placeholder = "Code service (ex : 2910, DM, REPOS)";
  input.autocomplete = "off";

  const formationLabel = document.createElement("label");
  formationLabel.textContent = "Dur\u00E9e formation (heures:minutes)";
  formationLabel.className = "edit-day-label";
  formationLabel.hidden = true;

  const formationInput = document.createElement("input");
  formationInput.type = "text";
  formationInput.className = "settings-input";
  formationInput.placeholder = "HH:MM (ex : 07:00)";
  formationInput.inputMode = "text";
  formationInput.autocomplete = "off";
  formationInput.hidden = true;

  const hoursSection = document.createElement("section");
  hoursSection.className = "edit-day-section";

  const hoursTitle = document.createElement("p");
  hoursTitle.className = "edit-day-section-title";
  hoursTitle.textContent = "Heures";

  const extraTypeLabel = document.createElement("label");
  extraTypeLabel.className = "edit-day-label";
  extraTypeLabel.textContent = "Type d'heures supplémentaires";

  const extraLabel = document.createElement("label");
  extraLabel.className = "edit-day-label";
  extraLabel.textContent = "Heures suppl\u00E9mentaires (minutes)";

  const extraTypeRow = document.createElement("div");
  extraTypeRow.className = "edit-day-extra-type";

  const majorTypeInput = document.createElement("input");
  majorTypeInput.type = "radio";
  majorTypeInput.name = "edit-day-extra-type";
  majorTypeInput.id = "edit-day-extra-major";
  majorTypeInput.className = "edit-day-chip-input";

  const majorTypeBtn = document.createElement("label");
  majorTypeBtn.className = "edit-day-chip";
  majorTypeBtn.setAttribute("for", majorTypeInput.id);
  majorTypeBtn.textContent = "Major\u00E9es";

  const nonMajorTypeInput = document.createElement("input");
  nonMajorTypeInput.type = "radio";
  nonMajorTypeInput.name = "edit-day-extra-type";
  nonMajorTypeInput.id = "edit-day-extra-nonmajor";
  nonMajorTypeInput.className = "edit-day-chip-input";

  const nonMajorTypeBtn = document.createElement("label");
  nonMajorTypeBtn.className = "edit-day-chip";
  nonMajorTypeBtn.setAttribute("for", nonMajorTypeInput.id);
  nonMajorTypeBtn.textContent = "Non major\u00E9es";

  extraTypeRow.append(majorTypeInput, majorTypeBtn, nonMajorTypeInput, nonMajorTypeBtn);

  const extraInput = document.createElement("input");
  extraInput.type = "text";
  extraInput.className = "settings-input";
  extraInput.placeholder = "Nombre de minutes (ex : 60)";
  extraInput.inputMode = "numeric";
  extraInput.autocomplete = "off";

  const missingSection = document.createElement("section");
  missingSection.className = "edit-day-section";

  const missingHelp = document.createElement("p");
  missingHelp.className = "edit-day-help";
  missingHelp.textContent = "Minutes \u00E0 soustraire en cas de d\u00E9part anticip\u00E9 (minutes)";

  const missingInput = document.createElement("input");
  missingInput.type = "text";
  missingInput.className = "settings-input";
  missingInput.placeholder = "Nombre de minutes (ex : 60)";
  missingInput.inputMode = "numeric";
  missingInput.autocomplete = "off";

  const optionsSection = document.createElement("section");
  optionsSection.className = "edit-day-section";

  const optionsTitle = document.createElement("p");
  optionsTitle.className = "edit-day-section-title";
  optionsTitle.textContent = "Options";

  const panierRow = document.createElement("div");
  panierRow.className = "edit-day-panier-row";

  const panierLabel = document.createElement("span");
  panierLabel.className = "edit-day-label";
  panierLabel.textContent = "Panier";

  const switchWrap = document.createElement("label");
  switchWrap.className = "switch";

  const panierToggle = document.createElement("input");
  panierToggle.type = "checkbox";
  const slider = document.createElement("span");
  slider.className = "slider";

  switchWrap.append(panierToggle, slider);
  panierRow.append(panierLabel, switchWrap);

  const panierDetails = document.createElement("p");
  panierDetails.className = "edit-day-help edit-day-panier-help";
  panierDetails.dataset.panierOn = "false";
  panierDetails.textContent = "Panier activ\u00E9";

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

  serviceSection.append(serviceTitle, inputLabel, input, formationLabel, formationInput, suggestions);
  hoursSection.append(hoursTitle, extraTypeLabel, extraTypeRow, extraLabel, extraInput);
  missingSection.append(missingHelp, missingInput);
  optionsSection.append(optionsTitle, panierRow, panierDetails);

  card.append(summary, serviceSection, hoursSection, missingSection, optionsSection, actions);
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
    const isMajor = selectedExtraType === "major";
    majorTypeInput.checked = isMajor;
    nonMajorTypeInput.checked = !isMajor;
    majorTypeBtn.classList.toggle("is-selected", isMajor);
    nonMajorTypeBtn.classList.toggle("is-selected", !isMajor);
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
        : "Nombre de minutes non majorees (ex : 60)";
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
    majorTypeInput.disabled = true;
    nonMajorTypeInput.disabled = true;
    majorTypeBtn.classList.add("is-disabled");
    nonMajorTypeBtn.classList.add("is-disabled");
    formationRaw = "";
    formationInput.value = "";
    formationInput.disabled = true;
  }

  syncExtraInputFromState();
  syncFormationInputVisibility();

  function syncPanierDetailsState() {
    panierDetails.dataset.panierOn = panierToggle.checked ? "true" : "false";
  }

  function renderSummaryText() {
    const normalizedCode = normalizeServiceCode(input.value);
    if (!normalizedCode) {
      summaryLine1.textContent = "Service actuel : aucun";
      summaryLine2.innerHTML = "Panier : <strong>Non</strong>";
      summaryLine3.innerHTML =
        "Heures suppl\u00E9mentaires major\u00E9es : <strong>00:00</strong>";
      summaryLine4.innerHTML = "Heures d\u00E9duites : <strong>00:00</strong>";
      syncPanierDetailsState();
      return;
    }

    const majorMinutes = parseMajorExtraInputMinutes(majorExtraRaw);
    const nonMajorMinutes = parseNonMajorExtraInputMinutes(nonMajorExtraRaw);
    const missingMinutes = parseMissingInputMinutes(missingRaw);
    const formationMinutes = parseFormationInputMinutes(formationRaw);
    const details = [];
    const isMajorType = selectedExtraType === "major";
    const activeTypeLabel = isMajorType ? "major\u00E9es" : "non major\u00E9es";
    const activeDuration = isMajorType
      ? formatMajorExtraMinutes(majorMinutes)
      : formatNonMajorExtraMinutes(nonMajorMinutes);
    if (isCongesDay) {
      details.push("Cong\u00E9s: options indisponibles");
    }

    if (normalizedCode === "FORMATION" && formationMinutes > 0) {
      details.push(`Formation : ${formatFormationMinutes(formationMinutes)}`);
    }

    summaryLine1.textContent = `Service actuel : ${getServiceDisplayName(normalizedCode)}`;
    summaryLine2.innerHTML = `Panier : <strong>${panierToggle.checked ? "Oui" : "Non"}</strong>`;
    summaryLine3.innerHTML = `Heures suppl\u00E9mentaires ${activeTypeLabel} : <strong>${activeDuration}</strong>`;
    summaryLine4.innerHTML = `Heures d\u00E9duites : <strong>${formatMissingMinutes(missingMinutes)}</strong>${
      details.length > 0 ? ` - ${details.join(" - ")}` : ""
    }`;
    syncPanierDetailsState();
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
    if (allCodes.includes(filter)) return;

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

  majorTypeInput.addEventListener("change", () => {
    switchExtraType("major");
  });
  nonMajorTypeInput.addEventListener("change", () => {
    switchExtraType("nonMajor");
  });
  panierToggle.addEventListener("change", () => {
    syncPanierDetailsState();
    renderSummaryText();
  });
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

