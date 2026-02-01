/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/suggestions.js

import { getConfig, setConfig } from "../data/storage.js";

const DEFAULT_PREFS = {
  tad: true,
  dm: true,
  dam: true,
  formation: true,
  lignes: true,
};

function normalizePrefs(value) {
  return {
    tad: value.tad !== false,
    dm: value.dm !== false,
    dam: value.dam !== false,
    formation: value.formation !== false,
    lignes: value.lignes !== false,
  };
}

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

export async function renderSuggestionsView() {
  const view = document.getElementById("view-suggestions");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Suggestions";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Choisir les types de services à suggérer";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const status = createStatus();

  const entry = await getConfig("suggestions_prefs");
  const prefs = normalizePrefs(entry?.value || DEFAULT_PREFS);

  function addToggle(labelText, key) {
    const row = document.createElement("label");
    row.className = "settings-toggle";

    const text = document.createElement("span");
    text.textContent = labelText;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = prefs[key];

    row.append(text, input);
    card.appendChild(row);

    input.addEventListener("change", async () => {
      prefs[key] = input.checked;
      await setConfig("suggestions_prefs", { ...prefs });
      status.show("Préférences enregistrées");
    });
  }

  addToggle("Lignes", "lignes");
  addToggle("Tad", "tad");
  addToggle("Dm", "dm");
  addToggle("Dam", "dam");
  addToggle("Formation", "formation");

  card.appendChild(status.node);

  root.append(header, card);
  view.appendChild(root);
}

