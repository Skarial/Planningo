/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/reset.js

import { clearAllPlanning, clearPlanningMonth } from "../data/storage.js";

function createStatus() {
  const status = document.createElement("div");
  status.className = "settings-status";
  status.hidden = true;
  return {
    node: status,
    show(text) {
      status.textContent = text;
      status.hidden = false;
      clearTimeout(status.__timer);
      status.__timer = setTimeout(() => {
        status.hidden = true;
      }, 2200);
    },
  };
}

function bindHoldAction(button, onHold, status, holdText) {
  let timer = null;
  const HOLD_DURATION = 4000;

  function start(e) {
    e.preventDefault();
    e.stopPropagation();
    if (timer) return;
    button.classList.add("holding");
    timer = setTimeout(async () => {
      timer = null;
      button.classList.remove("holding");
      try {
        await onHold();
      } catch (err) {
        status.show("Une erreur est survenue.");
      }
    }, HOLD_DURATION);
  }

  function cancel(e) {
    if (e?.pointerId !== undefined) {
      button.releasePointerCapture?.(e.pointerId);
    }
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
    button.classList.remove("holding");
    if (holdText) status.show(holdText);
  }

  button.addEventListener("pointerdown", (e) => {
    button.setPointerCapture?.(e.pointerId);
    start(e);
  });
  button.addEventListener("pointerup", cancel);
  button.addEventListener("pointercancel", cancel);
}

export async function renderResetView() {
  const view = document.getElementById("view-reset");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Réinitialisation";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Choisissez une action à effectuer.";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const warning = document.createElement("div");
  warning.className = "settings-note";
  warning.textContent =
    "Les Réinitialisations sont dÃ©finitives. Maintenez pour confirmer.";

  const labelMonth = document.createElement("label");
  labelMonth.textContent = "Mois à réinitialiser";

  const monthInput = document.createElement("input");
  monthInput.type = "month";

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const resetMonthBtn = document.createElement("button");
  resetMonthBtn.className = "settings-btn danger holdable";
  resetMonthBtn.type = "button";
  resetMonthBtn.id = "reset-confirm-month";
  resetMonthBtn.innerHTML =
    "<span>Maintenir pour réinitialiser le mois</span><div class=\"hold-progress\"></div>";

  const resetAllBtn = document.createElement("button");
  resetAllBtn.className = "settings-btn danger holdable";
  resetAllBtn.type = "button";
  resetAllBtn.id = "reset-all";
  resetAllBtn.innerHTML =
    "<span>Maintenir pour tout réinitialiser</span><div class=\"hold-progress\"></div>";

  const status = createStatus();

  actions.append(resetMonthBtn, resetAllBtn);
  card.append(warning, labelMonth, monthInput, actions, status.node);
  root.append(header, card);
  view.appendChild(root);

  bindHoldAction(
    resetMonthBtn,
    async () => {
      const value = monthInput.value.trim();
      if (!value) {
        status.show("Choisissez un mois avant de confirmer.");
        return;
      }
      await clearPlanningMonth(value);
      status.show("Planning du mois réinitialisé.");
    },
    status,
    null,
  );

  bindHoldAction(
    resetAllBtn,
    async () => {
      await clearAllPlanning();
      status.show("Planning entièrement réinitialisé.");
    },
    status,
    null,
  );
}

