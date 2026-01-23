// utils/conges.js
// Gestion centrale des congés (logique métier pure, sans UI)
// ⚠️ Hypothèse métier verrouillée :
// - Une seule période de congés à la fois
// - Pas de congés multiples ou fractionnés

import { getConfig } from "../data/storage.js";
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

export async function getCongesPeriod() {
  const entry = await getConfig("conges");
  const value = entry?.value;

  if (!value) return null;

  const start = parseFRDate(value.start);
  const end = parseFRDate(value.end);

  if (!start || !end) return null;

  // normalisation ordre
  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

// =======================
// TEST DATE EN CONGÉS
// =======================

export async function isDateInConges(date) {
  const period = await getCongesPeriod();
  if (!period) return false;

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const start = new Date(period.start);
  const end = new Date(period.end);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return d >= start && d <= end;
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

export async function getGuidedStartDay(year, monthIndex) {
  const period = await getCongesPeriod();
  if (!period) return 1;

  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);

  const cStart = period.start;
  const cEnd = period.end;

  // congés hors mois
  if (cEnd < monthStart || cStart > monthEnd) {
    return 1;
  }

  // congés qui commencent avant ou au début du mois
  if (cStart <= monthStart && cEnd >= monthStart) {
    const nextDay = new Date(cEnd);
    nextDay.setDate(nextDay.getDate() + 1);

    if (nextDay > monthEnd) {
      // mois entièrement en congés
      return null;
    }

    return nextDay.getDate();
  }

  // congés au milieu → on commence normalement
  return 1;
}

// =======================
// UTILITAIRE : LISTE JOURS BLOQUÉS
// =======================

export async function getCongesDaysISOForMonth(year, monthIndex) {
  const period = await getCongesPeriod();
  if (!period) return [];

  const days = [];
  const d = new Date(period.start.getTime());

  while (d <= period.end) {
    if (d.getFullYear() === year && d.getMonth() === monthIndex) {
      days.push(toISODateLocal(d));
    }
    d.setDate(d.getDate() + 1);
  }

  return days;
}
