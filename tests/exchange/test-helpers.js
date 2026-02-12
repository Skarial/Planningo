/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

function normalizeMethod(method) {
  if (typeof method !== "string") return "GET";
  return method.trim().toUpperCase() || "GET";
}

function extractUrl(input) {
  if (typeof input === "string") return input;
  if (input && typeof input.url === "string") return input.url;
  return String(input || "");
}

function extractPath(url) {
  const parsed = new URL(url, "https://exchange.test");
  return `${parsed.pathname}${parsed.search}`;
}

function toAbortError() {
  const err = new Error("Aborted");
  err.name = "AbortError";
  return err;
}

function toMockResponse(result) {
  if (result && typeof result.text === "function" && typeof result.status === "number") {
    return result;
  }

  const status = Number(result?.status ?? 200);
  const text =
    result && Object.prototype.hasOwnProperty.call(result, "text")
      ? String(result.text)
      : JSON.stringify(result?.body ?? {});

  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return text;
    },
  };
}

export function installFetchMock(routes) {
  const entries = Array.isArray(routes)
    ? routes.map((route) => ({
        ...route,
        method: normalizeMethod(route?.method),
        times: route && typeof route.times === "number" && route.times > 0 ? route.times : 1,
      }))
    : [];
  const calls = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = extractUrl(input);
    const path = extractPath(url);
    const method = normalizeMethod(init?.method);

    calls.push({
      method,
      path,
      url,
      headers: init?.headers || {},
      body: init?.body,
    });

    const route = entries.find((candidate) => {
      if (candidate.times <= 0) return false;
      if (candidate.method !== method) return false;
      return candidate.path === path;
    });

    if (!route) {
      throw new Error(`No mock route for ${method} ${path}`);
    }

    route.times -= 1;

    if (route.type === "network_error") {
      throw new Error(route.message || "Network error");
    }

    if (route.type === "timeout") {
      return new Promise((resolve, reject) => {
        const signal = init?.signal;
        if (!signal) return;
        if (signal.aborted) {
          reject(toAbortError());
          return;
        }
        signal.addEventListener(
          "abort",
          () => {
            reject(toAbortError());
          },
          { once: true },
        );
      });
    }

    if (typeof route.reply === "function") {
      const replied = await route.reply({ method, path, url, init, calls });
      return toMockResponse(replied);
    }

    return toMockResponse(route);
  };

  return { calls };
}

export function resetTestStorage() {
  if (globalThis.localStorage && typeof globalThis.localStorage.clear === "function") {
    globalThis.localStorage.clear();
  }
}

export function getStoredToken() {
  if (!globalThis.localStorage) return "";
  return globalThis.localStorage.getItem("planningo_exchange_token") || "";
}
