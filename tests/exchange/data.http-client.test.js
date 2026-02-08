/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import { exchangeFetch } from "../../js/data/exchange/http-client.js";
import { installFetchMock } from "./test-helpers.js";

test("exchange http-client - handles 200 and 201 JSON responses", async () => {
  installFetchMock([
    {
      method: "GET",
      path: "/mock/s200",
      status: 200,
      body: { ok: true, value: 1 },
    },
    {
      method: "POST",
      path: "/mock/s201",
      status: 201,
      body: { id: "created-1" },
    },
  ]);

  const res200 = await exchangeFetch("https://exchange.test/mock/s200", {
    method: "GET",
    authRequired: false,
  });
  assert(res200.ok === true, "200 should be ok");
  assert(res200.data.value === 1, "200 payload mismatch");

  const res201 = await exchangeFetch("https://exchange.test/mock/s201", {
    method: "POST",
    body: { test: true },
    authRequired: false,
  });
  assert(res201.ok === true, "201 should be ok");
  assert(res201.data.id === "created-1", "201 payload mismatch");
});

test("exchange http-client - maps 401/403/409/410/429", async () => {
  const cases = [
    { status: 401, code: "UNAUTHORIZED" },
    { status: 403, code: "FORBIDDEN" },
    { status: 409, code: "CONFLICT" },
    { status: 410, code: "GONE" },
    { status: 429, code: "TOO_MANY_REQUESTS" },
  ];

  installFetchMock(
    cases.map((item) => ({
      method: "GET",
      path: `/mock/s${item.status}`,
      status: item.status,
      body: { error: { message: `status ${item.status}` } },
    })),
  );

  for (const item of cases) {
    const result = await exchangeFetch(
      `https://exchange.test/mock/s${item.status}`,
      {
        method: "GET",
        authRequired: false,
      },
    );
    assert(result.ok === false, `status ${item.status} should fail`);
    assert(result.error.code === item.code, `status ${item.status} code mismatch`);
  }
});

test("exchange http-client - handles network error", async () => {
  installFetchMock([
    {
      method: "GET",
      path: "/mock/network-error",
      type: "network_error",
    },
  ]);

  const result = await exchangeFetch("https://exchange.test/mock/network-error", {
    method: "GET",
    authRequired: false,
  });

  assert(result.ok === false, "network error should fail");
  assert(result.error.code === "NETWORK_ERROR", "network error code mismatch");
});

test("exchange http-client - handles timeout via AbortController", async () => {
  installFetchMock([
    {
      method: "GET",
      path: "/mock/timeout",
      type: "timeout",
    },
  ]);

  const result = await exchangeFetch("https://exchange.test/mock/timeout", {
    method: "GET",
    authRequired: false,
    timeoutMs: 5,
  });

  assert(result.ok === false, "timeout should fail");
  assert(result.error.code === "REQUEST_TIMEOUT", "timeout error code mismatch");
});
