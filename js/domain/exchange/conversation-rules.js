/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export const EXCHANGE_CONVERSATION_STATUS = Object.freeze({
  ACTIVE: "active",
  LOCKED: "locked",
  CLOSED: "closed",
});

function buildError(code, message, field) {
  return { code, message, field };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeRole(role) {
  if (typeof role !== "string") return "";
  return role.trim().toUpperCase();
}

function normalizeStatus(status) {
  if (typeof status !== "string") return "";
  return status.trim().toLowerCase();
}

function toBool(value) {
  return value === true || value === 1;
}

function isValidNowISO(nowISO) {
  return asTrimmedString(nowISO).length > 0;
}

export function canChooseConversation(conversation, role) {
  if (!isObject(conversation)) return false;
  return (
    normalizeRole(role) === "A" &&
    normalizeStatus(conversation.status) === EXCHANGE_CONVERSATION_STATUS.ACTIVE
  );
}

export function canAcceptConversation(conversation) {
  if (!isObject(conversation)) return false;
  if (
    normalizeStatus(conversation.status) !== EXCHANGE_CONVERSATION_STATUS.LOCKED
  ) {
    return false;
  }
  return !(toBool(conversation.acceptedByA) && toBool(conversation.acceptedByB));
}

export function applyChoose(conversation, nowISO) {
  if (!isObject(conversation)) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_INVALID_TYPE",
        "conversation invalide: objet attendu",
        "conversation",
      ),
    };
  }

  if (!isValidNowISO(nowISO)) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_NOW_ISO_REQUIRED",
        "nowISO est requis",
        "nowISO",
      ),
    };
  }

  if (normalizeStatus(conversation.status) !== EXCHANGE_CONVERSATION_STATUS.ACTIVE) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_CHOOSE_NOT_ALLOWED",
        "Choix impossible: conversation non active",
        "conversation.status",
      ),
    };
  }

  return {
    ok: true,
    value: {
      ...conversation,
      status: EXCHANGE_CONVERSATION_STATUS.LOCKED,
      acceptedByA: false,
      acceptedByB: false,
      lockedAt: nowISO,
      updatedAt: nowISO,
    },
  };
}

export function applyAccept(conversation, who, nowISO) {
  if (!isObject(conversation)) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_INVALID_TYPE",
        "conversation invalide: objet attendu",
        "conversation",
      ),
    };
  }

  const normalizedWho = normalizeRole(who);
  if (normalizedWho !== "A" && normalizedWho !== "B") {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_ACCEPT_WHO_INVALID",
        "who doit etre A ou B",
        "who",
      ),
    };
  }

  if (!isValidNowISO(nowISO)) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_NOW_ISO_REQUIRED",
        "nowISO est requis",
        "nowISO",
      ),
    };
  }

  if (!canAcceptConversation(conversation)) {
    return {
      ok: false,
      error: buildError(
        "CONVERSATION_ACCEPT_NOT_ALLOWED",
        "Acceptation impossible dans l'etat courant",
        "conversation.status",
      ),
    };
  }

  const next = {
    ...conversation,
    acceptedByA: toBool(conversation.acceptedByA),
    acceptedByB: toBool(conversation.acceptedByB),
    updatedAt: nowISO,
  };

  if (normalizedWho === "A") {
    next.acceptedByA = true;
  } else {
    next.acceptedByB = true;
  }

  const bothAccepted = next.acceptedByA && next.acceptedByB;
  if (bothAccepted) {
    next.status = EXCHANGE_CONVERSATION_STATUS.CLOSED;
    next.closedAt = nowISO;
  } else {
    next.status = EXCHANGE_CONVERSATION_STATUS.LOCKED;
  }

  return {
    ok: true,
    value: next,
    bothAccepted,
  };
}
