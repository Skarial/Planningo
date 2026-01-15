// home.js : affiche Aujourd’hui et Demain (lecture seule, aucun état modifié)

import { getPlanningEntry, getAllServices } from "../data/storage.js";
import { toISODateLocal } from "../utils.js";
import { getPeriodeForDate } from "../utils/periods.js";

export async function renderHome() {
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  // Chargement des services une seule fois
  const allServices = await getAllServices();
  if (!Array.isArray(allServices)) {
    console.error("allServices invalide", allServices);
    return;
  }

  const baseDate = new Date();

  for (const [label, offset] of [
    ["Aujourd'hui", 0],
    ["Demain", 1],
  ]) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + offset);

    const iso = toISODateLocal(d);
    const entry = await getPlanningEntry(iso);

    const serviceCode = entry?.serviceCode || "REPOS";
    const isExtra = entry?.extra === true;

    const horaireHTML = await buildHorairesHome(serviceCode, iso, allServices);

    const dayCard = document.createElement("div");
    dayCard.className = "card";

    dayCard.innerHTML = `
      <div class="card-title">${label}</div>
      <div class="card-service ${
        serviceCode === "REPOS" ? "repos" : ""
      }">${serviceCode}</div>
      ${horaireHTML}
      ${
        serviceCode !== "REPOS" && isExtra
          ? `<div class="extra-label">Heure supplémentaire</div>`
          : ""
      }
    `;

    container.appendChild(dayCard);
  }
}

// =======================
// HORAIRES (ISOLÉ)
// =======================

async function buildHorairesHome(serviceCode, iso, allServices) {
  if (serviceCode === "REPOS") return "";

  const service = allServices.find((s) => s.code === serviceCode);
  if (!service || !Array.isArray(service.periodes)) return "";

  const periodeActive = await getPeriodeForDate(iso);

  let periode;
  if (service.periodes.length === 1) {
    periode = service.periodes[0];
  } else {
    periode =
      periodeActive === "Période saisonnière"
        ? service.periodes[1]
        : service.periodes[0];
  }

  if (!periode?.plages?.length) return "";

  return `
    <div class="card-time">
      ${periode.plages.map((p) => `${p.debut} - ${p.fin}`).join(" | ")}
    </div>
  `;
}
