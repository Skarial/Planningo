/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { test, assert } from "../run-tests.js";
import {
  parseFRDate,
  getCongesPeriods,
  isDateInConges,
  getGuidedStartDay,
} from "../../js/domain/conges.js";

// =======================
// parseFRDate
// =======================

test("parseFRDate valide une date FR correcte", () => {
  const d = parseFRDate("15/08/2025");
  assert(d instanceof Date, "Date non parsÃ©e");
  assert(d.getFullYear() === 2025, "AnnÃ©e incorrecte");
});

test("parseFRDate rejette une date invalide", () => {
  const d = parseFRDate("32/01/2025");
  assert(d === null, "Date invalide acceptÃ©e");
});

// =======================
// getCongesPeriods
// =======================

test("getCongesPeriods retourne [] si config absente", () => {
  const p = getCongesPeriods(null);
  assert(Array.isArray(p) && p.length === 0, "PÃ©riodes attendues vides");
});

test("getCongesPeriods normalise lâ€™ordre des dates", () => {
  const p = getCongesPeriods({
    start: "20/08/2025",
    end: "10/08/2025",
  });
  assert(p.length === 1, "Une pÃ©riode attendue");
  assert(p[0].start < p[0].end, "Dates non normalisÃ©es");
});

test("getCongesPeriods gÃ¨re plusieurs pÃ©riodes", () => {
  const p = getCongesPeriods({
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  });
  assert(p.length === 2, "Deux pÃ©riodes attendues");
});

// =======================
// isDateInConges
// =======================

test("isDateInConges retourne true si date incluse", () => {
  const config = { start: "10/08/2025", end: "20/08/2025" };
  const d = new Date(2025, 7, 15); // 15 aoÃ»t
  assert(isDateInConges(d, config) === true, "Date devrait Ãªtre en congÃ©s");
});

test("isDateInConges retourne false si date hors pÃ©riode", () => {
  const config = { start: "10/08/2025", end: "20/08/2025" };
  const d = new Date(2025, 7, 25);
  assert(isDateInConges(d, config) === false, "Date hors congÃ©s");
});

test("isDateInConges gÃ¨re plusieurs pÃ©riodes", () => {
  const config = {
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  };
  const d = new Date(2025, 7, 11);
  assert(isDateInConges(d, config) === true, "Date devrait Ãªtre en congÃ©s");
});

// =======================
// getGuidedStartDay
// =======================

test("getGuidedStartDay retourne 1 sans congÃ©s", () => {
  const day = getGuidedStartDay(2025, 7, null);
  assert(day === 1, "Jour de dÃ©part incorrect");
});

test("getGuidedStartDay saute congÃ©s en dÃ©but de mois", () => {
  const config = { start: "01/08/2025", end: "05/08/2025" };
  const day = getGuidedStartDay(2025, 7, config);
  assert(day === 6, "Jour guidÃ© incorrect");
});

test("getGuidedStartDay utilise la pÃ©riode couvrant le 1er", () => {
  const config = {
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  };
  const day = getGuidedStartDay(2025, 7, config);
  assert(day === 4, "Jour guidÃ© incorrect");
});

