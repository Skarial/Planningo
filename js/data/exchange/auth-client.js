/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { EXCHANGE_STORAGE_TOKEN_EXPIRES_AT_KEY, EXCHANGE_STORAGE_TOKEN_KEY } from "./config.js";
import { exchangeFetch } from "./http-client.js";

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function safeStorageGet(key) {
  try {
    return asTrimmedString(localStorage.getItem(key));
  } catch {
    return "";
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getExchangeToken() {
  return safeStorageGet(EXCHANGE_STORAGE_TOKEN_KEY);
}

export function setExchangeSession({ token, expiresAt }) {
  const normalizedToken = asTrimmedString(token);
  const normalizedExpiresAt = asTrimmedString(expiresAt);

  if (!normalizedToken) {
    return {
      ok: false,
      error: {
        code: "AUTH_TOKEN_MISSING",
        message: "Token d'authentification manquant",
        field: "token",
      },
    };
  }

  const tokenStored = safeStorageSet(EXCHANGE_STORAGE_TOKEN_KEY, normalizedToken);
  if (!tokenStored) {
    return {
      ok: false,
      error: {
        code: "STORAGE_WRITE_FAILED",
        message: "Impossible de sauvegarder la session",
      },
    };
  }

  if (normalizedExpiresAt) {
    safeStorageSet(EXCHANGE_STORAGE_TOKEN_EXPIRES_AT_KEY, normalizedExpiresAt);
  } else {
    safeStorageRemove(EXCHANGE_STORAGE_TOKEN_EXPIRES_AT_KEY);
  }

  return {
    ok: true,
    data: {
      token: normalizedToken,
      expiresAt: normalizedExpiresAt || null,
    },
  };
}

export function clearExchangeSession() {
  safeStorageRemove(EXCHANGE_STORAGE_TOKEN_KEY);
  safeStorageRemove(EXCHANGE_STORAGE_TOKEN_EXPIRES_AT_KEY);
  return { ok: true, data: { cleared: true } };
}

function storeSessionFromResponse(responseData) {
  const token = asTrimmedString(responseData?.token);
  const expiresAt = asTrimmedString(responseData?.expiresAt);
  if (!token) {
    return {
      ok: false,
      error: {
        code: "AUTH_TOKEN_MISSING",
        message: "Token absent de la reponse",
        field: "token",
      },
    };
  }
  return setExchangeSession({ token, expiresAt });
}

export async function registerExchangeUser({ prenom, nom, email, password }) {
  const response = await exchangeFetch("/auth/register", {
    method: "POST",
    body: { prenom, nom, email, password },
    authRequired: false,
  });

  if (!response.ok) {
    return response;
  }

  const stored = storeSessionFromResponse(response.data);
  if (!stored.ok) {
    return stored;
  }

  return {
    ok: true,
    data: {
      user: response.data?.user || null,
      expiresAt: response.data?.expiresAt || null,
    },
  };
}

export async function loginExchange({ email, password }) {
  const response = await exchangeFetch("/auth/login", {
    method: "POST",
    body: { email, password },
    authRequired: false,
  });

  if (!response.ok) {
    return response;
  }

  const stored = storeSessionFromResponse(response.data);
  if (!stored.ok) {
    return stored;
  }

  return {
    ok: true,
    data: {
      user: response.data?.user || null,
      expiresAt: response.data?.expiresAt || null,
    },
  };
}

export async function logoutExchange() {
  const token = getExchangeToken();
  clearExchangeSession();

  await exchangeFetch("/auth/logout", {
    method: "POST",
    authRequired: true,
    token,
  });

  return {
    ok: true,
    data: { cleared: true },
  };
}

export async function fetchMeExchange() {
  const token = getExchangeToken();
  const response = await exchangeFetch("/me", {
    method: "GET",
    authRequired: true,
    token,
  });

  if (!response.ok) {
    if (response.error?.code === "UNAUTHORIZED") {
      clearExchangeSession();
    }
    return response;
  }

  return {
    ok: true,
    data: response.data,
  };
}
