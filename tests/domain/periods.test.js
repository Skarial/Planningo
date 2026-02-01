/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { test, assert } from "../run-tests.js";
import { getPeriodState, PERIOD_STATE } from "../../js/domain/periods.js";

// Saison NON configurÃ©e
test("PÃ©riode principale si saison absente", () => {
  const saisonConfig = null;
  const state = getPeriodState(saisonConfig);
  assert(state === PERIOD_STATE.DEFAULT, "Etat de periode incorrect");
});

// Saison configurÃ©e
test("PÃ©riode saisonniÃ¨re si saison valide", () => {
  const saisonConfig = {
    saisonDebut: "01/06/2025",
    saisonFin: "30/09/2025",
  };
  const state = getPeriodState(saisonConfig);
  assert(state === PERIOD_STATE.SEASONAL, "Etat de periode incorrect");
});

