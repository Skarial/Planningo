/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const listeners = new Set();

const state = {
  selectedConversationId: null,
  selectedParticipants: null,
};

function cloneState() {
  return {
    selectedConversationId: state.selectedConversationId,
    selectedParticipants: state.selectedParticipants ? { ...state.selectedParticipants } : null,
  };
}

function notify() {
  const snapshot = cloneState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

export function getExchangeSelectionState() {
  return cloneState();
}

export function subscribeExchangeSelection(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function selectExchangeConversation(conversationId) {
  if (typeof conversationId !== "string") {
    return {
      ok: false,
      error: {
        code: "CONVERSATION_ID_INVALID_TYPE",
        message: "conversationId doit etre une chaine",
        field: "conversationId",
      },
    };
  }

  const normalizedConversationId = conversationId.trim();
  if (!normalizedConversationId) {
    return {
      ok: false,
      error: {
        code: "CONVERSATION_ID_REQUIRED",
        message: "conversationId est requis",
        field: "conversationId",
      },
    };
  }

  state.selectedConversationId = normalizedConversationId;
  state.selectedParticipants = null;
  notify();

  return {
    ok: true,
    data: { selectedConversationId: normalizedConversationId },
  };
}

export function selectExchangeConversationWithParticipants(conversationId, participantsMap) {
  if (typeof conversationId !== "string") {
    return {
      ok: false,
      error: {
        code: "CONVERSATION_ID_INVALID_TYPE",
        message: "conversationId doit etre une chaine",
        field: "conversationId",
      },
    };
  }

  const normalizedConversationId = conversationId.trim();
  if (!normalizedConversationId) {
    return {
      ok: false,
      error: {
        code: "CONVERSATION_ID_REQUIRED",
        message: "conversationId est requis",
        field: "conversationId",
      },
    };
  }

  if (!participantsMap || typeof participantsMap !== "object" || Array.isArray(participantsMap)) {
    return {
      ok: false,
      error: {
        code: "PARTICIPANTS_MAP_INVALID",
        message: "participantsMap doit etre un objet",
        field: "participantsMap",
      },
    };
  }

  const normalizedParticipants = {};
  Object.entries(participantsMap).forEach(([rawUserId, rawDisplayName]) => {
    const userId = typeof rawUserId === "string" ? rawUserId.trim() : "";
    const displayName = typeof rawDisplayName === "string" ? rawDisplayName.trim() : "";
    if (userId && displayName) {
      normalizedParticipants[userId] = displayName;
    }
  });

  if (Object.keys(normalizedParticipants).length === 0) {
    return {
      ok: false,
      error: {
        code: "PARTICIPANTS_MAP_EMPTY",
        message: "participantsMap est vide",
        field: "participantsMap",
      },
    };
  }

  state.selectedConversationId = normalizedConversationId;
  state.selectedParticipants = normalizedParticipants;
  notify();

  return {
    ok: true,
    data: {
      selectedConversationId: normalizedConversationId,
      selectedParticipants: normalizedParticipants,
    },
  };
}

export function clearExchangeConversationSelection() {
  state.selectedConversationId = null;
  state.selectedParticipants = null;
  notify();
  return {
    ok: true,
    data: {
      selectedConversationId: null,
      selectedParticipants: null,
    },
  };
}
