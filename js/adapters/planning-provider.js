/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getEnterpriseFlags } from "../state/enterprise-flags.js";

function normalizeBaseUrl(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

function buildNotImplementedError(baseUrl, action) {
  const safeBaseUrl = baseUrl || "(missing-base-url)";
  return new Error(
    `[enterprise-planning] ${action} not implemented for API ${safeBaseUrl}`,
  );
}

export function createLocalPlanningProvider(storageApi = {}) {
  async function lazyStorageCall(methodName, ...args) {
    const storageApiModule = await import("../data/storage.js");
    const fn = storageApiModule?.[methodName];
    if (typeof fn !== "function") {
      throw new Error(`storage method not available: ${methodName}`);
    }
    return fn(...args);
  }

  return {
    kind: "local",
    getPlanningEntry:
      storageApi.getPlanningEntry ||
      ((dateISO) => lazyStorageCall("getPlanningEntry", dateISO)),
    getPlanningForMonth:
      storageApi.getPlanningForMonth ||
      ((monthISO) => lazyStorageCall("getPlanningForMonth", monthISO)),
    getPlanningEntriesInRange:
      storageApi.getPlanningEntriesInRange ||
      ((startISO, endISO) =>
        lazyStorageCall("getPlanningEntriesInRange", startISO, endISO)),
    savePlanningEntry:
      storageApi.savePlanningEntry ||
      ((entry) => lazyStorageCall("savePlanningEntry", entry)),
    deletePlanningEntry:
      storageApi.deletePlanningEntry ||
      ((dateISO) => lazyStorageCall("deletePlanningEntry", dateISO)),
  };
}

export function createEnterprisePlanningProvider(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  return {
    kind: "enterprise_api",
    baseUrl,
    getPlanningEntry() {
      throw buildNotImplementedError(baseUrl, "getPlanningEntry");
    },
    getPlanningForMonth() {
      throw buildNotImplementedError(baseUrl, "getPlanningForMonth");
    },
    getPlanningEntriesInRange() {
      throw buildNotImplementedError(baseUrl, "getPlanningEntriesInRange");
    },
    savePlanningEntry() {
      throw buildNotImplementedError(baseUrl, "savePlanningEntry");
    },
    deletePlanningEntry() {
      throw buildNotImplementedError(baseUrl, "deletePlanningEntry");
    },
  };
}

export function isEnterprisePlanningEnabled(flags = {}) {
  const normalizedSource = String(flags.enterprisePlanningSource || "")
    .trim()
    .toLowerCase();
  const baseUrl = normalizeBaseUrl(flags.enterpriseApiBaseUrl);
  return (
    flags.enterpriseSyncEnabled === true &&
    normalizedSource === "enterprise_api" &&
    baseUrl !== ""
  );
}

export function resolvePlanningProvider(options = {}) {
  const localProvider = options.localProvider;
  if (!localProvider) {
    throw new Error("local planning provider is required");
  }

  if (
    isEnterprisePlanningEnabled(options.flags || {}) &&
    options.enterpriseProvider
  ) {
    return options.enterpriseProvider;
  }

  return localProvider;
}

export async function getPlanningProvider(options = {}) {
  const flags = options.flags || (await getEnterpriseFlags());
  const localProvider =
    options.localProvider || createLocalPlanningProvider(options.storageApi);
  const enterpriseProvider =
    options.enterpriseProvider ||
    createEnterprisePlanningProvider({
      baseUrl: flags.enterpriseApiBaseUrl,
    });

  return resolvePlanningProvider({
    flags,
    localProvider,
    enterpriseProvider,
  });
}
