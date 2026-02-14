/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export function normalizeServiceCode(rawCode) {
  if (rawCode == null) return "";
  const normalized = String(rawCode).trim().toUpperCase();
  if (!normalized) return "";
  if (normalized === "RPS") return "REPOS";
  if (/^TD(?=\s|\d|$)/i.test(normalized)) {
    return normalized
      .replace(/^TD\s*/i, "TAD ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (/^TAD(?=\s|\d|$)/i.test(normalized)) {
    return normalized
      .replace(/^TAD\s*/i, "TAD ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return normalized;
}
