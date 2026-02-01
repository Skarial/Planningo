/**
 * API metier officielle pour les suggestions de services
 * Implementation V1 - base deterministe
 */

import { isDateInSeason } from "./periods.js";

const SEASON_LABEL = "Période saisonnière";
const MAIN_LABEL = "Période principale";

export function getServiceSuggestions({
  servicesCatalog,
  saisonConfig,
  date,
  prefs,
  mode, // inutilise pour l'instant
}) {
  const result = {
    REPOS: ["REPOS"],
    DM: [],
    DAM: [],
    ANNEXE: [],
    TAD: [],
    LIGNES: {},
  };

  if (!Array.isArray(servicesCatalog)) {
    return result;
  }

  const inSeason = date ? isDateInSeason(saisonConfig, date) : false;

  const allow = {
    tad: prefs?.tad !== false,
    dm: prefs?.dm !== false,
    dam: prefs?.dam !== false,
    annexe: prefs?.annexe !== false,
    lignes: prefs?.lignes !== false,
  };

  if (allow.annexe) {
    result.ANNEXE.push("ANNEXE");
  }

  servicesCatalog.forEach((service) => {
    if (!service || typeof service.code !== "string") return;

    const code = service.code.trim();
    const upperCode = code.toUpperCase();

    if (upperCode === "REPOS") {
      return;
    }

    if (inSeason && !["DM", "DAM", "ANNEXE"].includes(upperCode) && !upperCode.startsWith("TAD")) {
      const periodes = Array.isArray(service.periodes) ? service.periodes : [];
      const hasSeason = periodes.some((p) => p && p.libelle === SEASON_LABEL);
      const hasMain = periodes.some((p) => p && p.libelle === MAIN_LABEL);
      // En saison : ne garder que les services saisonniers uniquement
      if (!hasSeason || hasMain) return;
    }

    if (upperCode === "DM") {
      if (!allow.dm) return;
      result.DM.push(code);
      return;
    }

    if (upperCode === "DAM") {
      if (!allow.dam) return;
      result.DAM.push(code);
      return;
    }

    if (upperCode === "ANNEXE") {
      if (!allow.annexe) return;
      result.ANNEXE.push(code);
      return;
    }

    // TADxxx
    if (upperCode.startsWith("TAD")) {
      if (!allow.tad) return;
      result.TAD.push(code);
      return;
    }

    // TDxxx -> ligne xxx
    if (upperCode.startsWith("TD")) {
      if (!allow.lignes) return;
      const line = code.slice(2); // ex: TD12 -> "12"
      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }
      result.LIGNES[line].push(code);
      return;
    }

    // Services numeriques -> ligne = 2 premiers chiffres
    if (/^\d{3,}$/.test(code)) {
      if (!allow.lignes) return;
      const line = code.slice(0, 2);
      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }
      result.LIGNES[line].push(code);
    }
  });

  // tri stable
  result.DM.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  result.DAM.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  result.ANNEXE.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  result.ANNEXE.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  result.TAD.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  Object.keys(result.LIGNES).forEach((line) => {
    result.LIGNES[line].sort((a, b) =>
      a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
    );
  });

  return result;
}
