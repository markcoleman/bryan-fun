#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/apps/mobile"
PROFILE="${1:-production}"

cd "${MOBILE_DIR}"

echo "Installing mobile dependencies..."
npm install

echo "Starting EAS iOS build with profile: ${PROFILE}"
eas build --platform ios --profile "${PROFILE}" --non-interactive
