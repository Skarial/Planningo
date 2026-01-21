// =======================
// CONFIGURATION DB
// =======================

const DB_NAME = "planningDB";
const DB_VERSION = 4;

const STORES = {
  SERVICES: "services",
  PLANNING: "planning",
  CONFIG: "config",
};

// =======================
// OUVERTURE DB
// =======================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
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
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// =======================
// SERVICES
// =======================

export async function getAllServices() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SERVICES, "readonly");
    const store = tx.objectStore(STORES.SERVICES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function addService(service) {
  const db = await openDB();
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

export async function savePlanningEntry(entry) {
  const db = await openDB();
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
  const db = await openDB();
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

export async function getPlanningEntry(dateISO) {
  const db = await openDB();

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
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PLANNING, "readwrite");
    tx.objectStore(STORES.PLANNING).clear();

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearPlanningMonth(monthISO) {
  const db = await openDB();

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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONFIG, "readonly");
    const req = tx.objectStore(STORES.CONFIG).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function setConfig(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONFIG, "readwrite");
    tx.objectStore(STORES.CONFIG).put({ key, value });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
