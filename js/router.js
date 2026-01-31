// js/router.js

let currentView = null;

import { renderHome } from "./components/home.js";

import { showGuidedMonth as renderGuidedMonth } from "./components/guided-month.js";
import { showTetribus, stopTetribus } from "./components/tetribus.js";

function getView(name) {
  return document.getElementById(`view-${name}`);
}

function hideAllViews() {
  ["home", "guided-month", "tetribus"].forEach((name) => {
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

    case "guided-month":
      showGuidedMonth();
      break;
  }
}

function activateView(name) {
  const view = getView(name);
  if (!view) {
    console.warn(`Vue inexistante : ${name}`);
    return null;
  }

  currentView = name;

  hideAllViews();
  view.style.display = "block";
  view.innerHTML = "";

  return view;
}
