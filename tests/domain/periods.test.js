import { test, assert } from "../run-tests.js";
import { getActivePeriodeLibelle } from "../../js/domain/periods.js";

// Saison NON configurée
test("Période principale si saison absente", () => {
  const saisonConfig = null;
  const label = getActivePeriodeLibelle(saisonConfig);
  assert(label === "Période principale", "Libellé incorrect");
});

// Saison configurée
test("Période saisonnière si saison valide", () => {
  const saisonConfig = {
    saisonDebut: "01/06/2025",
    saisonFin: "30/09/2025",
  };
  const label = getActivePeriodeLibelle(saisonConfig);
  assert(label === "Période saisonnière", "Libellé incorrect");
});
