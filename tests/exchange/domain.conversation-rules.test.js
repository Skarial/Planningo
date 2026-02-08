/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  EXCHANGE_CONVERSATION_STATUS,
  applyAccept,
  applyChoose,
  canAcceptConversation,
  canChooseConversation,
} from "../../js/domain/exchange/conversation-rules.js";

function createConversation() {
  return {
    id: "conv-1",
    status: EXCHANGE_CONVERSATION_STATUS.ACTIVE,
    acceptedByA: false,
    acceptedByB: false,
  };
}

test("exchange conversation-rules - choose allowed only for role A on active", () => {
  const conversation = createConversation();
  assert(canChooseConversation(conversation, "A") === true, "A should choose active");
  assert(canChooseConversation(conversation, "B") === false, "B should not choose");
});

test("exchange conversation-rules - applyChoose locks conversation", () => {
  const conversation = createConversation();
  const nowISO = "2026-02-08T10:00:00.000Z";
  const result = applyChoose(conversation, nowISO);

  assert(result.ok === true, "applyChoose should succeed");
  assert(
    result.value.status === EXCHANGE_CONVERSATION_STATUS.LOCKED,
    "status should be locked",
  );
  assert(result.value.lockedAt === nowISO, "lockedAt mismatch");
  assert(result.value.acceptedByA === false, "acceptedByA should reset");
  assert(result.value.acceptedByB === false, "acceptedByB should reset");
});

test("exchange conversation-rules - applyAccept closes when both accepted", () => {
  const lockedConversation = {
    id: "conv-2",
    status: EXCHANGE_CONVERSATION_STATUS.LOCKED,
    acceptedByA: false,
    acceptedByB: false,
  };

  const first = applyAccept(lockedConversation, "A", "2026-02-08T10:01:00.000Z");
  assert(first.ok === true, "first accept should succeed");
  assert(first.value.status === EXCHANGE_CONVERSATION_STATUS.LOCKED, "still locked");
  assert(canAcceptConversation(first.value) === true, "second accept should remain possible");

  const second = applyAccept(first.value, "B", "2026-02-08T10:02:00.000Z");
  assert(second.ok === true, "second accept should succeed");
  assert(second.bothAccepted === true, "bothAccepted should be true");
  assert(
    second.value.status === EXCHANGE_CONVERSATION_STATUS.CLOSED,
    "status should be closed",
  );
});

test("exchange conversation-rules - applyAccept rejects invalid role", () => {
  const conversation = {
    id: "conv-3",
    status: EXCHANGE_CONVERSATION_STATUS.LOCKED,
    acceptedByA: false,
    acceptedByB: false,
  };

  const result = applyAccept(conversation, "C", "2026-02-08T10:03:00.000Z");
  assert(result.ok === false, "invalid role should fail");
  assert(
    result.error.code === "CONVERSATION_ACCEPT_WHO_INVALID",
    "error code mismatch",
  );
});
