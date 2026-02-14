/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const PERIOD_KEY_DEFAULT = "default";
const PERIOD_KEY_SEASONAL = "seasonal";

function normalizeLabel(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeExistingKey(value) {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (key === PERIOD_KEY_DEFAULT) return PERIOD_KEY_DEFAULT;
  if (key === PERIOD_KEY_SEASONAL) return PERIOD_KEY_SEASONAL;
  return null;
}

export function inferPeriodKey(periode) {
  const explicitKey = normalizeExistingKey(periode?.key);
  if (explicitKey) return explicitKey;

  const label = normalizeLabel(periode?.libelle);
  if (label.includes("saison")) {
    return PERIOD_KEY_SEASONAL;
  }

  return PERIOD_KEY_DEFAULT;
}

export function normalizeServicePeriods(service) {
  if (!service || typeof service !== "object") return service;

  const periods = Array.isArray(service.periodes) ? service.periodes : [];

  return {
    ...service,
    periodes: periods.map((periode) => {
      const safePeriode = periode && typeof periode === "object" ? periode : {};
      return {
        ...safePeriode,
        key: inferPeriodKey(safePeriode),
      };
    }),
  };
}
