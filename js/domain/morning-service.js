/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const MORNING_TAD_NUMBERS = new Set([1, 3, 5]);

export function normalizeServiceCode(rawCode) {
  if (rawCode == null) return "";
  return String(rawCode).trim().toUpperCase();
}

export function parseTadServiceNumber(rawCode) {
  const normalized = normalizeServiceCode(rawCode);
  const match = normalized.match(/^(?:TAD|TD)\s*(\d+)$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isInteger(value)) return null;
  return value;
}

export function isTadServiceCode(rawCode) {
  return parseTadServiceNumber(rawCode) != null;
}

export function isBaseMorningServiceCode(rawCode) {
  const normalized = normalizeServiceCode(rawCode);
  if (!normalized) return false;
  if (normalized === "DM") return true;
  if (normalized === "DAM") return false;

  const tadNumber = parseTadServiceNumber(normalized);
  if (tadNumber != null) {
    return MORNING_TAD_NUMBERS.has(tadNumber);
  }

  if (!/^\d{3,}$/.test(normalized)) return false;
  const value = Number(normalized);
  return Number.isInteger(value) && value % 2 === 1;
}

export function getServiceCodeVariants(rawCode) {
  const normalized = normalizeServiceCode(rawCode);
  if (!normalized) return [];

  const variants = new Set([normalized, normalized.replace(/\s+/g, "")]);
  const tadNumber = parseTadServiceNumber(normalized);
  if (tadNumber != null) {
    variants.add(`TAD${tadNumber}`);
    variants.add(`TAD ${tadNumber}`);
    variants.add(`TD${tadNumber}`);
    variants.add(`TD ${tadNumber}`);
  }

  return Array.from(variants);
}
