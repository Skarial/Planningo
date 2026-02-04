/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/alarm.js

import { getAllServices, getConfig, getPlanningEntriesInRange, setConfig } from "../data/storage.js";
import { SERVICES_CATALOG } from "../data/services-catalog.js";
import { buildAlarmPlan } from "../domain/alarm-plan.js";
import { getPeriodStateForDate } from "../domain/periods.js";
import { getPeriodLabel } from "../utils/period-label.js";
import { toISODateLocal } from "../utils.js";

const RULES_KEY = "alarm_rules";

const DEFAULT_RULES = {
  startBefore: "10:00",
  offsetMinutes: 90,
  horizonDays: 30,
};

const LIMITS = {
  offsetMin: 1,
  offsetMax: 720,
  horizonMin: 1,
  horizonMax: 60,
};

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

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes) {
  if (typeof totalMinutes !== "number" || Number.isNaN(totalMinutes)) {
    return null;
  }
  const minutes = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, value));
}

function normalizeRules(input) {
  const startMinutes = parseTimeToMinutes(input?.startBefore);
  const startBefore =
    startMinutes != null
      ? formatMinutesToTime(startMinutes)
      : DEFAULT_RULES.startBefore;

  const offset = clampNumber(
    Number(input?.offsetMinutes),
    LIMITS.offsetMin,
    LIMITS.offsetMax,
  );
  const offsetMinutes =
    offset != null ? Math.round(offset) : DEFAULT_RULES.offsetMinutes;

  const horizon = clampNumber(
    Number(input?.horizonDays),
    LIMITS.horizonMin,
    LIMITS.horizonMax,
  );
  const horizonDays =
    horizon != null ? Math.round(horizon) : DEFAULT_RULES.horizonDays;

  return { startBefore, offsetMinutes, horizonDays };
}

function formatOffsetLabel(minutes) {
  const total = Math.max(0, Math.floor(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
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

  const servicesList =
    Array.isArray(services) && services.length > 0 ? services : SERVICES_CATALOG;
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
    await navigator.share({
      files: [file],
      title: "Plan de reveil",
      text: "Plan d'alarmes Planningo",
    });
    return "share";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return "download";
}

export async function renderAlarmView() {
  const view = document.getElementById("view-alarm");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Reveil intelligent";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Android uniquement (pour l'instant)";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const rules = document.createElement("div");
  rules.className = "settings-note";
  rules.textContent = "Regle active : service avant 10:00 => reveil 1h30 avant.";

  const horizon = document.createElement("div");
  horizon.className = "settings-note";
  horizon.textContent = "Horizon : 30 jours a venir.";

  const labelStart = document.createElement("label");
  labelStart.textContent = "Heure limite (avant)";
  const inputStart = document.createElement("input");
  inputStart.type = "time";

  const labelOffset = document.createElement("label");
  labelOffset.textContent = "Avance (minutes)";
  const inputOffset = document.createElement("input");
  inputOffset.type = "number";
  inputOffset.min = String(LIMITS.offsetMin);
  inputOffset.max = String(LIMITS.offsetMax);
  inputOffset.step = "5";

  const labelHorizon = document.createElement("label");
  labelHorizon.textContent = "Horizon (jours)";
  const inputHorizon = document.createElement("input");
  inputHorizon.type = "number";
  inputHorizon.min = String(LIMITS.horizonMin);
  inputHorizon.max = String(LIMITS.horizonMax);
  inputHorizon.step = "1";

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "settings-btn primary";
  saveBtn.textContent = "Valider";

  const resetBtn = document.createElement("button");
  resetBtn.className = "settings-btn danger";
  resetBtn.type = "button";
  resetBtn.textContent = "Reinitialiser";

  actions.append(saveBtn, resetBtn);

  const actionBtn = document.createElement("button");
  actionBtn.className = "settings-btn primary";
  actionBtn.textContent = "Mettre a jour le reveil";

  const status = createStatus();

  card.append(
    rules,
    horizon,
    labelStart,
    inputStart,
    labelOffset,
    inputOffset,
    labelHorizon,
    inputHorizon,
    actions,
    actionBtn,
    status.node,
  );
  root.append(header, card);
  view.appendChild(root);

  let currentRules = await loadRules();

  function syncInputs(rulesValue) {
    inputStart.value = rulesValue.startBefore;
    inputOffset.value = String(rulesValue.offsetMinutes);
    inputHorizon.value = String(rulesValue.horizonDays);
    rules.textContent = `Regle active : service avant ${rulesValue.startBefore} => reveil ${formatOffsetLabel(
      rulesValue.offsetMinutes,
    )} avant.`;
    horizon.textContent = `Horizon : ${rulesValue.horizonDays} jours a venir.`;
  }

  syncInputs(currentRules);

  saveBtn.addEventListener("click", async () => {
    const nextRules = normalizeRules({
      startBefore: inputStart.value,
      offsetMinutes: inputOffset.value,
      horizonDays: inputHorizon.value,
    });
    await persistRules(nextRules);
    currentRules = nextRules;
    syncInputs(currentRules);
    status.show("Regles enregistrees.");
  });

  resetBtn.addEventListener("click", async () => {
    await persistRules(DEFAULT_RULES);
    currentRules = { ...DEFAULT_RULES };
    syncInputs(currentRules);
    status.show("Regles reinitialisees.");
  });

  actionBtn.addEventListener("click", async () => {
    actionBtn.disabled = true;
    const prevText = actionBtn.textContent;
    actionBtn.textContent = "Generation...";

    try {
      const { plan, startISO, endISO } = await buildPlan(currentRules);
      const method = await sharePlan(plan);
      const count = plan.alarms.length;
      const suffix = method === "share" ? "partage" : "telecharge";
      status.show(
        `Plan ${suffix} (${count} alarme${count > 1 ? "s" : ""}) - ${startISO} a ${endISO}.`,
      );
    } catch (err) {
      const msg = err && err.name === "AbortError" ? "Partage annule." : "Erreur de generation.";
      status.show(msg);
    } finally {
      actionBtn.textContent = prevText;
      actionBtn.disabled = false;
    }
  });
}
