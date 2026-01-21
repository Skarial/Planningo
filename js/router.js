// router.js : une seule vue visible à la fois, affichage par masquage DOM

import { renderHome } from "./components/home.js";
import { getConsultedDate } from "./state/consulted-date.js";
import { renderDay } from "./components/day.js";
import { renderMonth } from "./components/month.js";
import { showGuidedMonth } from "./components/guided-month.js";
import { showTetribus, stopTetribus } from "./components/tetribus.js";

function getView(name) {
  return document.getElementById(`view-${name}`);
}

function hideAllViews() {
  ["home", "day", "month", "guided-month", "tetribus"].forEach((name) => {
    const el = getView(name);
    if (el) el.style.display = "none";
  });

  // arrêt propre du jeu si on quitte la vue
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
// JOUR
// =======================

export function showDay() {
  const view = activateView("day");
  if (!view) return;

  const date = getConsultedDate();
  if (!date) {
    showHome();
    return;
  }

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
// OUTIL INTERNE
// =======================

function activateView(name) {
  const view = getView(name);
  if (!view) {
    console.warn(`Vue inexistante : ${name}`);
    return null;
  }

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
