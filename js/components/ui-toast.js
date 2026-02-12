/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export function showToast(message, durationMs = 2200) {
  const text = typeof message === "string" ? message.trim() : "";
  if (!text) return;

  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = text;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
    }, 240);
  }, durationMs);
}
