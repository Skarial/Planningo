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
  assert(d instanceof Date, "Date non parsée");
  assert(d.getFullYear() === 2025, "Année incorrecte");
});

test("parseFRDate rejette une date invalide", () => {
  const d = parseFRDate("32/01/2025");
  assert(d === null, "Date invalide acceptée");
});

// =======================
// getCongesPeriods
// =======================

test("getCongesPeriods retourne [] si config absente", () => {
  const p = getCongesPeriods(null);
  assert(Array.isArray(p) && p.length === 0, "Périodes attendues vides");
});

test("getCongesPeriods normalise l’ordre des dates", () => {
  const p = getCongesPeriods({
    start: "20/08/2025",
    end: "10/08/2025",
  });
  assert(p.length === 1, "Une période attendue");
  assert(p[0].start < p[0].end, "Dates non normalisées");
});

test("getCongesPeriods gère plusieurs périodes", () => {
  const p = getCongesPeriods({
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  });
  assert(p.length === 2, "Deux périodes attendues");
});

// =======================
// isDateInConges
// =======================

test("isDateInConges retourne true si date incluse", () => {
  const config = { start: "10/08/2025", end: "20/08/2025" };
  const d = new Date(2025, 7, 15); // 15 août
  assert(isDateInConges(d, config) === true, "Date devrait être en congés");
});

test("isDateInConges retourne false si date hors période", () => {
  const config = { start: "10/08/2025", end: "20/08/2025" };
  const d = new Date(2025, 7, 25);
  assert(isDateInConges(d, config) === false, "Date hors congés");
});

test("isDateInConges gère plusieurs périodes", () => {
  const config = {
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  };
  const d = new Date(2025, 7, 11);
  assert(isDateInConges(d, config) === true, "Date devrait être en congés");
});

// =======================
// getGuidedStartDay
// =======================

test("getGuidedStartDay retourne 1 sans congés", () => {
  const day = getGuidedStartDay(2025, 7, null);
  assert(day === 1, "Jour de départ incorrect");
});

test("getGuidedStartDay saute congés en début de mois", () => {
  const config = { start: "01/08/2025", end: "05/08/2025" };
  const day = getGuidedStartDay(2025, 7, config);
  assert(day === 6, "Jour guidé incorrect");
});

test("getGuidedStartDay utilise la période couvrant le 1er", () => {
  const config = {
    periods: [
      { start: "01/08/2025", end: "03/08/2025" },
      { start: "10/08/2025", end: "12/08/2025" },
    ],
  };
  const day = getGuidedStartDay(2025, 7, config);
  assert(day === 4, "Jour guidé incorrect");
});

