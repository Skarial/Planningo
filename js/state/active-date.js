// js/state/active-date.js
// État global : date active (ISO yyyy-mm-dd)

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
