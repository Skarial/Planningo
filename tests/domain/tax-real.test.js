/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  computeTaxRealMetrics,
  getTaxRealYearDateRangeISO,
  normalizeTaxRealDistanceKmOneWay,
  normalizeTaxRealYear,
  roundTaxReal,
} from "../../js/domain/tax-real.js";

test("tax-real normalizeTaxRealYear keeps bounds and defaults to current year", () => {
  const now = new Date(2026, 1, 13);
  assert(normalizeTaxRealYear(undefined, now) === 2026, "missing year should fallback to current");
  assert(normalizeTaxRealYear("abcd", now) === 2026, "invalid year should fallback to current");
  assert(normalizeTaxRealYear(1999, now) === 2000, "year should be clamped to min");
  assert(normalizeTaxRealYear(2101, now) === 2100, "year should be clamped to max");
  assert(normalizeTaxRealYear(2025, now) === 2025, "valid year should be preserved");
});

test("tax-real normalizeTaxRealDistanceKmOneWay uses fallback for invalid values", () => {
  assert(normalizeTaxRealDistanceKmOneWay(undefined) === 2, "missing distance should fallback");
  assert(normalizeTaxRealDistanceKmOneWay(0) === 2, "zero distance should fallback");
  assert(normalizeTaxRealDistanceKmOneWay(-4) === 2, "negative distance should fallback");
  assert(normalizeTaxRealDistanceKmOneWay(22.4) === 22.4, "valid distance should be preserved");
});

test("tax-real getTaxRealYearDateRangeISO returns full year bounds", () => {
  const range = getTaxRealYearDateRangeISO(2024, new Date(2026, 1, 13));
  assert(range.selectedYear === 2024, "selected year should be returned");
  assert(range.startISO === "2024-01-01", "start date should be Jan 1");
  assert(range.endISO === "2024-12-31", "end date should be Dec 31");
});

test("tax-real computeTaxRealMetrics computes current year values with conges filter", () => {
  const result = computeTaxRealMetrics({
    rawYear: 2026,
    rawDistanceKmOneWay: 18,
    nowDate: new Date(2026, 1, 15), // 15/02/2026
    congesConfig: {
      periods: [{ start: "09/01/2026", end: "10/01/2026" }],
    },
    entries: [
      { date: "2026-01-05", serviceCode: "2101" },
      { date: "2026-01-06", serviceCode: "REPOS" },
      { date: "2026-01-07", serviceCode: "TAD 6" },
      { date: "2026-01-08", serviceCode: "RPS" },
      { date: "2026-01-09", serviceCode: "DM" }, // excluded by conges period
      { date: "2026-03-01", serviceCode: "2201" }, // future vs nowDate
    ],
  });

  assert(result.selectedYear === 2026, "selected year should be 2026");
  assert(result.distanceOneWayKm === 18, "distance should stay 18");
  assert(result.workedDays === 2, "worked days to date should count only valid worked days");
  assert(result.estimatedRoundTripKm === 72, "estimated km should be computed");
  assert(result.annualProjectionKm === 571, "annual projection should be extrapolated");
  assert(result.yearProgressPct === 13, "year progress should match elapsed days");
});

test("tax-real computeTaxRealMetrics uses full year behavior for past year", () => {
  const result = computeTaxRealMetrics({
    rawYear: 2025,
    rawDistanceKmOneWay: 20,
    nowDate: new Date(2026, 1, 15),
    entries: [
      { date: "2025-01-01", serviceCode: "2101" },
      { date: "2025-07-14", serviceCode: "REPOS" },
      { date: "2025-12-01", serviceCode: "TAD 2" },
      { date: "2025-12-24", serviceCode: "RPS" },
    ],
  });

  assert(result.workedDays === 2, "past year should count worked days from the full year");
  assert(result.estimatedRoundTripKm === 80, "estimated km should use worked days");
  assert(result.annualProjectionKm === 80, "past year projection should equal estimated km");
  assert(result.yearProgressPct === 100, "past year progress should be 100%");
});

test("tax-real computeTaxRealMetrics uses future year behavior", () => {
  const result = computeTaxRealMetrics({
    rawYear: 2027,
    rawDistanceKmOneWay: 19,
    nowDate: new Date(2026, 1, 15),
    entries: [{ date: "2027-01-03", serviceCode: "2101" }],
  });

  assert(result.workedDays === 0, "future year should not count worked days to date");
  assert(result.estimatedRoundTripKm === 0, "future year estimated km should be zero");
  assert(result.annualProjectionKm === 0, "future year projection should be zero");
  assert(result.yearProgressPct === 0, "future year progress should be 0%");
});

test("tax-real roundTaxReal rounds expected values", () => {
  assert(roundTaxReal(12.345, 2) === 12.35, "rounding to 2 digits should work");
  assert(roundTaxReal(12.5, 0) === 13, "rounding to 0 digit should work");
});
