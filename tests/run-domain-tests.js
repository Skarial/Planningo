/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import "./exchange/setup-env.js";
import "./domain/periods.test.js";
import "./domain/conges.test.js";
import "./domain/storage.memory.test.js";
import "./domain/alarm-plan.test.js";
import "./domain/alarm-auto-import.test.js";
import "./domain/alarm-resync.test.js";
import "./domain/day-edit.test.js";
import "./domain/daily-rest-warning.test.js";
import "./exchange/domain.service-value.test.js";
import "./exchange/domain.request-rules.test.js";
import "./exchange/domain.message-rules.test.js";
import "./exchange/domain.conversation-rules.test.js";
import "./exchange/data.http-client.test.js";
import "./exchange/data.requests-client.test.js";
import "./exchange/data.conversations-client.test.js";
import "./exchange/state.selection-state.test.js";
import "./exchange/state.auth-state.test.js";
import "./exchange/state.messages-state.test.js";
import "./exchange/router.guard.test.js";

import { runAllTests, summary } from "./run-tests.js";
import "./domain/month-calendar-state.test.js";

await runAllTests();
summary();
