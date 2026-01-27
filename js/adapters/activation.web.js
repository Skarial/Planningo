import { validateActivation } from "../domain/activation.js";

const ACTIVATION_SECRET = "PLANNING_PWA_SECRET_V1";

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkActivation(codeSaisi, deviceId) {
  if (!codeSaisi || !deviceId) return false;

  // RÈGLE EXACTE DU GÉNÉRATEUR
  const expectedCode = (
    await sha256Hex(`${ACTIVATION_SECRET}:${deviceId}`)
  ).slice(0, 12);

  return validateActivation(codeSaisi, expectedCode);
}
