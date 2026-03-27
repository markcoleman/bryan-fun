# Bryan's Bonkers Cruise Dash

Mobile-friendly side-scrolling HTML/JS game where a character auto-runs to the right.

## Gameplay

- Jump over walls.
- Play as `assets/images/bryan.png` as the main character.
- Collect `assets/images/drink.png` while jumping.
- Every drink collected increases running speed.
- Destination leveling progression: Level 1 Existing Cruise Deck, Level 2 Island Adventure with Adults-Only Pool, Level 3 Bahamas, Level 4 Cruise Deck, Level 5 Miami.
- Reaching a level milestone restarts the stage layout at the newly unlocked destination while preserving your current speed momentum.
- Each level uses a different full-screen background image.
- Level 2 uses a parallax beach setup: `assets/images/beach-background.png` (background) and `assets/images/beach.png` (ground).
- Level 3 uses: `assets/images/beach-background.png` (background) and `assets/images/bahamas.png` (ground).
- Level 5 uses: `assets/images/miami-background.png` (background) and `assets/images/miami.png` (ground).
- Level 4 features a cruise ship pass that starts on the right and sails left across the scene.
- The slide obstacle is tuned for fairness and appears only in Level 2.
- Unlocked levels persist in local storage and can be selected as the next run's starting level.
- Includes simple parallax background layers.

## Project Structure

- `index.html`: app shell and UI markup.
- `src/game.js`: gameplay logic and rendering.
- `src/style.css`: layout and visual styles.
- `assets/images/`: all sprite and background art.

## Controls

- `Space`, `Arrow Up`, or `W` to jump.
- Tap/click the game canvas to jump.
- On mobile, use the on-screen `Jump` button.

## Run locally

Open [index.html](/Users/markcoleman/Development/github/bryan-fun/index.html) in a browser.

## GitHub Actions

- CI workflow: [ci.yml](/Users/markcoleman/Development/github/bryan-fun/.github/workflows/ci.yml)
  - Verifies required files exist.
  - Checks JavaScript syntax with `node --check`.
- Deployment workflow: [deploy-pages.yml](/Users/markcoleman/Development/github/bryan-fun/.github/workflows/deploy-pages.yml)
  - Publishes the static site to GitHub Pages on pushes to `main`.
