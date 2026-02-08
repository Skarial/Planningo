/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/router.js

let currentView = null;
let stopTetribusFn = null;

function getView(name) {
  return document.getElementById(`view-${name}`);
}

function hideAllViews(previousView) {
  if (previousView === "tetribus") {
    stopTetribusIfRunning();
  }

  [
    "home",
    "guided-month",
    "conges",
    "season",
    "conges-periods",
    "consult-date",
    "suggestions",
    "phone-change",
    "summary",
    "tetribus",
    "alarm",
    "legal",
    "reset",
  ].forEach((name) => {
    const el = getView(name);
    if (el) el.hidden = true;
  });
}

// =======================
// HOME
// =======================

export async function showHome() {
  const view = activateView("home");
  if (!view) return;

  const { renderHome } = await import("./components/home.js");
  if (currentView !== "home") return;
  renderHome();
}

// =======================
// GUIDED
// =======================

export async function showGuidedMonth() {
  const view = activateView("guided-month");
  if (!view) return;

  const { showGuidedMonth: renderGuidedMonth } = await import(
    "./components/guided-month.js"
  );
  if (currentView !== "guided-month") return;
  renderGuidedMonth();
}

// =======================
// OUTILS
// =======================

export async function showCongesView() {
  const view = activateView("conges");
  if (!view) return;
  const { renderCongesView } = await import("./components/conges.js");
  if (currentView !== "conges") return;
  renderCongesView();
}

export async function showSeasonView() {
  const view = activateView("season");
  if (!view) return;
  const { renderSeasonView } = await import("./components/season.js");
  if (currentView !== "season") return;
  renderSeasonView();
}

export async function showCongesPeriodsView() {
  const view = activateView("conges-periods");
  if (!view) return;
  const { renderCongesPeriodsView } = await import(
    "./components/conges-periods.js"
  );
  if (currentView !== "conges-periods") return;
  renderCongesPeriodsView();
}

export async function showConsultDateView() {
  const view = activateView("consult-date");
  if (!view) return;
  const { renderConsultDateView } = await import("./components/consult-date.js");
  if (currentView !== "consult-date") return;
  renderConsultDateView();
}

export async function showResetView() {
  const view = activateView("reset");
  if (!view) return;
  const { renderResetView } = await import("./components/reset.js");
  if (currentView !== "reset") return;
  renderResetView();
}

export async function showSuggestionsView() {
  const view = activateView("suggestions");
  if (!view) return;
  const { renderSuggestionsView } = await import("./components/suggestions.js");
  if (currentView !== "suggestions") return;
  renderSuggestionsView();
}

export async function showPhoneChangeView() {
  const view = activateView("phone-change");
  if (!view) return;
  const { renderPhoneChangeView } = await import("./components/phone-change.js");
  if (currentView !== "phone-change") return;
  renderPhoneChangeView();
}

export async function showSummaryView() {
  const view = activateView("summary");
  if (!view) return;
  const { renderSummaryView } = await import("./components/summary.js");
  if (currentView !== "summary") return;
  renderSummaryView();
}

export async function showLegalView() {
  const view = activateView("legal");
  if (!view) return;
  const { renderLegalView } = await import("./components/legal.js");
  if (currentView !== "legal") return;
  renderLegalView();
}

export async function showAlarmView() {
  const view = activateView("alarm");
  if (!view) return;
  const { renderAlarmView } = await import("./components/alarm.js");
  if (currentView !== "alarm") return;
  renderAlarmView();
}

// =======================
// ROUTER INTERNE
// =======================

export async function showTetribusView() {
  const view = activateView("tetribus");
  if (!view) return;

  const mod = await import("./components/tetribus.js");
  if (currentView !== "tetribus") return;
  stopTetribusFn = typeof mod.stopTetribus === "function" ? mod.stopTetribus : null;
  const showTetribus = mod.showTetribus;
  if (typeof showTetribus !== "function") return;
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

    case "conges":
      showCongesView();
      break;

    case "season":
      showSeasonView();
      break;
    case "conges-periods":
      showCongesPeriodsView();
      break;

    case "consult-date":
      showConsultDateView();
      break;

    case "reset":
      showResetView();
      break;

    case "suggestions":
      showSuggestionsView();
      break;

    case "phone-change":
      showPhoneChangeView();
      break;

    case "summary":
      showSummaryView();
      break;

    case "legal":
      showLegalView();
      break;

    case "alarm":
      showAlarmView();
      break;
  }
}

function activateView(name) {
  const view = getView(name);
  if (!view) {
    console.warn(`Vue inexistante : ${name}`);
    return null;
  }

  const previousView = currentView;
  hideAllViews(previousView);
  currentView = name;
  view.hidden = false;
  view.innerHTML = "";

  const consultToggle = document.getElementById("consult-toggle");
  if (consultToggle) {
    consultToggle.classList.toggle("hidden", name !== "home");
  }

  return view;
}

function stopTetribusIfRunning() {
  if (typeof stopTetribusFn !== "function") return;
  try {
    stopTetribusFn();
  } catch {
    // ignore game cleanup errors
  }
}
