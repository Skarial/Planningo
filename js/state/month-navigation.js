/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

let currentYear = null;
let currentMonthIndex = null;

/**
 * Initialise le mois courant  partir dune date ISO
 */
export function initMonthFromDateISO(dateISO) {
  if (!dateISO) return;

  const d = new Date(dateISO);
  currentYear = d.getFullYear();
  currentMonthIndex = d.getMonth();
}

/**
 * Retourne le mois courant
 */
export function getCurrentMonth() {
  return {
    year: currentYear,
    monthIndex: currentMonthIndex,
  };
}

/**
 * Mois prcdent
 */
export function goToPreviousMonth() {
  if (currentMonthIndex === null) return;

  currentMonthIndex -= 1;
  if (currentMonthIndex < 0) {
    currentMonthIndex = 11;
    currentYear -= 1;
  }
}

/**
 * Mois suivant
 */
export function goToNextMonth() {
  if (currentMonthIndex === null) return;

  currentMonthIndex += 1;
  if (currentMonthIndex > 11) {
    currentMonthIndex = 0;
    currentYear += 1;
  }
}
