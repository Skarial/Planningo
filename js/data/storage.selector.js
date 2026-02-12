/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.selector.js
// Slection centralise de ladaptateur de stockage

import * as memory from "./storage.memory.js";
import * as file from "./storage.file.js";

//  Slection TEMPORAIRE (pilote)
// - "memory" = comportement actuel
// - "file"   = prparation logiciel
const STORAGE_MODE = "memory";

export function getStorageAdapter() {
  switch (STORAGE_MODE) {
    case "file":
      return file;
    case "memory":
    default:
      return memory;
  }
}
