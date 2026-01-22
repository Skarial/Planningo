import { getActivePeriodeLibelle } from "./periods.js";

// Services toujours disponibles (hors saison)
const ALWAYS_AVAILABLE_CODES = ["REPOS", "DM", "DAM", "TAD"];

/**
 * Groupe les services pour l’UI (guided-month)
 */
export async function groupServices(SERVICES_CATALOG) {
  const activePeriode = await getActivePeriodeLibelle();

  const result = {
    REPOS: [],
    DM: [],
    DAM: [],
    TAD: [],
    LIGNES: {},
  };

  SERVICES_CATALOG.forEach((service) => {
    const { code, periodes } = service;

    // =======================
    // SERVICES TOUJOURS DISPONIBLES
    // =======================

    if (ALWAYS_AVAILABLE_CODES.includes(code)) {
      if (code === "REPOS") result.REPOS.push(service);
      if (code === "DM") result.DM.push(service);
      if (code === "DAM") result.DAM.push(service);
      if (code === "TAD") result.TAD.push(service);
      return;
    }

    // =======================
    // SERVICES DÉPENDANTS DE LA SAISON
    // =======================

    if (!Array.isArray(periodes)) return;

    const hasActivePeriode = periodes.some((p) => p.libelle === activePeriode);

    if (!hasActivePeriode) return;

    // =======================
    // SERVICES NUMÉRIQUES (lignes)
    // =======================

    // Codes 3 ou 4 chiffres : 211, 213, 2201, etc.
    if (/^\d{3,4}$/.test(code)) {
      const line = code.slice(0, 2);

      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }

      result.LIGNES[line].push(service);
    }
  });

  return result;
}
