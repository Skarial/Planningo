/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/season.js

import { getConfig, setConfig } from "../data/storage.js";

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

export async function renderSeasonView() {
  const view = document.getElementById("view-season");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Periode saisonniere";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Definir une periode pour les services saisonniers";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const labelStart = document.createElement("label");
  labelStart.textContent = "Debut";
  const inputStart = document.createElement("input");
  inputStart.type = "date";

  const labelEnd = document.createElement("label");
  labelEnd.textContent = "Fin";
  const inputEnd = document.createElement("input");
  inputEnd.type = "date";

  const status = createStatus();

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const saveBtn = document.createElement("button");
  saveBtn.className = "settings-btn primary";
  saveBtn.textContent = "Valider";

  const resetBtn = document.createElement("button");
  resetBtn.className = "settings-btn danger";
  resetBtn.type = "button";
  resetBtn.textContent = "Reinitialiser la saison";

  actions.append(saveBtn, resetBtn);

  card.append(labelStart, inputStart, labelEnd, inputEnd, actions, status.node);

  root.append(header, card);
  view.appendChild(root);

  const entry = await getConfig("saison");
  const value = entry?.value || {};
  if (value.saisonDebut) inputStart.value = value.saisonDebut;
  if (value.saisonFin) inputEnd.value = value.saisonFin;

  saveBtn.addEventListener("click", async () => {
    const start = inputStart.value.trim();
    const end = inputEnd.value.trim();
    await setConfig(
      "saison",
      start && end ? { saisonDebut: start, saisonFin: end } : {},
    );
    window.__homeSaisonConfig = start && end ? { saisonDebut: start, saisonFin: end } : null;
    status.show("Saison enregistree");
  });

  resetBtn.addEventListener("click", async () => {
    await setConfig("saison", {});
    inputStart.value = "";
    inputEnd.value = "";
    window.__homeSaisonConfig = null;
    status.show("Saison reinitialisee");
  });
}

