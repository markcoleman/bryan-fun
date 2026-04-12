# iOS DevOps Build + App Store Delivery

This document defines an operational path to build, sign, validate, and deliver the React Native iOS app (`apps/mobile`) to the App Store via Expo EAS.

## 1) Tooling baseline

- Node 20+
- npm 10+
- Expo account with EAS enabled
- `eas-cli` (installed globally in CI and locally as needed)
- App Store Connect API key

## 2) Required secrets

Set these in GitHub repository secrets:

- `EXPO_TOKEN` (Expo access token)
- `ASC_API_KEY_ID`
- `ASC_API_KEY_ISSUER_ID`
- `ASC_API_KEY` (private key body)

These are validated by `scripts/ios/validate-env.sh`.

## 3) Build profiles

`apps/mobile/eas.json` defines:

- `development` — simulator/internal development client
- `preview` — internal distribution build for QA/TestFlight checks
- `production` — release profile with auto-increment enabled

## 4) Helpful scripts

From repo root:

- `npm run mobile:ios:validate` — check required tooling + secrets
- `npm run mobile:ios:build:preview` — create preview iOS artifact in EAS
- `npm run mobile:ios:build` — create production iOS artifact in EAS
- `npm run mobile:ios:submit` — submit latest production build to App Store Connect

Direct shell variants:

- `./scripts/ios/validate-env.sh`
- `./scripts/ios/build-ios.sh preview|production`
- `./scripts/ios/submit-ios.sh production [build-id]`

## 5) CI workflow

Workflow file: `.github/workflows/ios-eas.yml`

- Runs on manual dispatch and on `main` pushes affecting mobile/devops files.
- Validates environment.
- Executes EAS cloud build.
- Optionally submits to App Store Connect when `submit_to_app_store=true`.

## 6) Validation checklist before release

1. Run root tests: `npm test`
2. Validate iOS env: `npm run mobile:ios:validate`
3. Build preview artifact: `npm run mobile:ios:build:preview`
4. Verify QA checklist (launch, sign in, progression sync, crash-free smoke run)
5. Build production artifact: `npm run mobile:ios:build`
6. Submit: `npm run mobile:ios:submit`
7. Confirm build processing + metadata in App Store Connect

## 7) Suggested hardening next

- Add `expo-doctor` and TypeScript checks into CI gate.
- Upload source maps and release metadata for crash triage.
- Add semantic version + changelog automation for App Store release notes.
