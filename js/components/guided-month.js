import {
  getAllServices,
  savePlanningEntry,
  getPlanningEntry,
} from "../data/storage.js";

import { groupServices } from "../utils/services-grouping.js";
import { toISODateLocal } from "../utils.js";
import { showHome } from "../router.js";
import { getGuidedStartDay, isDateInConges } from "../utils/conges.js";

// =======================
// VUE : PRÉPARER MOIS SUIVANT
// =======================
async function findFirstIncompleteMonth(startDate) {
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  for (let i = 0; i < 12; i++) {
    const testDate = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const year = testDate.getFullYear();
    const monthIndex = testDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      const iso = toISODateLocal(date);
      const entry = await getPlanningEntry(iso);

      if (!entry || entry.serviceCode === "") {
        return testDate;
      }
    }
  }

  return base; // fallback de sécurité
}

let guidedMonthDate = null;

export async function showGuidedMonth(forcedDate = null) {
  const view = document.getElementById("view-guided-month");
  if (!view) return;

  // Masquer les autres vues
  ["view-home", "view-day", "view-month"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  view.style.display = "block";
  view.innerHTML = "";

  // =======================
  // CALCUL MOIS SUIVANT
  // =======================

  if (forcedDate) {
    guidedMonthDate = new Date(forcedDate);
  } else if (!guidedMonthDate) {
    const today = new Date();
    guidedMonthDate = await findFirstIncompleteMonth(today);
  }

  const targetDate = new Date(guidedMonthDate);

  const year = targetDate.getFullYear();
  const monthIndex = targetDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let currentDay = 1;

  async function resumeCurrentDayFromDB() {
    for (let d = daysInMonth; d >= 1; d--) {
      const date = new Date(year, monthIndex, d);
      const iso = toISODateLocal(date);

      const entry = await getPlanningEntry(iso);

      // ✅ JOUR CONSIDÉRÉ COMME REMPLI MÊME SI REPOS
      if (entry && typeof entry.serviceCode === "string") {
        currentDay = d + 1;
        return;
      }
    }

    // Aucun jour rempli
    currentDay = 1;
  }

  // =======================
  // CHARGEMENT SERVICES
  // =======================

  const allServices = await getAllServices();
  const grouped = await groupServices(allServices);

  // =======================
  // UI
  // =======================

  const card = document.createElement("div");
  card.className = "card";
  view.appendChild(card);

  // 📅 Mois concerné
  const monthLabel = document.createElement("div");
  monthLabel.className = "guided-month-label";
  monthLabel.style.textAlign = "center";
  monthLabel.style.fontWeight = "600";
  monthLabel.style.marginBottom = "4px";
  monthLabel.textContent = targetDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  card.appendChild(monthLabel);

  // 🔢 Numéro du jour
  const dayNumber = document.createElement("div");
  dayNumber.id = "guided-day-number";
  dayNumber.style.fontSize = "3rem";
  dayNumber.style.fontWeight = "900";
  dayNumber.style.textAlign = "center";

  card.appendChild(dayNumber);

  const servicesContainer = document.createElement("div");
  servicesContainer.className = "guided-services-grid guided-month-buttons";
  card.appendChild(servicesContainer);

  function renderCompletedView() {
    const nextMonthDate = new Date(targetDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    const nextMonthLabel = nextMonthDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    servicesContainer.innerHTML = "";
    dayNumber.textContent = "✔";

    const title = document.createElement("div");
    title.style.fontSize = "1.2rem";
    title.style.fontWeight = "600";
    title.style.textAlign = "center";
    title.style.margin = "12px 0";
    title.textContent = "Mois entièrement préparé";

    const btnNextGuided = document.createElement("button");
    btnNextGuided.textContent = `➡️ Préparer le mois ${nextMonthLabel}`;
    btnNextGuided.onclick = () => {
      const next = new Date(targetDate);
      next.setMonth(next.getMonth() + 1);
      showGuidedMonth(next);
    };

    const btnMonth = document.createElement("button");
    btnMonth.textContent = "📅 Voir le planning du mois";
    btnMonth.onclick = () => {
      showHome();
      document.querySelector('[data-action="month"]')?.click();
    };

    const btnHome = document.createElement("button");
    btnHome.textContent = "🏠 Retour à l’accueil";
    btnHome.onclick = () => {
      guidedMonthDate = null;
      showHome();
    };

    servicesContainer.append(title, btnNextGuided, btnMonth, btnHome);
  }

  await resumeCurrentDayFromDB();
  // =======================
  // CONGÉS — AJUSTEMENT DÉMARRAGE
  // =======================

  const guidedStartDay = await getGuidedStartDay(year, monthIndex);

  // mois entièrement en congés
  if (guidedStartDay === null) {
    currentDay = daysInMonth + 1;
  } else {
    // si aucun jour encore saisi, forcer le départ
    if (currentDay === 1 && guidedStartDay > 1) {
      currentDay = guidedStartDay;
    }
  }

  await renderDay();

  // =======================
  // RENDER JOUR
  // =======================

  async function renderDay() {
    // =======================
    // CONGÉS — SAUT AUTOMATIQUE
    // =======================

    while (currentDay <= daysInMonth) {
      const testDate = new Date(year, monthIndex, currentDay);
      const inConges = await isDateInConges(testDate);

      if (!inConges) break;

      currentDay++;
    }

    if (currentDay > daysInMonth) {
      renderCompletedView();
      return;
    }

    dayNumber.textContent = currentDay;
    servicesContainer.innerHTML = "";

    addServiceButton("REPOS");
    addServiceButton("DM");
    addServiceButton("DAM");
    // Bouton TAD (ouvre la liste des services TAD)
    const tadServices = allServices.filter(
      (s) => typeof s.code === "string" && s.code.startsWith("TAD"),
    );

    if (tadServices.length > 0) {
      const btnTAD = document.createElement("button");
      btnTAD.textContent = "TAD";
      btnTAD.onclick = () => renderTAD(tadServices);
      servicesContainer.appendChild(btnTAD);
    }

    Object.keys(grouped.LIGNES)
      .sort()
      .forEach((line) => {
        const btn = document.createElement("button");
        btn.textContent = `Ligne ${line}`;
        btn.onclick = () => renderLine(line);
        servicesContainer.appendChild(btn);
      });

    // Bouton annuler jour précédent
    if (currentDay > 1) {
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "↩ Annuler le jour précédent";
      cancelBtn.className = "guided-cancel-btn";

      cancelBtn.onclick = async () => {
        // Jour à annuler = jour précédent
        const dayToUndo = currentDay - 1;

        if (dayToUndo < 1) return;

        const date = new Date(year, monthIndex, dayToUndo);
        const iso = toISODateLocal(date);

        // 🔁 ROLLBACK DB : retour à REPOS
        await savePlanningEntry({
          date: iso,
          serviceCode: "REPOS",
          locked: false,
          extra: false,
        });

        // Retour UI
        currentDay--;
        await renderDay();
      };

      servicesContainer.appendChild(cancelBtn);
    }
  }

  function renderLine(line) {
    servicesContainer.innerHTML = "";

    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.onclick = renderDay;
    servicesContainer.appendChild(back);

    grouped.LIGNES[line].forEach((service) => {
      addServiceButton(service.code);
    });
  }

  function renderTAD(tadServices) {
    servicesContainer.innerHTML = "";

    const back = document.createElement("button");
    back.textContent = "← Retour";
    back.onclick = renderDay;
    servicesContainer.appendChild(back);

    tadServices.forEach((service) => {
      addServiceButton(service.code);
    });
  }

  // =======================
  // BOUTON SERVICE = ENREGISTRE + JOUR SUIVANT
  // =======================

  function addServiceButton(code) {
    const btn = document.createElement("button");
    btn.textContent = code;

    btn.onclick = async () => {
      const date = new Date(year, monthIndex, currentDay);
      const iso = toISODateLocal(date);

      // 🔁 Conversion TADx → TDx pour l’enregistrement
      const serviceCodeToSave = code.startsWith("TAD")
        ? code.replace(/^TAD/, "TD")
        : code;

      await savePlanningEntry({
        date: iso,
        serviceCode: serviceCodeToSave,
        locked: false,
        extra: false,
      });

      currentDay++;
      await renderDay();
    };

    servicesContainer.appendChild(btn);
  }
}
