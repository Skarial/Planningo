/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export const EXCHANGE_MESSAGE_MAX_LENGTH = 1000;
export const EXCHANGE_CLIENT_MESSAGE_ID_MAX_LENGTH = 80;

function buildError(code, message, field) {
  return { code, message, field };
}

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function validateSendMessage(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      error: buildError(
        "MESSAGE_INVALID_TYPE",
        "Payload invalide: objet attendu",
        "message",
      ),
    };
  }

  const clientMessageId = asTrimmedString(input.clientMessageId);
  const body = asTrimmedString(input.body);

  if (clientMessageId.length === 0) {
    return {
      ok: false,
      error: buildError(
        "MESSAGE_CLIENT_ID_REQUIRED",
        "clientMessageId est requis",
        "clientMessageId",
      ),
    };
  }

  if (clientMessageId.length > EXCHANGE_CLIENT_MESSAGE_ID_MAX_LENGTH) {
    return {
      ok: false,
      error: buildError(
        "MESSAGE_CLIENT_ID_TOO_LONG",
        `clientMessageId depasse ${EXCHANGE_CLIENT_MESSAGE_ID_MAX_LENGTH} caracteres`,
        "clientMessageId",
      ),
    };
  }

  if (body.length === 0) {
    return {
      ok: false,
      error: buildError(
        "MESSAGE_BODY_REQUIRED",
        "body est requis",
        "body",
      ),
    };
  }

  if (body.length > EXCHANGE_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: buildError(
        "MESSAGE_BODY_TOO_LONG",
        `body depasse ${EXCHANGE_MESSAGE_MAX_LENGTH} caracteres`,
        "body",
      ),
    };
  }

  return {
    ok: true,
    value: {
      clientMessageId,
      body,
    },
  };
}
