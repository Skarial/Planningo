import { test, assert } from "../run-tests.js";
import { initMonthFromDateISO } from "../../js/state/month-navigation.js";
import { getMonthCalendar } from "../../js/state/month-calendar-state.js";
import { setActiveDateISO } from "../../js/state/active-date.js";
import { DAY_STATUS } from "../../js/domain/day-status.js";

function fakeGetServiceForDateISO() {
  return null;
}

function fakeIsDateInConges() {
  return false;
}

test("month-calendar-state - calendrier null sans init", () => {
  const cal = getMonthCalendar({
    getServiceForDateISO: fakeGetServiceForDateISO,
    isDateInConges: fakeIsDateInConges,
  });

  assert(cal === null, "calendrier doit être null sans initialisation");
});

test("month-calendar-state - calendrier construit après init", () => {
  setActiveDateISO("2026-03-15");
  initMonthFromDateISO("2026-03-15");

  const cal = getMonthCalendar({
    getServiceForDateISO: fakeGetServiceForDateISO,
    isDateInConges: fakeIsDateInConges,
  });

  assert(cal !== null, "calendrier attendu");
  assert(cal.monthIndex === 2, "mois incorrect");
});

test("month-calendar-state - jour actif propagé", () => {
  setActiveDateISO("2026-03-10");
  initMonthFromDateISO("2026-03-10");

  const cal = getMonthCalendar({
    getServiceForDateISO: fakeGetServiceForDateISO,
    isDateInConges: fakeIsDateInConges,
  });

  const active = cal.days.find((d) => d.isActive === true);
  assert(active, "jour actif attendu");
  assert(active.iso === "2026-03-10", "jour actif incorrect");
});
