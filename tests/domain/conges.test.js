import { test, assert } from "../run-tests.js";
import {
  parseFRDate,
  getCongesPeriod,
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
// getCongesPeriod
// =======================

test("getCongesPeriod retourne null si config absente", () => {
  const p = getCongesPeriod(null);
  assert(p === null, "Période devrait être null");
});

test("getCongesPeriod normalise l’ordre des dates", () => {
  const p = getCongesPeriod({
    start: "20/08/2025",
    end: "10/08/2025",
  });
  assert(p.start < p.end, "Dates non normalisées");
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
