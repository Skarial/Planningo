/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { DAY_STATUS, getDayStatus } from "../domain/day-status.js";
import { getCurrentMonth } from "./month-navigation.js";
import { getActiveDateISO } from "./active-date.js";

function toISODateLocalSafe(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function buildMonthCalendar({
  year,
  monthIndex,
  getServiceForDateISO,
  isDateInConges,
  activeDateISO,
}) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      inMonth: false,
    });
  }

  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    const date = new Date(year, monthIndex, d);
    date.setHours(0, 0, 0, 0);

    const iso = toISODateLocalSafe(date);

    const service = getServiceForDateISO(iso);
    const isConges = isDateInConges(date);

    let status;

    const isRepos =
      service && typeof service.serviceCode === "string" && service.serviceCode === "REPOS";

    if (isConges || isRepos) {
      status = DAY_STATUS.REST;
    } else {
      status = getDayStatus({
        service,
        date,
        today,
      });
    }

    days.push({
      inMonth: true,
      iso,
      day: d,
      status,
      isActive: iso === activeDateISO,
    });
  }

  return {
    year,
    monthIndex,
    days,
  };
}

export function getMonthCalendar(deps) {
  const { year, monthIndex } = getCurrentMonth();

  if (year === null || monthIndex === null) {
    return null;
  }

  return buildMonthCalendar({
    year,
    monthIndex,
    getServiceForDateISO: deps.getServiceForDateISO,
    isDateInConges: deps.isDateInConges,
    activeDateISO: getActiveDateISO(),
  });
}

