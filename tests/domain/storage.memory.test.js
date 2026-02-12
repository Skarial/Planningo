/*

  Copyright (c) 2026 Jordan

  All Rights Reserved.

  See LICENSE for terms.

*/

// tests/domain/storage.memory.test.js
import { test, assert } from "../run-tests.js";
import {
  storageGet,
  storageSet,
  storageDelete,
  storageClear,
  storageExportAll,
  storageImportAll,
} from "../../js/data/storage.memory.js";

// tests…

test("storageSet / storageGet", async () => {
  await storageClear();
  await storageSet("a", 1);
  const v = await storageGet("a");
  assert(v === 1, "Valeur incorrecte");
});

test("storageDelete supprime la clé", async () => {
  await storageClear();
  await storageSet("a", 1);
  await storageDelete("a");
  const v = await storageGet("a");
  assert(v === null, "Clé non supprimée");
});

test("storageExportAll / storageImportAll", async () => {
  await storageClear();
  await storageSet("a", 1);
  await storageSet("b", 2);

  const data = await storageExportAll();

  await storageClear();
  await storageImportAll(data);

  assert((await storageGet("a")) === 1);
  assert((await storageGet("b")) === 2);
});
