/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/data/storage.abstract.js
// Point dentre UNIQUE pour le stockage abstrait (domain-compatible)

import { getStorageAdapter } from "./storage.selector.js";

const adapter = getStorageAdapter();

export const storageGet = adapter.storageGet;
export const storageSet = adapter.storageSet;
export const storageDelete = adapter.storageDelete;
export const storageClear = adapter.storageClear;
export const storageExportAll = adapter.storageExportAll;
export const storageImportAll = adapter.storageImportAll;
