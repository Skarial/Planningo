/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getExchangeToken } from "../../data/exchange/auth-client.js";
import {
  acceptExchangeConversation,
  chooseExchangeConversation,
  listExchangeConversations,
} from "../../data/exchange/conversations-client.js";
import { getExchangeAuthState } from "./auth-state.js";

const listeners = new Set();

const initialState = Object.freeze({
  status: "idle",
  items: [],
  page: 1,
  hasNext: false,
  error: null,
});

const state = {
  status: initialState.status,
  items: [...initialState.items],
  page: initialState.page,
  hasNext: initialState.hasNext,
  error: initialState.error,
};

function cloneState() {
  return {
    status: state.status,
    items: Array.isArray(state.items) ? [...state.items] : [],
    page: state.page,
    hasNext: state.hasNext,
    error: state.error ? { ...state.error } : null,
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

function patchState(next) {
  Object.assign(state, next);
  notify();
}

function normalizePage(page) {
  if (page === undefined || page === null) return 1;
  const value = Number(page);
  if (!Number.isInteger(value) || value < 1) return 1;
  return value;
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

export function getExchangeConversationsState() {
  return cloneState();
}

export function subscribeExchangeConversations(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetExchangeConversations() {
  patchState({
    status: initialState.status,
    items: [...initialState.items],
    page: initialState.page,
    hasNext: initialState.hasNext,
    error: initialState.error,
  });
  return { ok: true, data: getExchangeConversationsState() };
}

export async function fetchExchangeConversations({ page } = {}) {
  const auth = getExchangeAuthState();
  if (auth.status !== "authenticated") {
    return authRequiredError();
  }

  const targetPage = normalizePage(page);

  patchState({
    status: "loading",
    error: null,
  });

  const response = await listExchangeConversations({
    page: targetPage,
    token: getExchangeToken(),
  });

  if (!response.ok) {
    patchState({
      status: "error",
      error: response.error || null,
    });
    return response;
  }

  patchState({
    status: "ready",
    items: Array.isArray(response.data?.items) ? response.data.items : [],
    page: targetPage,
    hasNext: Boolean(response.data?.pagination?.hasNext),
    error: null,
  });

  return response;
}

export async function chooseConversationAction(conversationId, chosenProposal) {
  const auth = getExchangeAuthState();
  if (auth.status !== "authenticated") {
    return authRequiredError();
  }

  const response = await chooseExchangeConversation(
    conversationId,
    { chosenProposal },
    { token: getExchangeToken() },
  );

  if (response.ok) {
    await fetchExchangeConversations({ page: state.page });
  }

  return response;
}

export async function acceptConversationAction(conversationId) {
  const auth = getExchangeAuthState();
  if (auth.status !== "authenticated") {
    return authRequiredError();
  }

  const response = await acceptExchangeConversation(conversationId, {
    token: getExchangeToken(),
  });

  if (response.ok) {
    await fetchExchangeConversations({ page: state.page });
  }

  return response;
}
