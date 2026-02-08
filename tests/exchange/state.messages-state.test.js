/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import { bootstrapExchangeAuth, loginExchangeAction } from "../../js/state/exchange/auth-state.js";
import {
  enqueuePendingMessage,
  flushPendingMessages,
  getExchangeMessagesState,
  resetExchangeMessages,
  sendMessageAction,
} from "../../js/state/exchange/messages-state.js";
import { installFetchMock, resetTestStorage } from "./test-helpers.js";

async function authenticateForMessagesTests() {
  installFetchMock([
    {
      method: "POST",
      path: "/api/auth/login",
      status: 200,
      body: {
        token: "token-messages",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    },
    {
      method: "GET",
      path: "/api/me",
      status: 200,
      body: {
        user: { id: "u-msg", prenom: "Eve", nom: "Doe" },
      },
    },
  ]);

  const result = await loginExchangeAction({
    email: "eve@example.test",
    password: "password",
  });
  assert(result.ok === true, "auth precondition should succeed");
}

test("exchange messages-state - sendMessageAction requires authentication", async () => {
  resetTestStorage();
  resetExchangeMessages();
  await bootstrapExchangeAuth();

  const result = await sendMessageAction("conv-auth", {
    clientMessageId: "m-auth",
    body: "hello",
  });

  assert(result.ok === false, "send should fail without auth");
  assert(result.error.code === "AUTH_REQUIRED", "error code mismatch");
});

test("exchange messages-state - enqueue deduplicates by clientMessageId", () => {
  resetExchangeMessages();

  const first = enqueuePendingMessage("conv-local", {
    clientMessageId: "m-dup",
    body: "hello",
  });
  const second = enqueuePendingMessage("conv-local", {
    clientMessageId: "m-dup",
    body: "hello",
  });

  assert(first.ok === true, "first enqueue should succeed");
  assert(second.ok === true, "second enqueue should succeed");
  assert(second.data.pendingCount === 1, "pending should stay deduplicated");
});

test("exchange messages-state - queue on network error and flush pending", async () => {
  resetTestStorage();
  resetExchangeMessages();
  await authenticateForMessagesTests();

  installFetchMock([
    {
      method: "POST",
      path: "/api/exchanges/conversations/conv-1/message",
      type: "network_error",
      times: 2,
    },
  ]);

  const payload = { clientMessageId: "m-1", body: "Bonjour" };
  const send1 = await sendMessageAction("conv-1", payload);
  const send2 = await sendMessageAction("conv-1", payload);

  assert(send1.ok === false, "send1 should fail on network error");
  assert(send2.ok === false, "send2 should fail on network error");

  let state = getExchangeMessagesState();
  assert(
    (state.pendingByConversation["conv-1"] || []).length === 1,
    "pending queue should be deduplicated to one message",
  );

  installFetchMock([
    {
      method: "POST",
      path: "/api/exchanges/conversations/conv-1/message",
      status: 201,
      body: { id: "srv-m-1" },
    },
    {
      method: "GET",
      path: "/api/exchanges/conversations/conv-1/messages",
      status: 200,
      body: {
        items: [{ id: "srv-m-1", senderUserId: "u-msg", body: "Bonjour" }],
      },
    },
  ]);

  const flushed = await flushPendingMessages("conv-1");
  assert(flushed.ok === true, "flush should succeed");
  assert(flushed.data.flushed === 1, "flush count mismatch");

  state = getExchangeMessagesState();
  assert(
    (state.pendingByConversation["conv-1"] || []).length === 0,
    "pending queue should be empty after flush",
  );
  assert(
    (state.itemsByConversation["conv-1"] || []).length === 1,
    "messages should be refreshed after flush",
  );
});
