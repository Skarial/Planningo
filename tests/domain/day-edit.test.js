/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  buildSaveEntryPayload,
  formatFormationMinutes,
  formatMajorExtraMinutes,
  formatMissingMinutes,
  formatNonMajorExtraMinutes,
  getInitialFormationMinutes,
  getInitialMajorExtraMinutes,
  getInitialMissingMinutes,
  getInitialNonMajorExtraMinutes,
  getInitialPanierEnabled,
  getInitialServiceCode,
  normalizeFormationMinutes,
  normalizeMajorExtraMinutes,
  normalizeMissingMinutes,
  normalizeNonMajorExtraMinutes,
  normalizeServiceCode,
  parseFormationInputMinutes,
  parseMajorExtraInputMinutes,
  parseMissingInputMinutes,
  parseNonMajorExtraInputMinutes,
  resolvePanierEnabled,
  shouldMarkAlarmResync,
} from "../../js/domain/day-edit.js";

test("day-edit normalizeServiceCode trims and uppercases", () => {
  assert(normalizeServiceCode(" dm ") === "DM", "DM should be normalized");
  assert(normalizeServiceCode(2910) === "2910", "numeric codes should be normalized");
  assert(normalizeServiceCode("") === "", "empty value should stay empty");
});

test("day-edit normalize/parse non-major extra minutes", () => {
  assert(normalizeNonMajorExtraMinutes(61.2) === 61, "minutes should be rounded");
  assert(normalizeNonMajorExtraMinutes(-3) === 0, "negative minutes should be rejected");
  assert(parseNonMajorExtraInputMinutes("90") === 90, "minutes input should be parsed");
  assert(parseNonMajorExtraInputMinutes("75,4") === 75, "comma decimal should be parsed");
  assert(parseNonMajorExtraInputMinutes("abc") === 0, "invalid value should return zero");
  assert(formatNonMajorExtraMinutes(90) === "01:30", "format should be HH:MM");
});

test("day-edit normalize/parse major extra minutes", () => {
  assert(normalizeMajorExtraMinutes(61.2) === 61, "minutes should be rounded");
  assert(normalizeMajorExtraMinutes(-3) === 0, "negative minutes should be rejected");
  assert(parseMajorExtraInputMinutes("60") === 60, "minutes input should be parsed");
  assert(parseMajorExtraInputMinutes("30,4") === 30, "comma decimal should be parsed");
  assert(parseMajorExtraInputMinutes("abc") === 0, "invalid value should return zero");
  assert(formatMajorExtraMinutes(75) === "01:15", "format should be HH:MM");
});

test("day-edit normalize/parse missing minutes", () => {
  assert(normalizeMissingMinutes(61.2) === 61, "minutes should be rounded");
  assert(normalizeMissingMinutes(-3) === 0, "negative minutes should be rejected");
  assert(parseMissingInputMinutes("45") === 45, "minutes input should be parsed");
  assert(parseMissingInputMinutes("22,8") === 23, "comma decimal should be parsed");
  assert(parseMissingInputMinutes("abc") === 0, "invalid value should return zero");
  assert(formatMissingMinutes(70) === "01:10", "format should be HH:MM");
});

test("day-edit normalize/parse formation minutes", () => {
  assert(normalizeFormationMinutes(61.2) === 61, "minutes should be rounded");
  assert(normalizeFormationMinutes(-3) === 0, "negative minutes should be rejected");
  assert(parseFormationInputMinutes("07:00") === 420, "HH:MM should be parsed");
  assert(parseFormationInputMinutes("7h30") === 450, "HhMM should be parsed");
  assert(parseFormationInputMinutes("420") === 420, "minutes input should be parsed");
  assert(parseFormationInputMinutes("75,4") === 75, "comma decimal should be parsed");
  assert(parseFormationInputMinutes("07:70") === 0, "invalid HH:MM should return zero");
  assert(parseFormationInputMinutes("abc") === 0, "invalid value should return zero");
  assert(formatFormationMinutes(420) === "07:00", "format should be HH:MM");
});

