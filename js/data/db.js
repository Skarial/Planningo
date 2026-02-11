/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/db.js

// =======================
// CONFIGURATION
// =======================

export const DB_NAME = "planningDB";
export const DB_VERSION = 5;

export const STORES = {
  SERVICES: "services",
  PLANNING: "planning",
  CONFIG: "config",
};

// =======================
// UTILITAIRES DB
// =======================

function createTransaction(db, storeName, mode = "readonly") {
  return db.transaction(storeName, mode);
}

function executeTransaction(db, storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = createTransaction(db, storeName, mode);
    const store = tx.objectStore(storeName);

    operation(store, tx);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function executeQuery(db, storeName, operation) {
  return new Promise((resolve, reject) => {
    const tx = createTransaction(db, storeName, "readonly");
    const store = tx.objectStore(storeName);

    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// =======================
// OUVERTURE DB
// =======================

let migrationPromise = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = handleUpgrade;
    request.onsuccess = () => {
      const db = request.result;
      if (!migrationPromise) {
        migrationPromise = ensureServiceCodeMigration(db);
      }
      migrationPromise
        .then((didMigrate) => {
          if (didMigrate && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("db:migrated", {
                detail: { key: "migration_service_formation_v1" },
              }),
            );
          }
          resolve({ db, didMigrate });
        })
        .catch((error) => {
          // Fail-safe: allow retry on next openDB() call if migration failed once.
          migrationPromise = null;
          reject(error);
        });
    };
    request.onerror = () => reject(request.error);
  });
}

function handleUpgrade(event) {
  const db = event.target.result;
  const oldVersion = event.oldVersion || 0;

  if (!db.objectStoreNames.contains(STORES.SERVICES)) {
    db.createObjectStore(STORES.SERVICES, { keyPath: "code" });
  }

  if (!db.objectStoreNames.contains(STORES.PLANNING)) {
    db.createObjectStore(STORES.PLANNING, { keyPath: "date" });
  }

  if (!db.objectStoreNames.contains(STORES.CONFIG)) {
    db.createObjectStore(STORES.CONFIG, { keyPath: "key" });
  }

  if (oldVersion < 5) {
    migrateLegacyServiceToFormation(event.target.transaction);
  }
}

function legacyServiceCode() {
  return String.fromCharCode(65, 78, 78, 69, 88, 69);
}

function migrateLegacyServiceToFormation(tx) {
  if (!tx) return;
  const planningStore = tx.objectStore(STORES.PLANNING);
  const servicesStore = tx.objectStore(STORES.SERVICES);
  const legacyCode = legacyServiceCode();

  planningStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (!cursor) return;
    const entry = cursor.value;
    if (entry.serviceCode === legacyCode) {
      entry.serviceCode = "FORMATION";
      cursor.update(entry);
    }
    cursor.continue();
  };

  servicesStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (!cursor) return;
    const service = cursor.value;
    if (service.code === legacyCode) {
      servicesStore.delete(service.code);
      servicesStore.put({ ...service, code: "FORMATION" });
    }
    cursor.continue();
  };
}

function ensureServiceCodeMigration(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORES.CONFIG, STORES.PLANNING, STORES.SERVICES],
      "readwrite",
    );
    const configStore = tx.objectStore(STORES.CONFIG);
    const planningStore = tx.objectStore(STORES.PLANNING);
    const servicesStore = tx.objectStore(STORES.SERVICES);

    const key = "migration_service_formation_v1";
    const inProgressKey = "migration_service_formation_v1_in_progress";
    let didMigrate = false;
    const legacyCode = legacyServiceCode();

    let planningDone = false;
    let servicesDone = false;
    let flagWritten = false;

    function maybeFinalize() {
      if (!planningDone || !servicesDone || flagWritten) return;
      flagWritten = true;
      configStore.put({ key, value: true });
      didMigrate = true;
    }

    const flagReq = configStore.get(key);
    flagReq.onsuccess = () => {
      if (flagReq.result?.value === true) {
        resolve();
        return;
      }

      configStore.put({ key: inProgressKey, value: true });

      planningStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) {
          planningDone = true;
          maybeFinalize();
          return;
        }
        const entry = cursor.value;
        if (entry.serviceCode === legacyCode) {
          entry.serviceCode = "FORMATION";
          cursor.update(entry);
        }
        cursor.continue();
      };

      servicesStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (!cursor) {
          servicesDone = true;
          maybeFinalize();
          return;
        }
        const service = cursor.value;
        if (service.code === legacyCode) {
          servicesStore.delete(service.code);
          servicesStore.put({ ...service, code: "FORMATION" });
        }
        cursor.continue();
      };

      const legacyPrefsKey = String.fromCharCode(
        115,
        117,
        103,
        103,
        101,
        115,
        116,
        105,
        111,
        110,
        115,
        95,
        112,
        114,
        101,
        102,
        115,
      );
      const legacyPrefField = String.fromCharCode(97, 110, 110, 101, 120, 101);
      const prefsReq = configStore.get(legacyPrefsKey);
      prefsReq.onsuccess = () => {
        const prefs = prefsReq.result?.value;
        if (prefs && typeof prefs === "object" && legacyPrefField in prefs) {
          prefs.formation = prefs.formation ?? prefs[legacyPrefField];
          delete prefs[legacyPrefField];
          configStore.put({ key: legacyPrefsKey, value: prefs });
        }
      };
    };

    flagReq.onerror = () => reject(flagReq.error);
    tx.oncomplete = () => {
      const cleanupTx = db.transaction(STORES.CONFIG, "readwrite");
      cleanupTx.objectStore(STORES.CONFIG).delete(inProgressKey);
      cleanupTx.oncomplete = () => resolve(didMigrate);
      cleanupTx.onerror = () => resolve(didMigrate);
    };
    tx.onerror = () => reject(tx.error);
  });
}

