/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import {
  fetchMeExchange,
  getExchangeToken,
  loginExchange,
  logoutExchange,
  registerExchangeUser,
} from "../../data/exchange/auth-client.js";

const listeners = new Set();

const state = {
  status: "anonymous",
  currentUser: null,
  error: null,
};

function cloneState() {
  return {
    status: state.status,
    currentUser: state.currentUser ? { ...state.currentUser } : null,
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

function applyAuthError(error, fallbackCode = "AUTH_ERROR") {
  return {
    code: error?.code || fallbackCode,
    message: error?.message || "Erreur authentification",
    ...(error?.field ? { field: error.field } : {}),
  };
}

function isUnauthorizedError(error) {
  const code = error?.code;
  return code === "UNAUTHORIZED" || code === "AUTH_TOKEN_MISSING";
}

export function getExchangeAuthState() {
  return cloneState();
}

export function subscribeExchangeAuth(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function bootstrapExchangeAuth() {
  const token = getExchangeToken();
  if (!token) {
    patchState({
      status: "anonymous",
      currentUser: null,
      error: null,
    });
    return {
      ok: true,
      data: { currentUser: null },
    };
  }

  patchState({
    status: "loading",
    error: null,
  });

  const meResult = await fetchMeExchange();
  if (!meResult.ok) {
    if (isUnauthorizedError(meResult.error)) {
      patchState({
        status: "anonymous",
        currentUser: null,
        error: null,
      });
      return meResult;
    }
    patchState({
      status: "error",
      currentUser: null,
      error: applyAuthError(meResult.error, "AUTH_BOOTSTRAP_FAILED"),
    });
    return meResult;
  }

  const user = meResult.data?.user || null;
  patchState({
    status: user ? "authenticated" : "anonymous",
    currentUser: user,
    error: null,
  });

  return {
    ok: true,
    data: { currentUser: user },
  };
}

export async function loginExchangeAction({ email, password }) {
  patchState({
    status: "loading",
    error: null,
  });

  const loginResult = await loginExchange({ email, password });
  if (!loginResult.ok) {
    if (isUnauthorizedError(loginResult.error)) {
      patchState({
        status: "anonymous",
        currentUser: null,
        error: null,
      });
      return loginResult;
    }
    patchState({
      status: "error",
      currentUser: null,
      error: applyAuthError(loginResult.error, "AUTH_LOGIN_FAILED"),
    });
    return loginResult;
  }

  const meResult = await fetchMeExchange();
  if (!meResult.ok) {
    if (isUnauthorizedError(meResult.error)) {
      patchState({
        status: "anonymous",
        currentUser: null,
        error: null,
      });
      return meResult;
    }
    patchState({
      status: "error",
      currentUser: null,
      error: applyAuthError(meResult.error, "AUTH_FETCH_ME_FAILED"),
    });
    return meResult;
  }

  const user = meResult.data?.user || null;
  patchState({
    status: user ? "authenticated" : "anonymous",
    currentUser: user,
    error: null,
  });

  return {
    ok: true,
    data: {
      user,
      expiresAt: loginResult.data?.expiresAt || null,
    },
  };
}

export async function registerExchangeAction({
  prenom,
  nom,
  email,
  password,
}) {
  patchState({
    status: "loading",
    error: null,
  });

  const registerResult = await registerExchangeUser({
    prenom,
    nom,
    email,
    password,
  });
  if (!registerResult.ok) {
    if (isUnauthorizedError(registerResult.error)) {
      patchState({
        status: "anonymous",
        currentUser: null,
        error: null,
      });
      return registerResult;
    }
    patchState({
      status: "error",
      currentUser: null,
      error: applyAuthError(registerResult.error, "AUTH_REGISTER_FAILED"),
    });
    return registerResult;
  }

  const meResult = await fetchMeExchange();
  if (!meResult.ok) {
    if (isUnauthorizedError(meResult.error)) {
      patchState({
        status: "anonymous",
        currentUser: null,
        error: null,
      });
      return meResult;
    }
    patchState({
      status: "error",
      currentUser: null,
      error: applyAuthError(meResult.error, "AUTH_FETCH_ME_FAILED"),
    });
    return meResult;
  }

  const user = meResult.data?.user || null;
  patchState({
    status: user ? "authenticated" : "anonymous",
    currentUser: user,
    error: null,
  });

  return {
    ok: true,
    data: {
      user,
      expiresAt: registerResult.data?.expiresAt || null,
    },
  };
}

export async function logoutExchangeAction() {
  patchState({
    status: "loading",
    error: null,
  });

  await logoutExchange();

  patchState({
    status: "anonymous",
    currentUser: null,
    error: null,
  });

  return { ok: true, data: { cleared: true } };
}
