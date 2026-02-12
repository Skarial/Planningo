/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  getAlarmAutoImportOptions,
  shouldAutoImportAlarm,
} from "../../js/state/alarm-auto-import.js";

test("alarm auto-import options are enabled by default", () => {
  const options = getAlarmAutoImportOptions();
  assert(options.autoImport === true, "autoImport should be true");
  assert(shouldAutoImportAlarm(options) === true, "guard should accept options");
});

test("alarm auto-import guard rejects missing flag", () => {
  assert(shouldAutoImportAlarm() === false, "missing options should be false");
  assert(
    shouldAutoImportAlarm({ autoImport: false }) === false,
    "autoImport false should be rejected",
  );
});
