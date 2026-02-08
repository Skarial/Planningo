/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export const EXCHANGE_SERVICE_KIND = Object.freeze({
  CATALOG: "CATALOG",
  REST: "REST",
  FREE_TEXT: "FREE_TEXT",
});

export const EXCHANGE_SERVICE_KINDS = Object.freeze(
  Object.values(EXCHANGE_SERVICE_KIND),
);

function buildError(code, message, field) {
  return { code, message, field };
}

function asTrimmedString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function isBlank(value) {
  return asTrimmedString(value).length === 0;
}

function normalizeKind(value) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

export function normalizeServiceValue(input, fieldPrefix = "service") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      error: buildError(
        "SERVICE_INVALID_TYPE",
        "Service invalide: objet attendu",
        fieldPrefix,
      ),
    };
  }

  const kind = normalizeKind(input.kind);
  const code = asTrimmedString(input.code);
  const text = asTrimmedString(input.text);

  if (!EXCHANGE_SERVICE_KINDS.includes(kind)) {
    return {
      ok: false,
      error: buildError(
        "SERVICE_KIND_INVALID",
        "kind doit etre CATALOG, REST ou FREE_TEXT",
        `${fieldPrefix}.kind`,
      ),
    };
  }

  if (kind === EXCHANGE_SERVICE_KIND.CATALOG) {
    if (isBlank(code)) {
      return {
        ok: false,
        error: buildError(
          "SERVICE_CODE_REQUIRED",
          "code est requis pour CATALOG",
          `${fieldPrefix}.code`,
        ),
      };
    }
    if (!isBlank(text)) {
      return {
        ok: false,
        error: buildError(
          "SERVICE_TEXT_FORBIDDEN",
          "text doit etre vide pour CATALOG",
          `${fieldPrefix}.text`,
        ),
      };
    }
    return {
      ok: true,
      value: {
        kind,
        code,
        text: null,
      },
    };
  }

  if (kind === EXCHANGE_SERVICE_KIND.REST) {
    if (isBlank(code)) {
      return {
        ok: false,
        error: buildError(
          "SERVICE_CODE_REQUIRED",
          "code est requis pour REST",
          `${fieldPrefix}.code`,
        ),
      };
    }
    if (code.toUpperCase() !== EXCHANGE_SERVICE_KIND.REST) {
      return {
        ok: false,
        error: buildError(
          "SERVICE_CODE_INVALID",
          "code doit etre REST quand kind=REST",
          `${fieldPrefix}.code`,
        ),
      };
    }
    if (!isBlank(text)) {
      return {
        ok: false,
        error: buildError(
          "SERVICE_TEXT_FORBIDDEN",
          "text doit etre vide pour REST",
          `${fieldPrefix}.text`,
        ),
      };
    }
    return {
      ok: true,
      value: {
        kind,
        code: EXCHANGE_SERVICE_KIND.REST,
        text: null,
      },
    };
  }

  if (isBlank(text)) {
    return {
      ok: false,
      error: buildError(
        "SERVICE_TEXT_REQUIRED",
        "text est requis pour FREE_TEXT",
        `${fieldPrefix}.text`,
      ),
    };
  }
  if (!isBlank(code)) {
    return {
      ok: false,
      error: buildError(
        "SERVICE_CODE_FORBIDDEN",
        "code doit etre vide pour FREE_TEXT",
        `${fieldPrefix}.code`,
      ),
    };
  }

  return {
    ok: true,
    value: {
      kind,
      code: null,
      text,
    },
  };
}

export function isValidServiceValue(input) {
  return normalizeServiceValue(input).ok;
}
