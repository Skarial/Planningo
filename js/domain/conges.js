/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/conges.js
// Gestion centrale des congs (logique mtier pure, sans UI)
// Supporte plusieurs priodes, avec compatibilit ancien format.

import { toISODateLocal } from "../utils.js";

// =======================
// PARSING DATE jj/mm/aaaa
// =======================

export function parseFRDate(input) {
  if (typeof input !== "string") return null;

  const match = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm) - 1;
  const year = Number(yyyy);

  const date = new Date(year, month, day);

  // validation relle de la date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

// =======================
// LECTURE CONGS CONFIG
// =======================

function cloneDate(d) {
  return new Date(d.getTime());
}

function addDays(date, days) {
  const d = cloneDate(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parsePeriod(period) {
  if (!period) return null;
  const start = parseFRDate(period.start);
  const end = parseFRDate(period.end);
  if (!start || !end) return null;
  if (start > end) {
    return { start: end, end: start };
  }
  return { start, end };
}

export function getCongesPeriods(congesConfig) {
  if (!congesConfig) return [];

  let raw = [];

  if (Array.isArray(congesConfig.periods)) {
    raw = congesConfig.periods;
  } else if (congesConfig.start || congesConfig.end) {
    raw = [congesConfig];
  }

  const parsed = raw.map(parsePeriod).filter(Boolean);
  if (parsed.length === 0) return [];

  parsed.sort((a, b) => a.start - b.start);

  const merged = [];
  for (const p of parsed) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ start: cloneDate(p.start), end: cloneDate(p.end) });
      continue;
    }

    const lastEndPlusOne = addDays(last.end, 1);
    if (p.start <= lastEndPlusOne) {
      if (p.end > last.end) last.end = cloneDate(p.end);
    } else {
      merged.push({ start: cloneDate(p.start), end: cloneDate(p.end) });
    }
  }

  return merged;
}

export function getCongesPeriod(congesConfig) {
  const periods = getCongesPeriods(congesConfig);
  return periods[0] ?? null;
}

// =======================
// TEST DATE EN CONGS
// =======================

export function isDateInConges(date, congesConfig) {
  const periods = getCongesPeriods(congesConfig);
  if (periods.length === 0) return false;

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  return periods.some((period) => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  });
}

// =======================
// LOGIQUE SAISIE GUIDE
// =======================

/**
 * Calcule le premier jour saisissable du mois
 * selon la priode de congs.
 *
 * CAS GRS (CERTAIN) :
 * - pas de congs  jour 1
 * - congs hors mois  jour 1
 * - congs dbut mois  lendemain de fin congs
 * - congs milieu mois  jour 1
 */
//  IMPORTANT
// Les congs en milieu de mois sont grs dynamiquement
// par renderDay() via isDateInConges()
// Cette fonction ne gre QUE le point de dpart initial

export function getGuidedStartDay(year, monthIndex, congesConfig) {
  const periods = getCongesPeriods(congesConfig);
  if (periods.length === 0) return 1;

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  // Cherche une priode qui couvre le dbut du mois
  const covering = periods.filter(
    (p) => p.start <= monthStart && p.end >= monthStart,
  );

  if (covering.length === 0) return 1;

  const maxEnd = covering.reduce((acc, p) => (p.end > acc ? p.end : acc), covering[0].end);
  const nextDay = addDays(maxEnd, 1);

  if (nextDay > monthEnd) {
    // mois entirement en congs
    return null;
  }

  return nextDay.getDate();
}

// =======================
// UTILITAIRE : LISTE JOURS BLOQUS
// =======================

export function getCongesDaysISOForMonth(year, monthIndex, congesConfig) {
  const periods = getCongesPeriods(congesConfig);
  if (periods.length === 0) return [];

  const days = [];
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  periods.forEach((period) => {
    const start = period.start < monthStart ? monthStart : period.start;
    const end = period.end > monthEnd ? monthEnd : period.end;
    const d = new Date(start.getTime());

    while (d <= end) {
      if (d.getMonth() === monthIndex && d.getFullYear() === year) {
        days.push(toISODateLocal(d));
      }
      d.setDate(d.getDate() + 1);
    }
  });

  return days;
}

