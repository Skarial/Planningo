/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { renderExchangeRequestsList } from "./requests-list.js";
import { renderExchangeConversationsList } from "./conversations-list.js";
import { renderExchangeConversationThread } from "./conversation-thread.js";
import {
  clearExchangeConversationSelection,
  getExchangeSelectionState,
  subscribeExchangeSelection,
} from "../../state/exchange/selection-state.js";
import { resetExchangeMessages } from "../../state/exchange/messages-state.js";

const unsubscribeByContainer = new WeakMap();
const TABS = ["requests", "conversations"];

export function renderExchangesView(container) {
  const previousUnsubscribe = unsubscribeByContainer.get(container);
  if (typeof previousUnsubscribe === "function") {
    previousUnsubscribe();
  }

  container.innerHTML = "";

  let activeIndex = 0;

  const root = document.createElement("div");
  root.className =
    "tabs-view settings-page-variant settings-card-spacing-md conges-periods-view exchanges-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Échanges de service";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "Demandes publiques et conversations privees";
  header.append(title, subtitle);

  const tabs = document.createElement("div");
  tabs.className = "tabs-bar";
  const tabButtons = {};
  TABS.forEach((tab) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tabs-btn";
    button.dataset.tab = tab;
    button.textContent = tab === "requests" ? "Demandes" : "Conversations";
    tabs.appendChild(button);
    tabButtons[tab] = button;
  });

  const content = document.createElement("div");
  content.className = "tabs-content";

  const track = document.createElement("div");
  track.className = "tabs-track";
  content.appendChild(track);

  const requestsPage = document.createElement("div");
  requestsPage.className = "tab-page";

  const conversationsPage = document.createElement("div");
  conversationsPage.className = "tab-page";
  track.append(requestsPage, conversationsPage);

  function setActive(index, fromSwipe = false) {
    activeIndex = index;
    const width = content.clientWidth || 1;
    track.style.transform = `translate3d(${-index * width}px, 0, 0)`;
    TABS.forEach((tab, idx) => {
      tabButtons[tab].classList.toggle("active", idx === index);
    });
    if (!fromSwipe) {
      content.scrollLeft = 0;
      content.scrollTop = 0;
    }
  }

  function renderConversationsPage() {
    const selection = getExchangeSelectionState();
    if (!selection.selectedConversationId) {
      renderExchangeConversationsList(conversationsPage);
      return;
    }

    conversationsPage.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn";
    backButton.textContent = "Retour";
    backButton.addEventListener("click", () => {
      resetExchangeMessages();
      clearExchangeConversationSelection();
    });
    actions.appendChild(backButton);
    conversationsPage.appendChild(actions);

    const threadContainer = document.createElement("div");
    threadContainer.className = "settings-card";
    renderExchangeConversationThread(
      threadContainer,
      selection.selectedConversationId,
      selection.selectedParticipants,
    );

    conversationsPage.appendChild(threadContainer);
  }

  function layoutTrack() {
    if (!content.isConnected) return;
    const width = content.clientWidth || 1;
    track.style.width = `${width * TABS.length}px`;
    [requestsPage, conversationsPage].forEach((page) => {
      page.style.width = `${width}px`;
    });
    setActive(activeIndex, true);
  }

  tabButtons.requests.addEventListener("click", () => {
    clearExchangeConversationSelection();
    setActive(0);
  });

  tabButtons.conversations.addEventListener("click", () => {
    renderConversationsPage();
    setActive(1);
  });

  let startX = 0;
  let startY = 0;
  let startTranslate = 0;
  let isTracking = false;
  let isDragging = false;

  track.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isTracking = true;
    isDragging = false;
    const width = content.clientWidth || 1;
    startTranslate = -activeIndex * width;
    track.classList.add("dragging");
  });

  track.addEventListener(
    "touchmove",
    (event) => {
      if (!isTracking) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (!isDragging) {
        if (Math.abs(deltaX) < Math.abs(deltaY)) {
          isTracking = false;
          track.classList.remove("dragging");
          return;
        }
        isDragging = true;
      }

      event.preventDefault();

      const width = content.clientWidth || 1;
      const maxTranslate = 0;
      const minTranslate = -width * (TABS.length - 1);
      let nextTranslate = startTranslate + deltaX;
      if (nextTranslate > maxTranslate) nextTranslate = maxTranslate;
      if (nextTranslate < minTranslate) nextTranslate = minTranslate;
      track.style.transform = `translate3d(${nextTranslate}px, 0, 0)`;
    },
    { passive: false },
  );

  track.addEventListener("touchend", (event) => {
    if (!isTracking) return;
    isTracking = false;
    track.classList.remove("dragging");
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const width = content.clientWidth || 1;
    const threshold = width * 0.2;
    if (Math.abs(deltaX) < threshold) {
      if (activeIndex === 1) {
        renderConversationsPage();
      }
      setActive(activeIndex, true);
      return;
    }
    if (deltaX < 0 && activeIndex < TABS.length - 1) {
      renderConversationsPage();
      setActive(activeIndex + 1, true);
      return;
    }
    if (deltaX > 0 && activeIndex > 0) {
      clearExchangeConversationSelection();
      setActive(activeIndex - 1, true);
      return;
    }
    setActive(activeIndex, true);
  });

  track.addEventListener("touchcancel", () => {
    isTracking = false;
    isDragging = false;
    track.classList.remove("dragging");
    setActive(activeIndex, true);
  });

  const onResize = () => {
    layoutTrack();
  };
  window.addEventListener("resize", onResize, { passive: true });

  root.append(header, tabs, content);
  container.appendChild(root);

  renderExchangeRequestsList(requestsPage);
  renderConversationsPage();

  const unsubscribeSelection = subscribeExchangeSelection((selection) => {
    if (selection?.selectedConversationId && activeIndex !== 1) {
      renderConversationsPage();
      setActive(1);
      return;
    }
    if (activeIndex === 1) {
      renderConversationsPage();
    }
  });
  unsubscribeByContainer.set(container, () => {
    unsubscribeSelection();
    window.removeEventListener("resize", onResize);
  });

  requestAnimationFrame(() => {
    layoutTrack();
  });
  setActive(0);
}
