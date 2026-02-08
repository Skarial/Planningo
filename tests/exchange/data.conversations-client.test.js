/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  acceptExchangeConversation,
  chooseExchangeConversation,
  listExchangeMessages,
  sendExchangeMessage,
} from "../../js/data/exchange/conversations-client.js";

test("exchange conversations-client - choose requires conversationId", async () => {
  const result = await chooseExchangeConversation("   ", {});
  assert(result.ok === false, "choose without id should fail");
  assert(result.error.code === "CONVERSATION_ID_REQUIRED", "error code mismatch");
});

test("exchange conversations-client - accept requires conversationId", async () => {
  const result = await acceptExchangeConversation("   ");
  assert(result.ok === false, "accept without id should fail");
  assert(result.error.code === "CONVERSATION_ID_REQUIRED", "error code mismatch");
});

test("exchange conversations-client - send message requires conversationId", async () => {
  const result = await sendExchangeMessage("", { body: "hello" });
  assert(result.ok === false, "send without id should fail");
  assert(result.error.code === "CONVERSATION_ID_REQUIRED", "error code mismatch");
});

test("exchange conversations-client - list messages requires conversationId", async () => {
  const result = await listExchangeMessages("", {});
  assert(result.ok === false, "list messages without id should fail");
  assert(result.error.code === "CONVERSATION_ID_REQUIRED", "error code mismatch");
});
