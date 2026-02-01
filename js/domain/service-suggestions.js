/**
 * API metier officielle pour les suggestions de services
 * Implementation V1 - base deterministe
 */

export function getServiceSuggestions({
  servicesCatalog,
  saisonConfig, // inutilise pour l'instant
  date, // inutilise pour l'instant
  mode, // inutilise pour l'instant
}) {
  const result = {
    REPOS: ["REPOS"],
    DM: ["DM"],
    DAM: ["DAM"],
    ANNEXE: ["ANNEXE"],
    TAD: [],
    LIGNES: {},
  };

  if (!Array.isArray(servicesCatalog)) {
    return result;
  }

  servicesCatalog.forEach((service) => {
    if (!service || typeof service.code !== "string") return;

    const code = service.code.trim();
    const upperCode = code.toUpperCase();

    // TADxxx
    if (upperCode.startsWith("TAD")) {
      result.TAD.push(code);
      return;
    }

    // TDxxx -> ligne xxx
    if (upperCode.startsWith("TD")) {
      const line = code.slice(2); // ex: TD12 -> "12"
      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }
      result.LIGNES[line].push(code);
      return;
    }

    // Services numeriques -> ligne = 2 premiers chiffres
    if (/^\d{3,}$/.test(code)) {
      const line = code.slice(0, 2);
      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }
      result.LIGNES[line].push(code);
    }
  });

  // tri stable
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
