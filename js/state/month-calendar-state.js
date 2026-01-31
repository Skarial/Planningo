import { buildMonthCalendar } from "../domain/month-calendar.js";
import { getCurrentMonth } from "./month-navigation.js";
import { getActiveDateISO } from "./active-date.js";

export function getMonthCalendar(deps) {
  const { year, monthIndex } = getCurrentMonth();

  if (year === null || monthIndex === null) {
    return null;
  }

  return buildMonthCalendar({
    year,
    monthIndex,
    getServiceForDateISO: deps.getServiceForDateISO,
    isDateInConges: deps.isDateInConges,
    activeDateISO: getActiveDateISO(),
  });
}
