# Mobile + Web Sync Strategy (iOS + browser)

## Portability baseline

This repo now has two app surfaces:

1. **Web game** (existing `index.html` + `src/game.js`) for GitHub Pages/static hosting.
2. **Expo React Native app scaffold** in `apps/mobile/` for iOS App Store builds.

The React Native app consumes shared profile-sync utilities from `src/sync-profile.js` to keep progression behavior deterministic across platforms.

## Keep flavors in sync

Use these rules so iOS and web never diverge in progression:

- **Single sync schema**: both clients exchange `bbcd.sync.v1` envelopes.
- **Conflict winner**: newest `updatedAt` wins; tie-break with `deviceId` lexical order.
- **Safe merge**: progression merges by taking max values and unioning unlocked characters.
- **Eventual consistency**:
  - Push local envelope on end-of-run.
  - Pull remote envelope on app foreground/login.
  - Merge and write back only if merged state changed.

## Operational guidance

- Keep gameplay tuning constants in one place (`src/game-logic.js`) and mirror in RN only through imports/shared modules.
- Add backend row-level policies in Supabase so each authenticated user can read/write only their own profile snapshots.
- Add a migration field (`schema`) to evolve payload format without breaking old clients.

## Suggested rollout

1. Ship iOS internal build with TestFlight from Expo EAS.
2. Enable profile sync for signed-in users only.
3. Observe merge telemetry and conflict rate.
4. After stability, make cross-device sync default.


## DevOps delivery path

- iOS build/sign/submit automation is documented in `docs/ios-devops-delivery.md`.
- CI build automation is defined in `.github/workflows/ios-eas.yml`.
- Root helper scripts live in `scripts/ios/` for local reproducible release operations.
