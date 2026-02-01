/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export const UI_MODE = {
  CONSULTATION: "consultation",
  SAISIE_MENSUELLE: "saisie_mensuelle",
};

let currentMode = UI_MODE.CONSULTATION;

export function getUiMode() {
  return currentMode;
}

export function setUiMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  notifyUiModeChange();
}

let listeners = [];

export function subscribeUiMode(listener) {
  if (typeof listener !== "function") return;
  listeners.push(listener);
}

function notifyUiModeChange() {
  listeners.forEach((fn) => fn(currentMode));
}

