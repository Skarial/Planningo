#!/usr/bin/env bash
set -euo pipefail

resolve_adb() {
  if command -v adb >/dev/null 2>&1; then
    command -v adb
    return 0
  fi

  if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -x "${ANDROID_SDK_ROOT}/platform-tools/adb" ]; then
    echo "${ANDROID_SDK_ROOT}/platform-tools/adb"
    return 0
  fi

  if [ -n "${ANDROID_HOME:-}" ] && [ -x "${ANDROID_HOME}/platform-tools/adb" ]; then
    echo "${ANDROID_HOME}/platform-tools/adb"
    return 0
  fi

  local win_sdk="/c/Users/${USERNAME:-}/AppData/Local/Android/Sdk/platform-tools/adb.exe"
  if [ -x "${win_sdk}" ]; then
    echo "${win_sdk}"
    return 0
  fi

  return 1
}

echo "==> Build: ./gradlew assembleDebug"
./gradlew assembleDebug

ADB_BIN="$(resolve_adb || true)"
if [ -z "${ADB_BIN}" ]; then
  echo "ERREUR: adb introuvable. Installe Android platform-tools ou ajoute adb au PATH."
  exit 1
fi

echo "==> Install: ${ADB_BIN} install -r app/build/outputs/apk/debug/app-debug.apk"
"${ADB_BIN}" install -r app/build/outputs/apk/debug/app-debug.apk

echo "==> Done"
