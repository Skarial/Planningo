/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/consult-date.js

import { setActiveDateISO } from "../state/active-date.js";
import { showHome } from "../router.js";

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

export async function renderConsultDateView() {
  const view = document.getElementById("view-consult-date");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view settings-page-variant settings-card-spacing-lg consult-date-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Consulter une date";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Choisissez une date pour afficher le planning du jour.";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const label = document.createElement("label");
  label.textContent = "Date";

  const input = document.createElement("input");
  input.type = "date";

  const status = createStatus();

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const submitBtn = document.createElement("button");
  submitBtn.className = "settings-btn primary";
  submitBtn.textContent = "Afficher";

  actions.append(submitBtn);
  card.append(label, input, actions, status.node);
  root.append(header, card);
  view.appendChild(root);

  submitBtn.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) {
      status.show("Veuillez choisir une date.");
      return;
    }
    setActiveDateISO(value);
    showHome();
  });
}
