/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export function getRestWarningMessageLabel(messageKey, options = {}) {
  if (messageKey === "rest.insufficient") {
    return options.withThreshold === true
      ? "Repos legal insuffisant (< 11h)"
      : "Repos legal insuffisant";
  }
  if (messageKey === "rest.ok") return "Repos legal conforme";
  return "Controle repos indisponible";
}

export function getRestWarningPeriodLabel(periodKey) {
  return periodKey === "seasonal" ? "periode saisonniere" : "periode principale";
}

