#!/usr/bin/env bash
set -euo pipefail

echo "==> Build: ./gradlew assembleDebug"
./gradlew assembleDebug

echo "==> Install: adb install -r app/build/outputs/apk/debug/app-debug.apk"
adb install -r app/build/outputs/apk/debug/app-debug.apk

echo "==> Done"
