/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// home.js : vue Accueil - calendrier mensuel + jour actif

// VUE CENTRALE - Accueil (jour + calendrier mensuel)
// Cette vue remplace les anciennes pages :
// - consulter date
// - vue mensuelle dediee

import { renderHomeMonthCalendar } from "./home-month-calendar.js";
import {
  getAllServices,
  getPlanningEntry,
  getPlanningForMonthLocalFirst,
} from "../data/storage.js";
import { getActiveDateISO, setActiveDateISO } from "../state/active-date.js";
import {
  getHomeCongesConfig,
  getHomeSaisonConfig,
  setHomeCongesConfig,
  setHomeSaisonConfig,
} from "../state/home-state.js";

import { isDateInConges } from "../domain/conges.js";
import {
  formatMinutesAsDuration,
  getFixedServiceMinutes,
  getServiceDisplayName,
  toISODateLocal,
} from "../utils.js";
import { getConfig, setConfig } from "../data/db.js";
import { initMonthFromDateISO } from "../state/month-navigation.js";
import { getPeriodStateForDate } from "../domain/periods.js";
import { getPeriodLabel } from "../utils/period-label.js";
import {
  getRestWarningMessageLabel,
  getRestWarningPeriodLabel,
} from "../utils/rest-warning-labels.js";
import { computeDailyRestWarning } from "../domain/daily-rest-warning.js";
import {
  formatMajorExtraMinutes,
  normalizeFormationMinutes,
  formatMissingMinutes,
  normalizeMajorExtraMinutes,
  normalizeMissingMinutes,
  formatNonMajorExtraMinutes,
  normalizeNonMajorExtraMinutes,
  resolvePanierEnabled,
} from "../domain/day-edit.js";
import { getHolidayNameForDate } from "../domain/holidays-fr.js";
import { getServiceCodeVariants, isBaseMorningServiceCode } from "../domain/morning-service.js";
import {
  dismissAlarmResyncNotice,
  isAlarmResyncDismissed,
  isAlarmResyncPending,
} from "../state/alarm-resync.js";
import { getAlarmAutoImportOptions } from "../state/alarm-auto-import.js";
import { getAlarmSyncEnabled } from "../state/alarm-feature.js";

const TAX_REAL_NOTICE_HIDDEN_KEY = "tax_real_notice_hidden";
const TAX_REAL_NOTICE_SESSION_KEY = "tax_real_notice_seen_session";
let homeRenderSessionCounter = 0;
let lastHomeRemoteMonthSignature = "";
let homeMonthEntriesCacheISO = "";
let homeMonthEntriesCache = [];

function buildMonthCalendarSignature(entries) {
  if (!Array.isArray(entries)) return "";
  return entries
    .filter((entry) => entry && typeof entry.date === "string")
    .map((entry) => {
      const code = typeof entry?.serviceCode === "string" ? entry.serviceCode.trim().toUpperCase() : "";
      return `${entry.date}:${code}`;
    })
    .sort()
    .join("|");
}

function parseISODateLocal(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

async function findPreviousWorkedDayEntry(currentDate, congesConfig) {
  const probe = new Date(currentDate);
  for (let i = 0; i < 62; i++) {
    probe.setDate(probe.getDate() - 1);
    if (isDateInConges(probe, congesConfig)) continue;
    const iso = toISODateLocal(probe);
    const entry = await getPlanningEntry(iso);
    const code =
      entry && typeof entry.serviceCode === "string" ? entry.serviceCode.trim().toUpperCase() : "";
    if (!code || code === "REPOS") continue;
    return { dateISO: iso, entry };
  }
  return null;
}

function shiftMonth(date, delta) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const targetMonth = month + delta;

  const day = date.getDate();

  // dernier jour du mois cible
  const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();

  const safeDay = Math.min(day, lastDayOfTargetMonth);

  return new Date(year, targetMonth, safeDay);
}

