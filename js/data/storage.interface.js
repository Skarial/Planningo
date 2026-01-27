// js/data/storage.interface.js
// Contrat abstrait de stockage (PWA / logiciel / backend)

export async function storageGet(_key) {
  throw new Error("storageGet non implémenté");
}

export async function storageSet(_key, _value) {
  throw new Error("storageSet non implémenté");
}

export async function storageDelete(_key) {
  throw new Error("storageDelete non implémenté");
}

export async function storageClear() {
  throw new Error("storageClear non implémenté");
}

export async function storageExportAll() {
  throw new Error("storageExportAll non implémenté");
}

export async function storageImportAll(_data) {
  throw new Error("storageImportAll non implémenté");
}
