/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { normalizeServiceValue } from "./service-value.js";

export const EXCHANGE_MAX_COUNTER_PROPOSALS = 5;

function buildError(code, message, field) {
  return { code, message, field };
}

function isValidDateISO(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function proposalSignature(proposal) {
  const serviceCode = proposal.wantedService.code || "";
  const serviceText = (proposal.wantedService.text || "").trim();
  return [
    proposal.wantedDateISO,
    proposal.wantedService.kind,
    serviceCode,
    serviceText.toLowerCase(),
  ].join("|");
}

export function validateCreateExchangeRequest(input, options = {}) {
  const maxCounterProposals = options.maxCounterProposals ?? EXCHANGE_MAX_COUNTER_PROPOSALS;

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      error: buildError("REQUEST_INVALID_TYPE", "Payload invalide: objet attendu", "request"),
    };
  }

  if (!isValidDateISO(input.offeredDateISO)) {
    return {
      ok: false,
      error: buildError(
        "REQUEST_OFFERED_DATE_INVALID",
        "offeredDateISO doit etre une date ISO YYYY-MM-DD valide",
        "offeredDateISO",
      ),
    };
  }

  const normalizedOfferedService = normalizeServiceValue(input.offeredService, "offeredService");
  if (!normalizedOfferedService.ok) {
    return normalizedOfferedService;
  }

  if (!Array.isArray(input.counterProposals)) {
    return {
      ok: false,
      error: buildError(
        "REQUEST_COUNTER_PROPOSALS_INVALID_TYPE",
        "counterProposals doit etre un tableau",
        "counterProposals",
      ),
    };
  }

  if (input.counterProposals.length === 0) {
    return {
      ok: false,
      error: buildError(
        "REQUEST_COUNTER_PROPOSALS_REQUIRED",
        "Au moins une contre-proposition est requise",
        "counterProposals",
      ),
    };
  }

  if (input.counterProposals.length > maxCounterProposals) {
    return {
      ok: false,
      error: buildError(
        "REQUEST_COUNTER_PROPOSALS_TOO_MANY",
        `Maximum ${maxCounterProposals} contre-propositions`,
        "counterProposals",
      ),
    };
  }

  const normalizedCounterProposals = [];
  const seenProposals = new Set();

  for (let i = 0; i < input.counterProposals.length; i += 1) {
    const rawProposal = input.counterProposals[i];
    const itemField = `counterProposals[${i}]`;

    if (!rawProposal || typeof rawProposal !== "object" || Array.isArray(rawProposal)) {
      return {
        ok: false,
        error: buildError(
          "REQUEST_COUNTER_PROPOSAL_INVALID_TYPE",
          "Chaque contre-proposition doit etre un objet",
          itemField,
        ),
      };
    }

    if (!isValidDateISO(rawProposal.wantedDateISO)) {
      return {
        ok: false,
        error: buildError(
          "REQUEST_WANTED_DATE_INVALID",
          "wantedDateISO doit etre une date ISO YYYY-MM-DD valide",
          `${itemField}.wantedDateISO`,
        ),
      };
    }

    const normalizedWantedService = normalizeServiceValue(
      rawProposal.wantedService,
      `${itemField}.wantedService`,
    );
    if (!normalizedWantedService.ok) {
      return normalizedWantedService;
    }

    const normalizedProposal = {
      wantedDateISO: rawProposal.wantedDateISO,
      wantedService: normalizedWantedService.value,
    };

    const signature = proposalSignature(normalizedProposal);
    if (seenProposals.has(signature)) {
      return {
        ok: false,
        error: buildError(
          "REQUEST_COUNTER_PROPOSAL_DUPLICATE",
          "Contre-proposition dupliquee",
          itemField,
        ),
      };
    }

    seenProposals.add(signature);
    normalizedCounterProposals.push(normalizedProposal);
  }

  return {
    ok: true,
    value: {
      offeredDateISO: input.offeredDateISO,
      offeredService: normalizedOfferedService.value,
      counterProposals: normalizedCounterProposals,
    },
  };
}
