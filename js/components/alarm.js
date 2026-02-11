/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/alarm.js

import {
  getAllServices,
  getConfig,
  getPlanningEntriesInRange,
  setConfig,
} from "../data/storage.js";
import { SERVICES_CATALOG } from "../data/services-catalog.js";
import { buildAlarmPlan } from "../domain/alarm-plan.js";
import { getPeriodStateForDate } from "../domain/periods.js";
import { getPeriodLabel } from "../utils/period-label.js";
import { toISODateLocal } from "../utils.js";
import { clearAlarmResyncPending } from "../state/alarm-resync.js";
import { shouldAutoImportAlarm } from "../state/alarm-auto-import.js";
import {
  getAlarmSyncEnabled,
  setAlarmSyncEnabled,
} from "../state/alarm-feature.js";

const RULES_KEY = "alarm_rules";
const ALARM_NOTICE_SEEN_KEY = "planningo_alarm_notice_seen";
const ALARM_APK_PATH = "./apk/planningo-reveil.apk";
const ALARM_APP_IMPORT_URI = "planningoreveil://import";

const DEFAULT_RULES = {
  offsetMinutes: 90,
  horizonDays: 31,
};

const LIMITS = {
  offsetMin: 1,
  offsetMax: 720,
};

function mergeServicesWithCatalog(userServices) {
  const mergedByCode = new Map();
  const fixedCatalogCodes = new Set(["REPOS", "DM", "DAM"]);
  const addService = (service) => {
    if (!service || !service.code) return;
    const code = String(service.code).trim().toUpperCase();
    if (!code) return;
    mergedByCode.set(code, service);
  };

  if (Array.isArray(userServices)) {
    userServices.forEach(addService);
  }

  SERVICES_CATALOG.forEach((service) => {
    const code = String(service?.code || "")
      .trim()
      .toUpperCase();
    if (!code) return;
    if (fixedCatalogCodes.has(code)) {
      mergedByCode.set(code, service);
      return;
    }
    if (!mergedByCode.has(code)) {
      mergedByCode.set(code, service);
    }
  });

  return Array.from(mergedByCode.values());
}

function parseISODateLocal(dateISO) {
  if (typeof dateISO !== "string") return null;
  const parts = dateISO.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, value));
}

function normalizeRules(input) {
  const offset = clampNumber(
    Number(input?.offsetMinutes),
    LIMITS.offsetMin,
    LIMITS.offsetMax,
  );
  const offsetMinutes =
    offset != null ? Math.round(offset) : DEFAULT_RULES.offsetMinutes;

  const horizonDays = DEFAULT_RULES.horizonDays;

  return { offsetMinutes, horizonDays };
}

function formatOffsetLabel(minutes) {
  const total = Math.max(0, Math.floor(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function isAndroidDevice() {
  try {
    return /android/i.test(String(navigator?.userAgent || ""));
  } catch {
    return false;
  }
}

function getAlarmEnvironmentDiagnostics() {
  const canClipboardWrite = Boolean(
    navigator?.clipboard && typeof navigator.clipboard.writeText === "function",
  );
  const canNavigatorShare = Boolean(
    navigator?.share && typeof navigator.share === "function",
  );
  const canFileShare = Boolean(
    navigator?.canShare && typeof navigator.canShare === "function",
  );

  return {
    isAndroid: isAndroidDevice(),
    canClipboardWrite,
    canNavigatorShare,
    canFileShare,
  };
}

function validatePlanShape(plan) {
  if (!plan || typeof plan !== "object") {
    return { ok: false, reason: "Plan invalide." };
  }

  if (!Array.isArray(plan.alarms)) {
    return { ok: false, reason: "Plan invalide: alarms manquant." };
  }

  const ids = new Set();
  for (const alarm of plan.alarms) {
    if (!alarm || typeof alarm !== "object") {
      return { ok: false, reason: "Plan invalide: alarme incomplete." };
    }
    if (!alarm.id || typeof alarm.id !== "string") {
      return { ok: false, reason: "Plan invalide: id d'alarme manquant." };
    }
    if (ids.has(alarm.id)) {
      return { ok: false, reason: "Plan invalide: id d'alarme duplique." };
    }
    ids.add(alarm.id);
    if (!alarm.alarmAt || Number.isNaN(Date.parse(alarm.alarmAt))) {
      return { ok: false, reason: "Plan invalide: date alarme non valide." };
    }
  }

  return { ok: true, count: plan.alarms.length };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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
      }, 2600);
    },
  };
}

