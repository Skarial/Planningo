/**
 * États métier possibles pour la période globale
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
 * Indique si une saison est réellement configurée
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
 * Retourne l’état métier de la période globale
 *
 * RÈGLE MÉTIER (inchangée) :
 * - saison NON configurée → DEFAULT
 * - saison configurée     → SEASONAL
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
