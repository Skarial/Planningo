// backend/adapters/planning.mapper.js

// Pour l'instant, l'adapter mock renvoie déjà le bon format.
// Ce fichier sert de point d'entrée quand on branchera l'entreprise.
export function mapEntreprisePlanningToApi(raw) {
  // TODO: transformer "raw entreprise" -> { date, serviceCode }
  return raw;
}