async function loadRules() {
  const entry = await getConfig(RULES_KEY);
  return normalizeRules(entry?.value || {});
}

async function persistRules(rules) {
  await setConfig(RULES_KEY, rules);
}

async function buildPlan(rules) {
  const now = new Date();
  const safeRules = normalizeRules(rules);
  const horizonDays = safeRules.horizonDays;
  const startISO = toISODateLocal(now);
  const endISO = toISODateLocal(addDays(now, horizonDays));

  const [entries, services, saisonEntry] = await Promise.all([
    getPlanningEntriesInRange(startISO, endISO),
    getAllServices(),
    getConfig("saison"),
  ]);

  const servicesList = mergeServicesWithCatalog(services);
  const saisonConfig = saisonEntry?.value || {};

  const periodLabelForDate = (dateISO) => {
    const date = parseISODateLocal(dateISO) || new Date();
    const state = getPeriodStateForDate(saisonConfig, date);
    return getPeriodLabel(state);
  };

  const plan = buildAlarmPlan({
    entries,
    services: servicesList,
    periodLabelForDate,
    rules: { ...safeRules, horizonDays },
    now,
    horizonDays,
  });

  return { plan, startISO, endISO };
}

async function sharePlan(plan) {
  const json = JSON.stringify(plan, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const filename = `alarm-plan-${toISODateLocal(new Date())}.json`;

  let file = null;
  try {
    file = new File([blob], filename, { type: "application/json" });
  } catch {
    file = null;
  }

  if (
    file &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: "Plan de reveil",
        text: "Plan d'alarmes Planningo",
      });
      return "share";
    } catch (err) {
      // Fallback si le partage est refusé par le navigateur/OS.
      // On laisse le download gérer la sortie.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return "download";
}

async function tryDirectImportInAlarmApp(plan) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return false;
  }

  const prettyJson = JSON.stringify(plan, null, 2);
  const compactJson = JSON.stringify(plan);

  try {
    await navigator.clipboard.writeText(prettyJson);
  } catch {
    return false;
  }

  const directUrl = `${ALARM_APP_IMPORT_URI}?source=planningo&plan=${encodeURIComponent(compactJson)}`;
  const fallbackUrl = `${ALARM_APP_IMPORT_URI}?source=planningo`;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(timeoutId);
      resolve(value);
    };
    const onVisibilityChange = () => {
      if (document.hidden) finish(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timeoutId = setTimeout(() => finish(false), 1200);

    try {
      window.location.href = directUrl.length <= 12000 ? directUrl : fallbackUrl;
    } catch {
      finish(false);
    }
  });
}

