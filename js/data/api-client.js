// js/data/api-client.js

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_FETCH_TIMEOUT_MS = 1200;

function getApiBaseUrl() {
  // plus tard: config runtime / prod
  return DEFAULT_API_BASE_URL;
}

export async function fetchPlanningMonth(monthISO) {
  if (typeof monthISO !== "string" || !/^\d{4}-\d{2}$/.test(monthISO)) {
    throw new Error("monthISO must be YYYY-MM");
  }

  const url = `${getApiBaseUrl()}/api/planning?month=${encodeURIComponent(monthISO)}`;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeoutId =
    controller != null
      ? setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS)
      : null;
  let res;
  let payload;
  try {
    res = await fetch(url, {
      method: "GET",
      signal: controller?.signal,
    });
    payload = await res.json().catch(() => null);
  } finally {
    if (timeoutId != null) clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const msg = payload?.message || "API error";
    throw new Error(msg);
  }

  return payload; // { month, entries }
}
