// backend/adapters/planning.mapper.js

function normalizeServiceCode(rawCode) {
  if (rawCode == null) return "REPOS";
  const normalized = String(rawCode).trim().toUpperCase();
  return normalized || "REPOS";
}

function isISODate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function mapEntreprisePlanningToApi(raw) {
  const sourceEntries = Array.isArray(raw) ? raw : Array.isArray(raw?.entries) ? raw.entries : [];

  return sourceEntries
    .filter((entry) => entry && isISODate(entry.date))
    .map((entry) => ({
      date: entry.date,
      serviceCode: normalizeServiceCode(entry.serviceCode),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
