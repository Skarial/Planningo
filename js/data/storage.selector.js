// js/data/storage.selector.js
// Sélection centralisée de l’adaptateur de stockage

import * as memory from "./storage.memory.js";
import * as file from "./storage.file.js";

// ⚠️ Sélection TEMPORAIRE (pilotée)
// - "memory" = comportement actuel
// - "file"   = préparation logiciel
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
