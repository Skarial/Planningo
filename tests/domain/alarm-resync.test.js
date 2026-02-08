/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

import { assert, test } from "../run-tests.js";
import {
  clearAlarmResyncPending,
  dismissAlarmResyncNotice,
  isAlarmResyncDismissed,
  isAlarmResyncPending,
  markAlarmResyncPending,
} from "../../js/state/alarm-resync.js";

function resetAlarmResyncStorage() {
  localStorage.removeItem("planningo_alarm_resync_pending");
  localStorage.removeItem("planningo_alarm_resync_dismissed");
}

test("alarm-resync mark sets pending and clears dismissed", () => {
  resetAlarmResyncStorage();
  dismissAlarmResyncNotice();
  assert(isAlarmResyncDismissed() === true, "dismissed precondition expected");

  markAlarmResyncPending();

  assert(isAlarmResyncPending() === true, "pending should be true");
  assert(isAlarmResyncDismissed() === false, "dismissed should be cleared");
});

test("alarm-resync dismiss stores hidden state", () => {
  resetAlarmResyncStorage();

  dismissAlarmResyncNotice();

  assert(isAlarmResyncDismissed() === true, "dismissed should be true");
});

test("alarm-resync clear resets pending and dismissed", () => {
  resetAlarmResyncStorage();
  markAlarmResyncPending();
  dismissAlarmResyncNotice();

  clearAlarmResyncPending();

  assert(isAlarmResyncPending() === false, "pending should be false");
  assert(isAlarmResyncDismissed() === false, "dismissed should be false");
});

