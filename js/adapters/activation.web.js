import { validateActivation } from "../domain/activation.js";
import { generateActivationCode } from "../../tools/activation-algo.js";

export async function checkActivation(codeSaisi, deviceId) {
  if (!codeSaisi || !deviceId) return false;

  const expectedCode = generateActivationCode(deviceId);

  return validateActivation(codeSaisi, expectedCode);
}
