/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  bootstrapExchangeAuth,
  getExchangeAuthState,
  loginExchangeAction,
  logoutExchangeAction,
} from "../../js/state/exchange/auth-state.js";
import { installFetchMock, resetTestStorage } from "./test-helpers.js";

function tokenFromStorage() {
  return globalThis.localStorage.getItem("planningo_exchange_token");
}

test("exchange auth-state - bootstrap without token stays anonymous", async () => {
  resetTestStorage();
  await bootstrapExchangeAuth();

  const state = getExchangeAuthState();
  assert(state.status === "anonymous", "status should be anonymous");
  assert(state.currentUser === null, "currentUser should be null");
  assert(state.error === null, "error should be null");
});

test("exchange auth-state - bootstrap with unauthorized token clears session", async () => {
  resetTestStorage();
  globalThis.localStorage.setItem("planningo_exchange_token", "token-expired");

  installFetchMock([
    {
      method: "GET",
      path: "/api/me",
      status: 401,
      body: { error: { message: "unauthorized" } },
    },
  ]);

  const result = await bootstrapExchangeAuth();
  assert(result.ok === false, "bootstrap should fail on unauthorized");
  assert(result.error.code === "UNAUTHORIZED", "error code mismatch");

  const state = getExchangeAuthState();
  assert(state.status === "anonymous", "status should be anonymous");
  assert(tokenFromStorage() === null, "token should be cleared");
});

test("exchange auth-state - login success authenticates user", async () => {
  resetTestStorage();

  installFetchMock([
    {
      method: "POST",
      path: "/api/auth/login",
      status: 200,
      body: {
        token: "token-login",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    },
    {
      method: "GET",
      path: "/api/me",
      status: 200,
      body: {
        user: { id: "u-1", prenom: "Ada", nom: "Lovelace" },
      },
    },
  ]);

  const result = await loginExchangeAction({
    email: "ada@example.test",
    password: "password",
  });
  assert(result.ok === true, "login should succeed");

  const state = getExchangeAuthState();
  assert(state.status === "authenticated", "status should be authenticated");
  assert(state.currentUser?.id === "u-1", "user id mismatch");
  assert(tokenFromStorage() === "token-login", "token should be stored");
});

test("exchange auth-state - logout returns anonymous even on network error", async () => {
  resetTestStorage();

  installFetchMock([
    {
      method: "POST",
      path: "/api/auth/login",
      status: 200,
      body: {
        token: "token-logout",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    },
    {
      method: "GET",
      path: "/api/me",
      status: 200,
      body: {
        user: { id: "u-2", prenom: "Bob", nom: "Smith" },
      },
    },
    {
      method: "POST",
      path: "/api/auth/logout",
      type: "network_error",
    },
  ]);

  const login = await loginExchangeAction({
    email: "bob@example.test",
    password: "password",
  });
  assert(login.ok === true, "login precondition should succeed");

  const logout = await logoutExchangeAction();
  assert(logout.ok === true, "logout action should still succeed");

  const state = getExchangeAuthState();
  assert(state.status === "anonymous", "status should be anonymous");
  assert(state.currentUser === null, "currentUser should be null");
  assert(tokenFromStorage() === null, "token should be cleared");
});
