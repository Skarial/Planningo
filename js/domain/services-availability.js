/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// services-availability.js
// Dtermine si un service est autoris selon le contexte (saison, rgles mtier)

export function isServiceAllowed(service, seasonConfigured) {
  // Services toujours autoriss
  if (!service) return false;
  if (service.code === "REPOS") return true;
  if (service.code === "DM") return true;
  if (service.code === "DAM") return true;
  if (service.code === "TAD") return true;

  // Si aucune saison nest configure  tout autoris
  if (!seasonConfigured) return true;

  // Sinon, appliquer les rgles saisonnires
  if (service.saisonnier === true) return true;
  if (service.saisonnier === false) return false;

  // Par dfaut : autoris
  return true;
}
