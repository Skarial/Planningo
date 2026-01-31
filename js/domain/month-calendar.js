import { DAY_STATUS, getDayStatus } from "./day-status.js";
function toISODateLocalSafe(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Construit le modèle métier d’un mois calendaire
 *
 * @param {Object} params
 * @param {number} params.year
 * @param {number} params.monthIndex // 0-11
 * @param {Function} params.getServiceForDateISO
 * @param {Function} params.isDateInConges
 * @param {string} params.activeDateISO
 *
 * @returns {Object}
 */
export function buildMonthCalendar({
  year,
  monthIndex,
  getServiceForDateISO,
  isDateInConges,
  activeDateISO,
}) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  // Jours avant le mois (vides)
  const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      inMonth: false,
    });
  }

  // Jours du mois
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    date.setHours(0, 0, 0, 0);

    const iso = toISODateLocalSafe(date);

    const service = getServiceForDateISO(iso);
    const isConges = isDateInConges(date);

    let status;

    if (isConges) {
      status = DAY_STATUS.REST;
    } else {
      status = getDayStatus({
        service,
        date,
        today,
      });
    }

    days.push({
      inMonth: true,
      iso,
      day: d,
      status,
      isActive: iso === activeDateISO,
    });
  }

  return {
    year,
    monthIndex,
    days,
  };
}
