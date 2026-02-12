/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const EXCHANGES_UI_STORAGE_KEY = "ff_exchanges_ui";

function getHostname(locationLike) {
  const hostname =
    locationLike && typeof locationLike.hostname === "string"
      ? locationLike.hostname.trim().toLowerCase()
      : "";
  return hostname;
}

function getSearch(locationLike) {
  if (!locationLike || typeof locationLike.search !== "string") return "";
  return locationLike.search;
}

function readStorageFlag(storageLike, key) {
  if (!storageLike || typeof storageLike.getItem !== "function") return "";
  try {
    const value = storageLike.getItem(key);
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

function writeStorageFlag(storageLike, key, value) {
  if (!storageLike || typeof storageLike.setItem !== "function") return;
  try {
    storageLike.setItem(key, value);
  } catch {}
}

function removeStorageFlag(storageLike, key) {
  if (!storageLike || typeof storageLike.removeItem !== "function") return;
  try {
    storageLike.removeItem(key);
  } catch {}
}

function syncExchangesUiFlagFromQuery(locationLike, storageLike) {
  const search = getSearch(locationLike);
  if (!search) return;

  try {
    const params = new URLSearchParams(search);
    const flag = params.get(EXCHANGES_UI_STORAGE_KEY);
    if (flag === "1") {
      writeStorageFlag(storageLike, EXCHANGES_UI_STORAGE_KEY, "1");
    } else if (flag === "0") {
      removeStorageFlag(storageLike, EXCHANGES_UI_STORAGE_KEY);
    }
  } catch {}
}

export function isExchangesUiEnabled(options = {}) {
  const locationLike = options.location !== undefined ? options.location : globalThis.location;
  const storageLike = options.storage !== undefined ? options.storage : globalThis.localStorage;

  syncExchangesUiFlagFromQuery(locationLike, storageLike);

  const hostname = getHostname(locationLike);
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  if (!isLocalhost) return false;

  return readStorageFlag(storageLike, EXCHANGES_UI_STORAGE_KEY) === "1";
}
