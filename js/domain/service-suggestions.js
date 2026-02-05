/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

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
  const safePrefs = prefs && typeof prefs === "object" ? prefs : {};
  const result = {
    REPOS: ["REPOS"],
    DM: [],
    DAM: [],
    FORMATION: [],
    TAD: [],
    LIGNES: {},
  };

  if (!Array.isArray(servicesCatalog)) {
    return result;
  }

  const inSeason = date ? isDateInSeason(saisonConfig, date) : false;

  const allow = {
    tad: safePrefs.tad !== false,
    dm: safePrefs.dm !== false,
    dam: safePrefs.dam !== false,
    formation: safePrefs.formation !== false,
    lignes: safePrefs.lignes !== false,
  };

  if (allow.formation) {
    result.FORMATION.push("FORMATION");
  }

  servicesCatalog.forEach((service) => {
    if (!service || typeof service.code !== "string") return;

    const code = service.code.trim();
    const upperCode = code.toUpperCase();

    if (upperCode === "REPOS") {
      return;
    }

    if (inSeason && !["DM", "DAM", "FORMATION"].includes(upperCode) && !upperCode.startsWith("TAD")) {
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

    if (upperCode === "FORMATION") {
      if (!allow.formation) return;
      result.FORMATION.push(code);
      return;
    }

    if (upperCode === "TEST-ALARM") {
      if (!allow.lignes) return;
      if (!result.LIGNES.TEST) {
        result.LIGNES.TEST = [];
      }
      result.LIGNES.TEST.push(code);
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
  result.FORMATION.sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" }),
  );
  result.FORMATION.sort((a, b) =>
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

