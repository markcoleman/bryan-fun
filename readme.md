# Bryan's Bonkers Cruise Dash

Mobile-friendly side-scrolling HTML/JS game where a character auto-runs to the right.

## Gameplay

- Jump over walls.
- Play as `bryan.png` as the main character.
- Collect `drink.png` while jumping.
- Every drink collected increases running speed.
- Includes simple parallax background layers.

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
