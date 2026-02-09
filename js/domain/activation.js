/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/activation.js

export function validateActivation(providedHash, storedHash) {
  if (!providedHash) return false;
  if (!storedHash) return false;

  return providedHash === storedHash;
}

function normalizeCohort(value) {
  if (value === "legacy") return "legacy";
  if (value === "new") return "new";
  return null;
}

function isConfigTrue(value) {
  return value === "true";
}

export function resolveHasExistingConfig(entryCount, countFailed = false) {
  if (countFailed) return true;
  if (!Number.isFinite(entryCount)) return false;
  return entryCount > 0;
}

export function resolveActivationGate({
  cohortValue,
  activationValue,
  importedValue,
  hasExistingConfig = false,
} = {}) {
  const cohort = normalizeCohort(cohortValue);
  const isActivated = isConfigTrue(activationValue);
  const isImported = isConfigTrue(importedValue);

  if (cohort === "new") {
    return {
      cohort: "new",
      shouldPersistCohort: false,
      shouldShowActivation: false,
    };
  }

  if (cohort === "legacy") {
    return {
      cohort: "legacy",
      shouldPersistCohort: false,
      shouldShowActivation: !isActivated && !isImported,
    };
  }

  if (isActivated || isImported) {
    return {
      cohort: "legacy",
      shouldPersistCohort: true,
      shouldShowActivation: false,
    };
  }

  if (hasExistingConfig) {
    return {
      cohort: "legacy",
      shouldPersistCohort: true,
      shouldShowActivation: true,
    };
  }

  return {
    cohort: "new",
    shouldPersistCohort: true,
    shouldShowActivation: false,
  };
}
