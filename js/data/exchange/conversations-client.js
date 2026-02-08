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

function validateConversationId(conversationId) {
  const normalizedConversationId = asTrimmedString(conversationId);
  if (!normalizedConversationId) {
    return {
      ok: false,
      error: {
        code: "CONVERSATION_ID_REQUIRED",
        message: "conversationId est requis",
        field: "conversationId",
      },
    };
  }
  return { ok: true, value: normalizedConversationId };
}

export async function listExchangeConversations(options = {}) {
  const page = normalizePage(options.page);
  const token = resolveToken(options.token);
  return exchangeFetch(`/exchanges/conversations?page=${page}`, {
    method: "GET",
    authRequired: true,
    token,
  });
}

export async function chooseExchangeConversation(
  conversationId,
  payload,
  options = {},
) {
  const validatedId = validateConversationId(conversationId);
  if (!validatedId.ok) {
    return validatedId;
  }

  const token = resolveToken(options.token);
  return exchangeFetch(
    `/exchanges/conversations/${encodeURIComponent(validatedId.value)}/choose`,
    {
      method: "POST",
      body: payload,
      authRequired: true,
      token,
    },
  );
}

export async function acceptExchangeConversation(conversationId, options = {}) {
  const validatedId = validateConversationId(conversationId);
  if (!validatedId.ok) {
    return validatedId;
  }

  const token = resolveToken(options.token);
  return exchangeFetch(
    `/exchanges/conversations/${encodeURIComponent(validatedId.value)}/accept`,
    {
      method: "POST",
      authRequired: true,
      token,
    },
  );
}

export async function sendExchangeMessage(
  conversationId,
  payload,
  options = {},
) {
  const validatedId = validateConversationId(conversationId);
  if (!validatedId.ok) {
    return validatedId;
  }

  const token = resolveToken(options.token);
  return exchangeFetch(
    `/exchanges/conversations/${encodeURIComponent(validatedId.value)}/message`,
    {
      method: "POST",
      body: payload,
      authRequired: true,
      token,
    },
  );
}

export async function listExchangeMessages(conversationId, options = {}) {
  const validatedId = validateConversationId(conversationId);
  if (!validatedId.ok) {
    return validatedId;
  }

  const token = resolveToken(options.token);
  return exchangeFetch(
    `/exchanges/conversations/${encodeURIComponent(validatedId.value)}/messages`,
    {
      method: "GET",
      authRequired: true,
      token,
    },
  );
}
