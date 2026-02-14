/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { showToast } from "../components/ui-toast.js";

const INSTALL_KEY = "__planningo_ui_feedback_installed__";
const listenerMap = new WeakMap();

function isThenable(value) {
  return Boolean(value) && typeof value.then === "function";
}

function resolveButton(context, event) {
  if (context instanceof HTMLButtonElement) return context;
  const target = event?.target;
  if (target && typeof target.closest === "function") {
    return target.closest("button");
  }
  return null;
}

function beginButtonLoading(button) {
  const currentCount = Number(button.dataset.uiLoadingCount || "0");
  const nextCount = currentCount + 1;
  button.dataset.uiLoadingCount = String(nextCount);

  if (nextCount === 1) {
    button.dataset.uiLoadingWasDisabled = button.disabled ? "1" : "0";
    if (!button.disabled) {
      button.disabled = true;
    }
    button.classList.add("ui-loading");
    button.setAttribute("aria-busy", "true");
  }

  return () => {
    const count = Number(button.dataset.uiLoadingCount || "1");
    const rest = Math.max(0, count - 1);
    button.dataset.uiLoadingCount = String(rest);
    if (rest > 0) return;

    const wasDisabled = button.dataset.uiLoadingWasDisabled === "1";
    button.classList.remove("ui-loading");
    button.removeAttribute("aria-busy");
    if (!wasDisabled) {
      button.disabled = false;
    }
    delete button.dataset.uiLoadingCount;
    delete button.dataset.uiLoadingWasDisabled;
  };
}

function shouldShowSuccessToast(button) {
  if (!button || button.dataset.uiSuccess === "off") return false;
  if (button.dataset.uiSuccessText) return true;

  const label = String(button.textContent || "")
    .trim()
    .toLowerCase();
  return /(enregistrer|sauvegarder|valider|appliquer)/.test(label);
}

function showSuccessToastFor(button) {
  const text = button?.dataset?.uiSuccessText || "Enregistré";
  showToast(text, 1500);
}

function createWrappedClickListener(listener) {
  return function wrappedClickListener(event) {
    const result = listener.call(this, event);
    if (!isThenable(result)) return result;

    const button = resolveButton(this, event);
    if (!button) return result;

    const endLoading = beginButtonLoading(button);

    return Promise.resolve(result)
      .then((value) => {
        if (shouldShowSuccessToast(button)) {
          showSuccessToastFor(button);
        }
        return value;
      })
      .finally(() => {
        endLoading();
      });
  };
}

function patchAsyncButtonClicks() {
  const proto = EventTarget.prototype;
  if (proto.__planningoAsyncClickPatched) return;
  proto.__planningoAsyncClickPatched = true;

  const nativeAdd = proto.addEventListener;
  const nativeRemove = proto.removeEventListener;

  proto.addEventListener = function patchedAddEventListener(type, listener, options) {
    if (type !== "click" || typeof listener !== "function") {
      return nativeAdd.call(this, type, listener, options);
    }

    let wrapped = listenerMap.get(listener);
    if (!wrapped) {
      wrapped = createWrappedClickListener(listener);
      listenerMap.set(listener, wrapped);
    }
    return nativeAdd.call(this, type, wrapped, options);
  };

  proto.removeEventListener = function patchedRemoveEventListener(type, listener, options) {
    if (type === "click" && typeof listener === "function") {
      const wrapped = listenerMap.get(listener);
      if (wrapped) {
        return nativeRemove.call(this, type, wrapped, options);
      }
    }
    return nativeRemove.call(this, type, listener, options);
  };
}

function installPressedFeedback() {
  let activeBtn = null;

  const clearActive = () => {
    if (!activeBtn) return;
    activeBtn.classList.remove("ui-pressed");
    activeBtn = null;
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      clearActive();
      const nextBtn = event.target?.closest?.("button");
      if (!nextBtn || nextBtn.disabled) return;
      activeBtn = nextBtn;
      activeBtn.classList.add("ui-pressed");
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerup",
    () => {
      clearActive();
    },
    { passive: true },
  );

  document.addEventListener(
    "pointercancel",
    () => {
      clearActive();
    },
    { passive: true },
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const btn = event.target?.closest?.("button");
      if (!btn || btn.disabled) return;
      btn.classList.add("ui-pressed");
    },
    { passive: true },
  );

  document.addEventListener(
    "keyup",
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const btn = event.target?.closest?.("button");
      if (!btn) return;
      btn.classList.remove("ui-pressed");
    },
    { passive: true },
  );
}

export function installGlobalUiFeedback() {
  if (window[INSTALL_KEY]) return;
  window[INSTALL_KEY] = true;

  installPressedFeedback();
  patchAsyncButtonClicks();
}
