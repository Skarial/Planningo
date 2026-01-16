// home.js : vue Accueil — semaine glissante (swipe horizontal)

import { getPlanningEntry, getAllServices } from "../data/storage.js";
import { toISODateLocal } from "../utils.js";
import { getPeriodeForDate } from "../utils/periods.js";

let currentWeekStart = getMonday(new Date());

// =======================
// RENDER PUBLIC
// =======================
function renderTodayButton(container) {
  const btn = document.createElement("button");
  btn.className = "today-reset-btn";
  btn.textContent = "Revenir à aujourd’hui";

  btn.addEventListener("click", () => {
    currentWeekStart = getMonday(new Date());
    renderHome();
  });

  container.appendChild(btn);

  // état initial
  updateTodayButtonVisibility(container);
}

function updateTodayButtonVisibility(container) {
  const btn = container.querySelector(".today-reset-btn");
  if (!btn) return;

  const todayMonday = getMonday(new Date()).getTime();
  const currentMonday = currentWeekStart.getTime();

  if (todayMonday === currentMonday) {
    btn.classList.add("hidden");
    btn.disabled = true;
  } else {
    btn.classList.remove("hidden");
    btn.disabled = false;
  }
}

export async function renderHome() {
  const container = document.getElementById("view-home");
  if (!container) {
    console.error("Conteneur view-home introuvable");
    return;
  }

  container.innerHTML = "";

  // 1) Bouton FIXE (hors zone scroll)
  renderTodayButton(container);

  // 2) Zone scrollable SEULEMENT pour la semaine
  const scrollContainer = document.createElement("div");
  scrollContainer.className = "home-scroll";
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

  const todayISO = toISODateLocal(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);

    const iso = toISODateLocal(d);
    const entry = await getPlanningEntry(iso);

    const serviceCode = entry?.serviceCode || "REPOS";
    const isExtra = entry?.extra === true;

    const horaireHTML = await buildHorairesHome(serviceCode, iso, allServices);

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
        ${
          iso === todayISO ? `<span class="today-badge">Aujourd’hui</span>` : ""
        }
      </div>

      <div class="card-service ${
        serviceCode === "REPOS" ? "repos" : ""
      }">${serviceCode}</div>

      ${horaireHTML}

      ${
        serviceCode !== "REPOS" && isExtra
          ? `<div class="extra-label">Heure supplémentaire</div>`
          : ""
      }
    `;

    container.appendChild(card);
  }
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
      // gauche → semaine suivante
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      renderWeek(container);
      updateTodayButtonVisibility(document.getElementById("view-home"));
    }

    if (deltaX > SWIPE_THRESHOLD) {
      // droite → semaine précédente
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
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
  const day = d.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// =======================
// HORAIRES (ISOLÉ)
// =======================

async function buildHorairesHome(serviceCode, iso, allServices) {
  if (serviceCode === "REPOS") return "";

  const service = allServices.find((s) => s.code === serviceCode);
  if (!service || !Array.isArray(service.periodes)) return "";

  const periodeActive = await getPeriodeForDate(iso);

  let periode;
  if (service.periodes.length === 1) {
    periode = service.periodes[0];
  } else {
    periode =
      periodeActive === "Période saisonnière"
        ? service.periodes[1]
        : service.periodes[0];
  }

  if (!periode?.plages?.length) return "";

  return `
    <div class="card-time">
      ${periode.plages.map((p) => `${p.debut} - ${p.fin}`).join(" | ")}
    </div>
  `;
}
