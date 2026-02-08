/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  clearExchangeConversationSelection,
  getExchangeSelectionState,
  selectExchangeConversationWithParticipants,
} from "../../js/state/exchange/selection-state.js";

test("exchange selection-state - select with participants", () => {
  clearExchangeConversationSelection();

  const result = selectExchangeConversationWithParticipants("conv-1", {
    u1: "Alice Doe",
    u2: "Bob Doe",
  });

  assert(result.ok === true, "selection should succeed");
  const state = getExchangeSelectionState();
  assert(state.selectedConversationId === "conv-1", "conversationId mismatch");
  assert(state.selectedParticipants.u1 === "Alice Doe", "participant u1 mismatch");
  assert(state.selectedParticipants.u2 === "Bob Doe", "participant u2 mismatch");
});

test("exchange selection-state - invalid participants map rejected", () => {
  clearExchangeConversationSelection();

  const result = selectExchangeConversationWithParticipants("conv-2", {});
  assert(result.ok === false, "empty participants should fail");
  assert(result.error.code === "PARTICIPANTS_MAP_EMPTY", "error code mismatch");
});

test("exchange selection-state - clear resets state", () => {
  selectExchangeConversationWithParticipants("conv-3", { u3: "Cara Doe" });
  const cleared = clearExchangeConversationSelection();
  assert(cleared.ok === true, "clear should succeed");

  const state = getExchangeSelectionState();
  assert(state.selectedConversationId === null, "conversationId should be null");
  assert(state.selectedParticipants === null, "participants should be null");
});
