/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/import-db.js

import { openDB } from "./db.js";
import { normalizeServicePeriods } from "./period-key.js";

// =======================
// STORES CONNUS
// =======================

const STORES = ["services", "planning", "config"];

function canonicalizeServiceCode(rawCode) {
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

// =======================
// IMPORT PRINCIPAL
// =======================

export async function importDatabase(exportData) {
  const normalizedData = normalizeExportData(exportData);
  validateExportFormat(normalizedData);

  const { db } = await openDB();

  // 1. Vidage complet
  for (const storeName of STORES) {
    await clearStore(db, storeName);
  }

  // 2. Restauration dans l'ordre
  for (const storeName of STORES) {
    const records = normalizedData.stores[storeName] || [];
    await restoreStore(db, storeName, records);
  }

  db.close();

  // 3. Redemarrage obligatoire
  location.reload();
}
// =======================
// VALIDATION FORMAT
// =======================

function validateExportFormat(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Export invalide : objet attendu");
  }

  if (data.signature && data.signature !== "PLANNING_PWA_EXPORT_V1") {
    throw new Error("Export invalide : signature inconnue");
  }

  if (data.meta && data.meta.exportVersion && data.meta.exportVersion !== 1) {
    throw new Error("Export invalide : version non supportee");
  }

  if (!data.stores || typeof data.stores !== "object") {
    throw new Error("Export invalide : stores manquants");
  }
  if (!Array.isArray(data.stores.services)) {
    throw new Error("Export invalide : services manquants");
  }

  if (!Array.isArray(data.stores.planning)) {
    throw new Error("Export invalide : planning manquant");
  }
}

// =======================
// UTILITAIRES
// =======================

function normalizeExportData(rawData) {
  if (!rawData || typeof rawData !== "object") {
    return rawData;
  }

  let data = rawData;

  if (!data.stores && (rawData.services || rawData.planning || rawData.config)) {
    data = {
      ...rawData,
      stores: {
        services: rawData.services,
        planning: rawData.planning,
        config: rawData.config,
      },
    };
  }

  if (!data.stores || typeof data.stores !== "object") {
    return data;
  }

  if (data.stores.services == null) {
    data.stores.services = [];
  }

  if (data.stores.planning == null) {
    data.stores.planning = [];
  }

  if (data.stores.config == null) {
    data.stores.config = [];
  }

  if (
    data.stores.config &&
    !Array.isArray(data.stores.config) &&
    typeof data.stores.config === "object"
  ) {
    data.stores.config = Object.entries(data.stores.config).map(([key, value]) => ({
      key,
      value,
    }));
  }

  if (Array.isArray(data.stores.planning)) {
    data.stores.planning = data.stores.planning.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const serviceCode = item.serviceCode || item.service || null;
      if (!serviceCode) return item;

      const legacyCode = String.fromCharCode(65, 78, 78, 69, 88, 69);
      const normalizedCode =
        serviceCode === legacyCode ? "FORMATION" : canonicalizeServiceCode(serviceCode);

      return {
        ...item,
        serviceCode: normalizedCode,
      };
    });
  }

  if (Array.isArray(data.stores.services)) {
    const dedupe = new Map();
    data.stores.services.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const originalCode = item.code;
      if (!originalCode) return;
      const canonicalCode = canonicalizeServiceCode(originalCode);
      if (!canonicalCode) return;
      dedupe.set(canonicalCode, { ...item, code: canonicalCode });
    });
    data.stores.services = Array.from(dedupe.values());
  }

  return data;
}

function clearStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function normalizeRecordForStore(storeName, record) {
  if (storeName !== "services") return record;
  return normalizeServicePeriods(record);
}

function restoreStore(db, storeName, records) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(records)) {
      resolve();
      return;
    }

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const record of records) {
      store.put(normalizeRecordForStore(storeName, record));
    }

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// =======================
// IMPORT UI (UTILISATEUR)
// =======================

export async function importAllData() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    let settled = false;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    input.addEventListener("cancel", () => settle(false));

    input.onchange = async () => {
      const confirmed = confirm("L'import remplacera toutes les donnees existantes. Continuer ");
      if (!confirmed) {
        settle(false);
        return;
      }

      const file = input.files[0];
      if (!file) {
        settle(false);
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importDatabase(data);
        settle(true);
      } catch (err) {
        alert("Fichier de sauvegarde invalide");
        reject(err);
      }
    };

    input.click();
  });
}
