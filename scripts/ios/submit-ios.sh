#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MOBILE_DIR="${ROOT_DIR}/apps/mobile"
PROFILE="${1:-production}"
LATEST_BUILD_ID="${2:-}"

cd "${MOBILE_DIR}"

if [[ -z "${LATEST_BUILD_ID}" ]]; then
  echo "No build id provided, submitting the latest completed iOS build."
  eas submit --platform ios --profile "${PROFILE}" --latest --non-interactive
else
  echo "Submitting iOS build id: ${LATEST_BUILD_ID}"
  eas submit --platform ios --profile "${PROFILE}" --id "${LATEST_BUILD_ID}" --non-interactive
fi
