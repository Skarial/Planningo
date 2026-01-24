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
