// js/components/phone-change.js

import { exportAllData } from "../data/export-db.js";
import { importAllData } from "../data/import-db.js";

export async function renderPhoneChangeView() {
  const view = document.getElementById("view-phone-change");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Changement de telephone";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Sauvegarder ou restaurer vos donnees";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const exportBtn = document.createElement("button");
  exportBtn.className = "settings-btn primary";
  exportBtn.textContent = "Sauvegarder mes donnees";

  const exportNote = document.createElement("div");
  exportNote.className = "settings-note";
  exportNote.textContent = "A faire avant de changer de telephone.";

  const importBtn = document.createElement("button");
  importBtn.className = "settings-btn";
  importBtn.textContent = "Restaurer mes donnees";

  const importNote = document.createElement("div");
  importNote.className = "settings-note";
  importNote.textContent =
    "A utiliser sur un nouveau telephone ou apres reinstallation.";

  card.append(exportBtn, exportNote, importBtn, importNote);

  root.append(header, card);
  view.appendChild(root);

  exportBtn.addEventListener("click", async () => {
    await exportAllData();
  });

  importBtn.addEventListener("click", async () => {
    await importAllData();
  });
}
