/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

if (!globalThis.__PLANNINGO_EXCHANGE_API_BASE_URL__) {
  globalThis.__PLANNINGO_EXCHANGE_API_BASE_URL__ = "https://exchange.test/api";
}

if (!globalThis.__PLANNINGO_DEPOT_ID__) {
  globalThis.__PLANNINGO_DEPOT_ID__ = "planning_v2_test";
}

function createLocalStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      if (!store.has(String(key))) return null;
      return store.get(String(key));
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    },
    get length() {
      return store.size;
    },
  };
}

if (!globalThis.localStorage) {
  globalThis.localStorage = createLocalStorageMock();
}

if (typeof globalThis.fetch !== "function") {
  globalThis.fetch = async () => {
    throw new Error("fetch not mocked");
  };
}

if (typeof globalThis.AbortController !== "function") {
  class AbortSignalMock {
    constructor() {
      this.aborted = false;
      this._listeners = new Set();
    }

    addEventListener(type, listener, options = {}) {
      if (type !== "abort" || typeof listener !== "function") return;
      this._listeners.add({ listener, once: Boolean(options.once) });
    }

    removeEventListener(type, listener) {
      if (type !== "abort" || typeof listener !== "function") return;
      this._listeners.forEach((entry) => {
        if (entry.listener === listener) {
          this._listeners.delete(entry);
        }
      });
    }

    dispatchEvent(event) {
      if (!event || event.type !== "abort") return true;
      this._listeners.forEach((entry) => {
        try {
          entry.listener.call(this, event);
        } catch {}
        if (entry.once) {
          this._listeners.delete(entry);
        }
      });
      return true;
    }
  }

  class AbortControllerMock {
    constructor() {
      this.signal = new AbortSignalMock();
    }

    abort() {
      if (this.signal.aborted) return;
      this.signal.aborted = true;
      this.signal.dispatchEvent({ type: "abort" });
    }
  }

  globalThis.AbortController = AbortControllerMock;
}

if (!globalThis.crypto) {
  globalThis.crypto = {};
}

if (typeof globalThis.crypto.randomUUID !== "function") {
  let uuidSequence = 0;
  globalThis.crypto.randomUUID = () => {
    uuidSequence += 1;
    return `test-uuid-${uuidSequence}`;
  };
}
