import { getDayStatus, DAY_STATUS } from "../../js/domain/day-status.js";

function d(dateStr) {
  return new Date(dateStr);
}

const today = d("2025-12-01");

console.assert(
  getDayStatus({ service: { code: "2910" }, date: d("2025-12-02"), today }) ===
    DAY_STATUS.WORKED,
  "Jour travaillé incorrect",
);

console.assert(
  getDayStatus({ service: null, date: d("2025-11-30"), today }) ===
    DAY_STATUS.EMPTY,
  "Jour passé vide incorrect",
);

console.assert(
  getDayStatus({ service: null, date: d("2025-12-10"), today }) ===
    DAY_STATUS.FUTURE_EMPTY,
  "Jour futur vide incorrect",
);
