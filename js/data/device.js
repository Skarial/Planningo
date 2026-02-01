/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/device.js

import { getConfig, setConfig } from "./db.js";

// =======================
// CONSTANTES
// =======================

const DEVICE_ID_KEY = "deviceId";

// =======================
// API PUBLIQUE
// =======================

export async function getOrCreateDeviceId() {
  const existing = await getConfig(DEVICE_ID_KEY);

  if (existing && typeof existing.value === "string") {
    return existing.value;
  }

  const deviceId = generateDeviceId();
  await setConfig(DEVICE_ID_KEY, deviceId);

  return deviceId;
}

// =======================
// UTILITAIRES
// =======================

function generateDeviceId() {
  const bytes = new Uint8Array(16); // 128 bits
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

