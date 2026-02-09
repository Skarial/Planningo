/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  computeDailyRestWarning,
  formatRestMinutes,
} from "../../js/domain/daily-rest-warning.js";

function makeServicesByCode(services) {
  return new Map(
    services.map((service) => [String(service.code).toUpperCase(), service]),
  );
}

test("daily-rest-warning warns when rest is below 11h", () => {
  const servicesByCode = makeServicesByCode([
    {
      code: "2200",
      periodes: [
        { libelle: "Période principale", plages: [{ debut: "13:00", fin: "20:00" }] },
      ],
    },
    {
      code: "2201",
      periodes: [
        { libelle: "Période principale", plages: [{ debut: "05:45", fin: "13:00" }] },
      ],
    },
  ]);

  const result = computeDailyRestWarning({
    previousDateISO: "2026-03-10",
    previousEntry: { serviceCode: "2200" },
    currentDateISO: "2026-03-11",
    currentServiceCode: "2201",
    servicesByCode,
    saisonConfig: null,
  });

  assert(result.shouldWarn === true, "rest < 11h should warn");
  assert(result.restMinutes === 585, "expected 9h45 of rest");
  assert(result.previousEndTime === "20:00", "previous end time should be resolved");
  assert(result.currentStartTime === "05:45", "current start time should be resolved");
  assert(formatRestMinutes(result.restMinutes) === "09:45", "formatted rest should be HH:MM");
});

test("daily-rest-warning does not warn when rest is at least 11h", () => {
  const servicesByCode = makeServicesByCode([
    {
      code: "2300",
      periodes: [
        { libelle: "Période principale", plages: [{ debut: "10:00", fin: "18:00" }] },
      ],
    },
    {
      code: "2301",
      periodes: [
        { libelle: "Période principale", plages: [{ debut: "06:00", fin: "14:00" }] },
      ],
    },
  ]);

  const result = computeDailyRestWarning({
    previousDateISO: "2026-03-10",
    previousEntry: { serviceCode: "2300" },
    currentDateISO: "2026-03-11",
    currentServiceCode: "2301",
    servicesByCode,
    saisonConfig: null,
  });

  assert(result.shouldWarn === false, "rest >= 11h should not warn");
  assert(result.restMinutes === 720, "expected 12h of rest");
});

test("daily-rest-warning stays silent when bounds are missing", () => {
  const result = computeDailyRestWarning({
    previousDateISO: "2026-03-10",
    previousEntry: { serviceCode: "9999" },
    currentDateISO: "2026-03-11",
    currentServiceCode: "8888",
    servicesByCode: new Map(),
    saisonConfig: null,
  });

  assert(result.shouldWarn === false, "missing service bounds should not warn");
  assert(result.reason === "MISSING_TIME_BOUNDS", "reason should indicate missing bounds");
});
