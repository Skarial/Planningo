/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

// tests/run-tests.js
// Runner minimal async (sans framework)

const tests = [];
let passed = 0;
let failed = 0;

export function test(name, fn) {
  tests.push({ name, fn });
}

export async function runAllTests() {
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log("✅", name);
      passed++;
    } catch (err) {
      console.error("❌", name);
      console.error(err.message);
      failed++;
    }
  }
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

export function summary() {
  console.log("—".repeat(40));
  console.log(`Tests réussis : ${passed}`);
  console.log(`Tests échoués : ${failed}`);
  if (failed > 0) {
    throw new Error("Des tests ont échoué");
  }
}