function hasSeenAlarmNotice() {
  try {
    return localStorage.getItem(ALARM_NOTICE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function setAlarmNoticeSeen() {
  try {
    localStorage.setItem(ALARM_NOTICE_SEEN_KEY, "1");
  } catch {
    // No-op: notice persistence must never break UX.
  }
}

export async function renderAlarmView(options = {}) {
  const view = document.getElementById("view-alarm");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className =
    "settings-view settings-page-variant settings-card-spacing-md alarm-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Réveil intelligent";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Android uniquement";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const sectionSettings = document.createElement("section");
  sectionSettings.className = "alarm-section alarm-section-settings";
  const sectionSettingsTitle = document.createElement("h3");
  sectionSettingsTitle.className = "alarm-section-title";
  sectionSettingsTitle.textContent = "Réglages";

  const enableSyncRow = document.createElement("label");
  enableSyncRow.className = "settings-toggle";
  const enableSyncLabel = document.createElement("span");
  enableSyncLabel.textContent = "Activer le reveil intelligent (Android)";
  const enableSyncToggle = document.createElement("input");
  enableSyncToggle.type = "checkbox";
  enableSyncRow.append(enableSyncLabel, enableSyncToggle);

  const labelOffset = document.createElement("label");
  labelOffset.textContent = "Avance (minutes)";
  const inputOffset = document.createElement("input");
  inputOffset.type = "number";
  inputOffset.min = "0";
  inputOffset.max = String(LIMITS.offsetMax);
  inputOffset.step = "2";

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "settings-btn primary";
  saveBtn.textContent = "Enregistrer les réglages";

  const resetBtn = document.createElement("button");
  resetBtn.className = "settings-btn danger";
  resetBtn.type = "button";
  resetBtn.textContent = "Réinitialiser";

  actions.append(saveBtn, resetBtn);

  const actionBtn = document.createElement("button");
  actionBtn.className = "settings-btn alarm-import-btn";
  actionBtn.textContent = "Importer les alarmes dans le reveil";

  const sectionInstall = document.createElement("section");
  sectionInstall.className = "alarm-section alarm-section-install";
  const sectionInstallTitle = document.createElement("h3");
  sectionInstallTitle.className = "alarm-section-title";
  sectionInstallTitle.textContent = "Installation";

  const installApkBtn = document.createElement("button");
  installApkBtn.className = "settings-btn";
  installApkBtn.type = "button";
  installApkBtn.textContent = "Installer l'app Réveil (APK)";

  const helpBtn = document.createElement("button");
  helpBtn.className = "settings-btn alarm-help-btn";
  helpBtn.type = "button";
  helpBtn.textContent = "Voir la notice";

  const previewBtn = document.createElement("button");
  previewBtn.className = "settings-btn";
  previewBtn.type = "button";
  previewBtn.textContent = "Vérifier la prochaine alarme";

  const diagnoseBtn = document.createElement("button");
  diagnoseBtn.className = "settings-btn";
  diagnoseBtn.type = "button";
  diagnoseBtn.textContent = "Vérifier l'environnement";

  const sectionChecks = document.createElement("section");
  sectionChecks.className = "alarm-section alarm-section-checks";
  const sectionChecksTitle = document.createElement("h3");
  sectionChecksTitle.className = "alarm-section-title";
  sectionChecksTitle.textContent = "Vérifications";
  const checksActions = document.createElement("div");
  checksActions.className = "alarm-check-actions";

  const diagnosticsToggleBtn = document.createElement("button");
  diagnosticsToggleBtn.type = "button";
  diagnosticsToggleBtn.className = "alarm-diagnostics-toggle";
  diagnosticsToggleBtn.textContent = "Afficher le diagnostic ▾";

  const diagnosticsPanel = document.createElement("div");
  diagnosticsPanel.className = "alarm-diagnostics-panel";
  diagnosticsPanel.hidden = true;

  const diagnosticsList = document.createElement("ul");
  diagnosticsList.className = "settings-note";
  diagnosticsList.style.margin = "0";
  diagnosticsList.style.paddingLeft = "18px";

  const reliabilityHint = document.createElement("p");
  reliabilityHint.className = "settings-note";
  reliabilityHint.textContent =
    "Conseil : vérifiez toujours la prochaine alarme dans l'app Réveil avant un service important.";

  const status = createStatus();

  sectionSettings.append(
    sectionSettingsTitle,
    enableSyncRow,
    labelOffset,
    inputOffset,
    actions,
    actionBtn,
  );

  sectionInstall.append(sectionInstallTitle, installApkBtn);

  checksActions.append(previewBtn);
  diagnosticsPanel.append(diagnoseBtn, diagnosticsList);
  sectionChecks.append(
    sectionChecksTitle,
    checksActions,
    diagnosticsToggleBtn,
    diagnosticsPanel,
    reliabilityHint,
  );

  const footerActions = document.createElement("div");
  footerActions.className = "alarm-footer-actions";
  footerActions.append(helpBtn);

  card.append(
    sectionSettings,
    sectionInstall,
    sectionChecks,
    footerActions,
    status.node,
  );
  root.append(header, card);
  view.appendChild(root);
  const noticeOverlay = document.createElement("div");
  noticeOverlay.className = "alarm-notice-overlay hidden";

  const noticeModal = document.createElement("div");
  noticeModal.className = "alarm-notice-modal";

  const noticeTitle = document.createElement("h3");
  noticeTitle.className = "alarm-notice-title";
  noticeTitle.textContent = "Notice - Réveil intelligent";

  const noticeBody = document.createElement("div");
  noticeBody.className = "alarm-notice-body";
  noticeBody.innerHTML = `
    <p><strong>Important</strong> : le réveil intelligent s'occupe uniquement des <strong>services du matin</strong>.</p>
    <p><strong>Règle utilisée</strong> : <strong>DM</strong> et codes service numériques impairs (ex : DM, 2001, 2101).</p>
    <p><strong>Avance (minutes)</strong> : nombre de minutes où le réveil va sonner avant le début du service.</p>
    <p>Ensuite, utiliséz <strong>Importer dans Réveil</strong> pour envoyer le fichier vers l'application Réveil.</p>
  `;

  const noticeRememberLabel = document.createElement("label");
  noticeRememberLabel.className = "alarm-notice-remember";
  const noticeRemember = document.createElement("input");
  noticeRemember.type = "checkbox";
  noticeRemember.checked = true;
  const noticeRememberText = document.createElement("span");
  noticeRememberText.textContent = "Ne plus afficher";
  noticeRememberLabel.append(noticeRemember, noticeRememberText);

  const noticeCloseBtn = document.createElement("button");
  noticeCloseBtn.type = "button";
  noticeCloseBtn.className = "settings-btn primary";
  noticeCloseBtn.textContent = "J'ai compris";

  noticeModal.append(
    noticeTitle,
    noticeBody,
    noticeRememberLabel,
    noticeCloseBtn,
  );
  noticeOverlay.appendChild(noticeModal);
  view.appendChild(noticeOverlay);

  function openNotice() {
    noticeOverlay.classList.remove("hidden");
  }

  function closeNotice() {
    if (noticeRemember.checked) {
      setAlarmNoticeSeen();
    }
    noticeOverlay.classList.add("hidden");
  }

  helpBtn.addEventListener("click", openNotice);
  noticeCloseBtn.addEventListener("click", closeNotice);
  noticeOverlay.addEventListener("click", (e) => {
    if (e.target === noticeOverlay) {
      closeNotice();
    }
  });

  if (!hasSeenAlarmNotice()) {
    openNotice();
  }

  function renderDiagnostics() {
    const diagnostics = getAlarmEnvironmentDiagnostics();
    diagnosticsList.innerHTML = "";

    const lines = [
      diagnostics.isAndroid
        ? "OK - appareil Android détecté."
        : "Attention - Android non détecté (import direct potentiellement indisponible).",
      diagnostics.canClipboardWrite
        ? "OK - accès presse-papiers disponible."
        : "Attention - presse-papiers indisponible : import direct vers l'app désactivé.",
      diagnostics.canNavigatorShare
        ? "OK - partage navigateur disponible."
        : "Info - partage navigateur indisponible : téléchargement du plan utilisé.",
      diagnostics.canFileShare
        ? "OK - partage de fichier disponible."
        : "Info - partage fichier limité : téléchargement du plan utilisé.",
    ];

    lines.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      diagnosticsList.appendChild(item);
    });
  }

  renderDiagnostics();

  const alarmSyncEnabled = await getAlarmSyncEnabled();
  enableSyncToggle.checked = alarmSyncEnabled;

  enableSyncToggle.addEventListener("change", async () => {
    const enabled = await setAlarmSyncEnabled(enableSyncToggle.checked);
    if (!enabled) {
      clearAlarmResyncPending();
    }
    status.show(
      enabled
        ? "Rappels reveil actives."
        : "Rappels reveil désactivés.",
    );
  });

  let currentRules = await loadRules();

  function syncInputs(rulesValue) {
    inputOffset.value = String(rulesValue.offsetMinutes);
  }

  syncInputs(currentRules);

  saveBtn.addEventListener("click", async () => {
    const nextRules = normalizeRules({
      offsetMinutes: inputOffset.value,
    });
    await persistRules(nextRules);
    currentRules = nextRules;
    syncInputs(currentRules);
    status.show("Règles enregistrées.");
  });

  resetBtn.addEventListener("click", async () => {
    await persistRules(DEFAULT_RULES);
    currentRules = { ...DEFAULT_RULES };
    syncInputs(currentRules);
    status.show("Règles réinitialisées.");
  });

  installApkBtn.addEventListener("click", () => {
    const downloadUrl = new URL(ALARM_APK_PATH, location.href);
    downloadUrl.searchParams.set("v", String(Date.now()));

    const link = document.createElement("a");
    link.href = downloadUrl.toString();
    link.download = "planningo-reveil.apk";
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    status.show("Ouverture du téléchargement APK...");
  });

  let isImporting = false;

  previewBtn.addEventListener("click", async () => {
    try {
      const { plan, startISO, endISO } = await buildPlan(currentRules);
      const planCheck = validatePlanShape(plan);
      if (!planCheck.ok) {
        status.show(planCheck.reason);
        return;
      }
      if (planCheck.count === 0) {
        status.show(
          `Aucune alarme générée entre ${startISO} et ${endISO}. Vérifiez le planning et les services du matin.`,
        );
        return;
      }
      const nextAlarm = plan.alarms[0];
      status.show(
        `Prochaine alarme : ${nextAlarm.serviceDate} à ${nextAlarm.serviceStart} (déclenchement ${nextAlarm.alarmAt}).`,
      );
    } catch {
      status.show("Erreur pendant la vérification du plan.");
    }
  });

  diagnosticsToggleBtn.addEventListener("click", () => {
    const isHidden = diagnosticsPanel.hidden;
    diagnosticsPanel.hidden = !isHidden;
    diagnosticsToggleBtn.textContent = isHidden
      ? "Masquer le diagnostic ▴"
      : "Afficher le diagnostic ▾";
  });

  diagnoseBtn.addEventListener("click", () => {
    renderDiagnostics();
    status.show("Diagnostic mis à jour.");
  });

  async function runImport() {
    if (isImporting) return;
    isImporting = true;
    actionBtn.disabled = true;
    const prevText = actionBtn.textContent;
    actionBtn.textContent = "Génération...";

    try {
      const { plan, startISO, endISO } = await buildPlan(currentRules);
      const planCheck = validatePlanShape(plan);
      if (!planCheck.ok) {
        status.show(planCheck.reason);
        return;
      }
      if (planCheck.count === 0) {
        status.show(
          `Aucune alarme à importer entre ${startISO} et ${endISO}. Vérifiez le planning et les services du matin.`,
        );
        clearAlarmResyncPending();
        return;
      }

      const directImported = await tryDirectImportInAlarmApp(plan);
      const method = directImported ? "app" : await sharePlan(plan);
      const count = planCheck.count;
      const suffix =
        method === "app"
          ? "importé dans Réveil"
          : method === "share"
            ? "partagé"
            : "téléchargé";
      status.show(
        `Plan ${suffix} (${count} alarme${count > 1 ? "s" : ""}) - ${startISO} à ${endISO}.`,
      );
      clearAlarmResyncPending();
    } catch (err) {
      const msg =
        err && err.name === "AbortError"
          ? "Partage annulé."
          : "Erreur de génération.";
      status.show(msg);
    } finally {
      actionBtn.textContent = prevText;
      actionBtn.disabled = false;
      isImporting = false;
    }
  }

  actionBtn.addEventListener("click", runImport);

  if (shouldAutoImportAlarm(options)) {
    runImport();
  }
}







