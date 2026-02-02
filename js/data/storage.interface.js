/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.interface.js
// Contrat abstrait de stockage (PWA / logiciel / backend)

export async function storageGet(_key) {
  throw new Error("storageGet non implÃ©mentÃ©");
}

export async function storageSet(_key, _value) {
  throw new Error("storageSet non implÃ©mentÃ©");
}

export async function storageDelete(_key) {
  throw new Error("storageDelete non implÃ©mentÃ©");
}

export async function storageClear() {
  throw new Error("storageClear non implÃ©mentÃ©");
}

export async function storageExportAll() {
  throw new Error("storageExportAll non implÃ©mentÃ©");
}

export async function storageImportAll(_data) {
  throw new Error("storageImportAll non implÃ©mentÃ©");
}

