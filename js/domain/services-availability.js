/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// services-availability.js
// DÃ©termine si un service est autorisÃ© selon le contexte (saison, rÃ¨gles mÃ©tier)

export function isServiceAllowed(service, seasonConfigured) {
  // Services toujours autorisÃ©s
  if (!service) return false;
  if (service.code === "REPOS") return true;
  if (service.code === "DM") return true;
  if (service.code === "DAM") return true;
  if (service.code === "TAD") return true;

  // Si aucune saison nâ€™est configurÃ©e â†’ tout autorisÃ©
  if (!seasonConfigured) return true;

  // Sinon, appliquer les rÃ¨gles saisonniÃ¨res
  if (service.saisonnier === true) return true;
  if (service.saisonnier === false) return false;

  // Par dÃ©faut : autorisÃ©
  return true;
}

