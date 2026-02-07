/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { buildAlarmPlan } from "../../js/domain/alarm-plan.js";
import { test, assert } from "../run-tests.js";

test("alarm-plan genere une alarme pour un service impair", () => {
  const services = [
    {
      code: "21",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "09:12", fin: "12:00" }],
        },
      ],
    },
  ];

  const entries = [{ date: "2026-02-10", serviceCode: "21" }];

  const plan = buildAlarmPlan({
    entries,
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 1, "Alarme attendue");
  assert(plan.alarms[0].serviceStart === "09:12", "Heure service incorrecte");
  assert(
    plan.alarms[0].alarmAt.includes("T07:42"),
    "Heure alarme incorrecte",
  );
});

test("alarm-plan ignore les services pairs", () => {
  const services = [
    {
      code: "22",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "08:00", fin: "13:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "22" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 0, "Aucune alarme attendue");
});

test("alarm-plan prend la premiere plage du service", () => {
  const services = [
    {
      code: "23",
      periodes: [
        {
          libelle: "P",
          plages: [
            { debut: "13:00", fin: "15:00" },
            { debut: "05:30", fin: "08:00" },
          ],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "23" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 1, "Alarme attendue");
  assert(plan.alarms[0].serviceStart === "05:30", "Plage choisie incorrecte");
});

test("alarm-plan ignore une alarme deja passee", () => {
  const services = [
    {
      code: "25",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "08:30", fin: "12:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "25" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-10T08:00:00"),
  });

  assert(plan.alarms.length === 0, "Alarme passee ignoree");
});
