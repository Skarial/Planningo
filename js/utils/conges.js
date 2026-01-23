import { getConfig } from "../data/storage.js";

/**
 * Retourne la période de congés configurée ou null
 * Structure attendue :
 * { start: "yyyy-mm-dd", end: "yyyy-mm-dd" }
 */
export async function getConges() {
  const entry = await getConfig("conges");
  const c = entry?.value;

  if (
    !c ||
    typeof c.start !== "string" ||
    typeof c.end !== "string" ||
    c.start === "" ||
    c.end === ""
  ) {
    return null;
  }

  return {
    start: c.start,
    end: c.end,
  };
}

/**
 * Indique si une date ISO (yyyy-mm-dd) est dans les congés
 * Bornes INCLUSES
 */
export async function isDateInConges(isoDate) {
  const conges = await getConges();
  if (!conges) return false;

  return isoDate >= conges.start && isoDate <= conges.end;
}

/**
 * Retourne le prochain jour saisissable dans un mois donné,
 * en sautant les jours en congé.
 *
 * @param {number} year
 * @param {number} monthIndex (0-11)
 * @param {number} fromDay (1-31)
 * @returns {number|null}
 */
export async function getNextEditableDay({ year, monthIndex, fromDay }) {
  const conges = await getConges();

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let d = fromDay; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const iso = date.toISOString().slice(0, 10);

    if (!conges || iso < conges.start || iso > conges.end) {
      return d;
    }
  }

  return null;
}
