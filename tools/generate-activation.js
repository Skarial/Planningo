/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

#!/usr/bin/env node

import { generateActivationCode } from "./activation-algo.js";

if (process.argv.length < 3) {
  console.log("Usage : ./gen-code DEVICE_ID");
  process.exit(1);
}

const deviceId = process.argv[2];

try {
  const code = generateActivationCode(deviceId);
  console.log(code);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

