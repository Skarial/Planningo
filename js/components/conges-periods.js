/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/components/conges-periods.js

import { showHome } from "../router.js";
import { renderCongesView } from "./conges.js";
import { renderSeasonView } from "./season.js";

const TABS = ["conges", "periods"];

export async function renderCongesPeriodsView() {
  const view = document.getElementById("view-conges-periods");
  if (!view) return;

  view.innerHTML = "";

  const root = document.createElement("div");
  root.className = "tabs-view conges-periods-view";

  const header = document.createElement("div");
  header.className = "settings-header";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Cong\u00e9s & p\u00e9riodes";

  const subtitle = document.createElement("div");
  subtitle.className = "settings-subtitle";
  subtitle.textContent = "G\u00e9rer vos cong\u00e9s et la p\u00e9riode saisonni\u00e8re";

  header.append(title, subtitle);

  const tabs = document.createElement("div");
  tabs.className = "tabs-bar";

  const tabButtons = {};
  TABS.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tabs-btn";
    btn.dataset.tab = tab;
    btn.textContent = tab === "conges" ? "Cong\u00e9s" : "P\u00e9riodes";
    tabs.appendChild(btn);
    tabButtons[tab] = btn;
  });

  const content = document.createElement("div");
  content.className = "tabs-content";

  const track = document.createElement("div");
  track.className = "tabs-track";
  content.appendChild(track);

  const congesPage = document.createElement("div");
  congesPage.className = "tab-page";

  const periodsPage = document.createElement("div");
  periodsPage.className = "tab-page";

  track.append(congesPage, periodsPage);

  root.append(header, tabs, content);
  view.appendChild(root);

  await renderCongesView({ container: congesPage, showHeader: false });
  await renderSeasonView({ container: periodsPage, showHeader: false });

  let activeIndex = 0;

  function setActive(index, fromSwipe = false) {
    activeIndex = index;
    const width = content.clientWidth || 1;
    track.style.transform = `translate3d(${-index * width}px, 0, 0)`;
    TABS.forEach((tab, idx) => {
      tabButtons[tab].classList.toggle("active", idx === index);
    });
    if (!fromSwipe) {
      content.scrollTo({ left: 0, top: 0, behavior: "instant" });
    }
  }

  TABS.forEach((tab, idx) => {
    tabButtons[tab].addEventListener("click", () => setActive(idx));
  });

  let startX = 0;
  let startY = 0;
  let startTranslate = 0;
  let isTracking = false;
  let isDragging = false;

  function layoutTrack() {
    const width = content.clientWidth || 1;
    track.style.width = `${width * TABS.length}px`;
    [congesPage, periodsPage].forEach((page) => {
      page.style.width = `${width}px`;
    });
    setActive(activeIndex, true);
  }

  track.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
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
    (e) => {
      if (!isTracking) return;
      const touch = e.touches[0];
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

      e.preventDefault();

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

  track.addEventListener("touchend", (e) => {
    if (!isTracking) return;
    isTracking = false;
    track.classList.remove("dragging");
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const width = content.clientWidth || 1;
    const threshold = width * 0.2;
    if (Math.abs(deltaX) < threshold) {
      setActive(activeIndex, true);
      return;
    }
    if (deltaX < 0 && activeIndex < TABS.length - 1) {
      setActive(activeIndex + 1, true);
    } else if (deltaX > 0 && activeIndex > 0) {
      setActive(activeIndex - 1, true);
    } else {
      setActive(activeIndex, true);
    }
  });

  window.addEventListener("resize", () => layoutTrack());

  requestAnimationFrame(() => {
    layoutTrack();
  });

  setActive(0);
}

