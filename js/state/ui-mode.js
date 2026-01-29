export const UI_MODE = {
  CONSULTATION: "consultation",
  SAISIE_MENSUELLE: "saisie_mensuelle",
};

let currentMode = UI_MODE.CONSULTATION;

export function getUiMode() {
  return currentMode;
}

export function setUiMode(mode) {
  currentMode = mode;
}
