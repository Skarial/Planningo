/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const ALARM_RESYNC_PENDING_KEY = "planningo_alarm_resync_pending";

function safeGetStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemoveStorageValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function isAlarmResyncPending() {
  return safeGetStorageValue(ALARM_RESYNC_PENDING_KEY) === "1";
}

export function markAlarmResyncPending() {
  safeSetStorageValue(ALARM_RESYNC_PENDING_KEY, "1");
}

export function clearAlarmResyncPending() {
  safeRemoveStorageValue(ALARM_RESYNC_PENDING_KEY);
}

