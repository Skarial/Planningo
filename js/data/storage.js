/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// Storage.js

import { openDB, STORES } from "./db.js";

// =======================
// SERVICES
// =======================

export async function getAllServices() {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SERVICES, "readonly");
    const store = tx.objectStore(STORES.SERVICES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addService(service) {
  const { db } = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SERVICES, "readwrite");
    tx.objectStore(STORES.SERVICES).put(service);
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

  // RÃˆGLE MÃ‰TIER : service vide â†’ suppression
  if (!entry.serviceCode) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PLANNING, "readwrite");
      tx.objectStore(STORES.PLANNING).delete(entry.date);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    tx.objectStore(STORES.PLANNING).put({
      date: entry.date,
      serviceCode: entry.serviceCode,
      locked: entry.locked ?? false,
      extra: entry.extra ?? false,
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
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
          serviceCode: cursor.value.serviceCode ?? "REPOS",
          locked: cursor.value.locked ?? false,
          extra: cursor.value.extra ?? false,
        });
      }

      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
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
          serviceCode: cursor.value.serviceCode ?? "REPOS",
          locked: cursor.value.locked ?? false,
          extra: cursor.value.extra ?? false,
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
      resolve(request.result || null);
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

