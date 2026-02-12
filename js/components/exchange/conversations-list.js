/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import {
  fetchExchangeConversations,
  getExchangeConversationsState,
  subscribeExchangeConversations,
} from "../../state/exchange/conversations-state.js";
import { getExchangeAuthState, subscribeExchangeAuth } from "../../state/exchange/auth-state.js";
import { selectExchangeConversationWithParticipants } from "../../state/exchange/selection-state.js";

const unsubscribeByContainer = new WeakMap();

function resolveOtherUser(item, currentUser) {
  const userA = item?.userA || {};
  const userB = item?.userB || {};
  const currentUserId = currentUser && typeof currentUser.id === "string" ? currentUser.id : "";
  const userAId = typeof userA.id === "string" ? userA.id : "";
  return currentUserId && currentUserId === userAId ? userB : userA;
}

function createConversationItem(item, currentUser) {
  const li = document.createElement("li");
  li.className = "settings-period";

  const other = resolveOtherUser(item, currentUser);
  const otherName = `${other?.prenom || ""} ${other?.nom || ""}`.trim() || "Inconnu";

  const nameLine = document.createElement("div");
  nameLine.className = "settings-period-title";
  nameLine.textContent = otherName;
  li.appendChild(nameLine);

  const statusLine = document.createElement("div");
  statusLine.className = "settings-note";
  statusLine.textContent = `Statut: ${item?.status || "-"}`;
  li.appendChild(statusLine);

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "settings-btn primary";
  openButton.textContent = "Ouvrir";
  openButton.addEventListener("click", () => {
    const userAId = typeof item?.userA?.id === "string" ? item.userA.id.trim() : "";
    const userBId = typeof item?.userB?.id === "string" ? item.userB.id.trim() : "";
    const userAPrenom = typeof item?.userA?.prenom === "string" ? item.userA.prenom.trim() : "";
    const userANom = typeof item?.userA?.nom === "string" ? item.userA.nom.trim() : "";
    const userBPrenom = typeof item?.userB?.prenom === "string" ? item.userB.prenom.trim() : "";
    const userBNom = typeof item?.userB?.nom === "string" ? item.userB.nom.trim() : "";

    const participantsMap = {};
    if (userAId) {
      const displayNameA = `${userAPrenom} ${userANom}`.trim();
      if (displayNameA) {
        participantsMap[userAId] = displayNameA;
      }
    }
    if (userBId) {
      const displayNameB = `${userBPrenom} ${userBNom}`.trim();
      if (displayNameB) {
        participantsMap[userBId] = displayNameB;
      }
    }

    selectExchangeConversationWithParticipants(item?.id, participantsMap);
  });
  li.appendChild(openButton);

  return li;
}

export function renderExchangeConversationsList(container) {
  if (!container) return;

  const previousUnsubscribe = unsubscribeByContainer.get(container);
  if (typeof previousUnsubscribe === "function") {
    previousUnsubscribe();
  }

  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "settings-card";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "Conversations";

  const controls = document.createElement("div");
  controls.className = "settings-actions";
  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "settings-btn";
  refreshButton.textContent = "Rafraichir";
  controls.appendChild(refreshButton);

  const statusText = document.createElement("p");
  statusText.className = "settings-status";
  const list = document.createElement("ul");
  list.className = "settings-periods";
  list.style.listStyle = "none";
  list.style.margin = "0";
  list.style.padding = "0";

  card.append(title, controls, statusText, list);
  container.appendChild(card);

  let currentConversationsState = getExchangeConversationsState();
  let currentAuthState = getExchangeAuthState();

  const render = () => {
    const state = currentConversationsState;

    if (state.status === "loading") {
      statusText.textContent = "Chargement...";
    } else if (state.status === "error") {
      statusText.textContent = state.error?.message || "Erreur";
    } else if (state.status === "ready" && Array.isArray(state.items) && state.items.length === 0) {
      statusText.textContent = "Aucune conversation";
    } else {
      statusText.textContent = "";
    }

    list.innerHTML = "";
    const items = Array.isArray(state.items) ? state.items : [];
    items.forEach((item) => {
      list.appendChild(createConversationItem(item, currentAuthState.currentUser));
    });
  };

  refreshButton.addEventListener("click", () => {
    const state = getExchangeConversationsState();
    void fetchExchangeConversations({ page: state.page || 1 });
  });

  const unsubscribeConversations = subscribeExchangeConversations((nextState) => {
    currentConversationsState = nextState;
    render();
  });

  const unsubscribeAuth = subscribeExchangeAuth((nextAuthState) => {
    currentAuthState = nextAuthState;
    render();
  });

  unsubscribeByContainer.set(container, () => {
    unsubscribeConversations();
    unsubscribeAuth();
  });

  render();
  void fetchExchangeConversations({ page: 1 });
}
