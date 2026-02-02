/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/activation.js

export function validateActivation(providedHash, storedHash) {
  if (!providedHash) return false;
  if (!storedHash) return false;

  return providedHash === storedHash;
}

