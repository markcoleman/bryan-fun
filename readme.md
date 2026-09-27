# Bryan’s Bonkers Cruise Dash

A polished browser runner about being very late for the buffet. Original adult-sitcom cartoon characters and cruise destinations, two simple actions, and enough luggage to ruin everyone's day.

## Play

- **Jump:** Space, ↑, W, click/tap the game, or the Jump button. Hold for height, release for a shorter hop.
- **Duck:** ↓, S, Shift, or tap Duck. Duck automatically lasts a moment.
- **Pause:** P, Escape, or the pause button. Switching apps or rotating the screen pauses automatically.
- Jump luggage and buffet carts; duck seagulls. Later double baggage needs a well-timed held jump.
- Collect espresso martinis for a three-second protected speed boost. Choose Barbra to select her Morning Beer signature power instead; both give the same speed and protection.
- Collect donuts for streak multipliers. Clear obstacles and travel through five ports. At 1,250 m, complete the voyage and keep sailing.

Play as Bryan, Barbra, or Kyle. Identical physics means the argument stays about skill.

| Departure       | Loop                                                                               |
| --------------- | ---------------------------------------------------------------------------------- |
| Endless dash    | One life. Instant same-route retries; fresh routes from boarding.                  |
| Daily departure | Shared UTC daily seed and a saved daily personal best.                             |
| Pass & play     | 2–6 friends on the same device, same course, turn handoff, scoreboard and rematch. |
| Easy breezy     | Slower pace, three lives, separate practice record.                                |

Earn six passport stamps, chase personal bests, or share a result as a seeded friend challenge. Progress saves locally without accounts. Challenge targets are honor-system scores, not a global leaderboard.

## Develop

Requires Node 20.9+ (CI uses 22).

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8080`. Use `PORT=8081 npm run dev` if needed. ES modules require serving over HTTP; opening the HTML as a `file:` URL is unsupported.

```sh
npm run validate      # syntax, asset/DOM contracts, tests, production build
npm run format:check  # formatting
npm run format        # format sources
npm run preview       # serve dist after a build
npm run art:prepare   # export approved PNG masters to runtime WebP
```

There are no runtime dependencies or external font/CDN requests. Prettier handles formatting; Sharp exports approved art masters with `npm run art:prepare`. Neither ships to players.

Development art inspector: open `/tools/art-review.html` to inspect poses, props, all five scrolling destinations, phone framing, and Espresso Rush. It does not ship in the production bundle.

## Delivery

`npm run build` creates an allowlisted `dist/` bundle, approximately 2.5 MB including all art. Publish **dist**, not the repository root. The GitHub Pages workflow builds and validates before publishing. Relative paths support a repository subdirectory.

The same game runs in desktop, mobile, and tablet browsers. Production builds include home-screen install metadata and a content-versioned offline cache. Offline play requires one successful online load. Development stays uncached. Native store apps and cloud synchronization are not included; the previous Expo profile-sync demo and disconnected account prototype have been removed.

## Structure and iteration

- [AGENTS.md](AGENTS.md): agent instructions, module boundaries, invariants, commands.
- [Design review](docs/game-design-review.md): findings, changes, reasons, and remaining design uncertainty.
- [Art direction](docs/art-direction.md): sitcom style, production assets, source prompts and import contract.
- [Playtesting](docs/playtest.md): browser/device and human-fun checklist.
- `src/content.js`: characters, hazards, ports, stamps and tuning.
- `src/engine.js`: deterministic simulation; `src/game.js`: UI/input/run lifecycle.
- `src/renderer.js`: sprites, scenery and effects; `src/animation.js`: pose and parallax geometry; `src/audio.js`: synthesized sounds.
- `src/profile.js`: validated saves and legacy record preservation.
- `assets/cartoon/`: active compressed art; `source/`: original generated masters, excluded from deployment.
- `assets/images/`: earlier user artwork, preserved but excluded from the runtime and production bundle.

New scoring uses `bbcd:sketch:v1`; earlier `bbcd:profile:v2` data remains untouched. The old best is shown separately because the scoring systems are not comparable. Corrupt or unavailable storage falls back to an in-memory session.

The `buffet-2` ruleset adds Espresso Rush and full-size crouch clearance. Existing preferences and stamps survive; old scores are preserved as the previous-edition best, and competitive records start separately.
