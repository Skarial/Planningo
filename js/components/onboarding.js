/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { getConfig, setConfig } from "../data/storage.js";
import {
  showCongesPeriodsView,
  showEditDayView,
  showGuidedMonth,
  showHome,
  showPhoneChangeView,
} from "../router.js";
import { getActiveDateISO } from "../state/active-date.js";

const ONBOARDING_SEEN_KEY = "onboarding_seen_v3";

const ONBOARDING_STEPS = [
  {
    title: "Saisie guidée",
    body: "Commencez ici pour remplir le mois. Cette vue est guidée avec des suggestions pour aller plus vite.",
    view: "guided",
  },
  {
    title: "Mon planning",
    body: "Cette vue permet de consulter les jours en sélectionnant une date sur le calendrier.",
    view: "home",
  },
  {
    title: "Modifier un jour",
    body: "Depuis le bloc Informations du jour, ouvrez Modifier pour ajuster un changement de planning pour ce jour.",
    view: "edit-day",
  },
  {
    title: "Congés & période",
    body: "Ici, vous saisissez les dates de congés. Elles s'implémentent directement dans le planning.",
    view: "conges-periods",
  },
  {
    title: "Changement de téléphone",
    body: "En cas de changement de téléphone, exportez vos données depuis l'ancien. Après installation sur le nouveau téléphone, cliquez sur Importer pour retrouver le planning en l'état.",
    view: "phone-change",
  },
];

function removeOnboarding(overlay, previousOverflow) {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  document.body.style.overflow = previousOverflow;
}

function getOnboardingDateISO() {
  const active = getActiveDateISO();
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(active || ""))) {
    return active;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function showStepView(step) {
  switch (step.view) {
    case "guided":
      await showGuidedMonth();
      break;
    case "home":
      await showHome();
      break;
    case "edit-day":
      await showEditDayView(getOnboardingDateISO(), { updateHash: false });
      break;
    case "conges-periods":
      await showCongesPeriodsView();
      break;
    case "phone-change":
      await showPhoneChangeView();
      break;
    default:
      await showHome();
      break;
  }
}

export async function showOnboardingIfNeeded() {
  let alreadySeen = false;
  try {
    const entry = await getConfig(ONBOARDING_SEEN_KEY);
    alreadySeen = entry?.value === true;
  } catch {
    alreadySeen = false;
  }

  if (alreadySeen) return;

  const overlay = document.createElement("div");
  overlay.className = "onboarding-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Onboarding Planningo");

  const card = document.createElement("div");
  card.className = "onboarding-modal";

  const badge = document.createElement("p");
  badge.className = "onboarding-badge";

  const title = document.createElement("h3");
  title.className = "onboarding-title";

  const body = document.createElement("p");
  body.className = "onboarding-body";

  const actions = document.createElement("div");
  actions.className = "onboarding-actions";

  const skipBtn = document.createElement("button");
  skipBtn.type = "button";
  skipBtn.className = "settings-btn";
  skipBtn.textContent = "Passer";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "settings-btn";
  prevBtn.textContent = "Précédent";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "settings-btn primary";

  actions.append(skipBtn, prevBtn, nextBtn);
  card.append(badge, title, body, actions);
  overlay.appendChild(card);

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  document.body.appendChild(overlay);

  let stepIndex = 0;

  async function renderStep() {
    const step = ONBOARDING_STEPS[stepIndex];
    badge.textContent = `Étape ${stepIndex + 1} sur ${ONBOARDING_STEPS.length}`;
    title.textContent = step.title;
    body.textContent = step.body;
    prevBtn.hidden = stepIndex === 0;
    nextBtn.textContent =
      stepIndex === ONBOARDING_STEPS.length - 1 ? "Terminer" : "Suivant";
    await showStepView(step);
  }

  async function finish() {
    try {
      await setConfig(ONBOARDING_SEEN_KEY, true);
    } catch {
      // No-op: l'onboarding ne doit jamais bloquer l'usage de l'app.
    }
    removeOnboarding(overlay, previousOverflow);
    await showGuidedMonth();
  }

  skipBtn.addEventListener("click", finish);
  prevBtn.addEventListener("click", async () => {
    if (stepIndex <= 0) return;
    stepIndex -= 1;
    await renderStep();
  });
  nextBtn.addEventListener("click", async () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      await finish();
      return;
    }
    stepIndex += 1;
    await renderStep();
  });

  await renderStep();
}
