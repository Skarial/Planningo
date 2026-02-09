/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/menu.js

import { setUiMode, UI_MODE } from "../state/ui-mode.js";
import { isExchangesUiEnabled } from "../state/feature-flags.js";
import {
  showHome,
  showGuidedMonth,
  showCongesPeriodsView,
  showConsultDateView,
  showResetView,
  showSuggestionsView,
  showFeedbackView,
  showSummaryView,
  showExchangesView,
  showPhoneChangeView,
  showLegalView,
  showAlarmView,
} from "../router.js";

// =======================
// MENU
// =======================

export function initMenu() {
  // =======================
  // ETATS
  // =======================

  let isOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let currentTranslateX = 0;
  let isSwiping = false;
  let swipeLocked = false;
  let edgeStartX = 0;
  let edgeStartY = 0;
  let edgeTracking = false;
  let edgeLocked = false;
  let edgeDragging = false;
  const EDGE_SWIPE_WIDTH = 24;
  const EDGE_SWIPE_MIN = 32;

  function isScrollableElement(el) {
    if (!el || el === document.body || el === document.documentElement) {
      return false;
    }
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    if (overflowY !== "auto" && overflowY !== "scroll") return false;
    return el.scrollHeight > el.clientHeight;
  }

  function isInsideScrollableArea(target) {
    if (!target || !target.closest) return false;
    let node = target;
    while (node && node !== document.body) {
      if (isScrollableElement(node)) return true;
      node = node.parentElement;
    }
    return false;
  }

  function isInteractiveTarget(target) {
    if (!target || !target.closest) return false;
    return Boolean(
      target.closest(
        "input, textarea, select, button, a, [contenteditable='true']",
      ),
    );
  }

  // =======================
  // MENU  DOM
  // =======================

  const menu = document.getElementById("side-menu");

  const overlay = document.getElementById("menu-overlay");
  const toggle = document.getElementById("menu-toggle");
  const closeBtn = document.getElementById("menu-close");

  if (!menu || !overlay || !toggle || !closeBtn) return;

  toggle.classList.remove("hidden");
  overlay.classList.remove("hidden");
  menu.classList.remove("hidden");

  menu.classList.remove("open");
  overlay.classList.remove("open");
  menu.inert = true;

  // =======================
  // OUTILS (VUES DEDIEES)
  // =======================

  const congesPeriodsBtn = document.getElementById("menu-conges-periods");
  const suggestionsBtn = document.getElementById("menu-suggestions");
  const feedbackBtn = document.getElementById("menu-feedback");
  const summaryBtn = document.getElementById("menu-summary");
  const phoneBtn = document.getElementById("menu-phone-change");
  const alarmBtn = document.getElementById("menu-alarm");
  const legalBtn = document.getElementById("menu-legal");
  const resetBtn = document.getElementById("menu-reset");

  congesPeriodsBtn.addEventListener("click", () => {
    showCongesPeriodsView();
    setActiveMenu("menu-conges-periods");
    closeMenu();
  });

  suggestionsBtn.addEventListener("click", () => {
    showSuggestionsView();
    setActiveMenu("menu-suggestions");
    closeMenu();
  });

  if (feedbackBtn) {
    feedbackBtn.addEventListener("click", () => {
      showFeedbackView();
      setActiveMenu("menu-feedback");
      closeMenu();
    });
  }

  summaryBtn.addEventListener("click", () => {
    showSummaryView();
    setActiveMenu("menu-summary");
    closeMenu();
  });

  alarmBtn.addEventListener("click", () => {
    showAlarmView();
    setActiveMenu("menu-alarm");
    closeMenu();
  });

  phoneBtn.addEventListener("click", () => {
    showPhoneChangeView();
    setActiveMenu("menu-phone-change");
    closeMenu();
  });

  legalBtn.addEventListener("click", () => {
    showLegalView();
    setActiveMenu("menu-legal");
    closeMenu();
  });

  resetBtn.addEventListener("click", () => {
    showResetView();
    setActiveMenu("menu-reset");
    closeMenu();
  });

  // =======================
  // CONSULTATION DATE
  // =======================

  const consultBtn = document.getElementById("menu-consult-date");
  if (consultBtn) {
    consultBtn.addEventListener("click", () => {
      showConsultDateView();
      closeMenu();
    });
  }

  const consultToggle = document.getElementById("consult-toggle");
  if (consultToggle) {
    consultToggle.addEventListener("click", () => {
      showConsultDateView();
    });
  }

  // =======================
  // OUVERTURE / FERMETURE
  // =======================

  function openMenu() {
    menu.classList.add("open");
    overlay.classList.add("open");

    menu.removeAttribute("inert");
    menu.setAttribute("aria-hidden", "false");

    isOpen = true;
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (document.activeElement) {
      document.activeElement.blur();
    }

    menu.classList.remove("open");
    menu.classList.remove("opening-swipe");
    overlay.classList.remove("open");
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");

    isOpen = false;
    toggle.setAttribute("aria-expanded", "false");
    menu.style.transform = "";
    menu.style.transition = "";
    currentTranslateX = 0;

    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
  }

  function showMenuToast(message, anchorButton = null) {
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) return;

    const existing = document.getElementById("menu-toast");
    if (existing) {
      existing.remove();
    }

    const toast = document.createElement("div");
    toast.id = "menu-toast";
    toast.textContent = text;
    toast.style.background = "#1f1f1f";
    toast.style.color = "#ffffff";
    toast.style.padding = "8px 10px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "0.82rem";
    toast.style.lineHeight = "1.2";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    toast.style.transform = "translateY(2px)";
    toast.style.margin = "6px 0 0 32px";
    toast.style.display = "inline-block";
    toast.style.maxWidth = "220px";
    toast.style.pointerEvents = "none";

    if (anchorButton && menu.contains(anchorButton)) {
      anchorButton.insertAdjacentElement("afterend", toast);
    } else {
      toast.className = "toast-notification";
      document.body.appendChild(toast);
    }

    requestAnimationFrame(() => {
      if (toast.classList.contains("toast-notification")) {
        toast.classList.add("visible");
      } else {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      }
    });

    setTimeout(() => {
      if (toast.classList.contains("toast-notification")) {
        toast.classList.remove("visible");
      } else {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(2px)";
      }
      setTimeout(() => {
        toast.remove();
      }, 220);
    }, 1700);
  }

  toggle.addEventListener("click", () => {
    if (isOpen) {
      closeMenu();
      return;
    }
    menu.classList.remove("opening-swipe");
    openMenu();
  });

  closeBtn.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  // =======================
  // SWIPE DROITE  OUVERTURE MENU (EDGE)
  // =======================

  document.addEventListener(
    "touchstart",
    (e) => {
      if (isOpen) return;
      if (!e.touches || e.touches.length === 0) return;

      const touch = e.touches[0];
      if (touch.clientX > EDGE_SWIPE_WIDTH) return;
      if (isInteractiveTarget(e.target)) return;

      edgeStartX = touch.clientX;
      edgeStartY = touch.clientY;
      edgeTracking = true;
      edgeLocked = false;
      edgeDragging = false;
      menu.style.transition = "none";
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (isOpen || !edgeTracking) return;
      if (!e.touches || e.touches.length === 0) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - edgeStartX;
      const deltaY = touch.clientY - edgeStartY;

      if (!edgeLocked) {
        if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
        edgeLocked = true;
        if (Math.abs(deltaX) <= Math.abs(deltaY)) {
          edgeTracking = false;
          return;
        }
      }

      const menuWidth = menu.offsetWidth || 1;
      const clampedX = Math.max(0, Math.min(deltaX, menuWidth));
      if (clampedX > 0) {
        edgeDragging = true;
        if (e.cancelable) {
          e.preventDefault();
        }
        document.body.classList.add("menu-open");
        menu.classList.add("opening");
        overlay.classList.add("open");
        const translateX = -menuWidth + clampedX;
        menu.style.transform = `translateX(${translateX}px)`;
      }
    },
    { passive: false },
  );

  document.addEventListener(
    "touchend",
    () => {
      if (!edgeTracking) {
        edgeTracking = false;
        edgeLocked = false;
        edgeDragging = false;
        return;
      }

      const menuWidth = menu.offsetWidth || 1;
      const deltaX = edgeDragging ? menuWidth + (menu.getBoundingClientRect().left || 0) : 0;
      const openedEnough = deltaX > Math.max(EDGE_SWIPE_MIN, menuWidth * 0.35);

      menu.style.transition = "";

      if (openedEnough) {
        menu.classList.remove("opening");
        menu.classList.add("opening-swipe");
        menu.style.transform = "";
        openMenu();
      } else {
        menu.style.transform = "";
        overlay.classList.remove("open");
        menu.classList.remove("opening");
        document.body.classList.remove("menu-open");
      }

      edgeTracking = false;
      edgeLocked = false;
      edgeDragging = false;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchcancel",
    () => {
      menu.style.transition = "";
      menu.style.transform = "";
      overlay.classList.remove("open");
      menu.classList.remove("opening");
      document.body.classList.remove("menu-open");
      edgeTracking = false;
      edgeLocked = false;
      edgeDragging = false;
    },
    { passive: true },
  );
  // =======================
  // SWIPE GAUCHE  FERMETURE MENU
  // =======================

  menu.addEventListener("touchstart", (e) => {
    if (!isOpen) return;

    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    isSwiping = false;
    swipeLocked = false;
    menu.style.transition = "none";
  });

  menu.addEventListener(
    "touchmove",
    (e) => {
      if (!isOpen) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      if (!swipeLocked) {
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
        swipeLocked = true;
        isSwiping = Math.abs(deltaX) > Math.abs(deltaY);
        if (!isSwiping) {
          menu.style.transition = "";
          return;
        }
      }

      if (!isSwiping) return;

      if (deltaX < 0) {
        e.preventDefault();
        currentTranslateX = deltaX;
        menu.style.transform = `translateX(${deltaX}px)`;
      }
    },
    { passive: false },
  );

  menu.addEventListener("touchend", () => {
    if (!isOpen) return;

    menu.style.transition = "transform 0.25s ease";
    const threshold = -menu.offsetWidth * 0.3;

    if (isSwiping && currentTranslateX < threshold) {
      closeMenu();
    } else if (isSwiping) {
      menu.style.transform = "translateX(0)";
    }

    isSwiping = false;
    swipeLocked = false;
    currentTranslateX = 0;
  });

  menu.addEventListener("touchcancel", () => {
    if (!isOpen) return;
    menu.style.transition = "";
    menu.style.transform = "translateX(0)";
    isSwiping = false;
    swipeLocked = false;
    currentTranslateX = 0;
  });

  function setActiveMenu(key) {
    const buttons = menu.querySelectorAll(".menu-section button");
    buttons.forEach((btn) => {
      const action = btn.dataset.action || btn.id || "";
      btn.classList.toggle("active", action === key);
    });
  }

  setActiveMenu("home");

  // =======================
  // NAVIGATION
  // =======================

  menu.addEventListener("click", (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    let shouldCloseMenu = true;

    switch (action) {
      case "home":
        setUiMode(UI_MODE.CONSULTATION);
        showHome();
        setActiveMenu("home");
        break;

      case "day":
        break;

      case "guided-month":
        setUiMode(UI_MODE.SAISIE_MENSUELLE);

        showGuidedMonth();
        setActiveMenu("guided-month");
        break;

      case "exchanges":
        if (!isExchangesUiEnabled()) {
          showMenuToast("Module bientôt disponible", button);
          shouldCloseMenu = false;
          break;
        }
        setUiMode(UI_MODE.CONSULTATION);
        void showExchangesView();
        setActiveMenu("exchanges");
        break;

      case "tetribus":
        import("../router.js").then(({ showTetribusView }) => {
          showTetribusView();
          setActiveMenu("tetribus");
        });
        break;
    }

    if (shouldCloseMenu) {
      closeMenu();
    }
  });

  // =======================
  // VERSION
  // =======================

  // Version affiche supprime avec le footer du menu
}

