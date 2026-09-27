# Design review and implemented direction

This is a design assessment of the supplied working copy and the resulting revision, not a player-study result. The original game was inspected in source and in the browser. Its existing uncommitted changes were retained where relevant; the legacy art was left untouched.

## The fun worth keeping

The cast and setting are the strongest assets. Bryan, Barbra, and Kyle make the game specific to a social group. A cruise provides instantly recognizable absurdities: someone reserving a chair with a towel, overpacking, snack urgency, seagulls, and a friend insisting they know a shortcut. These are better recurring jokes than generic obstacles with renamed labels.

The runner format is appropriate. A short failure can become a funny story, a dare, and an immediate retry. The useful lesson from single-action arcade games is readable cause and effect and low restart cost. Difficulty should come from timing and temptation, not a large set of unexplained systems.

## What was weakening the old loop

| Finding in the supplied version                                                                                                                          | Why it matters                                                                                | Resulting change                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Multiple collectible-driven speed systems, variable difficulty, rescue chance, perks, casino rewards, quests, pass progression, and destination restarts | Too many reasons for a run to change; harder to attribute failure to a specific mistake       | One predictable time-based speed ramp, capped speed, two actions, four readable hazard patterns                                    |
| Collecting rewards increased speed                                                                                                                       | A player could accidentally make a promising run harder by doing the apparently correct thing | Donuts only affect score and streak multiplier; a distinctly marked espresso martini grants a protected speed boost                |
| Three lives, checkpoint restoration, random doctor rescue, and restart logic interacted                                                                  | Weakened the tension and made the meaning of a collision unclear                              | One bonk ends competitive runs; explicitly separate practice has three lives and recovery immunity                                 |
| Settings, perks, account setup, notes, and optional progression crowded the game                                                                         | A group wants to understand and play, not configure a system                                  | One primary start action, visible cast selection, four clearly described modes, short help                                         |
| Pixel characters, elaborate backgrounds, large textures, and independently styled objects                                                                | The cast did not feel part of the same world                                                  | Original adult sitcom cartoon cast and five coordinated cel-shaded backgrounds; coherent foreground props                          |
| A 4,893-line runtime mixed everything                                                                                                                    | Small changes were difficult to reason about and easy to regress                              | Pure simulation, declarative content, isolated renderer, validated saves, separate sound module                                    |
| Native app only demonstrated profile merging; cloud sign-in did not form a complete game delivery path                                                   | “Mobile support” described a scaffold instead of a playable equivalent                        | One responsive browser game, with install metadata and offline production caching; remove the disconnected scaffold and account UI |

## The finished loop

1. Pick a familiar character and departure. Every character controls the same way.
2. Get three simple luggage encounters before taller carts and seagulls appear.
3. Jump ground hazards, duck gulls, optionally chase a donut arc.
4. Clear an obstacle for five points. Each meter earns one point. Donuts start at ten points; five consecutive pickups activate ×2, ten activate ×3. A missed donut resets the streak.
5. The course accelerates gradually from 230 to 370 world units per second. Donuts do not affect speed. Espresso martinis grant +80 world units/second for three seconds, protection during the rush, and 400 ms of exit grace; the first appears between the first two hazards.
6. Later double baggage asks for a closer takeoff and a held jump. Recovery spacing and periodic breathers prevent impossible overlapping actions.
7. Every 250 meters changes the destination. At 1,250 meters, the voyage completes and loops into continued endless play.
8. A collision gets a specific joke and an actionable tip, then a one-button retry on the same course.
9. New personal records, six milestone stamps, and a next-stamp prompt provide persistence without mechanical upgrades.
10. Start a new departure for a new route, replay today's route, or hand the same route to the next person.

## Why the replay modes work

- **Endless dash:** a readable personal skill test with immediate same-course retries. Choosing a fresh departure creates variety.
- **Daily departure:** a versioned UTC seed gives everyone the same course. Scores are local; there is no fabricated global leaderboard.
- **Pass & play:** two to six names, equal-course turns, identical physics, a visible scoreboard, ties, and rematches. Known names select their matching character; other names cycle the cast. No account or network is needed once loaded.
- **Easy breezy:** 78% pace, three lives, no advanced double baggage, and separate records. This offers an approachable route into the game without making competitive comparisons ambiguous.
- **Friend challenge:** the result produces a route seed, ruleset, and score target. The receiving game validates these fields. A cancelled share sheet is harmless, and a visible copy field is available when sharing and clipboard APIs are unavailable.

