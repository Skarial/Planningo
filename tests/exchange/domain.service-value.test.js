/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  EXCHANGE_SERVICE_KIND,
  normalizeServiceValue,
} from "../../js/domain/exchange/service-value.js";

test("exchange service-value - normalize CATALOG", () => {
  const result = normalizeServiceValue({
    kind: "catalog",
    code: "2910",
    text: "",
  });

  assert(result.ok === true, "catalog should be valid");
  assert(result.value.kind === EXCHANGE_SERVICE_KIND.CATALOG, "kind mismatch");
  assert(result.value.code === "2910", "code mismatch");
  assert(result.value.text === null, "text should be null");
});

test("exchange service-value - FREE_TEXT requires text", () => {
  const result = normalizeServiceValue({
    kind: "FREE_TEXT",
    code: "",
    text: "   ",
  });

  assert(result.ok === false, "free_text without text should fail");
  assert(result.error.code === "SERVICE_TEXT_REQUIRED", "error code mismatch");
});

test("exchange service-value - REST code must be REST", () => {
  const result = normalizeServiceValue({
    kind: "REST",
    code: "repos",
    text: "",
  });

  assert(result.ok === false, "rest with wrong code should fail");
  assert(result.error.code === "SERVICE_CODE_INVALID", "error code mismatch");
});

test("exchange service-value - invalid kind rejected", () => {
  const result = normalizeServiceValue({
    kind: "UNKNOWN",
    code: "",
    text: "",
  });

  assert(result.ok === false, "invalid kind should fail");
  assert(result.error.code === "SERVICE_KIND_INVALID", "error code mismatch");
});
