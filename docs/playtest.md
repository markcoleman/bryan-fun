# Playtest and regression checklist

## Automated gate

`npm run validate` checks source syntax, HTML asset links and unique IDs, UI bindings, atlas bounds, simulation/profile tests, and a fresh production bundle. `npm run format:check` keeps source reviewable. Tests cover deterministic generation, maximum-speed spacing, reactive full-voyage survival, advanced baggage, jump buffering, short hops, duck clearance, collisions, recovery immunity, scoring/streaks, identical character physics, UTC daily seeds, challenge validation, corrupt storage, migration, and record separation.

Use `npm run dev` for iteration. For offline/install checks, run `npm run build`, then `PORT=8081 npm run preview`. Development deliberately does not register a service worker. The production build does, including on localhost.

## Browser checks

Use a fresh local test profile when comparing records. Do not clear a user's real browser data.

| Area            | Check                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Boarding        | Art appears, character and mode controls work, start has no setup requirement, stamps expand                                         |
| Input           | Keyboard jump/short hop/duck; pointer and touch press/release; no repeat-key jumping; browser scrolling outside gameplay still works |
| Phone portrait  | 390 × 844 and narrow 320-pixel width; no horizontal overflow; readable instructions; jump/duck reachable; results fit                |
| Phone landscape | 844 × 390; game and touch controls visible; modal buttons reachable; safe-area insets on a physical phone                            |
| Tablet          | 820 × 1180 portrait and landscape; cast and departure choices fit; canvas remains sharp                                              |
| Desktop         | 1440 × 900; readable stage, no stretched sprites; keyboard focus visible                                                             |
| Lifecycle       | Pause/resume, open help mid-run, switch app/tab, resize/orient; time and score freeze; countdown before resume                       |
| Failure         | Hit suitcase, trolley, gull, double baggage; appropriate tips; exactly one record; retry identical opening course                    |
| Practice        | Slower, three lives, immunity, separate best; cannot award competitive stamps                                                        |
| Daily           | Same date/seed has same course; today best persists; UTC boundary changes new departures, retry preserves old route                  |
| Party           | Validate 2–6 names; special characters render as text; each turn uses same course; scoreboard, tie, rematch, home exit               |
| Sharing         | Share success, user cancellation, clipboard copy and fallback; opened challenge recreates course; malformed/old links handled        |
| Saving          | Reload retains settings/stamps/records; blocked storage does not prevent play; legacy best appears separately                        |
| Art             | Every character's ten poses; no clipping/neighbor bleed; all five backgrounds; duck sprite aligns with gull clearance                |
| Reduced motion  | System preference and toggle suppress extra bob, clouds, particles, trails and shake; essential game movement continues              |
| Offline         | Production first load completes; revisit offline; challenge query navigation works; update produces a new cache version              |
| Accessibility   | Help/settings use native dialogs; focus returns sensibly; status announcements at events, not every score tick                       |

Use `/tools/art-review.html` on the development server to inspect every character/action/port through the real renderer, pause the animation, compare phone and desktop framing, and inspect Espresso Rush. It is excluded from production.

## Espresso and motion regressions

Collect the marked espresso martini with each cast member. Select Barbra, choose Morning Beer, and check the mug, power label, toast, preference persistence, and equal boost behavior. Switch to Bryan or Kyle and confirm Barbra’s special-power controls disappear. Confirm visible speed-up, countdown, collision protection, expiry and normal controls afterward. Donuts must not boost speed. Crouch beneath a gull without the head shrinking; the six running frames must move the legs. Observe at least one scenery wrap and a port transition. After replacing artwork, run `npm run art:prepare` and check the crop boundaries on a contrasting background.

## Human fun test

Recruit at least five members of the intended social group, preferably on their own devices. Let each play five runs with no explanation beyond the game. Record first failure, voluntary retries, typical run duration, missed-input complaints, and which jokes they recognize. Ask “What got you?” and “What would you do differently next run?” Tune one variable at a time. Never report simulated traversal as human fun validation.

## Known validation limits

A desktop viewport override verifies layout but not physical touch latency, mobile Safari audio, safe-area cutouts, thermal performance, or native install behavior. Complete those checks on hardware before a public launch. No hosted leaderboard or cloud synchronization exists.
