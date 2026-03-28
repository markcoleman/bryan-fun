# Bryan's Bonkers Cruise Dash

Mobile-friendly side-scrolling HTML/JS game where a character auto-runs to the right.

## Gameplay

- Jump over walls.
- Play as `assets/images/characters/bryan.png` as the main character.
- Collect `assets/images/items/drink.png` while jumping.
- Every drink collected increases running speed.
- Destination leveling progression: Level 1 Existing Cruise Deck, Level 2 Island Adventure with Adults-Only Pool, Level 3 Bahamas, Level 4 Cruise Deck, Level 5 Miami.
- Reaching a level milestone restarts the stage layout at the newly unlocked destination while preserving your current speed momentum.
- Each level uses a different full-screen background image.
- Level 2 uses a parallax beach setup: `assets/images/backgrounds/beach-background.png` (background) and `assets/images/grounds/beach.png` (ground).
- Level 3 uses: `assets/images/backgrounds/beach-background.png` (background) and `assets/images/grounds/bahamas.png` (ground).
- Level 5 uses: `assets/images/backgrounds/miami-background.png` (background) and `assets/images/grounds/miami.png` (ground).
- Level 4 features a cruise ship pass that starts on the right and sails left across the scene.
- The slide obstacle is tuned for fairness and appears only in Level 2.
- Unlocked levels persist in local storage and can be selected as the next run's starting level.
- Includes simple parallax background layers.

## Project Structure

- `index.html`: app shell and UI markup.
- `src/game.js`: gameplay logic and rendering.
- `src/style.css`: layout and visual styles.
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

Open [index.html](/Users/markcoleman/Development/github/bryan-fun/index.html) in a browser.

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
- If email confirmation is enabled in Supabase, the sign-up flow uses these redirect targets:
  - Dev: `http://localhost:8080/`
  - Prod: `https://markcoleman.github.io/bryan-fun/`
- If no anon key is configured, account controls stay disabled and gameplay remains fully local.

## GitHub Actions

- CI workflow: [ci.yml](/Users/markcoleman/Development/github/bryan-fun/.github/workflows/ci.yml)
  - Verifies required files exist.
  - Installs dependencies from the committed lock file (`npm ci`).
  - Checks JavaScript syntax with `node --check`.
  - Runs Node.js unit tests with coverage via `npm test`.
  - Runs `npm audit` with a high-severity threshold.
- Deployment workflow: [deploy-pages.yml](/Users/markcoleman/Development/github/bryan-fun/.github/workflows/deploy-pages.yml)
  - Publishes the static site to GitHub Pages on pushes to `main`.
- Performance workflow: [performance.yml](/Users/markcoleman/Development/github/bryan-fun/.github/workflows/performance.yml)
  - Runs Lighthouse CI on pull requests and manual dispatches.
  - Publishes Lighthouse artifacts for UX/performance visibility.
- Dependabot: [.github/dependabot.yml](/Users/markcoleman/Development/github/bryan-fun/.github/dependabot.yml)
  - Weekly updates for devcontainer config, GitHub Actions, and npm dependencies.
  - Groups test/quality tooling updates to reduce PR noise.


## Performance and delivery optimizations

- Non-critical large textures are now lazy-loaded at runtime to reduce initial page payload and improve first render time.
- Shared gameplay math and version helpers live in `src/game-logic.js` to keep core runtime logic cleaner and easier to maintain/test.
- Uses the open-source `canvas-confetti` package for level-up and achievement celebrations.

## Testing

- `npm test` runs the Node.js test runner with built-in test coverage output for `tests/game-logic.test.js`.
