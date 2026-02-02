/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.memory.js
// Implmentation mmoire du contrat storage.interface

const memory = new Map();

export async function storageGet(key) {
  return memory.has(key)  memory.get(key) : null;
}

export async function storageSet(key, value) {
  memory.set(key, value);
}

export async function storageDelete(key) {
  memory.delete(key);
}

export async function storageClear() {
  memory.clear();
}

export async function storageExportAll() {
  return Object.fromEntries(memory.entries());
}

export async function storageImportAll(data) {
  memory.clear();

  if (!data || typeof data !== "object") return;

  for (const [key, value] of Object.entries(data)) {
    memory.set(key, value);
  }
}

