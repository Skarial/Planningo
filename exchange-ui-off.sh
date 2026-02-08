#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5500/}"
TARGET_URL="${BASE_URL}?ff_exchanges_ui=0"

open_url() {
  local url="$1"
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "" "$url" >/dev/null 2>&1 && return 0
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 && return 0
  fi
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 && return 0
  fi
  return 1
}

if open_url "$TARGET_URL"; then
  echo "Exchange UI OFF -> $TARGET_URL"
else
  echo "Impossible d'ouvrir le navigateur automatiquement."
  echo "Ouvre cette URL manuellement:"
  echo "$TARGET_URL"
fi
