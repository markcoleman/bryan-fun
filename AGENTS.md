# Working on Cruise Dash

## Product direction

Bryan’s Bonkers Cruise Dash is a complete, browser-first, adult-sitcom-cartoon runner for a group of friends. The joke is a crew of recognizable people being spectacularly late for the buffet. The tone is affectionate, situational, and silly. Keep a run understandable in seconds and a retry one action away.

The current art direction is **bold outlines, expressive sitcom characters, cel-shaded tropical backgrounds, warm light, and readable cast shadows**. The user explicitly replaced the earlier watercolor/pixel direction. Keep the paper/postcard UI, but do not bring pixel art or watercolor backgrounds back into gameplay.

## Start here

- `npm ci`
- `npm run dev` → localhost:8080 (set `PORT` to change it)
- `npm run validate` → syntax, asset/DOM contracts, simulation/profile tests, production build
- `npm run format:check` → source formatting
- `npm run format` → format edited source
- `npm run preview` → serve `dist` (stop the dev server first or use a different port)

Node 20.9+ is supported; CI uses Node 22. Prettier formats source; Sharp prepares compressed art at development time. There are no runtime packages, remote fonts, CDNs, account services, or build-framework requirements.

## Ownership and boundaries

| File                         | Responsibility                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `src/content.js`             | Balancing constants, characters, hazard sizes, port names, humor, stamp definitions |
| `src/engine.js`              | Pure deterministic simulation; no DOM, storage, clock, audio, or visual randomness  |
| `src/game.js`                | UI states, fixed timestep, input, run lifecycle, party turn flow, sharing           |
| `src/renderer.js`            | Canvas layout, sprite cropping, shadows, particles, scenery                         |
| `src/profile.js`             | Validated local saves, legacy record preservation, record/stamp awards              |
| `src/audio.js`               | Gesture-unlocked synthesized effects                                                |
| `assets/cartoon/frames.json` | Explicit pixel bounds for each of ten poses per character                           |
| `scripts/build.mjs`          | Allowlisted production bundle and content-versioned offline worker                  |

Keep simulation changes out of the renderer. Keep copy and tuning out of the UI controller. Add data before adding conditionals. Prefer a small named module to growing `game.js` into another monolith.

## Gameplay invariants

- Arcade, daily, and party use the same physics and one life. All characters have identical collision boxes and abilities.
- Easy breezy has three lives and a slower pace; it cannot award competitive records or stamps. It does not spawn advanced double baggage.
- Same seed + same input ticks + same ruleset = same obstacles and score, regardless of device size or refresh rate.
- Physics advances at 120 Hz. Cap elapsed frame time and pause on blur, hidden document, and resize. Do not catch up after the user returns.
- Obstacles are generated in world coordinates; viewport dimensions must never affect the course.
- Recovery gaps are at least 1.4 seconds at maximum speed. New patterns must pass reactive full-voyage simulation tests and a human play check.
- Donuts only affect scoring. Espresso martinis give every character the same three-second protected speed boost; Barbra can optionally use her Morning Beer signature pickup with identical timing and protection, with 400 ms recovery immunity; missing a martini never resets a donut streak.
- The visual silhouette can exceed the forgiving collision box. A duck must visibly clear a gull. All poses use a bottom-center anchor and a single pixel scale derived from the idle pose. Never shrink a crouch by normalizing its height.
- A finished run is recorded exactly once. Retries preserve the course; new departures use new seeds. Daily seeds use UTC.
- Gameplay changes that affect competition require bumping `RULESET` and reviewing share-link compatibility and score migration.
- Shared target scores are friendly challenges, not authenticated leaderboard entries.

## Art workflow

Read `docs/art-direction.md` and `assets/prompts/README.md` before changing art. Generated masters live in `assets/cartoon/source/`; WebP exports, icons, and frame metadata are the runtime assets. Review sprite crops for clipping and neighboring-frame bleed. Do not assume generated atlas cells align perfectly.

`assets/images/` contains the user's earlier, partly uncommitted art. It is preserved as legacy material and excluded from the build. Do not delete or overwrite it as routine cleanup. No runtime code should reference it.

Run `npm run art:prepare` after replacing an approved master. It exports ten frames per character (idle, six running poses, jump, crouch, hurt), seven active cartoon props, and five 3:1 panoramas. Review the generated rectangles and run the animation contract tests. `src/animation.js` owns pose selection, constant sprite scale, and parallax wrapping.

`tools/art-review.html` is a development-only visual inspector at `/tools/art-review.html`. Use its character, action, port, stage-size, rush, and pause controls to review all artwork through the real renderer. It is excluded from production.

## Verification and handoff

Run `npm run validate` and `npm run format:check`. If changing a workflow, parse its YAML and preserve actual required-check names unless instructed otherwise. The validation job remains `CI / validate`; the optional performance workflow builds `dist` before Lighthouse. Do not publish the repository root.

Follow `docs/playtest.md` for browser checks, including keyboard, pointer/touch, phone portrait/landscape, tablet, retry, pause, party handoff, sharing, and storage failure. Do not claim physical iOS or Android validation from a resized desktop browser. Record any missing coverage candidly.

No commit, push, deployment, or new cloud service is implied by a local iteration. Do not create parallel agents unless the user explicitly asks for them. Preserve unrelated working-copy changes.
