/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  EXCHANGE_CLIENT_MESSAGE_ID_MAX_LENGTH,
  EXCHANGE_MESSAGE_MAX_LENGTH,
  validateSendMessage,
} from "../../js/domain/exchange/message-rules.js";

test("exchange message-rules - normalize payload", () => {
  const result = validateSendMessage({
    clientMessageId: "  c-001  ",
    body: "  Bonjour  ",
  });

  assert(result.ok === true, "message payload should be valid");
  assert(result.value.clientMessageId === "c-001", "clientMessageId trim mismatch");
  assert(result.value.body === "Bonjour", "body trim mismatch");
});

test("exchange message-rules - body required", () => {
  const result = validateSendMessage({
    clientMessageId: "c-001",
    body: "   ",
  });

  assert(result.ok === false, "empty body should fail");
  assert(result.error.code === "MESSAGE_BODY_REQUIRED", "error code mismatch");
});

test("exchange message-rules - body max length", () => {
  const tooLong = "a".repeat(EXCHANGE_MESSAGE_MAX_LENGTH + 1);
  const result = validateSendMessage({
    clientMessageId: "c-001",
    body: tooLong,
  });

  assert(result.ok === false, "too long body should fail");
  assert(result.error.code === "MESSAGE_BODY_TOO_LONG", "error code mismatch");
});

test("exchange message-rules - clientMessageId max length", () => {
  const tooLong = "x".repeat(EXCHANGE_CLIENT_MESSAGE_ID_MAX_LENGTH + 1);
  const result = validateSendMessage({
    clientMessageId: tooLong,
    body: "hello",
  });

  assert(result.ok === false, "too long clientMessageId should fail");
  assert(result.error.code === "MESSAGE_CLIENT_ID_TOO_LONG", "error code mismatch");
});
