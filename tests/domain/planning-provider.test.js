/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  isEnterprisePlanningEnabled,
  resolvePlanningProvider,
} from "../../js/adapters/planning-provider.js";

test("planning-provider enterprise mode requires full config", () => {
  assert(
    isEnterprisePlanningEnabled({
      enterpriseSyncEnabled: true,
      enterprisePlanningSource: "enterprise_api",
      enterpriseApiBaseUrl: "https://api.example.com",
    }) === true,
    "enterprise mode should be enabled with valid setup",
  );

  assert(
    isEnterprisePlanningEnabled({
      enterpriseSyncEnabled: true,
      enterprisePlanningSource: "enterprise_api",
      enterpriseApiBaseUrl: "",
    }) === false,
    "enterprise mode should be disabled without base URL",
  );

  assert(
    isEnterprisePlanningEnabled({
      enterpriseSyncEnabled: false,
      enterprisePlanningSource: "enterprise_api",
      enterpriseApiBaseUrl: "https://api.example.com",
    }) === false,
    "enterprise mode should be disabled when sync flag is false",
  );
});

test("planning-provider resolve keeps local provider by default", () => {
  const localProvider = { kind: "local" };
  const enterpriseProvider = { kind: "enterprise_api" };

  const selected = resolvePlanningProvider({
    flags: {
      enterpriseSyncEnabled: false,
      enterprisePlanningSource: "local",
      enterpriseApiBaseUrl: "",
    },
    localProvider,
    enterpriseProvider,
  });

  assert(selected === localProvider, "local provider should remain selected");
});

test("planning-provider resolve switches to enterprise when enabled", () => {
  const localProvider = { kind: "local" };
  const enterpriseProvider = { kind: "enterprise_api" };

  const selected = resolvePlanningProvider({
    flags: {
      enterpriseSyncEnabled: true,
      enterprisePlanningSource: "enterprise_api",
      enterpriseApiBaseUrl: "https://api.example.com",
    },
    localProvider,
    enterpriseProvider,
  });

  assert(
    selected === enterpriseProvider,
    "enterprise provider should be selected when config is valid",
  );
});
