// home.js : vue Accueil — semaine glissante (swipe horizontal)
import { isDateInConges } from "../utils/conges.js";
import { getPlanningEntry, getAllServices } from "../data/storage.js";
import { toISODateLocal } from "../utils.js";
import { getActivePeriodeLibelle } from "../utils/periods.js";

let currentWeekStart = getMonday(new Date());

// =======================
// RENDER PUBLIC
// =======================

function renderTodayButton(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "today-nav";

  const btnPrev = document.createElement("button");
  btnPrev.className = "today-arrow";
  btnPrev.textContent = "";
  btnPrev.classList.add("arrow-left");

  const btn = document.createElement("button");
  btn.className = "today-reset-btn";
  btn.textContent = "Revenir à aujourd’hui";

  const btnNext = document.createElement("button");
  btnNext.className = "today-arrow";
  btnNext.textContent = "";
  btnNext.classList.add("arrow-right");

  btnPrev.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderHome();
  });

  btnNext.addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderHome();
  });

  btn.addEventListener("click", () => {
    currentWeekStart = getMonday(new Date());
    renderHome();
  });

  wrapper.append(btnPrev, btn, btnNext);
  container.appendChild(wrapper);

  updateTodayButtonVisibility(container);
}

function updateTodayButtonVisibility(container) {
  const wrapper = container.querySelector(".today-nav");
  if (!wrapper) return;

  const todayMonday = getMonday(new Date()).getTime();
  const currentMonday = currentWeekStart.getTime();
  const isCurrentWeek = todayMonday === currentMonday;

  // Le wrapper reste toujours visible (hauteur constante)
  wrapper.classList.remove("hidden-today-nav");

  // On masque uniquement le bouton central
  const resetBtn = wrapper.querySelector(".today-reset-btn");
  if (resetBtn) {
    resetBtn.style.visibility = isCurrentWeek ? "hidden" : "visible";
  }
}

export async function renderHome() {
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  container.innerHTML = "";

  // 1) HEADER FIXE (flèches + bouton aujourd’hui)
  const header = document.createElement("div");
  header.className = "week-header";
  container.appendChild(header);
  renderTodayButton(header);

  // 2) ZONE SCROLLABLE (cartes semaine)
  const scrollContainer = document.createElement("div");
  scrollContainer.className = "week-scroll";
  container.appendChild(scrollContainer);

  const weekContainer = document.createElement("div");
  weekContainer.id = "week-container";
  scrollContainer.appendChild(weekContainer);

  await renderWeek(weekContainer);
  initWeekSwipe(scrollContainer);
}

// =======================
// RENDER SEMAINE
// =======================

async function renderWeek(container) {
  container.innerHTML = "";

  const allServices = await getAllServices();
  if (!Array.isArray(allServices)) {
    console.error("allServices invalide", allServices);
    return;
  }

  const activePeriode = await getActivePeriodeLibelle();
  const todayISO = toISODateLocal(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);

    const iso = toISODateLocal(d);
    const entry = await getPlanningEntry(iso);

    const isConges = await isDateInConges(d);

    let serviceLabel = "";
    let serviceClass = "";
    let horaireHTML = "";
    const isExtra = entry?.extra === true;
    let workedMinutes = 0;

    if (isConges) {
      serviceLabel = "CONGÉ";
      serviceClass = "conges";
    } else {
      const serviceCode = entry?.serviceCode || "REPOS";
      serviceLabel = serviceCode;
      workedMinutes = calculateWorkedMinutes(
        serviceCode,
        activePeriode,
        allServices,
      );

      if (serviceCode === "REPOS") {
        serviceClass = "repos";
      } else if (serviceCode === "ANNEXE") {
        serviceClass = "conges";
      } else {
        horaireHTML = buildHorairesHome(
          serviceCode,
          activePeriode,
          allServices,
        );
      }
    }

    const card = document.createElement("div");
    card.className = "card week-day-card";

    if (iso === todayISO) {
      card.classList.add("today");
    }

    card.innerHTML = `
  <div class="week-day-header">
    <span class="week-day-name">
      ${d.toLocaleDateString("fr-FR", { weekday: "long" })}
    </span>
    <span class="week-day-date">
      ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
    </span>
    ${iso === todayISO ? `<span class="today-badge">Aujourd’hui</span>` : ""}
  </div>

  <div class="card-service-row">
  <div class="card-service ${serviceClass}">
    ${serviceLabel}
  </div>

  ${
    workedMinutes > 0
      ? `<div class="card-worked-time">${formatMinutesToHours(workedMinutes)}</div>`
      : ""
  }
</div>


  ${horaireHTML}

  ${
    !isConges && serviceLabel !== "REPOS" && isExtra
      ? `<div class="extra-label">Heure supplémentaire</div>`
      : ""
  }
`;

    container.appendChild(card);
  }
}
// =======================
// CALCUL HEURES JOUR
// =======================

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function calculateWorkedMinutes(serviceCode, activePeriode, allServices) {
  if (!serviceCode || serviceCode === "REPOS" || serviceCode === "ANNEXE") {
    return 0;
  }

  const service = allServices.find((s) => s.code === serviceCode);
  if (!service || !Array.isArray(service.periodes)) return 0;

  const periode = service.periodes.find((p) => p.libelle === activePeriode);
  if (!periode || !Array.isArray(periode.plages)) return 0;

  let totalMinutes = 0;

  for (const plage of periode.plages) {
    const start = timeToMinutes(plage.debut);
    const end = timeToMinutes(plage.fin);
    if (end > start) {
      totalMinutes += end - start;
    }
  }

  return totalMinutes;
}

function formatMinutesToHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// =======================
// SWIPE SEMAINE
// =======================

function initWeekSwipe(container) {
  let startX = null;

  container.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  container.addEventListener("touchend", (e) => {
    if (startX === null) return;

    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    const SWIPE_THRESHOLD = 60;

    if (deltaX < -SWIPE_THRESHOLD) {
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      renderWeek(container);
      updateTodayButtonVisibility(document.getElementById("view-home"));
    }

    if (deltaX > SWIPE_THRESHOLD) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      renderWeek(container);
      updateTodayButtonVisibility(document.getElementById("view-home"));
    }

    startX = null;
  });
}

// =======================
// OUTILS DATE
// =======================

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// =======================
// HORAIRES (LOGIQUE CANONIQUE)
// =======================

function buildHorairesHome(serviceCode, activePeriode, allServices) {
  if (serviceCode === "REPOS") return "";

  const service = allServices.find((s) => s.code === serviceCode);
  if (!service || !Array.isArray(service.periodes)) return "";

  const periode = service.periodes.find((p) => p.libelle === activePeriode);

  if (!periode?.plages?.length) return "";

  return `
    <div class="card-time">
      ${periode.plages.map((p) => `${p.debut} - ${p.fin}`).join(" | ")}
    </div>
  `;
}

export function setHomeWeekFromDate(dateISO) {
  if (!dateISO) return;

  const date = new Date(dateISO);
  currentWeekStart = getMonday(date);
}
