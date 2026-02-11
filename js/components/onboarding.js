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
    body: "Commencez par saisir votre premier service ici. Touchez un type et/ou une ligne pour remplir rapidement votre mois.",
    view: "guided",
  },
  {
    title: "Mon planning",
    body: "Touchez une date pour voir ou modifier un jour précis de votre planning.",
    view: "home",
  },
  {
    title: "Modifier un jour",
    body: "Utilisez « Modifier » pour corriger un service, ajouter des heures sup ou un panier.",
    view: "edit-day",
  },
  {
    title: "Congés & période",
    body: "Entrez vos dates de congés ici. Elles se placent automatiquement dans le planning.",
    view: "conges-periods",
  },
  {
    title: "Changement de téléphone",
    body: "Sauvegardez ici vos données pour les restaurer sur un nouveau téléphone.",
    view: "phone-change",
  },
];

const STEP_SPOTLIGHT_SELECTORS = {
  guided: [
    "#view-guided-month .guided-section-label",
    "#view-guided-month .guided-primary-grid",
    "#view-guided-month .guided-lines-grid",
  ],
};

function clearSpotlight(targets) {
  targets.forEach((node) => node.classList.remove("onboarding-spotlight"));
  targets.length = 0;
}

function applySpotlight(step, targets) {
  clearSpotlight(targets);
  const selectors = STEP_SPOTLIGHT_SELECTORS[step.view] || [];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.classList.add("onboarding-spotlight");
      targets.push(node);
    });
  });
}

function removeOnboarding(overlay, previousOverflow, spotlightTargets) {
  clearSpotlight(spotlightTargets);
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  document.body.classList.remove("onboarding-lock");
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
  document.body.classList.add("onboarding-lock");
  document.body.style.overflow = "hidden";
  document.body.appendChild(overlay);

  const spotlightTargets = [];
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
    applySpotlight(step, spotlightTargets);
  }

  async function markSeenSafely() {
    try {
      await setConfig(ONBOARDING_SEEN_KEY, true);
    } catch {
      // No-op: l'onboarding ne doit jamais bloquer l'usage de l'app.
    }
  }

  async function finishAndGoGuided() {
    removeOnboarding(overlay, previousOverflow, spotlightTargets);
    await markSeenSafely();
    await showGuidedMonth();
  }

  skipBtn.addEventListener("click", finishAndGoGuided);
  prevBtn.addEventListener("click", async () => {
    if (stepIndex <= 0) return;
    stepIndex -= 1;
    await renderStep();
  });
  nextBtn.addEventListener("click", async () => {
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      await finishAndGoGuided();
      return;
    }
    stepIndex += 1;
    await renderStep();
  });

  await renderStep();
}