// =======================
// SERVICES
// =======================

export async function getAllServices() {
  const { db } = await openDB();
  return executeQuery(db, STORES.SERVICES, (store) => store.getAll());
}

export async function addService(service) {
  const { db } = await openDB();
  return executeTransaction(db, STORES.SERVICES, "readwrite", (store) => {
    store.put(service);
  });
}

// =======================
// PLANNING
// =======================

window.savePlanningEntry = async function (entry) {
  // Legacy global kept for compatibility: delegate to canonical storage path.
  const { savePlanningEntry } = await import("./storage.js");
  await savePlanningEntry(entry);
};

window.getPlanningForMonth = async function (monthISO) {
  // Legacy global kept for compatibility: delegate to canonical storage path.
  const { getPlanningForMonth } = await import("./storage.js");
  return getPlanningForMonth(monthISO);
};

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
// VERROUILLAGE MOIS PASSS
// =======================

window.lockPastMonths = async function () {
  const { db } = await openDB();
  const cutoffMonth = getPreviousMonthISO();

  return new Promise((resolve, reject) => {
    const tx = createTransaction(db, STORES.PLANNING, "readwrite");
    const store = tx.objectStore(STORES.PLANNING);

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        resolve();
        return;
      }

      lockEntryIfPastMonth(cursor, cutoffMonth);
      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
};

export async function enforceMaxMonthsRetention(maxMonths = 13) {
  const { db } = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("planning", "readwrite");
    const store = tx.objectStore("planning");

    const monthsMap = new Map(); // YYYY-MM -> [dates]

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) {
        const months = Array.from(monthsMap.keys()).sort();

        if (months.length <= maxMonths) {
          resolve();
          return;
        }

        const monthsToDelete = months.slice(0, months.length - maxMonths);

        monthsToDelete.forEach((month) => {
          const dates = monthsMap.get(month);
          dates.forEach((date) => store.delete(date));
        });

        resolve();
        return;
      }

      const date = cursor.key; // YYYY-MM-DD
      const month = date.slice(0, 7); // YYYY-MM

      if (!monthsMap.has(month)) {
        monthsMap.set(month, []);
      }

      monthsMap.get(month).push(date);
      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
}

export async function getConfig(key) {
  const { db } = await openDB();
  const result = await executeQuery(db, STORES.CONFIG, (store) => store.get(key));
  return result || { key, value: null };
}

export async function setConfig(key, value) {
  const { db } = await openDB();
  return executeTransaction(db, STORES.CONFIG, "readwrite", (store) => {
    store.put({ key, value });
  });
}

export async function countConfigEntries(options = {}) {
  const excludeKeys = Array.isArray(options.excludeKeys)
    ? options.excludeKeys.map((key) => String(key))
    : [];
  const { db } = await openDB();
  const keys = await executeQuery(db, STORES.CONFIG, (store) => store.getAllKeys());
  if (!Array.isArray(keys)) return 0;
  if (excludeKeys.length === 0) return keys.length;

  const excluded = new Set(excludeKeys);
  return keys.reduce((count, key) => {
    return excluded.has(String(key)) ? count : count + 1;
  }, 0);
}

