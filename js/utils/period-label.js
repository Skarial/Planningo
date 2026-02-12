import { PERIOD_STATE } from "../domain/periods.js";

/**
 * Construit le libell UI de la priode active
 *  UI uniquement  ne pas utiliser dans le domain
 */
export function getPeriodLabel(periodState) {
  return periodState === PERIOD_STATE.SEASONAL ? "Période saisonnière" : "Période principale";
}
