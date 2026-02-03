/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const holidayCache = new Map();

function toISODateLocal(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

// Algorithme de Meeus/Jones/Butcher (grégorien)
function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function buildHolidaysForYear(year) {
  const map = new Map();

  function addFixed(monthIndex, day, name) {
    const d = new Date(year, monthIndex, day);
    map.set(toISODateLocal(d), name);
  }

  addFixed(0, 1, "Jour de l'an");
  addFixed(4, 1, "F\u00eate du Travail");
  addFixed(4, 8, "Victoire 1945");
  addFixed(6, 14, "F\u00eate nationale");
  addFixed(7, 15, "Assomption");
  addFixed(10, 1, "Toussaint");
  addFixed(10, 11, "Armistice 1918");
  addFixed(11, 25, "No\u00ebl");

  const easterSunday = getEasterSunday(year);
  map.set(toISODateLocal(addDays(easterSunday, 1)), "Lundi de P\u00e2ques");
  map.set(toISODateLocal(addDays(easterSunday, 39)), "Ascension");
  map.set(toISODateLocal(addDays(easterSunday, 50)), "Lundi de Pentec\u00f4te");

  return map;
}

export function getHolidayNameForDate(date) {
  if (!date) return null;
  const year = date.getFullYear();
  if (!holidayCache.has(year)) {
    holidayCache.set(year, buildHolidaysForYear(year));
  }
  const map = holidayCache.get(year);
  return map.get(toISODateLocal(date)) || null;
}
