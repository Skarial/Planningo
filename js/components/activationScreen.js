// js/components/activationScreen.js
import { APP_VERSION } from "../app.js";

import { getOrCreateDeviceId } from "../data/device.js";
import { setConfig } from "../data/db.js";
import { checkActivation } from "../adapters/activation.web.js";

// =======================
// API PUBLIQUE
// =======================

export async function showActivationScreen() {
  const deviceId = await getOrCreateDeviceId();

  const root = document.createElement("div");
  root.id = "activation-screen";
  root.innerHTML = render(deviceId);

  document.body.innerHTML = "";
  document.body.appendChild(root);

  bindEvents(root, deviceId);
}

// =======================
// RENDER
// =======================

function render(deviceId) {
  return `
    <div class="activation-container">
      <h1>Activation requise</h1>

      <p>Un code d’activation est nécessaire pour utiliser l’application.</p>

      <div class="device-id">
        <label>Device ID</label>
        <code id="device-id-value">${deviceId}</code>
        <button id="copy-device-id">Copier</button>
        <p id="copy-feedback" class="info" hidden>Device ID copié</p>
      </div>

      <input
        type="text"
        id="activation-code"
        placeholder="Code d’activation"
        autocomplete="off"
      />

      <button id="activation-validate">Valider</button>

      <p id="activation-error" class="error" hidden>
        Code invalide. Vérifiez la saisie ou le Device ID transmis.
      </p>

      <p id="activation-success" class="success" hidden>
        Activation réussie. Redémarrage…
      </p>
    </div>
  `;
}

// =======================
// LOGIQUE
// =======================

function bindEvents(root, deviceId) {
  const input = root.querySelector("#activation-code");
  const button = root.querySelector("#activation-validate");
  const error = root.querySelector("#activation-error");
  const success = root.querySelector("#activation-success");

  const copyBtn = root.querySelector("#copy-device-id");
  const copyFeedback = root.querySelector("#copy-feedback");

  // Copier Device ID
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(deviceId);
    copyFeedback.hidden = false;
    setTimeout(() => (copyFeedback.hidden = true), 1500);
  });

  // Validation
  async function validate() {
    error.hidden = true;
    success.hidden = true;

    const code = input.value.trim();
    if (!code) {
      error.hidden = false;
      return;
    }

    const ok = await checkActivation(code, deviceId);

    if (!ok) {
      error.hidden = false;
      return;
    }

    await setConfig("activation_ok", "true");

    // ✅ version courante considérée comme déjà vue
    localStorage.setItem("lastSeenAppVersion", APP_VERSION);

    success.hidden = false;
    setTimeout(() => location.reload(), 800);
  }

  button.addEventListener("click", validate);

  // Touche Entrée
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      validate();
    }
  });
}
