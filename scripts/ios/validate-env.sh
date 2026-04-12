#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/apps/mobile"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required" >&2
  exit 1
fi

if ! command -v eas >/dev/null 2>&1; then
  echo "eas cli is required. install with: npm i -g eas-cli" >&2
  exit 1
fi

if [[ -z "${EXPO_TOKEN:-}" ]]; then
  echo "EXPO_TOKEN is not set. CI/App Store delivery requires it." >&2
  exit 1
fi

if [[ -z "${ASC_API_KEY_ID:-}" || -z "${ASC_API_KEY_ISSUER_ID:-}" || -z "${ASC_API_KEY:-}" ]]; then
  echo "ASC_API_KEY_ID / ASC_API_KEY_ISSUER_ID / ASC_API_KEY are required for App Store submission." >&2
  exit 1
fi

if [[ ! -f "${MOBILE_DIR}/eas.json" ]]; then
  echo "Missing apps/mobile/eas.json" >&2
  exit 1
fi

echo "Environment looks good for iOS cloud build + submit."
