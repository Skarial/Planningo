import { test, assert } from "../run-tests.js";
import { groupServices } from "../../js/domain/services-grouping.js";

const SERVICES = [
  { code: "A", periode: "Période principale" },
  { code: "B", periode: "Période saisonnière" },
  { code: "C", periode: "Période principale" },
];

test("groupServices retourne une structure objet", () => {
  const result = groupServices(SERVICES, null);

  assert(
    result && typeof result === "object" && !Array.isArray(result),
    "Résultat attendu : objet de groupes",
  );
});

test("groupServices retourne une structure valide (même vide)", () => {
  const result = groupServices(SERVICES, null);

  assert(result && typeof result === "object", "Résultat invalide");
});

test("groupServices ne modifie pas les objets source", () => {
  const clone = JSON.parse(JSON.stringify(SERVICES));

  groupServices(SERVICES, null);

  assert(
    JSON.stringify(SERVICES) === JSON.stringify(clone),
    "Effet de bord détecté sur les données source",
  );
});
