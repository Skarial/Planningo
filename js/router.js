/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/router.js

let currentView = null;

import { renderHome } from "./components/home.js";

import { showGuidedMonth as renderGuidedMonth } from "./components/guided-month.js";
import { showTetribus, stopTetribus } from "./components/tetribus.js";
import { renderCongesView } from "./components/conges.js";
import { renderSeasonView } from "./components/season.js";
import { renderPhoneChangeView } from "./components/phone-change.js";
import { renderSummaryView } from "./components/summary.js";
import { renderSuggestionsView } from "./components/suggestions.js";
import { renderLegalView } from "./components/legal.js";
import { renderConsultDateView } from "./components/consult-date.js";
import { renderResetView } from "./components/reset.js";

function getView(name) {
  return document.getElementById(`view-${name}`);
}

function hideAllViews() {
  [
    "home",
    "guided-month",
    "conges",
    "season",
    "consult-date",
    "suggestions",
    "phone-change",
    "summary",
    "tetribus",
    "legal",
    "reset",
  ].forEach((name) => {
    const el = getView(name);
    if (el) el.hidden = true;
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
// OUTILS
// =======================

export function showCongesView() {
  const view = activateView("conges");
  if (!view) return;
  renderCongesView();
}

export function showSeasonView() {
  const view = activateView("season");
  if (!view) return;
  renderSeasonView();
}

export function showConsultDateView() {
  const view = activateView("consult-date");
  if (!view) return;
  renderConsultDateView();
}

export function showResetView() {
  const view = activateView("reset");
  if (!view) return;
  renderResetView();
}

export function showSuggestionsView() {
  const view = activateView("suggestions");
  if (!view) return;
  renderSuggestionsView();
}

export function showPhoneChangeView() {
  const view = activateView("phone-change");
  if (!view) return;
  renderPhoneChangeView();
}

export function showSummaryView() {
  const view = activateView("summary");
  if (!view) return;
  renderSummaryView();
}

export function showLegalView() {
  const view = activateView("legal");
  if (!view) return;
  renderLegalView();
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

    case "conges":
      showCongesView();
      break;

    case "season":
      showSeasonView();
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
  view.hidden = false;
  view.innerHTML = "";

  return view;
}

