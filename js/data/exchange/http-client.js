/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import {
  EXCHANGE_API_BASE_URL,
  EXCHANGE_DEFAULT_TIMEOUT_MS,
  EXCHANGE_DEPOT_HEADER_NAME,
  EXCHANGE_DEPOT_HEADER_VALUE,
} from "./config.js";

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function buildUrl(path) {
  const targetPath = asTrimmedString(path);
  if (/^https?:\/\//i.test(targetPath)) return targetPath;
  const base = EXCHANGE_API_BASE_URL.endsWith("/")
    ? EXCHANGE_API_BASE_URL
    : `${EXCHANGE_API_BASE_URL}/`;
  const normalizedPath = targetPath.startsWith("/")
    ? targetPath.slice(1)
    : targetPath;
  return new URL(normalizedPath, base).toString();
}

function mapStatusToError(status) {
  switch (status) {
    case 400:
      return { code: "BAD_REQUEST", message: "Requete invalide" };
    case 401:
      return { code: "UNAUTHORIZED", message: "Authentification requise" };
    case 403:
      return { code: "FORBIDDEN", message: "Acces refuse" };
    case 404:
      return { code: "NOT_FOUND", message: "Ressource introuvable" };
    case 409:
      return { code: "CONFLICT", message: "Conflit de requete" };
    case 410:
      return { code: "GONE", message: "Ressource indisponible" };
    case 429:
      return { code: "TOO_MANY_REQUESTS", message: "Trop de requetes" };
    default:
      return { code: `HTTP_${status}`, message: "Erreur serveur" };
  }
}

function normalizeServerError(payload, status) {
  const fallback = mapStatusToError(status);
  const serverError = payload?.error;
  if (!serverError || typeof serverError !== "object") {
    return { ...fallback, status };
  }

  const code =
    typeof serverError.code === "string" && serverError.code.trim().length > 0
      ? serverError.code.trim()
      : fallback.code;
  const message =
    typeof serverError.message === "string" &&
    serverError.message.trim().length > 0
      ? serverError.message.trim()
      : fallback.message;

  const normalized = { code, message, status };
  if (typeof serverError.field === "string" && serverError.field.trim().length > 0) {
    normalized.field = serverError.field.trim();
  }
  return normalized;
}

async function parseJsonResponse(response) {
  let text = "";
  try {
    text = await response.text();
  } catch {
    return { ok: true, json: null, hasBody: false };
  }

  if (!text) {
    return { ok: true, json: null, hasBody: false };
  }

  try {
    return { ok: true, json: JSON.parse(text), hasBody: true };
  } catch {
    return { ok: false, text };
  }
}

export async function exchangeFetch(path, options = {}) {
  const {
    method = "GET",
    body,
    authRequired = true,
    timeoutMs = EXCHANGE_DEFAULT_TIMEOUT_MS,
    token = "",
  } = options;

  const headers = {
    Accept: "application/json",
    [EXCHANGE_DEPOT_HEADER_NAME]: EXCHANGE_DEPOT_HEADER_VALUE,
  };

  if (authRequired) {
    const normalizedToken = asTrimmedString(token);
    if (!normalizedToken) {
      return {
        ok: false,
        error: {
          code: "AUTH_TOKEN_MISSING",
          message: "Token d'authentification manquant",
          field: "Authorization",
        },
      };
    }
    headers.Authorization = `Bearer ${normalizedToken}`;
  }

  let requestBody;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    try {
      requestBody = JSON.stringify(body);
    } catch {
      return {
        ok: false,
        error: {
          code: "REQUEST_BODY_SERIALIZATION_FAILED",
          message: "Impossible de serialiser le body JSON",
          field: "body",
        },
      };
    }
  }

  const controller = new AbortController();
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : EXCHANGE_DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    const parsed = await parseJsonResponse(response);
    if (!parsed.ok) {
      return {
        ok: false,
        error: {
          code: "INVALID_JSON_RESPONSE",
          message: "Reponse serveur non JSON",
        },
      };
    }

    if (response.ok) {
      return {
        ok: true,
        data: parsed.hasBody ? parsed.json : {},
      };
    }

    return {
      ok: false,
      error: normalizeServerError(parsed.json, response.status),
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        ok: false,
        error: {
          code: "REQUEST_TIMEOUT",
          message: `Requete expiree apres ${timeout}ms`,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Erreur reseau",
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
