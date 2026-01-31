/**
 * API métier officielle pour les suggestions de services
 * Implémentation V1 — base déterministe
 */

export function getServiceSuggestions({
  servicesCatalog,
  saisonConfig, // inutilisé pour l’instant
  date, // inutilisé pour l’instant
  mode, // inutilisé pour l’instant
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

    // TADxxx
    if (code.startsWith("TAD")) {
      result.TAD.push(code);
      return;
    }

    // TDxxx → ligne xxx
    if (code.startsWith("TD")) {
      const line = code.slice(2); // ex: TD12 → "12"
      if (!result.LIGNES[line]) {
        result.LIGNES[line] = [];
      }
      result.LIGNES[line].push(code);
    }
  });

  // tri stable
  result.TAD.sort();
  Object.keys(result.LIGNES).forEach((line) => {
    result.LIGNES[line].sort();
  });

  return result;
}
