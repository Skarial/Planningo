/**
 * Indique si une saison est réellement configurée
 * (présence de dates valides)
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
 * Retourne la période ACTIVE globale de l’application.
 *
 * RÈGLE MÉTIER (verrouillée) :
 * - saison NON configurée → "Période principale"
 * - saison configurée     → "Période saisonnière"
 *
 * ⚠️ AUCUNE logique par jour
 * ⚠️ AUCUN null
 * ⚠️ UNE seule période active à la fois
 */
export function getActivePeriodeLibelle(saisonConfig) {
  const seasonConfigured = isSeasonConfigured(saisonConfig);

  return seasonConfigured ? "Période saisonnière" : "Période principale";
}
