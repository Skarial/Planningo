/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import "./pwa/pwa-integrity.test.js";
import "./ui/ui-smoke.test.js";

import { runAllTests, summary } from "./run-tests.js";

await runAllTests();
summary();
