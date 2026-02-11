/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assert, test } from "../run-tests.js";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(TEST_DIR, "..", "..");

function readRootFile(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

test("ui-smoke - index contains all primary view sections", () => {
  const html = readRootFile("index.html");
  const requiredViewIds = [
    "view-home",
    "view-guided-month",
    "view-edit-day",
    "view-conges-periods",
    "view-summary",
    "view-alarm",
    "view-phone-change",
    "view-legal",
  ];

  for (const id of requiredViewIds) {
    assert(
      html.includes(`id="${id}"`),
      `Section principale manquante dans index.html: ${id}`,
    );
  }
});

test("ui-smoke - onboarding keeps 5-step critical flow", () => {
  const source = readRootFile("js/components/onboarding.js");
  const stepViews = Array.from(source.matchAll(/view:\s*"([^"]+)"/g)).map(
    (entry) => entry[1],
  );

  const expectedViews = [
    "guided",
    "home",
    "edit-day",
    "conges-periods",
    "phone-change",
  ];

  assert(
    stepViews.length === expectedViews.length,
    `Nombre d'etapes onboarding inattendu: ${stepViews.length}`,
  );
  assert(
    JSON.stringify(stepViews) === JSON.stringify(expectedViews),
    `Ordre des vues onboarding inattendu: ${stepViews.join(" -> ")}`,
  );
});

test("ui-smoke - onboarding controls keep expected behavior hooks", () => {
  const source = readRootFile("js/components/onboarding.js");

  assert(
    source.includes('skipBtn.addEventListener("click", finishAndGoGuided);'),
    "Le bouton Passer doit terminer l'onboarding vers la saisie guidee",
  );
  assert(
    source.includes('stepIndex === ONBOARDING_STEPS.length - 1 ? "Terminer" : "Suivant"'),
    "Le bouton principal onboarding doit conserver la logique Suivant/Terminer",
  );
  assert(
    source.includes("const STEP_SPOTLIGHT_SELECTORS = {"),
    "Configuration spotlight onboarding manquante",
  );
});
