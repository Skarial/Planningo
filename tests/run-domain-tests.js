/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import "./domain/periods.test.js";
import "./domain/conges.test.js";
import "./domain/activation.test.js";
import "./domain/storage.memory.test.js";
import "./domain/alarm-plan.test.js";

import { runAllTests, summary } from "./run-tests.js";
import "./domain/month-calendar-state.test.js";

await runAllTests();
summary();

