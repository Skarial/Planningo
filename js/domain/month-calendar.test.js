import { test, assert } from "../run-tests.js";
import { buildMonthCalendar } from "../../js/domain/month-calendar.js";
import { DAY_STATUS } from "../../js/domain/day-status.js";

function fakeGetServiceForDateISO(map) {
  return (iso) => map[iso] ?? null;
}

function fakeIsDateInConges(datesISO) {
  return (date) => datesISO.includes(date.toISOString().slice(0, 10));
}

test("buildMonthCalendar - structure de base", () => {
  const result = buildMonthCalendar({
    year: 2026,
    monthIndex: 0, // janvier
    getServiceForDateISO: fakeGetServiceForDateISO({}),
    isDateInConges: fakeIsDateInConges([]),
    activeDateISO: "2026-01-15",
  });

  assert(result.year === 2026, "année incorrecte");
  assert(result.monthIndex === 0, "mois incorrect");
  assert(Array.isArray(result.days), "days doit être un tableau");
  assert(result.days.length >= 28, "jours insuffisants");
});

test("buildMonthCalendar - jour actif", () => {
  const result = buildMonthCalendar({
    year: 2026,
    monthIndex: 0,
    getServiceForDateISO: fakeGetServiceForDateISO({}),
    isDateInConges: fakeIsDateInConges([]),
    activeDateISO: "2026-01-10",
  });

  const activeDays = result.days.filter((d) => d.isActive === true);
  assert(activeDays.length === 1, "un seul jour actif attendu");
  assert(activeDays[0].iso === "2026-01-10", "jour actif incorrect");
});

test("buildMonthCalendar - jours hors mois", () => {
  const result = buildMonthCalendar({
    year: 2026,
    monthIndex: 1, // février 2026 commence un dimanche
    getServiceForDateISO: fakeGetServiceForDateISO({}),
    isDateInConges: fakeIsDateInConges([]),
    activeDateISO: null,
  });

  const outOfMonth = result.days.filter((d) => d.inMonth === false);
  assert(outOfMonth.length > 0, "jours hors mois attendus");
});

test("buildMonthCalendar - congés prioritaires", () => {
  const result = buildMonthCalendar({
    year: 2026,
    monthIndex: 0,
    getServiceForDateISO: fakeGetServiceForDateISO({
      "2026-01-05": { code: "123" },
    }),
    isDateInConges: fakeIsDateInConges(["2026-01-05"]),
    activeDateISO: null,
  });

  const day = result.days.find((d) => d.iso === "2026-01-05");
  assert(day.status === DAY_STATUS.REST, "congé doit primer");
});
