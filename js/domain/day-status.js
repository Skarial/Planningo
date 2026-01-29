/**
 * Statuts métier possibles pour un jour
 * Source unique de vérité
 */

export const DAY_STATUS = {
  WORKED: "worked", // jour travaillé (1 service)
  REST: "rest", // jour de repos
  EMPTY: "empty", // jamais saisi
  FUTURE_EMPTY: "future_empty", // futur sans saisie
};

/**
 * Détermine le statut métier d’un jour
 * @param {Object|null} service - service du jour ou null
 * @param {Date} date
 * @param {Date} today
 * @returns {string} DAY_STATUS
 */
export function getDayStatus({ service, date, today }) {
  if (service) {
    return DAY_STATUS.WORKED;
  }

  if (date < today) {
    return DAY_STATUS.EMPTY;
  }

  return DAY_STATUS.FUTURE_EMPTY;
}
