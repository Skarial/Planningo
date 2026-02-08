/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import {
  fetchExchangeRequests,
  getExchangeRequestsState,
  subscribeExchangeRequests,
} from "../../state/exchange/requests-state.js";
import { getPlanningEntry } from "../../data/storage.js";
import { respondToExchangeRequest } from "../../data/exchange/requests-client.js";
import { getExchangeAuthState } from "../../state/exchange/auth-state.js";
import { selectExchangeConversationWithParticipants } from "../../state/exchange/selection-state.js";

const unsubscribeByContainer = new WeakMap();

function serviceLabel(service) {
  if (!service || typeof service !== "object") return "-";
  const kind = typeof service.kind === "string" ? service.kind : "";
  const code = typeof service.code === "string" ? service.code : "";
  const text = typeof service.text === "string" ? service.text : "";
  if (kind === "FREE_TEXT") return text || "FREE_TEXT";
  if (code) return code;
  return kind || "-";
}

function normalizeIdentifier(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function getConversationIdFromRespondResult(result) {
  const directId = normalizeIdentifier(result?.data?.conversationId);
  if (directId) return directId;

  const nestedId = normalizeIdentifier(result?.data?.conversation?.id);
  if (nestedId) return nestedId;

  const fallbackId = normalizeIdentifier(result?.data?.id);
  return fallbackId || null;
}

function askCounterProposalIndex(counterProposals) {
  const choices = counterProposals
    .map((proposal, index) => {
      const date = proposal?.wantedDateISO || "-";
      const service = serviceLabel(proposal?.wantedService);
      return `${index + 1}. ${date} / ${service}`;
    })
    .join("\n");

  const raw = prompt(
    `Choisir une contre-proposition (1-${counterProposals.length}) :\n${choices}`,
  );
  if (raw == null) return null;

  const idx = Number(raw);
  if (!Number.isInteger(idx) || idx < 1 || idx > counterProposals.length) {
    return null;
  }
  return idx - 1;
}

async function handleRespondToRequest(request) {
  const auth = getExchangeAuthState();
  const currentUser = auth?.currentUser || null;

  if (!currentUser || !currentUser.id) {
    alert("Connexion requise");
    return;
  }

  const ownerId = normalizeIdentifier(request?.owner?.id);
  const currentUserId = normalizeIdentifier(currentUser.id);

  if (ownerId && currentUserId && ownerId === currentUserId) {
    alert("Vous ne pouvez pas repondre a votre propre demande");
    return;
  }

  const counterProposals = Array.isArray(request?.counterProposals)
    ? request.counterProposals
    : [];
  if (counterProposals.length === 0) {
    alert("Aucune contre-proposition");
    return;
  }

  const chosenIndex = askCounterProposalIndex(counterProposals);
  if (chosenIndex == null) {
    return;
  }

  const chosenProposal = counterProposals[chosenIndex];
  const wantedDateISO = chosenProposal?.wantedDateISO || "";
  const wantedService = chosenProposal?.wantedService || null;

  if (!wantedDateISO || !wantedService) {
    alert("Contre-proposition invalide");
    return;
  }

  const planningEntry = await getPlanningEntry(wantedDateISO);
  if (!planningEntry) {
    alert(`Planning non renseigné sur ${wantedDateISO}`);
    return;
  }

  const requestId = normalizeIdentifier(request?.id);
  const respondResult = await respondToExchangeRequest(requestId, {
    wantedDateISO,
    wantedService,
  });

  if (!respondResult.ok) {
    alert(respondResult.error?.message || "Erreur lors de la reponse");
    return;
  }

  const conversationId = getConversationIdFromRespondResult(respondResult);
  if (!conversationId) {
    alert("Conversation creee, mais identifiant introuvable");
    return;
  }

  const owner = request?.owner || {};
  const ownerPrenom =
    typeof owner.prenom === "string" ? owner.prenom.trim() : "";
  const ownerNom = typeof owner.nom === "string" ? owner.nom.trim() : "";
  const currentUserPrenom =
    typeof currentUser.prenom === "string" ? currentUser.prenom.trim() : "";
  const currentUserNom =
    typeof currentUser.nom === "string" ? currentUser.nom.trim() : "";

  const participantsMap = {};
  const ownerDisplayName = `${ownerPrenom} ${ownerNom}`.trim();
  if (ownerId && ownerDisplayName) {
    participantsMap[ownerId] = ownerDisplayName;
  }
  const currentUserDisplayName = `${currentUserPrenom} ${currentUserNom}`.trim();
  if (currentUserId && currentUserDisplayName) {
    participantsMap[currentUserId] = currentUserDisplayName;
  }

  const selectionResult = selectExchangeConversationWithParticipants(
    conversationId,
    participantsMap,
  );
  if (!selectionResult.ok) {
    alert(selectionResult.error?.message || "Erreur de selection conversation");
    return;
  }
}

function createRequestItem(request) {
  const item = document.createElement("li");
  item.className = "settings-period";

  const title = document.createElement("div");
  title.className = "settings-period-title";
  const owner = request?.owner || {};
  const ownerName = `${owner.prenom || ""} ${owner.nom || ""}`.trim() || "Inconnu";
  title.textContent = ownerName;
  item.appendChild(title);

  const offered = document.createElement("div");
  offered.className = "settings-note";
  offered.textContent = `Offre: ${request?.offeredDateISO || "-"} / ${serviceLabel(
    request?.offeredService,
  )}`;
  item.appendChild(offered);

  const proposals = document.createElement("div");
  proposals.className = "settings-note";
  const count = Array.isArray(request?.counterProposals)
    ? request.counterProposals.length
    : 0;
  proposals.textContent = `Contre-propositions: ${count}`;
  item.appendChild(proposals);

  const respondButton = document.createElement("button");
  respondButton.type = "button";
  respondButton.className = "settings-btn primary";
  respondButton.textContent = "Repondre";
  respondButton.addEventListener("click", () => {
    void handleRespondToRequest(request);
  });
  item.appendChild(respondButton);

  return item;
}

export function renderExchangeRequestsList(container) {
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
  title.textContent = "Demandes publiques";

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

  const render = (currentState) => {
    if (currentState.status === "loading") {
      statusText.textContent = "Chargement...";
    } else if (currentState.status === "error") {
      statusText.textContent =
        currentState.error?.message || "Erreur de chargement";
    } else if (currentState.status === "ready") {
      statusText.textContent = `Page ${currentState.page}`;
    } else {
      statusText.textContent = "";
    }

    list.innerHTML = "";
    const items = Array.isArray(currentState.items) ? currentState.items : [];
    if (items.length === 0 && currentState.status === "ready") {
      const empty = document.createElement("li");
      empty.className = "settings-note";
      empty.textContent = "Aucune demande";
      list.appendChild(empty);
      return;
    }

    items.forEach((request) => {
      list.appendChild(createRequestItem(request));
    });
  };

  refreshButton.addEventListener("click", () => {
    const current = getExchangeRequestsState();
    void fetchExchangeRequests({ page: current.page || 1 });
  });

  const unsubscribe = subscribeExchangeRequests((nextState) => {
    render(nextState);
  });
  unsubscribeByContainer.set(container, unsubscribe);

  const initialState = getExchangeRequestsState();
  render(initialState);
  void fetchExchangeRequests({ page: initialState.page || 1 });
}
