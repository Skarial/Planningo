/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/state/home-mode.js
// Ã‰tat UI local Ã  HOME (vue centrale)

export const HOME_MODE = {
  VIEW: "VIEW",
  EDIT_DAY: "EDIT_DAY",
};

let currentHomeMode = HOME_MODE.VIEW;

export function getHomeMode() {
  return currentHomeMode;
}

export function setHomeMode(mode) {
  if (!Object.values(HOME_MODE).includes(mode)) {
    throw new Error("HOME_MODE invalide : " + mode);
  }

  currentHomeMode = mode;
}

