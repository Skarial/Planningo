// services-availability.js
// Détermine si un service est autorisé selon le contexte (saison, règles métier)

export function isServiceAllowed(service, seasonConfigured) {
  // Services toujours autorisés
  if (!service) return false;
  if (service.code === "REPOS") return true;
  if (service.code === "DM") return true;
  if (service.code === "DAM") return true;
  if (service.code === "TAD") return true;

  // Si aucune saison n’est configurée → tout autorisé
  if (!seasonConfigured) return true;

  // Sinon, appliquer les règles saisonnières
  if (service.saisonnier === true) return true;
  if (service.saisonnier === false) return false;

  // Par défaut : autorisé
  return true;
}
