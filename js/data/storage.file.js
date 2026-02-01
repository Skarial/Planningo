/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.file.js
// Adaptateur stockage "fichier" â€” MOCK (en mÃ©moire)
// Respecte strictement storage.interface.js

let fileData = {};

export async function storageGet(key) {
  return Object.prototype.hasOwnProperty.call(fileData, key)
     fileData[key]
    : null;
}

export async function storageSet(key, value) {
  fileData[key] = value;
}

export async function storageDelete(key) {
  delete fileData[key];
}

export async function storageClear() {
  fileData = {};
}

export async function storageExportAll() {
  // copie profonde simple
  return JSON.parse(JSON.stringify(fileData));
}

export async function storageImportAll(data) {
  if (!data || typeof data !== "object") {
    fileData = {};
    return;
  }
  fileData = JSON.parse(JSON.stringify(data));
}

