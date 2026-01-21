// =======================
// CONSTANTES
// =======================

export const SERVICE_TYPES = {
  REPOS: "REPOS",
  STANDARD: "STANDARD",
};

const SCORE_WEIGHTS = {
  EXACT_START: 100,
  CONTAINS: 50,
  NO_MATCH: 0,
};

const SUGGESTION_LIMIT = 8;

// Services toujours disponibles (pas de périodes)
const ALWAYS_AVAILABLE_CODES = ["REPOS", "DM", "DAM", "TAD"];

// =======================
// HELPERS INTERNES
// =======================

function normalize(str) {
  if (typeof str !== "string") return "";
  return str.trim().toUpperCase();
}

function serviceHasActivePeriode(service, activePeriode) {
  if (!Array.isArray(service.periodes)) return false;

  return service.periodes.some(
    (p) =>
      p.libelle === activePeriode &&
      Array.isArray(p.plages) &&
      p.plages.length > 0,
  );
}

function calculateScore(code, query) {
  const normalizedCode = normalize(code);

  if (normalizedCode.startsWith(query)) return SCORE_WEIGHTS.EXACT_START;
  if (normalizedCode.includes(query)) return SCORE_WEIGHTS.CONTAINS;

  return SCORE_WEIGHTS.NO_MATCH;
}

function sortByScore(scoredServices) {
  return scoredServices.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.service.code.localeCompare(b.service.code);
  });
}

// =======================
// API PUBLIQUE
// =======================

/**
 * Suggestions clavier pour le planning mensuel
 *
 * RÈGLES :
 * - filtrage texte d’abord
 * - REPOS / DM / DAM / TAD toujours autorisés
 * - autres services filtrés par période active
 */
export async function suggestServices({
  input,
  activePeriode,
  getAllServices,
  limit = SUGGESTION_LIMIT,
}) {
  const query = normalize(input);
  if (!query) return [];

  const services = await getAllServices();

  const eligible = services.filter((service) => {
    const code = service.code.toUpperCase();

    // 1️⃣ FILTRAGE PAR TEXTE (RÈGLE CLAVIER)
    // - lettres : startsWith UNIQUEMENT
    // - chiffres : startsWith OU includes
    const isNumericQuery = /^[0-9]+$/.test(query);

    if (isNumericQuery) {
      if (!code.startsWith(query) && !code.includes(query)) {
        return false;
      }
    } else {
      if (!code.startsWith(query)) {
        return false;
      }
    }

    // 2️⃣ SERVICES TOUJOURS DISPONIBLES
    if (ALWAYS_AVAILABLE_CODES.includes(code)) {
      return true;
    }

    // 3️⃣ SERVICES DÉPENDANTS DE LA PÉRIODE ACTIVE
    return serviceHasActivePeriode(service, activePeriode);
  });

  const scored = eligible
    .map((service) => ({
      service,
      score: calculateScore(service.code, query),
    }))
    .filter((item) => item.score > SCORE_WEIGHTS.NO_MATCH);

  return sortByScore(scored)
    .slice(0, limit)
    .map((item) => ({
      code: item.service.code,
      type: item.service.type,
    }));
}
