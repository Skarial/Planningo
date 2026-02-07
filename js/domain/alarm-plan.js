/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/alarm-plan.js

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

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatOffsetISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const offsetAbs = Math.abs(offset);
  const offsetH = String(Math.floor(offsetAbs / 60)).padStart(2, "0");
  const offsetM = String(offsetAbs % 60).padStart(2, "0");

  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${offsetH}:${offsetM}`;
}

function parseISODate(dateISO) {
  if (typeof dateISO !== "string") return null;
  const match = dateISO.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, yy, mm, dd] = match;
  const year = Number(yy);
  const month = Number(mm) - 1;
  const day = Number(dd);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatOffsetLabel(minutes) {
  const total = Math.max(0, Math.floor(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

const FALLBACK_START_MINUTES_BY_CODE = {
  DM: 5 * 60 + 45,
};

function getServiceStartMinutes(service, periodLabel) {
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

  const minutes = matchingPeriod.plages
    .map((plage) => (plage ? parseTimeToMinutes(plage.debut) : null))
    .filter((value) => value != null);

  if (minutes.length === 0) return null;

  return Math.min(...minutes);
}

function isMorningServiceCode(serviceCode, service, periodLabel) {
  if (typeof serviceCode !== "string" && typeof serviceCode !== "number") {
    return false;
  }
  const normalized = String(serviceCode).trim().toUpperCase();
  if (normalized === "DM") return true;
  if (normalized === "DAM") return false;
  // Ignore line-only values like "21"/"23": we only accept real service codes.
  if (!/^\d{3,}$/.test(normalized)) return false;
  const value = Number(normalized);
  if (!Number.isInteger(value)) return false;
  if (value % 2 !== 1) return false;

  // Extra guard: if service timings are known, keep only morning starts.
  const startMinutes = getServiceStartMinutes(service, periodLabel);
  if (startMinutes == null) return true;
  return startMinutes < 12 * 60;
}

export function buildAlarmPlan(options = {}) {
  const {
    entries = [],
    services = [],
    periodLabelForDate = null,
    rules = { offsetMinutes: 90 },
    now = new Date(),
    horizonDays = null,
  } = options;

  const appliedRules = {
    offsetMinutes:
      typeof rules.offsetMinutes === "number" ? rules.offsetMinutes : 90,
  };

  if (typeof horizonDays === "number") {
    appliedRules.horizonDays = horizonDays;
  } else if (typeof rules.horizonDays === "number") {
    appliedRules.horizonDays = rules.horizonDays;
  }

  const plan = {
    schemaVersion: 1,
    generatedAt: formatOffsetISO(now instanceof Date ? now : new Date(now)),
    rules: appliedRules,
    alarms: [],
  };

  const offsetMinutes = appliedRules.offsetMinutes;
  if (!Number.isFinite(offsetMinutes)) {
    return plan;
  }

  const servicesByCode = new Map(
    services
      .filter((service) => service && service.code)
      .map((service) => [String(service.code).trim().toUpperCase(), service]),
  );

  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const alarms = [];

  for (const entry of entries) {
    if (!entry || !entry.date || !entry.serviceCode) continue;

    const serviceCode = String(entry.serviceCode).trim().toUpperCase();
    const service = servicesByCode.get(serviceCode) || null;

    const periodLabel =
      typeof periodLabelForDate === "function"
        ? periodLabelForDate(entry.date)
        : null;
    if (!isMorningServiceCode(serviceCode, service, periodLabel)) continue;

    const explicitStart = parseTimeToMinutes(entry.startTime);
    const serviceStartMinutes =
      serviceCode === "DM"
        ? FALLBACK_START_MINUTES_BY_CODE.DM
        : explicitStart != null
          ? explicitStart
          : getServiceStartMinutes(service, periodLabel) ??
            FALLBACK_START_MINUTES_BY_CODE[serviceCode] ??
            null;
    if (serviceStartMinutes == null) continue;

    const serviceDate = parseISODate(entry.date);
    if (!serviceDate) continue;

    const serviceStart = formatMinutesToTime(serviceStartMinutes);
    if (!serviceStart) continue;

    const serviceStartDate = new Date(serviceDate);
    serviceStartDate.setHours(
      Math.floor(serviceStartMinutes / 60),
      serviceStartMinutes % 60,
      0,
      0,
    );

    const alarmDate = new Date(
      serviceStartDate.getTime() - offsetMinutes * 60 * 1000,
    );
    if (alarmDate.getTime() <= nowMs) continue;

    const alarmAt = formatOffsetISO(alarmDate);
    const alarmDateISO = formatLocalDate(alarmDate);
    const alarmTime = formatMinutesToTime(
      alarmDate.getHours() * 60 + alarmDate.getMinutes(),
    );

    const id = `${entry.date}__${serviceCode}__start_${serviceStart.replace(
      ":",
      "",
    )}__alarm_${alarmDateISO}_${alarmTime.replace(":", "")}`;

    alarms.push({
      id,
      serviceDate: entry.date,
      serviceCode,
      serviceStart,
      alarmAt,
      label: `Service ${serviceStart} - reveil ${formatOffsetLabel(
        offsetMinutes,
      )} avant`,
      requiresUserActionToStop: true,
    });
  }

  alarms.sort((a, b) => new Date(a.alarmAt) - new Date(b.alarmAt));
  plan.alarms = alarms;

  return plan;
}
