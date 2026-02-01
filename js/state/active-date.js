/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/state/active-date.js
// Ã‰tat global : date active (ISO yyyy-mm-dd)

let activeDateISO = null;

const subscribers = new Set();

export function getActiveDateISO() {
  return activeDateISO;
}

export function setActiveDateISO(dateISO) {
  if (!dateISO) return;

  activeDateISO = dateISO;

  subscribers.forEach((fn) => {
    try {
      fn(activeDateISO);
    } catch {}
  });
}

export function subscribeActiveDate(fn) {
  if (typeof fn === "function") {
    subscribers.add(fn);
  }
}

