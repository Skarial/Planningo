/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import { resolveRouteGuard } from "../../js/router.js";
import { isExchangesUiEnabled } from "../../js/state/feature-flags.js";

function createStorage(value) {
  return {
    getItem(key) {
      if (key === "ff_exchanges_ui") return value;
      return null;
    },
  };
}

test("exchange feature flag - enabled only on localhost/127 with ff_exchanges_ui=1", () => {
  const onLocalhost = isExchangesUiEnabled({
    location: { hostname: "localhost" },
    storage: createStorage("1"),
  });
  assert(onLocalhost === true, "localhost + flag should enable exchanges");

  const onLoopback = isExchangesUiEnabled({
    location: { hostname: "127.0.0.1" },
    storage: createStorage("1"),
  });
  assert(onLoopback === true, "127.0.0.1 + flag should enable exchanges");

  const missingFlag = isExchangesUiEnabled({
    location: { hostname: "localhost" },
    storage: createStorage("0"),
  });
  assert(missingFlag === false, "localhost without flag should disable exchanges");

  const productionHost = isExchangesUiEnabled({
    location: { hostname: "planningo.app" },
    storage: createStorage("1"),
  });
  assert(productionHost === false, "non-localhost should disable exchanges");
});

test("exchange route guard - OFF blocks /exchanges and redirects home", () => {
  const result = resolveRouteGuard("/exchanges", "", {
    location: { hostname: "planningo.app" },
    storage: createStorage("1"),
  });

  assert(result.allowed === false, "route should be blocked");
  assert(result.requestedView === "exchanges", "requested view mismatch");
  assert(result.resolvedView === "home", "resolved view should be home");
  assert(result.redirectTo === "/", "redirect should be /");
});

test("exchange route guard - OFF blocks hash route #/exchanges", () => {
  const result = resolveRouteGuard("/", "#/exchanges", {
    location: { hostname: "planningo.app" },
    storage: createStorage("1"),
  });

  assert(result.allowed === false, "hash route should be blocked");
  assert(result.redirectTo === "/", "redirect should be /");
});

test("exchange route guard - home route remains allowed", () => {
  const result = resolveRouteGuard("/", "", {
    location: { hostname: "planningo.app" },
    storage: createStorage("1"),
  });

  assert(result.allowed === true, "home route should be allowed");
  assert(result.resolvedView === "home", "resolved view should be home");
});
