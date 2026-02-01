/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { test, assert } from "../run-tests.js";
import { validateActivation } from "../../js/domain/activation.js";

test("activation invalide si hash fourni absent", () => {
  const ok = validateActivation("", "abc");
  assert(ok === false, "Activation acceptÃ©e sans hash fourni");
});

test("activation invalide si hash stockÃ© absent", () => {
  const ok = validateActivation("abc", "");
  assert(ok === false, "Activation acceptÃ©e sans hash stockÃ©");
});

test("activation valide si hashes identiques", () => {
  const ok = validateActivation("hash123", "hash123");
  assert(ok === true, "Activation refusÃ©e malgrÃ© hashes identiques");
});

test("activation invalide si hashes diffÃ©rents", () => {
  const ok = validateActivation("hash123", "hash456");
  assert(ok === false, "Activation acceptÃ©e avec hashes diffÃ©rents");
});

