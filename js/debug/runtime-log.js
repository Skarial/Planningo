/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const LOG_KEY = "planningo_runtime_debug_logs";
const MAX_LOGS = 80;

let runtimeDebugBound = false;

function readLogsRaw() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogsRaw(logs) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    // No-op: debug logging must never break UX.
  }
}

function getCurrentRoute() {
  try {
    const visible = document.querySelector("#app-main > section:not([hidden])");
    if (!visible || !visible.id) return null;
    return visible.id.startsWith("view-") ? visible.id.slice(5) : visible.id;
  } catch {
    return null;
  }
}

function getScreenSnapshot() {
  const orientationType = (screen.orientation && screen.orientation.type) || null;
  const visualViewportHeight = window.visualViewport?.height ?? null;

  return {
    innerWidth: window.innerWidth ?? null,
    innerHeight: window.innerHeight ?? null,
    visualViewportHeight,
    pixelRatio: window.devicePixelRatio ?? null,
    orientation: orientationType,
    appVh: document.documentElement.style.getPropertyValue("--app-vh") || null,
    userAgent: navigator.userAgent || null,
  };
}

function toErrorPayload(reason) {
  if (reason instanceof Error) {
    return {
      message: reason.message || "Error",
      stack: reason.stack || null,
      name: reason.name || "Error",
    };
  }
  if (typeof reason === "string") {
    return { message: reason, stack: null, name: "UnhandledRejection" };
  }
  return {
    message: "Unhandled rejection",
    stack: null,
    name: typeof reason,
  };
}

function appendLog(entry) {
  const logs = readLogsRaw();
  logs.push(entry);
  const bounded = logs.slice(-MAX_LOGS);
  writeLogsRaw(bounded);
}

function recordRuntimeIssue(type, payload) {
  appendLog({
    ts: new Date().toISOString(),
    type,
    route: getCurrentRoute(),
    screen: getScreenSnapshot(),
    payload,
  });
}

function onWindowError(event) {
  // Resource loading errors arrive as generic Event with target.
  if (event?.target && event.target !== window) {
    const target = event.target;
    const source = target.src || target.href || target.currentSrc || target.tagName || "resource";
    recordRuntimeIssue("resource-error", { source: String(source) });
    return;
  }

  recordRuntimeIssue("error", {
    message: event?.message || "Script error",
    filename: event?.filename || null,
    lineno: event?.lineno || null,
    colno: event?.colno || null,
    stack: event?.error?.stack || null,
    name: event?.error?.name || null,
  });
}

function onUnhandledRejection(event) {
  recordRuntimeIssue("unhandledrejection", toErrorPayload(event?.reason));
}

export function installRuntimeDebugLogging() {
  if (runtimeDebugBound) return;
  runtimeDebugBound = true;

  window.addEventListener("error", onWindowError, true);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  // Lightweight API for support/debug from console.
  window.__planningoDebug = {
    readLogs: () => readLogsRaw(),
    clearLogs: () => writeLogsRaw([]),
  };
}
