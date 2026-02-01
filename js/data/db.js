// js/data/db.js

// =======================
// CONFIGURATION
// =======================

const DB_NAME = "planningDB";
const DB_VERSION = 4;

const STORES = {
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

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = handleUpgrade;
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function handleUpgrade(event) {
  const db = event.target.result;

  if (!db.objectStoreNames.contains(STORES.SERVICES)) {
    db.createObjectStore(STORES.SERVICES, { keyPath: "code" });
  }

  if (!db.objectStoreNames.contains(STORES.PLANNING)) {
    db.createObjectStore(STORES.PLANNING, { keyPath: "date" });
  }

  if (!db.objectStoreNames.contains(STORES.CONFIG)) {
    db.createObjectStore(STORES.CONFIG, { keyPath: "key" });
  }
}

// =======================
// SERVICES
// =======================

export async function getAllServices() {
  const db = await openDB();
  return executeQuery(db, STORES.SERVICES, (store) => store.getAll());
}

export async function addService(service) {
  const db = await openDB();
  return executeTransaction(db, STORES.SERVICES, "readwrite", (store) => {
    store.put(service);
  });
}

// =======================
// PLANNING
// =======================

window.savePlanningEntry = async function (entry) {
  const db = await openDB();

  await executeTransaction(db, STORES.PLANNING, "readwrite", (store) => {
    store.put({
      date: entry.date,
      serviceCode: entry.serviceCode,
      locked: entry.locked ?? false,
      extra: entry.extra ?? false,
    });
  });

  // nettoyage après écriture
  await enforceMaxMonthsRetention(36);
};

window.getPlanningForMonth = async function (monthISO) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = createTransaction(db, STORES.PLANNING, "readonly");
    const store = tx.objectStore(STORES.PLANNING);
    const results = [];

    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (!cursor) {
        resolve(sortPlanningResults(results));
        return;
      }

      if (isDateInMonth(cursor.key, monthISO)) {
        results.push(normalizePlanningEntry(cursor.value));
      }

      cursor.continue();
    };

    tx.onerror = () => reject(tx.error);
  });
};

function isDateInMonth(dateKey, monthISO) {
  return dateKey.startsWith(monthISO);
}

function normalizePlanningEntry(entry) {
  return {
    date: entry.date,
    serviceCode: entry.serviceCode ?? "REPOS",
    locked: entry.locked ?? false,
    extra: entry.extra ?? false,
  };
}

function sortPlanningResults(results) {
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

// =======================
// VERROUILLAGE MOIS PASSÉS
// =======================

window.lockPastMonths = async function () {
  const db = await openDB();
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

async function enforceMaxMonthsRetention(maxMonths = 13) {
  const db = await openDB();

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
  const db = await openDB();
  return executeQuery(db, STORES.CONFIG, (store) => store.get(key));
}

export async function setConfig(key, value) {
  const db = await openDB();
  return executeTransaction(db, STORES.CONFIG, "readwrite", (store) => {
    store.put({ key, value });
  });
}
