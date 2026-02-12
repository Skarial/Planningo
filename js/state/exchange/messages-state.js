/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getExchangeToken } from "../../data/exchange/auth-client.js";
import {
  listExchangeMessages,
  sendExchangeMessage,
} from "../../data/exchange/conversations-client.js";
import { validateSendMessage } from "../../domain/exchange/message-rules.js";
import { getExchangeAuthState } from "./auth-state.js";

const listeners = new Set();

const state = {
  statusByConversation: {},
  itemsByConversation: {},
  pendingByConversation: {},
  errorByConversation: {},
};

function cloneArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function cloneState() {
  const statusByConversation = { ...state.statusByConversation };
  const errorByConversation = {};
  const itemsByConversation = {};
  const pendingByConversation = {};

  Object.keys(state.errorByConversation).forEach((key) => {
    const error = state.errorByConversation[key];
    errorByConversation[key] = error ? { ...error } : null;
  });

  Object.keys(state.itemsByConversation).forEach((key) => {
    itemsByConversation[key] = cloneArray(state.itemsByConversation[key]);
  });

  Object.keys(state.pendingByConversation).forEach((key) => {
    pendingByConversation[key] = cloneArray(state.pendingByConversation[key]);
  });

  return {
    statusByConversation,
    itemsByConversation,
    pendingByConversation,
    errorByConversation,
  };
}

function notify() {
  const snapshot = cloneState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

function patchConversation(conversationId, patch) {
  if (patch.status !== undefined) {
    state.statusByConversation[conversationId] = patch.status;
  }
  if (patch.items !== undefined) {
    state.itemsByConversation[conversationId] = cloneArray(patch.items);
  }
  if (patch.pending !== undefined) {
    state.pendingByConversation[conversationId] = cloneArray(patch.pending);
  }
  if (patch.error !== undefined) {
    state.errorByConversation[conversationId] = patch.error ? { ...patch.error } : null;
  }
  notify();
}

function normalizeConversationId(conversationId) {
  if (typeof conversationId !== "string") return "";
  return conversationId.trim();
}

function authRequiredError() {
  return {
    ok: false,
    error: {
      code: "AUTH_REQUIRED",
      message: "Connexion requise",
    },
  };
}

function conversationIdRequiredError() {
  return {
    ok: false,
    error: {
      code: "CONVERSATION_ID_REQUIRED",
      message: "conversationId est requis",
      field: "conversationId",
    },
  };
}

function isQueueableNetworkError(error) {
  const code = error?.code;
  return code === "NETWORK_ERROR" || code === "REQUEST_TIMEOUT";
}

function dedupePendingByClientMessageId(items) {
  const map = new Map();
  cloneArray(items).forEach((item) => {
    const key = typeof item?.clientMessageId === "string" ? item.clientMessageId.trim() : "";
    if (!key) return;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function removePendingByClientMessageId(conversationId, clientMessageId) {
  const key = typeof clientMessageId === "string" ? clientMessageId.trim() : "";
  if (!key) return;

  const current = cloneArray(state.pendingByConversation[conversationId]);
  const next = current.filter((item) => (item?.clientMessageId || "").trim() !== key);
  patchConversation(conversationId, { pending: next });
}

export function getExchangeMessagesState() {
  return cloneState();
}

export function subscribeExchangeMessages(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function enqueuePendingMessage(conversationId, payload) {
  const normalizedConversationId = normalizeConversationId(conversationId);
  if (!normalizedConversationId) {
    return conversationIdRequiredError();
  }

  const validated = validateSendMessage(payload);
  if (!validated.ok) {
    return validated;
  }

  const currentPending = cloneArray(state.pendingByConversation[normalizedConversationId]);
  currentPending.push(validated.value);
  const deduped = dedupePendingByClientMessageId(currentPending);

  patchConversation(normalizedConversationId, {
    pending: deduped,
  });

  return {
    ok: true,
    data: { pendingCount: deduped.length },
  };
}

export function resetExchangeMessages() {
  state.statusByConversation = {};
  state.itemsByConversation = {};
  state.pendingByConversation = {};
  state.errorByConversation = {};
  notify();
  return { ok: true, data: getExchangeMessagesState() };
}

export async function fetchConversationMessages(conversationId) {
  if (getExchangeAuthState().status !== "authenticated") {
    return authRequiredError();
  }

  const normalizedConversationId = normalizeConversationId(conversationId);
  if (!normalizedConversationId) {
    return conversationIdRequiredError();
  }

  patchConversation(normalizedConversationId, {
    status: "loading",
    error: null,
  });

  const response = await listExchangeMessages(normalizedConversationId, {
    token: getExchangeToken(),
  });

  if (!response.ok) {
    patchConversation(normalizedConversationId, {
      status: "error",
      error: response.error || null,
    });
    return response;
  }

  patchConversation(normalizedConversationId, {
    status: "ready",
    items: Array.isArray(response.data?.items) ? response.data.items : [],
    error: null,
  });

  return response;
}

export async function sendMessageAction(conversationId, payload) {
  if (getExchangeAuthState().status !== "authenticated") {
    return authRequiredError();
  }

  const normalizedConversationId = normalizeConversationId(conversationId);
  if (!normalizedConversationId) {
    return conversationIdRequiredError();
  }

  const validated = validateSendMessage(payload);
  if (!validated.ok) {
    patchConversation(normalizedConversationId, {
      status: "error",
      error: validated.error,
    });
    return validated;
  }

  const response = await sendExchangeMessage(normalizedConversationId, validated.value, {
    token: getExchangeToken(),
  });

  if (!response.ok) {
    if (isQueueableNetworkError(response.error)) {
      const currentPending = cloneArray(state.pendingByConversation[normalizedConversationId]);
      currentPending.push(validated.value);
      patchConversation(normalizedConversationId, {
        pending: dedupePendingByClientMessageId(currentPending),
        status: "error",
        error: response.error || null,
      });
    } else {
      patchConversation(normalizedConversationId, {
        status: "error",
        error: response.error || null,
      });
    }
    return response;
  }

  removePendingByClientMessageId(normalizedConversationId, validated.value.clientMessageId);
  patchConversation(normalizedConversationId, {
    status: "ready",
    error: null,
  });
  await fetchConversationMessages(normalizedConversationId);
  return response;
}

export async function flushPendingMessages(conversationId) {
  if (getExchangeAuthState().status !== "authenticated") {
    return authRequiredError();
  }

  const normalizedConversationId = normalizeConversationId(conversationId);
  if (!normalizedConversationId) {
    return conversationIdRequiredError();
  }

  const queue = dedupePendingByClientMessageId(
    state.pendingByConversation[normalizedConversationId],
  );

  if (queue.length === 0) {
    return { ok: true, data: { flushed: 0 } };
  }

  let flushedCount = 0;
  const remaining = [...queue];

  while (remaining.length > 0) {
    const message = remaining[0];
    const response = await sendExchangeMessage(normalizedConversationId, message, {
      token: getExchangeToken(),
    });

    if (!response.ok) {
      patchConversation(normalizedConversationId, {
        pending: remaining,
        status: "error",
        error: response.error || null,
      });
      return response;
    }

    flushedCount += 1;
    remaining.shift();
    patchConversation(normalizedConversationId, {
      pending: remaining,
      status: "ready",
      error: null,
    });
  }

  await fetchConversationMessages(normalizedConversationId);
  return { ok: true, data: { flushed: flushedCount } };
}
