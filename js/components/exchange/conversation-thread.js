/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import {
  fetchConversationMessages,
  flushPendingMessages,
  getExchangeMessagesState,
  sendMessageAction,
  subscribeExchangeMessages,
} from "../../state/exchange/messages-state.js";

const unsubscribeByContainer = new WeakMap();

function normalizeConversationId(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function generateClientMessageId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getConversationSlice(conversationId) {
  const fullState = getExchangeMessagesState();
  const status = fullState.statusByConversation?.[conversationId] || "idle";
  const items = Array.isArray(fullState.itemsByConversation?.[conversationId])
    ? fullState.itemsByConversation[conversationId]
    : [];
  const pending = Array.isArray(fullState.pendingByConversation?.[conversationId])
    ? fullState.pendingByConversation[conversationId]
    : [];
  const error = fullState.errorByConversation?.[conversationId] || null;
  return { status, items, pending, error };
}

function createMessageItem(message, participantsMap) {
  const li = document.createElement("li");
  li.className = "settings-period";
  const sender = document.createElement("div");
  sender.className = "settings-period-title";
  const senderUserId = typeof message?.senderUserId === "string" ? message.senderUserId.trim() : "";
  const senderDisplayName =
    senderUserId &&
    participantsMap &&
    typeof participantsMap === "object" &&
    typeof participantsMap[senderUserId] === "string"
      ? participantsMap[senderUserId]
      : "";
  sender.textContent = `De: ${senderDisplayName || senderUserId || "-"}`;
  const body = document.createElement("div");
  body.className = "settings-note";
  body.textContent = message?.body || "";
  li.appendChild(sender);
  li.appendChild(body);
  return li;
}

export function renderExchangeConversationThread(
  container,
  conversationId,
  participantsMap = null,
) {
  if (!container) return;

  const previousUnsubscribe = unsubscribeByContainer.get(container);
  if (typeof previousUnsubscribe === "function") {
    previousUnsubscribe();
  }

  const normalizedConversationId = normalizeConversationId(conversationId);
  container.innerHTML = "";

  if (!normalizedConversationId) {
    const invalid = document.createElement("p");
    invalid.textContent = "Conversation invalide";
    container.appendChild(invalid);
    return;
  }

  const statusText = document.createElement("p");
  statusText.className = "settings-status";
  const list = document.createElement("ul");
  list.className = "settings-periods";
  list.style.listStyle = "none";
  list.style.margin = "0";
  list.style.padding = "0";
  const composer = document.createElement("div");
  composer.className = "settings-card";
  const textarea = document.createElement("textarea");
  const sendButton = document.createElement("button");
  const flushButton = document.createElement("button");
  const actions = document.createElement("div");
  actions.className = "settings-actions";

  textarea.rows = 3;
  textarea.placeholder = "Votre message";
  textarea.style.width = "100%";
  textarea.style.boxSizing = "border-box";
  textarea.style.minHeight = "96px";
  textarea.style.border = "1px solid #d6d6d6";
  textarea.style.borderRadius = "8px";
  textarea.style.padding = "8px";
  textarea.style.background = "var(--input-bg)";

  sendButton.type = "button";
  sendButton.className = "settings-btn primary";
  sendButton.textContent = "Envoyer";

  flushButton.type = "button";
  flushButton.className = "settings-btn";
  flushButton.textContent = "Renvoyer";

  actions.appendChild(sendButton);
  composer.append(textarea, actions);

  container.appendChild(statusText);
  container.appendChild(list);
  container.appendChild(composer);

  const render = () => {
    const state = getConversationSlice(normalizedConversationId);

    if (state.status === "loading") {
      statusText.textContent = "Chargement...";
    } else if (state.status === "error") {
      statusText.textContent = state.error?.message || "Erreur";
    } else {
      statusText.textContent = "";
    }

    list.innerHTML = "";
    if (state.items.length === 0 && state.status === "ready") {
      const empty = document.createElement("li");
      empty.className = "settings-note";
      empty.textContent = "Aucun message";
      list.appendChild(empty);
    } else {
      state.items.forEach((message) => {
        list.appendChild(createMessageItem(message, participantsMap));
      });
    }

    if (state.pending.length > 0) {
      if (!flushButton.isConnected) {
        actions.appendChild(flushButton);
      }
      flushButton.textContent = `Renvoyer (${state.pending.length})`;
    } else if (flushButton.isConnected) {
      flushButton.remove();
    }
  };

  sendButton.addEventListener("click", async () => {
    const payload = {
      clientMessageId: generateClientMessageId(),
      body: textarea.value,
    };
    const result = await sendMessageAction(normalizedConversationId, payload);
    if (result.ok) {
      textarea.value = "";
    }
  });

  flushButton.addEventListener("click", async () => {
    await flushPendingMessages(normalizedConversationId);
  });

  const unsubscribe = subscribeExchangeMessages(() => {
    render();
  });
  unsubscribeByContainer.set(container, unsubscribe);

  render();
  void fetchConversationMessages(normalizedConversationId);
}
