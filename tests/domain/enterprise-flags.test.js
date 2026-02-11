/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  DEFAULT_ENTERPRISE_FLAGS,
  normalizeEnterpriseFlags,
} from "../../js/state/enterprise-flags.js";

test("enterprise-flags normalize returns defaults on invalid payload", () => {
  const flags = normalizeEnterpriseFlags(null);
  assert(
    flags.enterpriseSyncEnabled === DEFAULT_ENTERPRISE_FLAGS.enterpriseSyncEnabled,
    "default enterpriseSyncEnabled expected",
  );
  assert(
    flags.exchangeServerEnabled === DEFAULT_ENTERPRISE_FLAGS.exchangeServerEnabled,
    "default exchangeServerEnabled expected",
  );
  assert(
    flags.guidedInputEnabled === DEFAULT_ENTERPRISE_FLAGS.guidedInputEnabled,
    "default guidedInputEnabled expected",
  );
  assert(
    flags.enterpriseApiBaseUrl === DEFAULT_ENTERPRISE_FLAGS.enterpriseApiBaseUrl,
    "default base URL expected",
  );
  assert(
    flags.enterprisePlanningSource ===
      DEFAULT_ENTERPRISE_FLAGS.enterprisePlanningSource,
    "default planning source expected",
  );
});

test("enterprise-flags normalize sanitizes baseUrl and source", () => {
  const flags = normalizeEnterpriseFlags({
    enterpriseSyncEnabled: true,
    exchangeServerEnabled: true,
    guidedInputEnabled: false,
    enterpriseApiBaseUrl: " https://api.example.com/ ",
    enterprisePlanningSource: "ENTERPRISE_API",
  });

  assert(flags.enterpriseSyncEnabled === true, "enterpriseSyncEnabled expected");
  assert(flags.exchangeServerEnabled === true, "exchangeServerEnabled expected");
  assert(flags.guidedInputEnabled === false, "guidedInputEnabled expected");
  assert(
    flags.enterpriseApiBaseUrl === "https://api.example.com",
    "base URL should be trimmed without trailing slash",
  );
  assert(
    flags.enterprisePlanningSource === "enterprise_api",
    "planning source should be normalized",
  );
});

test("enterprise-flags normalize rejects unknown planning source", () => {
  const flags = normalizeEnterpriseFlags({
    enterprisePlanningSource: "legacy_server",
  });

  assert(
    flags.enterprisePlanningSource === "local",
    "unknown planning source should fallback to local",
  );
});
