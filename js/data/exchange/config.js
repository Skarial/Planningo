/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

export const EXCHANGE_API_BASE_URL =
  globalThis.__PLANNINGO_EXCHANGE_API_BASE_URL__ || "/api";

export const EXCHANGE_DEPOT_HEADER_NAME = "X-Planningo-Depot";
export const EXCHANGE_DEPOT_HEADER_VALUE =
  globalThis.__PLANNINGO_DEPOT_ID__ || "planning_v2";

export const EXCHANGE_STORAGE_TOKEN_KEY = "planningo_exchange_token";
export const EXCHANGE_STORAGE_TOKEN_EXPIRES_AT_KEY =
  "planningo_exchange_token_expires_at";

export const EXCHANGE_DEFAULT_TIMEOUT_MS = 8000;
