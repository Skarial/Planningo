import { getConfig } from "../data/storage.js";

/**
 * Indique si une saison est réellement configurée
 * (présence de dates valides)
 */
export async function isSeasonConfigured() {
  const entry = await getConfig("saison");
  const s = entry?.value;

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
export async function getActivePeriodeLibelle() {
  const seasonConfigured = await isSeasonConfigured();

  return seasonConfigured ? "Période saisonnière" : "Période principale";
}
