/**
 * États métier possibles pour la période globale
 */
export const PERIOD_STATE = {
  DEFAULT: "default",
  SEASONAL: "seasonal",
};

/**
 * Indique si une saison est réellement configurée
 */
export function isSeasonConfigured(saisonConfig) {
  const s = saisonConfig;

  return Boolean(
    s &&
    typeof s.saisonDebut === "string" &&
    typeof s.saisonFin === "string" &&
    s.saisonDebut !== "" &&
    s.saisonFin !== "",
  );
}

/**
 * Retourne l’état métier de la période globale
 *
 * RÈGLE MÉTIER (inchangée) :
 * - saison NON configurée → DEFAULT
 * - saison configurée     → SEASONAL
 */
export function getPeriodState(saisonConfig) {
  return isSeasonConfigured(saisonConfig)
    ? PERIOD_STATE.SEASONAL
    : PERIOD_STATE.DEFAULT;
}
