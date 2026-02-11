/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const ENTERPRISE_FLAGS_KEY = "enterprise_flags_v1";
const ALLOWED_PLANNING_SOURCES = new Set(["local", "enterprise_api"]);

export const DEFAULT_ENTERPRISE_FLAGS = Object.freeze({
  enterpriseSyncEnabled: false,
  exchangeServerEnabled: false,
  guidedInputEnabled: true,
  enterpriseApiBaseUrl: "",
  enterprisePlanningSource: "local",
});

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeBaseUrl(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

function normalizePlanningSource(value) {
  if (typeof value !== "string") return DEFAULT_ENTERPRISE_FLAGS.enterprisePlanningSource;
  const normalized = value.trim().toLowerCase();
  if (!ALLOWED_PLANNING_SOURCES.has(normalized)) {
    return DEFAULT_ENTERPRISE_FLAGS.enterprisePlanningSource;
  }
  return normalized;
}

export function normalizeEnterpriseFlags(rawValue = {}) {
  const source = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    enterpriseSyncEnabled: normalizeBoolean(
      source.enterpriseSyncEnabled,
      DEFAULT_ENTERPRISE_FLAGS.enterpriseSyncEnabled,
    ),
    exchangeServerEnabled: normalizeBoolean(
      source.exchangeServerEnabled,
      DEFAULT_ENTERPRISE_FLAGS.exchangeServerEnabled,
    ),
    guidedInputEnabled: normalizeBoolean(
      source.guidedInputEnabled,
      DEFAULT_ENTERPRISE_FLAGS.guidedInputEnabled,
    ),
    enterpriseApiBaseUrl: normalizeBaseUrl(source.enterpriseApiBaseUrl),
    enterprisePlanningSource: normalizePlanningSource(
      source.enterprisePlanningSource,
    ),
  };
}

export async function getEnterpriseFlags() {
  const storageApi = await import("../data/storage.js");
  const entry = await storageApi.getConfig(ENTERPRISE_FLAGS_KEY);
  return normalizeEnterpriseFlags(entry?.value || {});
}

export async function setEnterpriseFlags(nextValue = {}) {
  const current = await getEnterpriseFlags();
  const merged = normalizeEnterpriseFlags({
    ...current,
    ...(nextValue && typeof nextValue === "object" ? nextValue : {}),
  });
  const storageApi = await import("../data/storage.js");
  await storageApi.setConfig(ENTERPRISE_FLAGS_KEY, merged);
  return merged;
}

export async function resetEnterpriseFlags() {
  const storageApi = await import("../data/storage.js");
  await storageApi.setConfig(ENTERPRISE_FLAGS_KEY, { ...DEFAULT_ENTERPRISE_FLAGS });
  return { ...DEFAULT_ENTERPRISE_FLAGS };
}
