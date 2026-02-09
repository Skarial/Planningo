/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  resolveActivationGate,
  resolveHasExistingConfig,
} from "../../js/domain/activation.js";

test("legacy activated keeps access without activation screen", () => {
  const result = resolveActivationGate({
    cohortValue: "legacy",
    activationValue: "true",
    importedValue: null,
  });

  assert(result.cohort === "legacy", "legacy cohort should be preserved");
  assert(
    result.shouldPersistCohort === false,
    "legacy cohort should not be persisted again",
  );
  assert(
    result.shouldShowActivation === false,
    "activation screen should stay hidden for activated legacy user",
  );
});

test("legacy imported keeps access without activation screen", () => {
  const result = resolveActivationGate({
    cohortValue: "legacy",
    activationValue: null,
    importedValue: "true",
  });

  assert(result.cohort === "legacy", "legacy cohort should be preserved");
  assert(
    result.shouldShowActivation === false,
    "activation screen should stay hidden for imported legacy user",
  );
});

test("fresh install migrates to new cohort and bypasses activation screen", () => {
  const result = resolveActivationGate({
    cohortValue: null,
    activationValue: null,
    importedValue: null,
    hasExistingConfig: false,
  });

  assert(result.cohort === "new", "fresh install should become new cohort");
  assert(
    result.shouldPersistCohort === true,
    "new cohort should be persisted at first boot",
  );
  assert(
    result.shouldShowActivation === false,
    "new cohort should bypass activation screen",
  );
});

test("missing cohort with activation_ok true migrates to legacy", () => {
  const result = resolveActivationGate({
    cohortValue: null,
    activationValue: "true",
    importedValue: null,
    hasExistingConfig: false,
  });

  assert(result.cohort === "legacy", "activated existing user should migrate to legacy");
  assert(
    result.shouldPersistCohort === true,
    "legacy migration should be persisted",
  );
  assert(
    result.shouldShowActivation === false,
    "activated migrated user should not see activation screen",
  );
});

test("legacy without activation or import still requires activation screen", () => {
  const result = resolveActivationGate({
    cohortValue: "legacy",
    activationValue: null,
    importedValue: null,
  });

  assert(
    result.shouldShowActivation === true,
    "legacy rules must keep existing activation guard",
  );
});

test("missing cohort with non-empty config migrates to legacy and requires activation", () => {
  const result = resolveActivationGate({
    cohortValue: null,
    activationValue: null,
    importedValue: null,
    hasExistingConfig: true,
  });

  assert(
    result.cohort === "legacy",
    "non-empty config without cohort should migrate to legacy",
  );
  assert(
    result.shouldPersistCohort === true,
    "legacy migration should be persisted",
  );
  assert(
    result.shouldShowActivation === true,
    "legacy migrated user without activation/import should still see activation screen",
  );
});

test("count config failure uses safe mode (treated as existing legacy config)", () => {
  const hasExistingConfig = resolveHasExistingConfig(0, true);
  const result = resolveActivationGate({
    cohortValue: null,
    activationValue: null,
    importedValue: null,
    hasExistingConfig,
  });

  assert(hasExistingConfig === true, "safe mode should force existing config");
  assert(result.cohort === "legacy", "safe mode should migrate to legacy");
  assert(
    result.shouldShowActivation === true,
    "safe mode should not bypass activation screen",
  );
});
