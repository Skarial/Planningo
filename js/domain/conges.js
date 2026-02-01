// js/domain/conges.js
// Gestion centrale des congés (logique métier pure, sans UI)
// Supporte plusieurs périodes, avec compatibilité ancien format.

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

  // validation réelle de la date
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
// LECTURE CONGÉS CONFIG
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
// TEST DATE EN CONGÉS
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
// LOGIQUE SAISIE GUIDÉE
// =======================

/**
 * Calcule le premier jour saisissable du mois
 * selon la période de congés.
 *
 * CAS GÉRÉS (CERTAIN) :
 * - pas de congés → jour 1
 * - congés hors mois → jour 1
 * - congés début mois → lendemain de fin congés
 * - congés milieu mois → jour 1
 */
// ⚠️ IMPORTANT
// Les congés en milieu de mois sont gérés dynamiquement
// par renderDay() via isDateInConges()
// Cette fonction ne gère QUE le point de départ initial

export function getGuidedStartDay(year, monthIndex, congesConfig) {
  const periods = getCongesPeriods(congesConfig);
  if (periods.length === 0) return 1;

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  // Cherche une période qui couvre le début du mois
  const covering = periods.filter(
    (p) => p.start <= monthStart && p.end >= monthStart,
  );

  if (covering.length === 0) return 1;

  const maxEnd = covering.reduce((acc, p) => (p.end > acc ? p.end : acc), covering[0].end);
  const nextDay = addDays(maxEnd, 1);

  if (nextDay > monthEnd) {
    // mois entièrement en congés
    return null;
  }

  return nextDay.getDate();
}

// =======================
// UTILITAIRE : LISTE JOURS BLOQUÉS
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
