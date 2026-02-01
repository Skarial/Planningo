/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

/**
 * Ã‰tats mÃ©tier possibles pour la pÃ©riode globale
 */
export const PERIOD_STATE = {
  DEFAULT: "default",
  SEASONAL: "seasonal",
};

function parseISODate(input) {
  if (typeof input !== "string") return null;
  const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
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

/**
 * Indique si une saison est rÃ©ellement configurÃ©e
 */
export function isSeasonConfigured(saisonConfig) {
  const s = saisonConfig;

  return Boolean(
    s &&
    typeof s.saisonDebut === "string" &&
    typeof s.saisonFin === "string" &&
    s.saisonDebut !== "" &&
    s.saisonFin !== "",
  );
}

/**
 * Retourne lâ€™Ã©tat mÃ©tier de la pÃ©riode globale
 *
 * RÃˆGLE MÃ‰TIER (inchangÃ©e) :
 * - saison NON configurÃ©e â†’ DEFAULT
 * - saison configurÃ©e     â†’ SEASONAL
 */
export function getPeriodState(saisonConfig) {
  return isSeasonConfigured(saisonConfig)
    ? PERIOD_STATE.SEASONAL
    : PERIOD_STATE.DEFAULT;
}

export function isDateInSeason(saisonConfig, date) {
  if (!isSeasonConfigured(saisonConfig)) return false;
  const start = parseISODate(saisonConfig.saisonDebut);
  const end = parseISODate(saisonConfig.saisonFin);
  if (!start || !end) return false;

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const s = start <= end ? start : end;
  const e = start <= end ? end : start;

  return d >= s && d <= e;
}

export function getPeriodStateForDate(saisonConfig, date) {
  return isDateInSeason(saisonConfig, date)
    ? PERIOD_STATE.SEASONAL
    : PERIOD_STATE.DEFAULT;
}

