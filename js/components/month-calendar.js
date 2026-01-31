// js/components/month-calendar.js

import { getMonthCalendar } from "../state/month-calendar-state.js";

/**
 * Rendu HOME — calendrier circulaire par semaines
 * ⚠️ Ce composant est VISUEL, aucune logique métier ici
 */
export function renderMonthCalendar(container, { onDaySelected, ...deps }) {
  container.innerHTML = "";

  const calendar = getMonthCalendar(deps);
  if (!calendar) return;

  const root = document.createElement("div");
  root.className = "home-month";

  // groupement par semaines
  const weeks = [];
  let currentWeek = [];

  calendar.days.forEach((day, index) => {
    currentWeek.push(day);

    if (currentWeek.length === 7 || index === calendar.days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  weeks.forEach((week) => {
    const row = document.createElement("div");
    row.className = "week-row";

    // semaine contenant le jour actif
    const isActiveWeek = week.some((d) => d.isActive);

    if (!isActiveWeek) {
      row.classList.add("faded");
    }

    week.forEach((day) => {
      const circle = document.createElement("div");
      circle.className = "day-circle";

      if (!day.inMonth) {
        circle.classList.add("out");
      } else {
        circle.textContent = day.day;

        if (day.isActive) {
          circle.classList.add("active");
        }

        circle.addEventListener("click", () => {
          onDaySelected?.(day.iso);
        });
      }

      row.appendChild(circle);
    });

    root.appendChild(row);
  });

  container.appendChild(root);
}
