/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { isDateInConges } from "./conges.js";

function toISODate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeServiceCode(value) {
  if (value == null) return "";
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return "";
  if (normalized === "RPS") return "REPOS";
  if (/^TD(?=\s|\d|$)/i.test(normalized)) {
    return normalized
      .replace(/^TD\s*/i, "TAD ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (/^TAD(?=\s|\d|$)/i.test(normalized)) {
    return normalized
      .replace(/^TAD\s*/i, "TAD ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return normalized;
}

function dayDiffInclusive(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86400000) + 1;
}

function normalizeDateToLocalMidnight(inputDate) {
  const date = new Date(inputDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function roundTaxReal(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function getTaxRealCurrentYear(nowDate = new Date()) {
  return new Date(nowDate).getFullYear();
}

export function normalizeTaxRealYear(rawYear, nowDate = new Date()) {
  const currentYear = getTaxRealCurrentYear(nowDate);
  const year = Number(rawYear);
  if (!Number.isInteger(year)) return currentYear;
  return Math.max(2000, Math.min(2100, year));
}

export function normalizeTaxRealDistanceKmOneWay(rawDistance, fallbackDistanceKm = 2) {
  const configuredDistance = Number(rawDistance);
  if (!Number.isFinite(configuredDistance) || configuredDistance <= 0) {
    return fallbackDistanceKm;
  }
  return configuredDistance;
}

export function getTaxRealYearDateRangeISO(rawYear, nowDate = new Date()) {
  const selectedYear = normalizeTaxRealYear(rawYear, nowDate);
  const start = new Date(selectedYear, 0, 1);
  const end = new Date(selectedYear, 11, 31);
  return {
    selectedYear,
    startISO: toISODate(start),
    endISO: toISODate(end),
  };
}

export function computeTaxRealMetrics({
  entries = [],
  congesConfig = null,
  rawYear,
  rawDistanceKmOneWay,
  nowDate = new Date(),
}) {
  const now = normalizeDateToLocalMidnight(nowDate);
  const currentYear = getTaxRealCurrentYear(now);
  const selectedYear = normalizeTaxRealYear(rawYear, now);
  const distanceOneWayKm = normalizeTaxRealDistanceKmOneWay(rawDistanceKmOneWay);

  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31);
  const entryMap = new Map(
    (Array.isArray(entries) ? entries : []).map((entry) => [entry.date, entry]),
  );

  let workedDays = 0;
  let workedDaysToDate = 0;
  const cursor = new Date(yearStart.getTime());
  while (cursor <= yearEnd) {
    if (!isDateInConges(cursor, congesConfig)) {
      const entry = entryMap.get(toISODate(cursor));
      const code = normalizeServiceCode(entry?.serviceCode);
      if (code && code !== "REPOS") {
        workedDays += 1;
        if (cursor <= now) {
          workedDaysToDate += 1;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const workedDaysDisplay = workedDaysToDate;
  const estimatedRoundTripKm = roundTaxReal(workedDaysDisplay * distanceOneWayKm * 2, 0);

  const totalYearDays = dayDiffInclusive(yearStart, yearEnd);
  const elapsedYearDays =
    selectedYear === currentYear
      ? Math.max(1, Math.min(totalYearDays, dayDiffInclusive(yearStart, now)))
      : totalYearDays;

  const yearProgressPct =
    selectedYear < currentYear
      ? 100
      : selectedYear > currentYear
        ? 0
        : roundTaxReal((elapsedYearDays / totalYearDays) * 100, 0);

  const annualProjectionKm =
    selectedYear === currentYear
      ? roundTaxReal(
          ((workedDaysToDate * distanceOneWayKm * 2) / elapsedYearDays) * totalYearDays,
          0,
        )
      : estimatedRoundTripKm;

  return {
    selectedYear,
    distanceOneWayKm: roundTaxReal(distanceOneWayKm, 0),
    workedDays: workedDaysDisplay,
    estimatedRoundTripKm,
    annualProjectionKm,
    yearProgressPct,
    workedDaysTotalInYear: workedDays,
  };
}