function parseTimeToMinutes(value) {
  if (typeof value !== "string") return null;
  const [h, m] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(minutes) {
  if (typeof minutes !== "number" || Number.isNaN(minutes) || minutes < 0) {
    return "";
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function normalizeServiceCode(value) {
  if (value == null) return "";
  return String(value).trim().toUpperCase();
}

function buildServicesLookup(services) {
  const lookup = new Map();
  if (!Array.isArray(services)) return lookup;

  services.forEach((service) => {
    if (!service || typeof service.code !== "string") return;
    const baseCode = normalizeServiceCode(service.code);
    if (!baseCode) return;
    lookup.set(baseCode, service);
    getServiceCodeVariants(baseCode).forEach((variant) => {
      const normalizedVariant = normalizeServiceCode(variant);
      if (normalizedVariant) lookup.set(normalizedVariant, service);
    });
  });

  return lookup;
}

function resolveServiceFromLookup(lookup, serviceCode) {
  if (!(lookup instanceof Map)) return null;
  const normalizedCode = normalizeServiceCode(serviceCode);
  if (!normalizedCode) return null;

  const direct = lookup.get(normalizedCode);
  if (direct) return direct;

  for (const variant of getServiceCodeVariants(normalizedCode)) {
    const normalizedVariant = normalizeServiceCode(variant);
    if (!normalizedVariant) continue;
    const found = lookup.get(normalizedVariant);
    if (found) return found;
  }

  return null;
}

function isMorningServiceCode(serviceCode) {
  return isBaseMorningServiceCode(serviceCode);
}

function getRestWarningTitle(restCheck) {
  return getRestWarningMessageLabel(restCheck?.messageKey, { withThreshold: true });
}

function shouldAddExtraMinutes(service) {
  const code = typeof service.code === "string" ? service.code.toUpperCase() : "";
  if (!code) return false;
  if (code === "DM" || code === "DAM" || code === "FORMATION") return false;
  if (code.startsWith("TAD")) return false;
  return true;
}

function getEntryFixedMinutes(entry) {
  if (!entry || !entry.serviceCode) return null;
  const code = String(entry.serviceCode).trim().toUpperCase();
  if (code === "FORMATION") {
    const customFormationMinutes = normalizeFormationMinutes(entry.formationMinutes);
    if (customFormationMinutes > 0) return customFormationMinutes;
  }
  return getFixedServiceMinutes(code);
}

function buildServiceTimeLines(service, periodLabel) {
  if (getFixedServiceMinutes(service.code) != null) {
    return {
      lines: [],
      duration: formatMinutesAsDuration(getFixedServiceMinutes(service.code)),
    };
  }
  if (!service || !Array.isArray(service.periodes)) return null;
  const matchingPeriod =
    service.periodes.find(
      (periode) =>
        periode &&
        periode.libelle === periodLabel &&
        Array.isArray(periode.plages) &&
        periode.plages.length > 0,
    ) ||
    service.periodes.find(
      (periode) => periode && Array.isArray(periode.plages) && periode.plages.length > 0,
    );

  if (!matchingPeriod || !Array.isArray(matchingPeriod.plages)) {
    return null;
  }

  const lines = matchingPeriod.plages
    .map((plage) => {
      if (!plage || !plage.debut || !plage.fin) return null;
      return {
        text: `${plage.debut} – ${plage.fin}`,
        start: plage.debut,
        end: plage.fin,
      };
    })
    .filter(Boolean);

  if (lines.length === 0) return null;

  let totalMinutes = lines.reduce((sum, line) => {
    const start = parseTimeToMinutes(line.start);
    const end = parseTimeToMinutes(line.end);
    if (start == null || end == null) return sum;
    const diff = end - start;
    return diff > 0 ? sum + diff : sum;
  }, 0);

  if (shouldAddExtraMinutes(service)) {
    totalMinutes += 5;
  }

  return {
    lines,
    duration: formatDuration(totalMinutes),
  };
}

// =======================
// RENDER PUBLIC
// =======================

function renderMonthNav(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "month-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "month-arrow arrow-left";

  const btnNext = document.createElement("button");
  btnNext.className = "month-arrow arrow-right";

  const todayISO = toISODateLocal(new Date());
  const isOnToday = getActiveDateISO() === todayISO;

  let btnToday = null;
  if (!isOnToday) {
    btnToday = document.createElement("button");
    btnToday.className = "month-today-btn";
    btnToday.type = "button";
    btnToday.textContent = "Aujourd'hui";
    wrapper.classList.add("month-nav-with-today");

    btnToday.addEventListener("click", () => {
      setActiveDateISO(todayISO);
      renderHome();
    });
  }

  btnPrev.addEventListener("click", () => {
    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, -1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });

  btnNext.addEventListener("click", () => {
    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, +1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });

  if (btnToday) {
    wrapper.append(btnPrev, btnToday, btnNext);
  } else {
    wrapper.append(btnPrev, btnNext);
  }
  container.appendChild(wrapper);
}

function bindMonthSwipe(container) {
  if (container.__monthSwipeBound) return;
  container.__monthSwipeBound = true;

  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  function isMenuBlocking() {
    if (document.body.classList.contains("menu-open")) return true;
    const menu = document.getElementById("side-menu");
    return Boolean(menu && (menu.classList.contains("open") || menu.classList.contains("opening")));
  }

  function isInteractiveSwipeTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    return Boolean(
      target.closest(
        ".day-circle, button, a, input, select, textarea, label, [role='button'], [data-no-swipe]",
      ),
    );
  }

  container.addEventListener("touchstart", (e) => {
    if (isMenuBlocking()) return;
    if (isInteractiveSwipeTarget(e.target)) return;
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
  });

  container.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    if (isMenuBlocking()) {
      isSwiping = false;
      return;
    }
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isSwiping = false;
    }
  });

  container.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    if (isMenuBlocking()) {
      isSwiping = false;
      return;
    }
    isSwiping = false;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    if (Math.abs(deltaX) < 40) return;

    const d = parseISODateLocal(getActiveDateISO());
    const newDate = shiftMonth(d, deltaX < 0 ? 1 : -1);
    setActiveDateISO(toISODateLocal(newDate));
    renderHome();
  });
}

