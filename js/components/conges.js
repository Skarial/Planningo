/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

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
  title.textContent = "Congés";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Configurer vos périodes de congés";

  header.append(title, subtitle);

  const card = document.createElement("div");
  card.className = "settings-card";

  const periodsContainer = document.createElement("div");
  periodsContainer.className = "settings-periods";

  const status = createStatus();

  const actions = document.createElement("div");
  actions.className = "settings-actions";

  const addBtn = document.createElement("button");
  addBtn.className = "settings-btn";
  addBtn.type = "button";
  addBtn.textContent = "Ajouter une periode";

  const saveBtn = document.createElement("button");
  saveBtn.className = "settings-btn primary";
  saveBtn.textContent = "Valider";

  const resetBtn = document.createElement("button");
  resetBtn.className = "settings-btn danger";
  resetBtn.type = "button";
  resetBtn.textContent = "Supprimer les congés";

  actions.append(addBtn, saveBtn, resetBtn);

  card.append(periodsContainer, actions, status.node);

  root.append(header, card);
  view.appendChild(root);

  function createPeriodRow(period = {}, index = 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "settings-period";

    const headerRow = document.createElement("div");
    headerRow.className = "settings-period-header";

    const title = document.createElement("div");
    title.className = "settings-period-title";
    title.textContent = `Periode ${index + 1}`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "settings-period-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "Supprimer";

    headerRow.append(title, removeBtn);

    const grid = document.createElement("div");
    grid.className = "settings-period-grid";

    const labelStart = document.createElement("label");
    labelStart.textContent = "Debut";
    const inputStart = document.createElement("input");
    inputStart.type = "date";

    const labelEnd = document.createElement("label");
    labelEnd.textContent = "Fin";
    const inputEnd = document.createElement("input");
    inputEnd.type = "date";

    if (period.start) inputStart.value = frToISO(period.start);
    if (period.end) inputEnd.value = frToISO(period.end);

    grid.append(labelStart, inputStart, labelEnd, inputEnd);
    wrapper.append(headerRow, grid);

    removeBtn.addEventListener("click", () => {
      wrapper.remove();
      refreshPeriodTitles();
    });

    return wrapper;
  }

  function refreshPeriodTitles() {
    const rows = periodsContainer.querySelectorAll(".settings-period");
    rows.forEach((row, idx) => {
      const title = row.querySelector(".settings-period-title");
      if (title) title.textContent = `Periode ${idx + 1}`;
    });
  }

  const entry = await getConfig("conges");
  const value = entry.value;
  let periods = [];

  if (Array.isArray(value.periods)) {
    periods = value.periods;
  } else if (value.start || value.end) {
    periods = [{ start: value.start, end: value.end }];
  }

  if (periods.length === 0) {
    periodsContainer.appendChild(createPeriodRow({}, 0));
  } else {
    periods.forEach((period, idx) => {
      periodsContainer.appendChild(createPeriodRow(period, idx));
    });
  }

  addBtn.addEventListener("click", () => {
    const row = createPeriodRow({}, periodsContainer.children.length);
    periodsContainer.appendChild(row);
    refreshPeriodTitles();
  });

  saveBtn.addEventListener("click", async () => {
    const rows = periodsContainer.querySelectorAll(".settings-period");
    const nextPeriods = [];
    let invalid = false;

    rows.forEach((row) => {
      const inputs = row.querySelectorAll("input[type='date']");
      const startISO = inputs[0].value || "";
      const endISO = inputs[1].value || "";

      if (!startISO && !endISO) return;
      if (!startISO || !endISO) {
        invalid = true;
        return;
      }

      let start = startISO;
      let end = endISO;
      if (start > end) {
        const tmp = start;
        start = end;
        end = tmp;
      }

      nextPeriods.push({
        start: isoToFR(start),
        end: isoToFR(end),
      });
    });

    if (invalid) {
      status.show("Dates invalides");
      return;
    }

    await setConfig("conges", { periods: nextPeriods });
    window.__homeCongesConfig = { periods: nextPeriods };
    status.show("Congés enregistrés");
  });

  resetBtn.addEventListener("click", async () => {
    await setConfig("conges", { periods: [] });
    periodsContainer.innerHTML = "";
    periodsContainer.appendChild(createPeriodRow({}, 0));
    window.__homeCongesConfig = null;
    status.show("Congés supprimés");
  });
}

