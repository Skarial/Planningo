// day.js : affiche le jour consulté + le lendemain (lecture seule)

import { getAllServices, getPlanningEntry } from "../data/storage.js";
import { getActivePeriodeLibelle } from "../utils/periods.js";
import { toISODateLocal, formatDateFR, getDayNameFullFR } from "../utils.js";

// =======================
// RENDER VUE JOUR
// =======================

export async function renderDay(dateISO) {
  if (!dateISO) {
    console.error("renderDay appelé sans dateISO");
    return;
  }

  const container = document.getElementById("view-day");
  if (!container) {
    console.error("Conteneur view-day introuvable");
    return;
  }

  container.innerHTML = "";

  // Chargement des services une seule fois
  const allServices = await getAllServices();
  if (!Array.isArray(allServices)) {
    console.error("allServices invalide", allServices);
    return;
  }

  // Période active globale (UNE fois)
  const activePeriode = await getActivePeriodeLibelle();

  // Dates : jour consulté + lendemain
  const base = new Date(dateISO);
  const next = new Date(base);
  next.setDate(base.getDate() + 1);

  for (const d of [base, next]) {
    const iso = toISODateLocal(d);
    const entry = await getPlanningEntry(iso);

    const serviceCode = entry?.serviceCode || "REPOS";
    const isExtra = entry?.extra === true;

    const card = document.createElement("div");
    card.className = "card";

    // 1) Nom du jour
    const dayNameEl = document.createElement("div");
    dayNameEl.className = "day-name-full";
    dayNameEl.textContent = getDayNameFullFR(d);

    // 2) Date
    const dateEl = document.createElement("div");
    dateEl.className = "day-date";
    dateEl.textContent = formatDateFR(iso);

    // 3) Service
    const serviceEl = document.createElement("div");
    serviceEl.className = "card-service";
    serviceEl.textContent = serviceCode;
    if (serviceCode === "REPOS") serviceEl.classList.add("repos");

    // 4) Horaires (logique canonique)
    const timeEl = buildHorairesDay(serviceCode, activePeriode, allServices);

    // Injection
    card.append(dayNameEl, dateEl, serviceEl);
    if (timeEl) card.appendChild(timeEl);

    // 5) Heures supplémentaires
    if (serviceCode !== "REPOS" && isExtra) {
      const extra = document.createElement("div");
      extra.className = "extra-label";
      extra.textContent = "Heure supplémentaire";
      card.appendChild(extra);
    }

    container.appendChild(card);
  }
}

// =======================
// HORAIRES (LOGIQUE CANONIQUE)
// =======================

function buildHorairesDay(serviceCode, activePeriode, allServices) {
  if (serviceCode === "REPOS") return null;

  const service = allServices.find((s) => s.code === serviceCode);
  if (!service || !Array.isArray(service.periodes)) return null;

  const periode = service.periodes.find((p) => p.libelle === activePeriode);

  if (!periode?.plages?.length) return null;

  const el = document.createElement("div");
  el.className = "card-time";
  el.textContent = periode.plages
    .map((p) => `${p.debut} - ${p.fin}`)
    .join(" | ");

  return el;
}
