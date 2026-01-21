// =======================
// DATES
// =======================

export function toISODateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateFR(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDayNumber(date) {
  return String(date.getDate()).padStart(2, "0");
}

export function getMonthLabelFR(year, monthIndex) {
  return [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ][monthIndex];
}

export function getDayNameFR(date) {
  return ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][date.getDay()];
}

export function getDayNameFullFR(date) {
  return [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ][date.getDay()];
}

export function getAllDaysOfMonth(year, monthIndex) {
  const days = [];
  const d = new Date(year, monthIndex, 1);

  while (d.getMonth() === monthIndex) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return days;
}

export function getWeekNumberISO(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function isMonthLocked(year, monthIndex) {
  const today = new Date();

  return (
    year < today.getFullYear() ||
    (year === today.getFullYear() && monthIndex < today.getMonth())
  );
}

export function getAdjacentMonths(year, monthIndex) {
  const prevYear = monthIndex === 0 ? year - 1 : year;
  const prevMonth = monthIndex === 0 ? 12 : monthIndex;

  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;

  return [
    `${prevYear}-${String(prevMonth).padStart(2, "0")}`,
    `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
  ];
}

// =======================
// SERVICES
// =======================

export function formatServiceLabel(serviceCode) {
  if (!serviceCode) return "";

  if (serviceCode === "REPOS") return "RPS";
  if (serviceCode === "DM") return "DM";
  if (serviceCode === "DAM") return "DAM";

  // 🔁 Affichage TDx → TAD x
  if (/^TD\d+$/i.test(serviceCode)) {
    return serviceCode.replace(/^TD/i, "TAD ");
  }

  return serviceCode;
}
