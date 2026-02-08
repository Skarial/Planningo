/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getExchangeToken } from "./auth-client.js";
import { exchangeFetch } from "./http-client.js";

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizePage(page) {
  const numeric = Number(page);
  if (!Number.isInteger(numeric) || numeric < 1) return 1;
  return numeric;
}

function resolveToken(token) {
  const explicitToken = asTrimmedString(token);
  if (explicitToken) return explicitToken;
  return getExchangeToken();
}

export async function listExchangeRequests(options = {}) {
  const page = normalizePage(options.page);
  const token = resolveToken(options.token);
  return exchangeFetch(`/exchanges/requests?page=${page}`, {
    method: "GET",
    authRequired: true,
    token,
  });
}

export async function createExchangeRequest(payload, options = {}) {
  const token = resolveToken(options.token);
  return exchangeFetch("/exchanges/requests", {
    method: "POST",
    body: payload,
    authRequired: true,
    token,
  });
}

export async function respondToExchangeRequest(requestId, payload, options = {}) {
  const normalizedRequestId = asTrimmedString(requestId);
  if (!normalizedRequestId) {
    return {
      ok: false,
      error: {
        code: "REQUEST_ID_REQUIRED",
        message: "requestId est requis",
        field: "requestId",
      },
    };
  }

  const token = resolveToken(options.token);
  return exchangeFetch(
    `/exchanges/requests/${encodeURIComponent(normalizedRequestId)}/respond`,
    {
      method: "POST",
      body: payload,
      authRequired: true,
      token,
    },
  );
}
