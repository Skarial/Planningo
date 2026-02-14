import { fetchPlanningByMonth } from "../adapters/planning-source.selector.js";
import { savePlanningEntry as saveEntry } from "../adapters/planning-source.selector.js";
import { mapEntreprisePlanningToApi } from "../adapters/planning.mapper.js";

export async function getPlanningByMonth(month) {
  const planning = await fetchPlanningByMonth(month);

  // contrat de réponse stable (normalisé)
  return {
    month,
    entries: mapEntreprisePlanningToApi(planning),
  };
}

export async function setPlanningEntry(entry) {
  // ici plus tard règles métier (droits, cohérence, etc.)
  return saveEntry(entry);
}