test("day-edit buildSaveEntryPayload keeps exact extra rule for REPOS", () => {
  const payload = buildSaveEntryPayload({
    dateISO: "2026-03-12",
    rawCode: "repos",
    previousEntry: { serviceCode: "2911", extra: true },
    panierEnabled: true,
    rawFormationMinutes: "120",
    rawMajorExtraMinutes: "1",
    rawNonMajorExtraMinutes: "2",
    rawMissingMinutes: "3",
  });

  assert(payload.date === "2026-03-12", "date should be kept");
  assert(payload.serviceCode === "REPOS", "serviceCode should be normalized");
  assert(payload.locked === false, "locked should remain false");
  assert(payload.extra === false, "REPOS must force extra false");
  assert(payload.panierOverride === null, "REPOS should not keep panier override");
  assert(payload.majorExtraMinutes === 0, "REPOS should force major extra to zero");
  assert(payload.nonMajorExtraMinutes === 0, "REPOS should force non-major extra to zero");
  assert(payload.missingMinutes === 0, "REPOS should force missing minutes to zero");
  assert(payload.formationMinutes === 0, "REPOS should force formation minutes to zero");
});

test("day-edit buildSaveEntryPayload keeps exact extra rule for worked day", () => {
  const fromRepos = buildSaveEntryPayload({
    dateISO: "2026-03-13",
    rawCode: "2910",
    previousEntry: { serviceCode: "REPOS", extra: false },
    panierEnabled: true,
    rawFormationMinutes: "360",
    rawMajorExtraMinutes: "60",
    rawNonMajorExtraMinutes: "90",
    rawMissingMinutes: "30",
  });
  assert(fromRepos.extra === true, "wasRepos should make extra true");
  assert(fromRepos.panierOverride === true, "non-default panier should persist as override");
  assert(fromRepos.majorExtraMinutes === 60, "major extra should be converted in minutes");
  assert(fromRepos.nonMajorExtraMinutes === 90, "non-major extra should be converted in minutes");
  assert(fromRepos.missingMinutes === 30, "missing minutes should be converted in minutes");
  assert(fromRepos.formationMinutes === 0, "non-formation should keep formation minutes at zero");

  const fromExtra = buildSaveEntryPayload({
    dateISO: "2026-03-13",
    rawCode: "2623",
    previousEntry: { serviceCode: "2912", extra: true },
    panierEnabled: true,
    rawFormationMinutes: "",
    rawMajorExtraMinutes: "",
    rawNonMajorExtraMinutes: "",
    rawMissingMinutes: "",
  });
  assert(fromExtra.extra === true, "wasExtra true should remain true");
  assert(fromExtra.panierOverride === null, "default panier should not store override");
  assert(fromExtra.majorExtraMinutes === 0, "empty value should store zero minutes");
  assert(fromExtra.nonMajorExtraMinutes === 0, "empty value should store zero minutes");
  assert(fromExtra.missingMinutes === 0, "empty value should store zero minutes");
  assert(fromExtra.formationMinutes === 0, "empty value should store zero minutes");

  const formation = buildSaveEntryPayload({
    dateISO: "2026-03-13",
    rawCode: "FORMATION",
    previousEntry: { serviceCode: "2912", extra: false },
    panierEnabled: false,
    rawFormationMinutes: "330",
    rawMajorExtraMinutes: "",
    rawNonMajorExtraMinutes: "",
    rawMissingMinutes: "",
  });
  assert(formation.formationMinutes === 330, "formation minutes should be saved");
});

test("day-edit buildSaveEntryPayload clears service and extra on empty code", () => {
  const payload = buildSaveEntryPayload({
    dateISO: "2026-03-14",
    rawCode: "   ",
    previousEntry: { serviceCode: "REPOS", extra: true },
    panierEnabled: true,
    rawFormationMinutes: "120",
    rawMajorExtraMinutes: "2",
    rawNonMajorExtraMinutes: "3",
    rawMissingMinutes: "4",
  });

  assert(payload.serviceCode === "", "empty input should clear serviceCode");
  assert(payload.extra === false, "empty input should force extra false");
  assert(payload.panierOverride === null, "empty input should clear panier override");
  assert(payload.majorExtraMinutes === 0, "empty input should force major extra to zero");
  assert(payload.nonMajorExtraMinutes === 0, "empty input should force non-major extra to zero");
  assert(payload.missingMinutes === 0, "empty input should force missing minutes to zero");
  assert(payload.formationMinutes === 0, "empty input should force formation minutes to zero");
});

