/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// Storage.js

import { enforceMaxMonthsRetention, openDB, STORES } from "./db.js";
import { normalizeServicePeriods } from "./period-key.js";
import { normalizeServiceCode } from "../domain/service-normalization.js";
import { fetchPlanningMonth } from "./api-client.js";

function normalizePanierOverride(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizeNonMajorExtraMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric);
}

function normalizeMajorExtraMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

function normalizeMissingMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

function normalizeFormationMinutes(value) {
  return normalizeNonMajorExtraMinutes(value);
}

// =======================
// SERVICES
// =======================

export async function getAllServices() {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SERVICES, "readonly");
    const store = tx.objectStore(STORES.SERVICES);
    const req = store.getAll();
    req.onsuccess = () => {
      const services = Array.isArray(req.result) ? req.result : [];
      resolve(services.map((service) => normalizeServicePeriods(service)));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function addService(service) {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SERVICES, "readwrite");
    tx.objectStore(STORES.SERVICES).put(normalizeServicePeriods(service));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// =======================
// PLANNING
// =======================
export async function deletePlanningEntry(dateISO) {
  const { db } = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    tx.objectStore(STORES.PLANNING).delete(dateISO);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function savePlanningEntry(entry) {
  const { db } = await openDB();
  const canonicalServiceCode = normalizeServiceCode(entry.serviceCode);

  // RGLE MTIER : service vide  suppression
  if (!canonicalServiceCode) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLANNING, "readwrite");
      tx.objectStore(STORES.PLANNING).delete(entry.date);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    tx.objectStore(STORES.PLANNING).put({
      date: entry.date,
      serviceCode: canonicalServiceCode,
      locked: entry.locked ?? false,
      extra: entry.extra ?? false,
      panierOverride: normalizePanierOverride(entry.panierOverride),
      majorExtraMinutes: normalizeMajorExtraMinutes(entry.majorExtraMinutes),
      nonMajorExtraMinutes: normalizeNonMajorExtraMinutes(entry.nonMajorExtraMinutes),
      missingMinutes: normalizeMissingMinutes(entry.missingMinutes),
      formationMinutes: normalizeFormationMinutes(entry.formationMinutes),
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  await enforceMaxMonthsRetention(36);
}

export async function getPlanningForMonth(monthISO) {
  const { db } = await openDB();
  const results = [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readonly");
    const store = tx.objectStore(STORES.PLANNING);

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) {
        resolve(results.sort((a, b) => a.date.localeCompare(b.date)));
        return;
      }

      if (cursor.key.startsWith(monthISO)) {
        results.push({
          date: cursor.value.date,
          serviceCode: normalizeServiceCode(cursor.value.serviceCode ?? "REPOS"),
          locked: cursor.value.locked ?? false,
          extra: cursor.value.extra ?? false,
          panierOverride: normalizePanierOverride(cursor.value.panierOverride),
          majorExtraMinutes: normalizeMajorExtraMinutes(cursor.value.majorExtraMinutes),
          nonMajorExtraMinutes: normalizeNonMajorExtraMinutes(cursor.value.nonMajorExtraMinutes),
          missingMinutes: normalizeMissingMinutes(cursor.value.missingMinutes),
          formationMinutes: normalizeFormationMinutes(cursor.value.formationMinutes),
        });
      }

      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
}

function normalizeRemoteMonthEntries(remoteEntries) {
  const entries = Array.isArray(remoteEntries) ? remoteEntries : [];
  return entries
    .filter((entry) => entry && typeof entry.date === "string")
    .map((entry) => ({
      date: entry.date,
      serviceCode: normalizeServiceCode(entry.serviceCode ?? "REPOS"),
      locked: false,
      extra: false,
      panierOverride: null,
      majorExtraMinutes: 0,
      nonMajorExtraMinutes: 0,
      missingMinutes: 0,
      formationMinutes: 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPlanningForMonthSmart(monthISO) {
  try {
    const remote = await fetchPlanningMonth(monthISO);
    return normalizeRemoteMonthEntries(remote?.entries);
  } catch {
    return getPlanningForMonth(monthISO);
  }
}

export async function getPlanningForMonthLocalFirst(monthISO, onRemoteEntries) {
  const localEntries = await getPlanningForMonth(monthISO);

  void (async () => {
    try {
      const remote = await fetchPlanningMonth(monthISO);
      const normalizedRemoteEntries = normalizeRemoteMonthEntries(remote?.entries);
      if (typeof onRemoteEntries === "function") {
        onRemoteEntries(normalizedRemoteEntries);
      }
    } catch (error) {
      console.warn("[storage] remote month refresh failed", error);
    }
  })();

  return localEntries;
}

export async function getPlanningEntriesInRange(startISO, endISO) {
  const { db } = await openDB();
  const results = [];
  const start = startISO;
  const end = endISO;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readonly");
    const store = tx.objectStore(STORES.PLANNING);

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) {
        resolve(results);
        return;
      }

      const key = cursor.key;
      if (key >= start && key <= end) {
        results.push({
          date: cursor.value.date,
          serviceCode: normalizeServiceCode(cursor.value.serviceCode ?? "REPOS"),
          locked: cursor.value.locked ?? false,
          extra: cursor.value.extra ?? false,
          panierOverride: normalizePanierOverride(cursor.value.panierOverride),
          majorExtraMinutes: normalizeMajorExtraMinutes(cursor.value.majorExtraMinutes),
          nonMajorExtraMinutes: normalizeNonMajorExtraMinutes(cursor.value.nonMajorExtraMinutes),
          missingMinutes: normalizeMissingMinutes(cursor.value.missingMinutes),
          formationMinutes: normalizeFormationMinutes(cursor.value.formationMinutes),
        });
      }

      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
}

export async function getPlanningEntry(dateISO) {
  const { db } = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readonly");
    const store = tx.objectStore(STORES.PLANNING);

    const request = store.get(dateISO);

    request.onsuccess = () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      resolve({
        ...request.result,
        serviceCode: normalizeServiceCode(request.result.serviceCode),
        panierOverride: normalizePanierOverride(request.result.panierOverride),
        majorExtraMinutes: normalizeMajorExtraMinutes(request.result.majorExtraMinutes),
        nonMajorExtraMinutes: normalizeNonMajorExtraMinutes(request.result.nonMajorExtraMinutes),
        missingMinutes: normalizeMissingMinutes(request.result.missingMinutes),
        formationMinutes: normalizeFormationMinutes(request.result.formationMinutes),
      });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function clearAllPlanning() {
  const { db } = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    tx.objectStore(STORES.PLANNING).clear();

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPlanningMonth(monthISO) {
  const { db } = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    const store = tx.objectStore(STORES.PLANNING);

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) return;

      if (cursor.key.startsWith(monthISO)) {
        cursor.delete();
      }

      cursor.continue();
    };

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// =======================
// CONFIG
// =======================

export async function getConfig(key) {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONFIG, "readonly");
    const req = tx.objectStore(STORES.CONFIG).get(key);
    req.onsuccess = () => resolve(req.result || { key, value: null });
    req.onerror = () => reject(req.error);
  });
}

export async function setConfig(key, value) {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONFIG, "readwrite");
    tx.objectStore(STORES.CONFIG).put({ key, value });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
