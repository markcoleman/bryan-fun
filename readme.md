# Bryan's Bonkers Cruise Dash

Mobile-friendly side-scrolling HTML/JS game where a character auto-runs to the right.

## Gameplay

- Jump over walls.
- Play as `assets/images/characters/bryan.png` as the main character.
- Collect `assets/images/items/drink.png` while jumping.
- Every drink collected increases running speed.
- Destination leveling progression: Level 1 Existing Cruise Deck, Level 2 Island Adventure with Adults-Only Pool, Level 3 Bahamas, Level 4 Cruise Deck, Level 5 Miami.
- Reaching each voyage-distance milestone restarts the stage layout at the newly unlocked destination while preserving your current speed momentum.
- Each level uses a different full-screen background image.
- Level 2 uses a parallax beach setup: `assets/images/backgrounds/beach-background.png` (background) and `assets/images/grounds/beach.png` (ground).
- Level 3 uses: `assets/images/backgrounds/beach-background.png` (background) and `assets/images/grounds/bahamas.png` (ground).
- Level 5 uses: `assets/images/backgrounds/miami-background.png` (background) and `assets/images/grounds/miami.png` (ground).
- Level 4 features a cruise ship pass that starts on the right and sails left across the scene.
- The slide obstacle is tuned for fairness and appears only in Level 2.
- Unlocked levels persist in local storage and can be selected as the next run's starting level.
- Includes simple parallax background layers.

## Cross-platform strategy (Web + iOS)

The project now supports a portable delivery strategy:

- **Web runtime** remains deployable as static assets (`index.html` + `src/*`) for GitHub Pages/any static host.
- **iOS runtime** is scaffolded in `apps/mobile/` with Expo React Native to enable App Store delivery.
- **Shared progression sync utilities** live in `src/sync-profile.js` and are reusable by both web and mobile clients.

See `docs/mobile-web-sync-strategy.md` for merge/conflict rules and rollout guidance.

## Project Structure

- `index.html`: app shell and UI markup.
- `src/game.js`: gameplay logic and rendering.
- `src/game-logic.js`: deterministic gameplay helpers and progression logic.
- `src/sync-profile.js`: cross-platform profile sync merge helpers.
- `apps/mobile/`: Expo React Native iOS app starter.
- `tests/`: Node unit tests for gameplay + sync rules.
- `assets/images/`: organized art assets by category:
  - `characters/`: player runner sprites
  - `items/`: pickups and obstacle sprites
  - `backgrounds/`: layered background textures
  - `grounds/`: ground/deck textures
  - `levels/`: SVG destination backdrops
  - `ui/`: splash/menu art
  - `npc/`: non-player character sprites

## Controls

- `Space`, `Arrow Up`, or `W` to jump.
- Tap/click the game canvas to jump.
- On mobile, use the on-screen `Jump` button.

## Run locally

### Web

Open `index.html` in a browser, or run a simple static server.

### Tests

- `npm test` runs Node.js tests for both game logic and cross-platform sync logic.

### iOS app scaffold (Expo)

```bash
cd apps/mobile
npm install
npm run ios
```

This starts the React Native iOS target (Xcode required for local simulator builds).


## iOS build + App Store delivery (DevOps)

- EAS profiles are defined in `apps/mobile/eas.json`.
- Local helper scripts are in `scripts/ios/` for validation, build, and submission.
- CI workflow for cloud build + optional App Store submit is in `.github/workflows/ios-eas.yml`.
- Full process/checklist: `docs/ios-devops-delivery.md`.

Common commands from repo root:

```bash
npm run mobile:ios:validate
npm run mobile:ios:build:preview
npm run mobile:ios:build
npm run mobile:ios:submit
```

## Optional Supabase account flows

The game now supports optional email/password account creation and sign-in using Supabase Auth.

- Supabase project URL is set to `https://gzigwxvukzxyfphuzmmy.supabase.co` (Project: **Bryan-bash**, Org: **Kramnameloc**).
- Add your Supabase anon key by setting `window.__SUPABASE_ANON_KEY__` before loading `src/game.js`, or pass it once in the URL:
  - `http://localhost:8080/?sbAnonKey=YOUR_ANON_KEY`
  - `https://markcoleman.github.io/bryan-fun/?sbAnonKey=YOUR_ANON_KEY`
- The key from `sbAnonKey` is stored in local storage under `bbcd:supabaseAnonKey`.
- In **Settings**, use:
  - **Create Account** (email + password)
  - **Sign In**
  - **Sign Out**

## Performance and delivery optimizations

- Non-critical large textures are lazy-loaded at runtime to reduce initial page payload and improve first render time.
- Shared gameplay math/version helpers live in `src/game-logic.js`.
- Shared cross-device progression merge helpers live in `src/sync-profile.js`.
- Uses the open-source `canvas-confetti` package for level-up and achievement celebrations.
