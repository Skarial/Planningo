import "./domain/periods.test.js";
import "./domain/conges.test.js";
// import "./domain/services-grouping.test.js";
import "./domain/activation.test.js";
import "./domain/storage.memory.test.js";

import { runAllTests, summary } from "./run-tests.js";
import "./domain/month-calendar.test.js";
import "./domain/month-calendar-state.test.js";

await runAllTests();
summary();