function markTaxRealNoticeSeenInSession() {
  try {
    sessionStorage.setItem(TAX_REAL_NOTICE_SESSION_KEY, "1");
  } catch {}
}

function isTaxRealNoticeSeenInSession() {
  try {
    return sessionStorage.getItem(TAX_REAL_NOTICE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function removeTaxRealNoticeSheet() {
  const existing = document.getElementById("tax-real-notice-sheet");
  if (existing) existing.remove();
}

function createTaxRealNoticeSheet() {
  const sheet = document.createElement("section");
  sheet.id = "tax-real-notice-sheet";
  sheet.className = "home-tax-real-sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-label", "Nouveauté Frais réels");

  const card = document.createElement("div");
  card.className = "home-tax-real-notice";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "home-tax-real-close-btn";
  closeBtn.setAttribute("aria-label", "Fermer cette annonce");

  const title = document.createElement("h3");
  title.className = "home-tax-real-notice-title";
  title.textContent = "Nouveaut\u00e9 : Frais r\u00e9els";

  const text = document.createElement("p");
  text.className = "home-tax-real-notice-text";
  text.textContent =
    "Dans Statistiques / Frais r\u00e9els, estimez vos kilom\u00e8tres pour la d\u00e9claration d'imp\u00f4t annuel.";

  const actions = document.createElement("div");
  actions.className = "home-tax-real-notice-actions";

  const discoverBtn = document.createElement("button");
  discoverBtn.type = "button";
  discoverBtn.className = "home-tax-real-discover-btn";
  discoverBtn.textContent = "D\u00e9couvrir";

  const hideWrap = document.createElement("label");
  hideWrap.className = "home-tax-real-hide-wrap";

  const hideCheckbox = document.createElement("input");
  hideCheckbox.type = "checkbox";
  hideCheckbox.className = "home-tax-real-hide-checkbox";
  hideCheckbox.setAttribute("aria-label", "Ne plus afficher la nouveaut\u00e9 Frais r\u00e9els");
  async function closeSheet({ persist = false } = {}) {
    if (persist) {
      await setConfig(TAX_REAL_NOTICE_HIDDEN_KEY, true);
    }
    markTaxRealNoticeSeenInSession();
    sheet.remove();
  }

  hideCheckbox.addEventListener("change", async () => {
    if (!hideCheckbox.checked) return;
    await closeSheet({ persist: true });
  });

  discoverBtn.addEventListener("click", async () => {
    await closeSheet({ persist: hideCheckbox.checked });
    import("../router.js").then(({ showSummaryView }) => {
      showSummaryView({ initialTab: "tax" });
    });
  });

  closeBtn.addEventListener("click", async () => {
    await closeSheet({ persist: hideCheckbox.checked });
  });

  const hideText = document.createElement("span");
  hideText.textContent = "Ne plus afficher";

  hideWrap.append(hideCheckbox, hideText);
  actions.append(discoverBtn);

  card.append(closeBtn, title, text, actions, hideWrap);
  sheet.appendChild(card);
  return sheet;
}

// =======================
// CALCUL HEURES JOUR
// =======================

export async function renderHome() {
  const renderSession = ++homeRenderSessionCounter;
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  const nextContent = document.createDocumentFragment();
  const card = document.createElement("div");
  card.className = "home-main-card";

  const top = document.createElement("div");
  top.className = "home-top";

  const bottom = document.createElement("div");
  bottom.className = "home-bottom";

  const daySummary = document.createElement("div");
  daySummary.className = "home-day-summary";
  top.appendChild(daySummary);

  card.append(top, bottom);
  nextContent.append(card);

  const monthISO = getActiveDateISO().slice(0, 7);
  let monthEntries = [];
  const monthEntriesPromise =
    monthISO && homeMonthEntriesCacheISO === monthISO
      ? Promise.resolve(homeMonthEntriesCache)
      : monthISO
        ? getPlanningForMonthLocalFirst(monthISO, (remoteEntries) => {
            if (renderSession !== homeRenderSessionCounter) return;

            const remoteSignature = `${monthISO}|${buildMonthCalendarSignature(remoteEntries)}`;
            if (remoteSignature === lastHomeRemoteMonthSignature) return;

            const localSignature = `${monthISO}|${buildMonthCalendarSignature(monthEntries)}`;
            lastHomeRemoteMonthSignature = remoteSignature;

            if (remoteSignature !== localSignature) {
              homeMonthEntriesCacheISO = monthISO;
              homeMonthEntriesCache = remoteEntries;
              renderHome();
            }
          })
        : Promise.resolve([]);

  // CONFIG CONGES (cache)
  if (!getHomeCongesConfig()) {
    const congesEntry = await getConfig("conges");
    setHomeCongesConfig(congesEntry?.value ?? null);
  }

  if (!getHomeSaisonConfig()) {
    const saisonEntry = await getConfig("saison");
    setHomeSaisonConfig(saisonEntry?.value ?? null);
  }
  const alarmSyncEnabled = await getAlarmSyncEnabled();

  initMonthFromDateISO(getActiveDateISO());

  bindMonthSwipe(container);
  removeTaxRealNoticeSheet();

  const taxRealNoticeHiddenEntry = await getConfig(TAX_REAL_NOTICE_HIDDEN_KEY);
  const taxRealNoticeHidden = taxRealNoticeHiddenEntry?.value === true;
  if (!taxRealNoticeHidden && !isTaxRealNoticeSeenInSession()) {
    nextContent.appendChild(createTaxRealNoticeSheet());
  }

  // =======================
  // DAY HEADER - JOUR ACTIF
  // =======================

  const iso = getActiveDateISO();
  if (iso) {
    const date = new Date(iso);
    const isCongesDay = isDateInConges(date, getHomeCongesConfig());

    const section = document.createElement("section");
    section.className = "day-header";

    const left = document.createElement("div");
    left.className = "day-header-left";

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-header-day";
    dayNumber.textContent = date.getDate();

    const month = document.createElement("div");
    month.className = "day-header-month";
    month.textContent = date.toLocaleDateString("fr-FR", { month: "long" }).toUpperCase();

    const year = document.createElement("div");
    year.className = "day-header-year";
    year.textContent = date.getFullYear();

    left.append(dayNumber, month, year);

    const right = document.createElement("div");
    right.className = "day-header-right";

    const editBtn = document.createElement("button");
    editBtn.id = "edit-btn";
    editBtn.className = "edit-btn";
    editBtn.textContent = "Modifier";
    editBtn.onclick = () => {
      import("../router.js").then(({ showEditDayView }) => {
        showEditDayView(iso);
      });
    };

    right.appendChild(editBtn);

    const service = document.createElement("div");
    service.className = "day-header-service";
    service.hidden = true;

    const time = document.createElement("div");
    time.className = "day-header-time";
    time.hidden = true;

    const timeRow = document.createElement("div");
    timeRow.className = "day-header-time-row";
    timeRow.hidden = true;

    const extraLabel = document.createElement("div");
    extraLabel.className = "day-extra-label";
    extraLabel.textContent = "Heures supplémentaires";
    extraLabel.hidden = true;

    const nonMajorExtraLabel = document.createElement("div");
    nonMajorExtraLabel.className = "day-extra-label";
    nonMajorExtraLabel.hidden = true;

    const majorExtraLabel = document.createElement("div");
    majorExtraLabel.className = "day-extra-label";
    majorExtraLabel.hidden = true;

    const missingLabel = document.createElement("div");
    missingLabel.className = "day-extra-label";
    missingLabel.hidden = true;

    timeRow.append(time);

    const duration = document.createElement("div");
    duration.className = "day-header-duration";
    duration.hidden = true;

    const holidayLabel = document.createElement("div");
    holidayLabel.className = "day-holiday-label";
    holidayLabel.hidden = true;

    const panier = document.createElement("div");
    panier.className = "day-header-panier";
    panier.hidden = true;
    panier.setAttribute("aria-label", "Repas");
    panier.setAttribute("title", "Repas");
    const panierIcon = document.createElement("span");
    panierIcon.className = "panier-icon";
    panierIcon.setAttribute("aria-hidden", "true");
    panier.appendChild(panierIcon);

    const alarmResyncBtn = document.createElement("button");
    alarmResyncBtn.type = "button";
    alarmResyncBtn.className = "alarm-resync-btn";
    alarmResyncBtn.textContent = "Réveil à resynchroniser";
    alarmResyncBtn.addEventListener("click", () => {
      import("../router.js").then(({ showAlarmView }) => {
        showAlarmView(getAlarmAutoImportOptions());
      });
    });

    const alarmResyncDismissBtn = document.createElement("button");
    alarmResyncDismissBtn.type = "button";
    alarmResyncDismissBtn.className = "alarm-resync-dismiss";
    alarmResyncDismissBtn.textContent = "";
    alarmResyncDismissBtn.setAttribute(
      "aria-label",
      "Masquer le rappel de resynchronisation du réveil",
    );

    const alarmResyncActions = document.createElement("div");
    alarmResyncActions.className = "alarm-resync-actions";
    alarmResyncActions.hidden = true;
    alarmResyncActions.append(alarmResyncBtn, alarmResyncDismissBtn);

    alarmResyncDismissBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dismissAlarmResyncNotice();
      alarmResyncActions.hidden = true;
    });

    const rightChildren = [
      service,
      timeRow,
      duration,
      holidayLabel,
      extraLabel,
      majorExtraLabel,
      nonMajorExtraLabel,
      missingLabel,
      panier,
    ];
    if (alarmSyncEnabled) {
      rightChildren.push(alarmResyncActions);
    }
    right.append(...rightChildren);

    section.append(left, right);
    daySummary.appendChild(section);

    const holidayName = getHolidayNameForDate(date);
    if (holidayName) {
      holidayLabel.textContent = `Jour f\u00e9ri\u00e9 : ${holidayName}`;
      holidayLabel.hidden = false;
    }

    // chargement service reel
    getPlanningEntry(iso).then(async (entry) => {
      const shouldShowAlarmResync =
        alarmSyncEnabled &&
        isAlarmResyncPending() &&
        Boolean(entry?.serviceCode) &&
        isMorningServiceCode(entry.serviceCode) &&
        !isAlarmResyncDismissed();
      alarmResyncActions.hidden = !shouldShowAlarmResync;

      function updateExtraIndicators(entryValue) {
        if (isCongesDay) {
          extraLabel.hidden = true;
          majorExtraLabel.hidden = true;
          majorExtraLabel.textContent = "";
          nonMajorExtraLabel.hidden = true;
          nonMajorExtraLabel.textContent = "";
          missingLabel.hidden = true;
          missingLabel.textContent = "";
          panier.hidden = true;
          return;
        }

        if (entryValue && entryValue.extra) {
          extraLabel.hidden = false;
        } else {
          extraLabel.hidden = true;
        }

        const majorExtraMinutes = normalizeMajorExtraMinutes(entryValue?.majorExtraMinutes);
        if (majorExtraMinutes > 0) {
          majorExtraLabel.hidden = false;
          majorExtraLabel.textContent = `Heures supplémentaires : ${formatMajorExtraMinutes(majorExtraMinutes)}`;
        } else {
          majorExtraLabel.hidden = true;
          majorExtraLabel.textContent = "";
        }

        const nonMajorExtraMinutes = normalizeNonMajorExtraMinutes(
          entryValue?.nonMajorExtraMinutes,
        );
        if (nonMajorExtraMinutes > 0) {
          nonMajorExtraLabel.hidden = false;
          nonMajorExtraLabel.textContent = `Heures supplémentaires non majorées : ${formatNonMajorExtraMinutes(nonMajorExtraMinutes)}`;
        } else {
          nonMajorExtraLabel.hidden = true;
          nonMajorExtraLabel.textContent = "";
        }

        const missingMinutes = normalizeMissingMinutes(entryValue?.missingMinutes);
        if (missingMinutes > 0) {
          missingLabel.hidden = false;
          missingLabel.textContent = `Heures non effectuées : ${formatMissingMinutes(missingMinutes)}`;
        } else {
          missingLabel.hidden = true;
          missingLabel.textContent = "";
        }

        panier.hidden = !resolvePanierEnabled(entryValue?.serviceCode, entryValue?.panierOverride);
      }

      if (isCongesDay) {
        service.hidden = false;
        service.textContent = "Cong\u00E9s";
        service.classList.remove("repos", "rest-warning");
        service.classList.add("conges");
        service.removeAttribute("title");
        timeRow.hidden = true;
        time.textContent = "";
        duration.hidden = true;
        duration.textContent = "";
        updateExtraIndicators(null);
        return;
      }

      if (!entry || !entry.serviceCode) {
        return;
      }

      service.hidden = false;
      service.textContent = getServiceDisplayName(entry.serviceCode);
      service.classList.remove("rest-warning");
      service.removeAttribute("title");
      const normalizedServiceCode = String(entry.serviceCode).trim().toUpperCase();

      let servicesCatalog = null;
      let servicesLookup = null;
      async function loadServicesCatalog() {
        if (!servicesCatalog) {
          servicesCatalog = await getAllServices();
          servicesLookup = buildServicesLookup(servicesCatalog);
        }
        return servicesCatalog;
      }

      if (normalizedServiceCode === "REPOS") {
        service.classList.add("repos");
        timeRow.hidden = true;
        time.textContent = "";
        duration.hidden = true;
        duration.textContent = "";
        updateExtraIndicators(entry);
        return;
      }

      try {
        const previousWorkedDay = await findPreviousWorkedDayEntry(date, getHomeCongesConfig());
        if (previousWorkedDay) {
          await loadServicesCatalog();
          const servicesByCode = servicesLookup || new Map();
          const restCheck = computeDailyRestWarning({
            previousDateISO: previousWorkedDay.dateISO,
            previousEntry: previousWorkedDay.entry,
            currentDateISO: iso,
            currentServiceCode: entry.serviceCode,
            servicesByCode,
            saisonConfig: getHomeSaisonConfig(),
          });
          if (restCheck.shouldWarn) {
            service.classList.add("rest-warning");
            const periodLabel = getRestWarningPeriodLabel(restCheck.periodKey);
            service.title = `${getRestWarningTitle(restCheck)} - ${periodLabel}`;
          }
        }
      } catch {
        // Ne pas bloquer le rendu Home si le calcul de warning echoue.
      }

      const fixedMinutes = getEntryFixedMinutes(entry);
      if (fixedMinutes != null) {
        timeRow.hidden = true;
        time.textContent = "";
        duration.hidden = false;
        duration.textContent = formatMinutesAsDuration(fixedMinutes);
        updateExtraIndicators(entry);
        return;
      }

      if (entry.startTime && entry.endTime) {
        timeRow.hidden = false;
        time.hidden = false;
        time.textContent = `${entry.startTime} – ${entry.endTime}`;
      }

      if (entry.duration) {
        duration.hidden = false;
        duration.textContent = entry.duration;
      }

      updateExtraIndicators(entry);

      if (entry.startTime && entry.endTime) return;

      try {
        await loadServicesCatalog();
        const matchedService = resolveServiceFromLookup(servicesLookup, entry.serviceCode);

        const periodLabel = getPeriodLabel(getPeriodStateForDate(getHomeSaisonConfig(), date));
        const timeInfo = buildServiceTimeLines(matchedService, periodLabel);

        if (timeInfo) {
          timeRow.hidden = false;
          time.hidden = false;
          time.innerHTML = "";
          timeInfo.lines.forEach((line) => {
            const row = document.createElement("div");
            row.className = "day-time-row";

            const start = document.createElement("span");
            start.className = "day-time-start";
            start.textContent = line.start;

            const sep = document.createElement("span");
            sep.className = "day-time-sep";
            sep.textContent = "–";

            const end = document.createElement("span");
            end.className = "day-time-end";
            end.textContent = line.end;

            row.append(start, sep, end);
            time.appendChild(row);
          });

          if (timeInfo.duration) {
            duration.hidden = false;
            duration.textContent = timeInfo.duration;
          }
        }

        updateExtraIndicators(entry);
      } catch {
        updateExtraIndicators(entry);
      }
    });
  }

  // NAV MOIS (AU-DESSUS DU CALENDRIER)
  const monthNav = document.createElement("div");
  monthNav.className = "month-nav";
  renderMonthNav(monthNav);
  bottom.appendChild(monthNav);

  // CALENDRIER HOME - rendu circulaire
  const calendarAnchor = document.createElement("div");
  calendarAnchor.id = "home-calendar-anchor";
  bottom.appendChild(calendarAnchor);

  monthEntries = await monthEntriesPromise;
  homeMonthEntriesCacheISO = monthISO;
  homeMonthEntriesCache = monthEntries;
  const monthMap = new Map(monthEntries.map((entry) => [entry.date, entry]));

  renderHomeMonthCalendar(calendarAnchor, {
    getServiceForDateISO: (iso) => monthMap.get(iso) || null,

    isDateInConges: (date) => {
      const congesEntry = getHomeCongesConfig();
      return isDateInConges(date, congesEntry);
    },

    onDaySelected: (iso) => {
      setActiveDateISO(iso);
      initMonthFromDateISO(iso);
      renderHome();
    },
  });

  if (renderSession !== homeRenderSessionCounter) return;
  container.replaceChildren(nextContent);
}
