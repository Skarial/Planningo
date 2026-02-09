/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { hasPanier } from "./service-panier.js";

export function normalizeServiceCode(rawCode) {
  if (rawCode == null) return "";
  return String(rawCode).trim().toUpperCase();
}

export function normalizeNonMajorExtraMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric);
}

export function normalizeMajorExtraMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

export function normalizeMissingMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

export function normalizeFormationMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

export function parseNonMajorExtraInputMinutes(rawMinutes) {
  if (rawMinutes == null) return 0;
  const normalizedRaw = String(rawMinutes).trim().replace(",", ".");
  if (!normalizedRaw) return 0;
  const minutes = Number(normalizedRaw);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return normalizeNonMajorExtraMinutes(minutes);
}

export function parseMajorExtraInputMinutes(rawMinutes) {
  return parseNonMajorExtraInputMinutes(rawMinutes);
}

export function parseMissingInputMinutes(rawMinutes) {
  return parseNonMajorExtraInputMinutes(rawMinutes);
}

function parseDurationHourMinute(rawValue) {
  const compact = String(rawValue).trim().toLowerCase().replace(/\s+/g, "");
  if (!compact) return 0;

  const hhmmMatch = compact.match(/^(\d{1,3}):(\d{1,2})$/);
  if (hhmmMatch) {
    const hours = Number(hhmmMatch[1]);
    const minutes = Number(hhmmMatch[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
    if (hours < 0 || minutes < 0 || minutes > 59) return 0;
    return normalizeFormationMinutes(hours * 60 + minutes);
  }

  const hourMatch = compact.match(/^(\d{1,3})h(?:(\d{1,2}))?$/);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    const minutes = hourMatch[2] == null || hourMatch[2] === "" ? 0 : Number(hourMatch[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
    if (hours < 0 || minutes < 0 || minutes > 59) return 0;
    return normalizeFormationMinutes(hours * 60 + minutes);
  }

  return 0;
}

export function parseFormationInputMinutes(rawMinutes) {
  if (rawMinutes == null) return 0;
  const hourMinute = parseDurationHourMinute(rawMinutes);
  if (hourMinute > 0) return hourMinute;
  return parseNonMajorExtraInputMinutes(rawMinutes);
}

export function formatNonMajorExtraMinutes(minutes) {
  const normalizedMinutes = normalizeNonMajorExtraMinutes(minutes);
  if (normalizedMinutes <= 0) return "00:00";
  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatMajorExtraMinutes(minutes) {
  return formatNonMajorExtraMinutes(minutes);
}

export function formatMissingMinutes(minutes) {
  return formatNonMajorExtraMinutes(minutes);
}

export function formatFormationMinutes(minutes) {
  return formatNonMajorExtraMinutes(minutes);
}

export function resolvePanierEnabled(serviceCode, panierOverride = null) {
  const normalizedServiceCode = normalizeServiceCode(serviceCode);
  const defaultPanierEnabled = hasPanier(normalizedServiceCode);
  if (typeof panierOverride === "boolean") {
    return panierOverride;
  }
  return defaultPanierEnabled;
}

export function getInitialPanierEnabled(entry) {
  if (!entry) return false;
  return resolvePanierEnabled(entry.serviceCode, entry.panierOverride);
}

export function getInitialNonMajorExtraMinutes(entry) {
  const minutes = normalizeNonMajorExtraMinutes(entry?.nonMajorExtraMinutes);
  if (minutes <= 0) return "";
  return String(minutes);
}

export function getInitialMajorExtraMinutes(entry) {
  const minutes = normalizeMajorExtraMinutes(entry?.majorExtraMinutes);
  if (minutes <= 0) return "";
  return String(minutes);
}

export function getInitialMissingMinutes(entry) {
  const minutes = normalizeMissingMinutes(entry?.missingMinutes);
  if (minutes <= 0) return "";
  return String(minutes);
}

export function getInitialFormationMinutes(entry) {
  const minutes = normalizeFormationMinutes(entry?.formationMinutes);
  if (minutes <= 0) return "";
  return formatFormationMinutes(minutes);
}

export function buildSaveEntryPayload({
  dateISO,
  rawCode,
  previousEntry,
  panierEnabled,
  rawFormationMinutes,
  rawMajorExtraMinutes,
  rawNonMajorExtraMinutes,
  rawMissingMinutes,
  isCongesDay = false,
}) {
  const code = normalizeServiceCode(rawCode);
  const wasRepos = previousEntry?.serviceCode === "REPOS";
  const wasExtra = previousEntry?.extra === true;
  const isRepos = code === "REPOS";
  const isConges = isCongesDay === true;
  const defaultPanierEnabled = hasPanier(code);
  const effectivePanierEnabled =
    typeof panierEnabled === "boolean"
      ? panierEnabled
      : resolvePanierEnabled(code, previousEntry?.panierOverride);
  const panierOverride =
    code && !isRepos && !isConges && effectivePanierEnabled !== defaultPanierEnabled
      ? effectivePanierEnabled
      : null;
  const nonMajorExtraMinutes =
    code && !isRepos && !isConges
      ? parseNonMajorExtraInputMinutes(rawNonMajorExtraMinutes)
      : 0;
  const majorExtraMinutes =
    code && !isRepos && !isConges
      ? parseMajorExtraInputMinutes(rawMajorExtraMinutes)
      : 0;
  const missingMinutes =
    code && !isRepos && !isConges
      ? parseMissingInputMinutes(rawMissingMinutes)
      : 0;
  const formationMinutes =
    code === "FORMATION" && !isConges
      ? parseFormationInputMinutes(rawFormationMinutes)
      : 0;

  return {
    date: dateISO,
    serviceCode: code,
    locked: false,
    extra: isConges ? false : code ? (isRepos ? false : wasExtra || wasRepos) : false,
    panierOverride,
    majorExtraMinutes,
    nonMajorExtraMinutes,
    missingMinutes,
    formationMinutes,
  };
}

export function shouldMarkAlarmResync(serviceCode) {
  if (typeof serviceCode !== "string" && typeof serviceCode !== "number") {
    return false;
  }
  const normalized = String(serviceCode).trim().toUpperCase();
  if (!normalized) return false;
  if (normalized === "DM") return true;
  if (normalized === "DAM") return false;
  if (!/^\d{3,}$/.test(normalized)) return false;
  const value = Number(normalized);
  return Number.isInteger(value) && value % 2 === 1;
}

export function getInitialServiceCode(entry) {
  if (!entry || typeof entry.serviceCode !== "string") return "";
  return entry.serviceCode;
}
