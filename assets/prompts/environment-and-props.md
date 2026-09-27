# Environments and props

All backgrounds use the same adult animated sitcom visual language as the cast: dark inked contours, clean cel-shaded color, bright tropical shapes, warm directional lighting, crisp shadows, and humorous everyday cruise details. See `docs/art-direction.md` for the actual scene prompt set.

Five destinations: sunny cruise deck, pool club, Bahamas beach boardwalk, sunset cruise deck, and Miami Art Deco promenade. Use an open center and place furniture behind the playable lane. Do not create apparent holes or solid barriers on the walking line. Do not embed essential instructions or interface text in the art.

Active foreground assets: coral luggage, buffet trolley, obnoxious white seagull, pink-frosted donut, espresso martini, Barbra’s Morning Beer mug, puffy cloud. Drink art is deliberately simple and matte: bold contours, flat cel fills, one shadow, no glossy reflections. Double baggage reuses two suitcases. Props need strong silhouettes at 30–80 screen pixels. Match visible obstruction to the generous collision contract in `src/content.js`; decorative handles, feathers and shadows must not become invisible collision penalties.

Save source PNGs in `assets/cartoon/source/`, export backgrounds to 2172-pixel-wide 3:1 WebP at quality 87, preserve alpha on characters and props. Run `npm run art:prepare` to reproduce the approved exports. Props use the same generated cartoon style as the cast. Old casino, pill, rescue, low-bar and waterslide art is not part of the active game.
