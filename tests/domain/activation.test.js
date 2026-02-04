/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { test, assert } from "../run-tests.js";
import { validateActivation } from "../../js/domain/activation.js";

test("activation invalide si hash fourni absent", () => {
  const ok = validateActivation("", "abc");
  assert(ok === false, "Activation acceptée sans hash fourni");
});

test("activation invalide si hash stocké absent", () => {
  const ok = validateActivation("abc", "");
  assert(ok === false, "Activation acceptée sans hash stocké");
});

test("activation valide si hashes identiques", () => {
  const ok = validateActivation("hash123", "hash123");
  assert(ok === true, "Activation refusée malgré hashes identiques");
});

test("activation invalide si hashes différents", () => {
  const ok = validateActivation("hash123", "hash456");
  assert(ok === false, "Activation acceptée avec hashes différents");
});

