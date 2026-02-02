/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/domain/service-model.js
/**
 * Modle mtier dun service journalier
 */

export function createService({
  code,
  start1,
  end1,
  start2 = null,
  end2 = null,
}) {
  return {
    code, // ex: "2910"
    periods: [
      { start: start1, end: end1 },
      ...(start2 && end2  [{ start: start2, end: end2 }] : []),
    ],
  };
}

