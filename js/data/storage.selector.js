/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.selector.js
// SÃ©lection centralisÃ©e de lâ€™adaptateur de stockage

import * as memory from "./storage.memory.js";
import * as file from "./storage.file.js";

// âš ï¸ SÃ©lection TEMPORAIRE (pilotÃ©e)
// - "memory" = comportement actuel
// - "file"   = prÃ©paration logiciel
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

