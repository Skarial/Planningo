/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import { respondToExchangeRequest } from "../../js/data/exchange/requests-client.js";

test("exchange requests-client - respond requires requestId", async () => {
  const result = await respondToExchangeRequest("", {
    wantedDateISO: "2026-02-10",
    wantedService: { kind: "REST", code: "REST", text: "" },
  });

  assert(result.ok === false, "missing requestId should fail");
  assert(result.error.code === "REQUEST_ID_REQUIRED", "error code mismatch");
  assert(result.error.field === "requestId", "error field mismatch");
});
