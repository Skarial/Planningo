/*
  Copyright (c) 2026 Jordan
  All Rights Reserved.
  See LICENSE for terms.
*/

const ALARM_AUTO_IMPORT_OPTIONS = Object.freeze({ autoImport: true });

export function getAlarmAutoImportOptions() {
  return { ...ALARM_AUTO_IMPORT_OPTIONS };
}

export function shouldAutoImportAlarm(options) {
  return options?.autoImport === true;
}

