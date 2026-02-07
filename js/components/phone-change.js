/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/phone-change.js

import { exportAllData } from "../data/export-db.js";
import { importAllData } from "../data/import-db.js";

export async function renderPhoneChangeView() {
  const view = document.getElementById("view-phone-change");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view phone-change-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Changement de téléphone";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Sauvegarder ou restaurer vos données";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const exportBtn = document.createElement("button");
  exportBtn.className = "settings-btn primary";
  exportBtn.textContent = "Sauvegarder mes données";

  const exportNote = document.createElement("div");
  exportNote.className = "settings-note";
  exportNote.textContent = "À faire avant de changer de téléphone.";

  const importBtn = document.createElement("button");
  importBtn.className = "settings-btn danger";
  importBtn.textContent = "Restaurer mes données";

  const importNote = document.createElement("div");
  importNote.className = "settings-note";
  importNote.textContent =
    "À utiliser sur un nouveau téléphone ou après réinstallation.";

  card.append(exportNote, exportBtn, importNote, importBtn);

  root.append(header, card);
  view.appendChild(root);

  exportBtn.addEventListener("click", async () => {
    await exportAllData();
  });

  importBtn.addEventListener("click", async () => {
    await importAllData();
  });
}
