// js/components/conges.js

import { getConfig, setConfig } from "../data/storage.js";

function isoToFR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function frToISO(fr) {
  if (!fr) return "";
  const [d, m, y] = fr.split("/");
  return `${y}-${m}-${d}`;
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

export async function renderCongesView() {
  const view = document.getElementById("view-conges");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "settings-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Conges";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Configurer votre periode de conges";

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
  resetBtn.className = "settings-btn";
  resetBtn.type = "button";
  resetBtn.textContent = "Supprimer les conges";

  actions.append(saveBtn, resetBtn);

  card.append(labelStart, inputStart, labelEnd, inputEnd, actions, status.node);

  root.append(header, card);
  view.appendChild(root);

  const entry = await getConfig("conges");
  const value = entry?.value;
  if (value?.start) inputStart.value = frToISO(value.start);
  if (value?.end) inputEnd.value = frToISO(value.end);

  saveBtn.addEventListener("click", async () => {
    if (!inputStart.value || !inputEnd.value) {
      status.show("Dates invalides");
      return;
    }

    const startFR = isoToFR(inputStart.value);
    const endFR = isoToFR(inputEnd.value);

    await setConfig("conges", { start: startFR, end: endFR });
    window.__homeCongesConfig = { start: startFR, end: endFR };
    status.show("Conges enregistres");
  });

  resetBtn.addEventListener("click", async () => {
    await setConfig("conges", {});
    inputStart.value = "";
    inputEnd.value = "";
    window.__homeCongesConfig = null;
    status.show("Conges supprimes");
  });
}
