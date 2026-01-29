// router.js

let currentView = null;

import { renderHome, setHomeWeekFromDate } from "./components/home.js";

import {
  getConsultedDate,
  clearConsultedDate,
} from "./state/consulted-date.js";

import { renderDay } from "./components/day.js";
import { renderMonth } from "./components/month.js";
import { showGuidedMonth as renderGuidedMonth } from "./components/guided-month.js";
import { showTetribus, stopTetribus } from "./components/tetribus.js";

function getView(name) {
  return document.getElementById(`view-${name}`);
}

function hideAllViews() {
  ["home", "day", "month", "guided-month", "tetribus"].forEach((name) => {
    const el = getView(name);
    if (el) el.style.display = "none";
  });

  stopTetribus();
}

// =======================
// HOME
// =======================

export function showHome() {
  const view = activateView("home");
  if (!view) return;
  renderHome();
}
export function showHomeAtDate(dateISO) {
  const view = activateView("home");
  if (!view) return;

  setHomeWeekFromDate(dateISO);
  renderHome();
}

// =======================
// JOUR
// =======================

export function showDay() {
  const date = getConsultedDate();

  // 🔒 Vue day non exposée — fallback sécurité
  if (!date) {
    showHome();
    return;
  }

  const view = activateView("day");
  if (!view) return;

  renderDay(date);
}

// =======================
// MOIS
// =======================

export function showMonth() {
  const view = activateView("month");
  if (!view) return;

  renderMonth();
}

// =======================
// GUIDED
// =======================

export function showGuidedMonth() {
  const view = activateView("guided-month");
  if (!view) return;

  renderGuidedMonth();
}

// =======================
// ROUTER INTERNE
// =======================

function activateView(name) {
  const view = getView(name);
  if (!view) {
    console.warn(`Vue inexistante : ${name}`);
    return null;
  }

  // 🔒 VERROU ARCHITECTURAL
  if (name !== "day") {
    clearConsultedDate();
  }

  currentView = name;

  hideAllViews();
  view.style.display = "block";
  view.innerHTML = "";
  return view;
}

export function showTetribusView() {
  const view = activateView("tetribus");
  if (!view) return;

  showTetribus();
}

export function refreshCurrentView() {
  switch (currentView) {
    case "home":
      showHome();
      break;
    case "day":
      showDay();
      break;
    case "month":
      showMonth();
      break;
    case "guided-month":
      showGuidedMonth();
      break;
  }
}
