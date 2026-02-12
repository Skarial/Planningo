/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  EXCHANGE_MAX_COUNTER_PROPOSALS,
  validateCreateExchangeRequest,
} from "../../js/domain/exchange/request-rules.js";

function createBasePayload() {
  return {
    offeredDateISO: "2026-02-10",
    offeredService: {
      kind: "CATALOG",
      code: "2910",
      text: "",
    },
    counterProposals: [
      {
        wantedDateISO: "2026-02-11",
        wantedService: {
          kind: "REST",
          code: "REST",
          text: "",
        },
      },
    ],
  };
}

test("exchange request-rules - valid payload", () => {
  const payload = createBasePayload();
  payload.counterProposals.push({
    wantedDateISO: "2026-02-12",
    wantedService: {
      kind: "FREE_TEXT",
      code: "",
      text: "Navette PM",
    },
  });

  const result = validateCreateExchangeRequest(payload);
  assert(result.ok === true, "payload should be valid");
  assert(result.value.counterProposals.length === 2, "counter proposals count");
});

test("exchange request-rules - duplicate proposal rejected", () => {
  const payload = createBasePayload();
  payload.counterProposals.push({
    wantedDateISO: "2026-02-11",
    wantedService: {
      kind: "REST",
      code: "REST",
      text: "  ",
    },
  });

  const result = validateCreateExchangeRequest(payload);
  assert(result.ok === false, "duplicate proposal should fail");
  assert(
    result.error.code === "REQUEST_COUNTER_PROPOSAL_DUPLICATE",
    "duplicate error code mismatch",
  );
});

test("exchange request-rules - max proposals enforced", () => {
  const payload = createBasePayload();
  payload.counterProposals = [];
  for (let i = 0; i < EXCHANGE_MAX_COUNTER_PROPOSALS + 1; i += 1) {
    const day = String(i + 1).padStart(2, "0");
    payload.counterProposals.push({
      wantedDateISO: `2026-03-${day}`,
      wantedService: {
        kind: "CATALOG",
        code: `${2900 + i}`,
        text: "",
      },
    });
  }

  const result = validateCreateExchangeRequest(payload);
  assert(result.ok === false, "too many proposals should fail");
  assert(
    result.error.code === "REQUEST_COUNTER_PROPOSALS_TOO_MANY",
    "max proposals error code mismatch",
  );
});

test("exchange request-rules - offeredDateISO must be valid", () => {
  const payload = createBasePayload();
  payload.offeredDateISO = "2026-02-31";

  const result = validateCreateExchangeRequest(payload);
  assert(result.ok === false, "invalid offeredDateISO should fail");
  assert(result.error.code === "REQUEST_OFFERED_DATE_INVALID", "offered date error code mismatch");
});