test("day-edit buildSaveEntryPayload enforces conges constraints", () => {
  const payload = buildSaveEntryPayload({
    dateISO: "2026-03-15",
    rawCode: "2911",
    previousEntry: { serviceCode: "2910", extra: true },
    panierEnabled: true,
    rawFormationMinutes: "420",
    rawMajorExtraMinutes: "60",
    rawNonMajorExtraMinutes: "90",
    rawMissingMinutes: "30",
    isCongesDay: true,
  });

  assert(payload.serviceCode === "2911", "service code should still be saved");
  assert(payload.extra === false, "conges day should force extra to false");
  assert(payload.panierOverride === null, "conges day should clear panier override");
  assert(payload.majorExtraMinutes === 0, "conges day should force major extra to zero");
  assert(payload.nonMajorExtraMinutes === 0, "conges day should force non-major extra to zero");
  assert(payload.missingMinutes === 0, "conges day should force missing minutes to zero");
  assert(payload.formationMinutes === 0, "conges day should force formation minutes to zero");
});

test("day-edit shouldMarkAlarmResync matches morning service behavior", () => {
  assert(shouldMarkAlarmResync("DM") === true, "DM should be morning");
  assert(shouldMarkAlarmResync("2911") === true, "odd numeric service should be morning");
  assert(shouldMarkAlarmResync("DAM") === false, "DAM should not be morning");
  assert(shouldMarkAlarmResync("2910") === false, "even numeric service should not be morning");
});

test("day-edit getInitialServiceCode returns current service", () => {
  assert(
    getInitialServiceCode({ serviceCode: "2910" }) === "2910",
    "existing service should be returned",
  );
  assert(getInitialServiceCode(null) === "", "null entry should return empty string");
});

test("day-edit resolvePanierEnabled applies override over default", () => {
  assert(resolvePanierEnabled("2623") === true, "2623 has default panier");
  assert(resolvePanierEnabled("2910") === false, "2910 has no default panier");
  assert(
    resolvePanierEnabled("2623", false) === false,
    "override false must disable panier",
  );
  assert(
    resolvePanierEnabled("2910", true) === true,
    "override true must enable panier",
  );
});

test("day-edit getInitialPanierEnabled reads entry override", () => {
  assert(
    getInitialPanierEnabled({ serviceCode: "2623", panierOverride: null }) === true,
    "default panier should be true for 2623",
  );
  assert(
    getInitialPanierEnabled({ serviceCode: "2623", panierOverride: false }) === false,
    "override false should be applied",
  );
  assert(
    getInitialPanierEnabled({ serviceCode: "2910", panierOverride: true }) === true,
    "override true should be applied",
  );
});

test("day-edit getInitialNonMajorExtraMinutes reads stored minutes", () => {
  assert(
    getInitialNonMajorExtraMinutes({ nonMajorExtraMinutes: 90 }) === "90",
    "90 minutes should map to \"90\"",
  );
  assert(
    getInitialNonMajorExtraMinutes({ nonMajorExtraMinutes: 60 }) === "60",
    "60 minutes should map to \"60\"",
  );
  assert(
    getInitialNonMajorExtraMinutes({ nonMajorExtraMinutes: 0 }) === "",
    "zero should map to empty",
  );
});

test("day-edit getInitialMajorExtraMinutes reads stored minutes", () => {
  assert(
    getInitialMajorExtraMinutes({ majorExtraMinutes: 90 }) === "90",
    "90 minutes should map to \"90\"",
  );
  assert(
    getInitialMajorExtraMinutes({ majorExtraMinutes: 60 }) === "60",
    "60 minutes should map to \"60\"",
  );
  assert(
    getInitialMajorExtraMinutes({ majorExtraMinutes: 0 }) === "",
    "zero should map to empty",
  );
});

test("day-edit getInitialMissingMinutes reads stored minutes", () => {
  assert(
    getInitialMissingMinutes({ missingMinutes: 90 }) === "90",
    "90 minutes should map to \"90\"",
  );
  assert(
    getInitialMissingMinutes({ missingMinutes: 60 }) === "60",
    "60 minutes should map to \"60\"",
  );
  assert(
    getInitialMissingMinutes({ missingMinutes: 0 }) === "",
    "zero should map to empty",
  );
});

test("day-edit getInitialFormationMinutes reads stored minutes", () => {
  assert(
    getInitialFormationMinutes({ formationMinutes: 420 }) === "07:00",
    "420 minutes should map to \"07:00\"",
  );
  assert(
    getInitialFormationMinutes({ formationMinutes: 0 }) === "",
    "zero should map to empty",
  );
});
