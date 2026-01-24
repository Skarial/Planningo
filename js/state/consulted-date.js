// ⚠️ ÉTAT DORMANT
// Utilisé uniquement par la vue day (non exposée à l’UI).
// Conservé volontairement pour usage futur.

let consultedDate = null;

export function setConsultedDate(dateISO) {
  consultedDate = dateISO;
}

export function getConsultedDate() {
  return consultedDate;
}

export function clearConsultedDate() {
  consultedDate = null;
}
