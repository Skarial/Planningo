/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// js/state/home-state.js
// Etat memoire partage entre composants Home (sans couplage window.*)

const homeState = {
  congesConfig: null,
  saisonConfig: null,
};

export function getHomeCongesConfig() {
  return homeState.congesConfig;
}

export function setHomeCongesConfig(congesConfig) {
  homeState.congesConfig = congesConfig ?? null;
}

export function getHomeSaisonConfig() {
  return homeState.saisonConfig;
}

export function setHomeSaisonConfig(saisonConfig) {
  homeState.saisonConfig = saisonConfig ?? null;
}
