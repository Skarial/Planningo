/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function shouldAddExtraMinutes(code) {
  if (!code) return false;
  const upper = String(code).toUpperCase();
  if (upper === "DM" || upper === "DAM" || upper === "FORMATION") return false;
  if (upper.startsWith("TAD")) return false;
  return true;
}

export function computeServicePeriodMinutes(service, periodKey) {
  if (!service || !Array.isArray(service.periodes)) return 0;

  const matchingPeriod =
    service.periodes.find(
      (periode) =>
        periode &&
        periode.key === periodKey &&
        Array.isArray(periode.plages) &&
        periode.plages.length > 0,
    ) ||
    service.periodes.find(
      (periode) => periode && Array.isArray(periode.plages) && periode.plages.length > 0,
    );

  if (!matchingPeriod || !Array.isArray(matchingPeriod.plages)) {
    return 0;
  }

  let total = matchingPeriod.plages.reduce((sum, plage) => {
    if (!plage || !plage.debut || !plage.fin) return sum;
    const start = parseTimeToMinutes(plage.debut);
    const end = parseTimeToMinutes(plage.fin);
    if (start == null || end == null) return sum;
    const diff = end - start;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  if (shouldAddExtraMinutes(service.code)) {
    total += 5;
  }

  return total;
}
