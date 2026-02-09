/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getPeriodStateForDate } from "./periods.js";
import { getPeriodLabel } from "../utils/period-label.js";

const MINIMUM_DAILY_REST_MINUTES = 11 * 60;
const DM_FALLBACK_START_MINUTES = 5 * 60 + 45;

function parseISODateLocal(dateISO) {
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

function normalizeServiceCode(serviceCode) {
  if (typeof serviceCode !== "string" && typeof serviceCode !== "number") {
    return "";
  }
  return String(serviceCode).trim().toUpperCase();
}

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return null;
  const minutes = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function computeBoundsFromPlages(plages) {
  if (!Array.isArray(plages)) return null;
  let startMinutes = null;
  let endMinutes = null;
  for (const plage of plages) {
    if (!plage || !plage.debut || !plage.fin) continue;
    const start = parseTimeToMinutes(plage.debut);
    const end = parseTimeToMinutes(plage.fin);
    if (start == null || end == null) continue;
    let normalizedEnd = end;
    if (normalizedEnd <= start) normalizedEnd += 1440;
    startMinutes = startMinutes == null ? start : Math.min(startMinutes, start);
    endMinutes = endMinutes == null ? normalizedEnd : Math.max(endMinutes, normalizedEnd);
  }
  if (startMinutes == null || endMinutes == null) return null;
  return { startMinutes, endMinutes };
}

function resolvePeriodLabelForDate(dateISO, saisonConfig) {
  const date = parseISODateLocal(dateISO);
  if (!date) return null;
  return getPeriodLabel(getPeriodStateForDate(saisonConfig, date));
}

function resolveMatchingPeriod(service, periodLabel) {
  if (!service || !Array.isArray(service.periodes)) return null;
  return (
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
    ) ||
    null
  );
}

function resolveServiceBounds({ serviceCode, dateISO, entry, servicesByCode, saisonConfig }) {
  const normalizedCode = normalizeServiceCode(serviceCode);
  if (!normalizedCode || normalizedCode === "REPOS") return null;

  const explicitStart = parseTimeToMinutes(entry?.startTime);
  const explicitEnd = parseTimeToMinutes(entry?.endTime);
  if (explicitStart != null && explicitEnd != null) {
    return {
      startMinutes: explicitStart,
      endMinutes: explicitEnd <= explicitStart ? explicitEnd + 1440 : explicitEnd,
    };
  }

  const service = servicesByCode.get(normalizedCode) || null;
  const periodLabel = resolvePeriodLabelForDate(dateISO, saisonConfig);
  const period = resolveMatchingPeriod(service, periodLabel);
  const fromPlages = computeBoundsFromPlages(period?.plages);
  if (fromPlages) return fromPlages;

  if (normalizedCode === "DM") {
    return {
      startMinutes: DM_FALLBACK_START_MINUTES,
      endMinutes: null,
    };
  }

  return null;
}

function computeDiffDays(previousDateISO, currentDateISO) {
  const previousDate = parseISODateLocal(previousDateISO);
  const currentDate = parseISODateLocal(currentDateISO);
  if (!previousDate || !currentDate) return null;
  const ms = currentDate.getTime() - previousDate.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function computeDailyRestWarning({
  previousDateISO,
  previousEntry,
  currentDateISO,
  currentServiceCode,
  servicesByCode,
  saisonConfig = null,
  minimumMinutes = MINIMUM_DAILY_REST_MINUTES,
}) {
  const safeMinimum = Number.isFinite(minimumMinutes)
    ? Math.max(0, Math.floor(minimumMinutes))
    : MINIMUM_DAILY_REST_MINUTES;

  const dayDiff = computeDiffDays(previousDateISO, currentDateISO);
  if (dayDiff == null || dayDiff <= 0) {
    return { shouldWarn: false, reason: "INVALID_DATES" };
  }

  const previousBounds = resolveServiceBounds({
    serviceCode: previousEntry?.serviceCode,
    dateISO: previousDateISO,
    entry: previousEntry,
    servicesByCode,
    saisonConfig,
  });
  const currentBounds = resolveServiceBounds({
    serviceCode: currentServiceCode,
    dateISO: currentDateISO,
    entry: null,
    servicesByCode,
    saisonConfig,
  });

  const previousEndMinutes = previousBounds?.endMinutes;
  const currentStartMinutes = currentBounds?.startMinutes;

  if (!Number.isFinite(previousEndMinutes) || !Number.isFinite(currentStartMinutes)) {
    return { shouldWarn: false, reason: "MISSING_TIME_BOUNDS" };
  }

  const restMinutes = dayDiff * 1440 + currentStartMinutes - previousEndMinutes;
  if (!Number.isFinite(restMinutes)) {
    return { shouldWarn: false, reason: "INVALID_REST" };
  }

  return {
    shouldWarn: restMinutes < safeMinimum,
    restMinutes,
    minimumMinutes: safeMinimum,
    previousDateISO,
    currentDateISO,
    previousEndTime: formatMinutesToTime(previousEndMinutes),
    currentStartTime: formatMinutesToTime(currentStartMinutes),
  };
}

export function formatRestMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return "00:00";
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
