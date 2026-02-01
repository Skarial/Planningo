/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/day-status.js
/**
 * Statuts mÃ©tier possibles pour un jour
 * Source unique de vÃ©ritÃ©
 */

export const DAY_STATUS = {
  WORKED: "worked", // jour travaillÃ© (1 service)
  REST: "rest", // jour de repos
  EMPTY: "empty", // jamais saisi
  FUTURE_EMPTY: "future_empty", // futur sans saisie
};

/**
 * DÃ©termine le statut mÃ©tier dâ€™un jour
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

