/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { validateActivation } from "../domain/activation.js";
import { generateActivationCode } from "../../tools/activation-algo.js";

export async function checkActivation(codeSaisi, deviceId) {
  if (!codeSaisi || !deviceId) return false;

  const expectedCode = generateActivationCode(deviceId);

  return validateActivation(codeSaisi, expectedCode);
}

