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
      code: "2001",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "09:12", fin: "12:00" }],
        },
      ],
    },
  ];

  const entries = [{ date: "2026-02-10", serviceCode: "2001" }];

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
      code: "2002",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "08:00", fin: "13:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "2002" }],
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
      code: "2101",
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
    entries: [{ date: "2026-02-10", serviceCode: "2101" }],
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
      code: "2111",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "08:30", fin: "12:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "2111" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-10T08:00:00"),
  });

  assert(plan.alarms.length === 0, "Alarme passee ignoree");
});

test("alarm-plan traite DM comme service du matin", () => {
  const services = [
    {
      code: "DM",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "05:45", fin: "13:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "DM" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 1, "DM doit produire une alarme");
  assert(plan.alarms[0].serviceCode === "DM", "Code service DM attendu");
});

test("alarm-plan force DM matin meme avec une heure saisie incoherente", () => {
  const services = [
    {
      code: "DM",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "05:45", fin: "13:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "DM", startTime: "12:00" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 1, "DM doit produire une alarme");
  assert(plan.alarms[0].serviceStart === "05:45", "DM doit rester a 05:45");
  assert(
    plan.alarms[0].alarmAt.includes("T04:15"),
    "Alarme DM attendue a 04:15 avec offset 90",
  );
});

test("alarm-plan ignore DAM (apres-midi)", () => {
  const services = [
    {
      code: "DAM",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "12:30", fin: "20:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "DAM" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 0, "DAM ne doit pas produire d'alarme");
});

test("alarm-plan traite TAD 1/3/5 comme services du matin", () => {
  const services = [
    {
      code: "TAD 1",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "06:45", fin: "13:15" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "TD1" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 1, "TAD 1 doit produire une alarme");
  assert(plan.alarms[0].serviceStart === "06:45", "Heure TAD 1 attendue");
  assert(
    plan.alarms[0].alarmAt.includes("T05:15"),
    "Alarme TAD 1 attendue a 05:15 avec offset 90",
  );
});

test("alarm-plan ignore TAD 2/4/6 (apres-midi)", () => {
  const services = [
    {
      code: "TAD 2",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "13:00", fin: "20:15" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "TAD2" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 0, "TAD 2 ne doit pas produire d'alarme");
});

test("alarm-plan ignore un numero de ligne (2 chiffres)", () => {
  const services = [
    {
      code: "21",
      periodes: [
        {
          libelle: "P",
          plages: [{ debut: "06:00", fin: "12:00" }],
        },
      ],
    },
  ];

  const plan = buildAlarmPlan({
    entries: [{ date: "2026-02-10", serviceCode: "21" }],
    services,
    periodLabelForDate: () => "P",
    rules: { offsetMinutes: 90 },
    now: new Date("2026-02-01T00:00:00"),
  });

  assert(plan.alarms.length === 0, "Une ligne ne doit pas etre traitee comme service");
});