## Silliness and social relevance

The humor lives in the situation, character expressions, failure titles, and deliberately petty stakes. “Excess baggage,” “The buffet fought back,” and “Seagull: 1. Dignity: 0” tell a small joke while identifying the failed action. References to group chats, towels, and breakfast reinforce the shared holiday story. Keep additions specific and affectionate; do not replace personality with a volume of random puns.

Adult sitcom is the **visual medium**: clean ink, exaggerated expressions, strong silhouettes, layered backgrounds, and cel shading. The existing toddler Bryan remains a toddler. The UI retains the tactile postcard and travel-passport framing.

## Fair frustration

The collision boxes are inset from the artwork, jump input buffers for 130 ms, short and held hops share predictable gravity, and duck lasts 720 ms per tap. A 120 Hz simulation prevents frame-rate-dependent collision behavior. Losing app focus or resizing pauses play, and resuming gives a short countdown.

Spacing tests cover 15,000 generated obstacle pairs. Full-route tests use reactive inputs to survive over 3,000 m on 35 seeds, including multiple loops and advanced baggage. This demonstrates that those tested courses are traversable; it does not prove that timing feels right to every human.

The key remaining design uncertainty is subjective difficulty. Before tuning for a specific group, observe at least five people on their own phones for five runs each. Ask them to describe why they failed, then watch whether they voluntarily restart. That evidence should drive timing changes; raw session length alone can reward confusion.

## Engineering and delivery

- No runtime dependency on a CDN, remote font, auth SDK, or analytics provider.
- The production build allowlists active files and is about 2.5 MB including all five backgrounds and the cast.
- Original generated masters remain editable source inputs, and earlier user art remains outside the shipped bundle.
- Production builds generate a content-versioned offline cache and installable web-app metadata.
- Corrupt or unavailable storage falls back to a playable in-memory session. Old records are preserved separately because scoring changed.
- Deleted dead paths include the legacy monolithic logic, the unused profile-sync demo, native build scripts/workflow, casino/rescue/perk/pass/account systems, and obsolete instructions. Earlier art is retained because it contains user changes.

## Explicit limits

This is a browser game, not a submitted App Store or Play Store binary. Progress is local to each browser/device. Challenge scores are honor-system targets. Offline play requires a first successful production load and cache installation. Resized browser checks do not replace physical-device testing or group playtesting. Deployment and store publication were not performed.

## Feedback incorporated: motion and visual consistency

- Replaced the separately drawn SVG obstacles with a transparent cartoon prop atlas: luggage, overloaded buffet cart, indignant gull, donut, espresso martini, and cloud. Similar ink and shading help players read everything as one world.
- Replaced two-frame wiggles with six distinct running poses per character, advancing by distance traveled. Contact, passing, and airborne poses make speed visible through the legs.
- Kept one physical sprite scale across every pose. Crouching now bends the body instead of shrinking it; gull clearance and the forgiving crouch hitbox follow the real art.
- Replaced the stationary establishing shots with five long 3:1 side-on panoramas. Scenery travels at 36% of course speed, clouds at 7.5%, deck seams at 95%. Portrait layouts extend the sky instead of magnifying buildings into the foreground.
- Espresso Rush uses a visible glass, BOOST marker, toast, sound, protection halo, speed trails, and a countdown. Protection makes the requested acceleration feel like a reward. Donut streaks remain independent.
- The competition ruleset is now `buffet-2`. Previous bests remain available separately; settings and earned stamps survive the migration. Old challenge links fail clearly instead of silently comparing different rules.

Barbra’s optional **Morning Beer** gives her a recognizable group-specific joke without changing competitive timing. Her boarding card reveals a saved drink choice; the pickup, home-stage prop, toast, and boost title follow that choice. Espresso remains available to her and standard for Bryan and Kyle. Both drinks were simplified to matte cel colors and dark sitcom outlines after feedback about glossy art.
