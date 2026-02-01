import { getMonthCalendar } from "../state/month-calendar-state.js";
import { DAY_STATUS } from "../domain/day-status.js";

export function renderHomeMonthCalendar(container, deps) {
  container.innerHTML = "";

  const calendar = getMonthCalendar(deps);
  if (!calendar) return;

  // ✅ 1. WRAPPER DÉCLARÉ EN PREMIER
  const wrapper = document.createElement("div");
  wrapper.className = "home-month";

  // ✅ 2. EN-TÊTE JOURS (FR, ALIGNÉ)
  const weekdays = ["L", "M", "M", "J", "V", "S", "D"];
  const header = document.createElement("div");
  header.className = "home-weekdays";

  weekdays.forEach((d) => {
    const el = document.createElement("div");
    el.textContent = d;
    header.appendChild(el);
  });

  wrapper.appendChild(header);

  // ✅ 3. GRILLE UNIQUE (ALIGNEMENT GARANTI)
  const grid = document.createElement("div");
  grid.className = "home-month-grid";

  calendar.days.forEach((day) => {
    const el = document.createElement("div");
    el.className = "day-circle";

    if (!day.inMonth) {
      el.classList.add("out");
    } else {
      el.textContent = day.day;

      if (day.status === DAY_STATUS.REST) {
        el.classList.add("rest");
      }
      if (day.isActive) el.classList.add("active");

      el.onclick = () => deps.onDaySelected?.(day.iso);
    }

    grid.appendChild(el);
  });

  wrapper.appendChild(grid);
  container.appendChild(wrapper);
}
