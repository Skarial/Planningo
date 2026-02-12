/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getConfig, setConfig } from "../data/storage.js";

const ALARM_SYNC_ENABLED_KEY = "alarm_sync_enabled";
const ALARM_RULES_KEY = "alarm_rules";
const ALARM_NOTICE_SEEN_KEY = "planningo_alarm_notice_seen";
const ALARM_RESYNC_PENDING_KEY = "planningo_alarm_resync_pending";
const ALARM_RESYNC_DISMISSED_KEY = "planningo_alarm_resync_dismissed";

let cachedEnabled = null;

function safeGetStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function hasLegacyAlarmSignals(rulesValue) {
  const hasRules =
    rulesValue && typeof rulesValue === "object" && Object.keys(rulesValue).length > 0;
  const hasNoticeSeen = safeGetStorageValue(ALARM_NOTICE_SEEN_KEY) === "1";
  const hasResyncFlag =
    safeGetStorageValue(ALARM_RESYNC_PENDING_KEY) === "1" ||
    safeGetStorageValue(ALARM_RESYNC_DISMISSED_KEY) === "1";
  return hasRules || hasNoticeSeen || hasResyncFlag;
}

export async function getAlarmSyncEnabled() {
  if (typeof cachedEnabled === "boolean") {
    return cachedEnabled;
  }

  const [enabledEntry, rulesEntry] = await Promise.all([
    getConfig(ALARM_SYNC_ENABLED_KEY),
    getConfig(ALARM_RULES_KEY),
  ]);

  const enabledValue = enabledEntry?.value;
  if (typeof enabledValue === "boolean") {
    cachedEnabled = enabledValue;
    return cachedEnabled;
  }

  // Migration douce:
  // - anciens utilisateurs avec traces d'usage reveil => ON
  // - nouveaux / non utilisateurs => OFF
  cachedEnabled = hasLegacyAlarmSignals(rulesEntry?.value);
  await setConfig(ALARM_SYNC_ENABLED_KEY, cachedEnabled);
  return cachedEnabled;
}

export async function setAlarmSyncEnabled(enabled) {
  const nextValue = Boolean(enabled);
  cachedEnabled = nextValue;
  await setConfig(ALARM_SYNC_ENABLED_KEY, nextValue);
  return nextValue;
}
