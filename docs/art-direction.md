# Adult sitcom cartoon art

The active direction follows the user's instruction: **adult sitcom cartoon characters, props, and backgrounds**. Bold dark ink, expressive faces, readable cel shading, warm tropical light, and deck shadows unify the world. The earlier pixel and watercolor directions are retired.

## Approved production assets

- `assets/cartoon/bryan.webp`, `barbra.webp`, `kyle.webp`: transparent 1983 × 793 atlases, ten poses each.
- `assets/cartoon/frames.json`: measured crop rectangles, atlas dimensions, character poses, and props.
- `assets/cartoon/*-portrait.webp`: isolated idle poses used by the character cards.
- `assets/cartoon/props.webp`: transparent 1536 × 1024 atlas supplying suitcase, buffet cart, gull, donut, and cloud. Its original glossy martini cell is superseded.
- `assets/cartoon/drinks.webp`: matching flat cartoon espresso martini and Morning Beer; `espresso-icon.webp` and `morning-beer-icon.webp` use the same approved art for selection buttons. `frames.json` routes drink frames to this atlas.
- `assets/cartoon/port-1.webp` through `port-5.webp`: 2172 × 724 panoramic sun deck, pool club, Bahamas, sunset deck, and Miami scenes.
- `assets/cartoon/favicon.svg` and icons: cruise-boat identity.
- `assets/cartoon/source/`: approved imagegen PNG masters, excluded from deployment.

The art was generated with the built-in **imagegen** tool. Sharp only performs technical preparation: alpha-bound crop measurement, compression, and portrait export. Run `npm run art:prepare` to reproduce the exports. Character/prop quality is 90 with preserved alpha; backgrounds use WebP quality 87. The runtime has no image-processing dependency. Earlier user artwork in `assets/images/` remains untouched and excluded from the build.

## Character identity and animation

Bryan: oversized round head, single brown curl, white romper, bare feet, mischievous expression. Barbra: red-brown curls, blue glasses, tan patterned blouse, jeans, sandals, pink crossbody bag. Kyle: blond hair, teal tropical shirt with yellow flowers, jeans, sandals.

Each character has a separate five-column, two-row atlas. All poses face right:

| Frame | Pose                                                                         |
| ----- | ---------------------------------------------------------------------------- |
| 0     | Idle, full-height reference                                                  |
| 1–6   | Run cycle: contact, down, passing, airborne, opposite contact, opposite down |
| 7     | Jump with raised knees                                                       |
| 8     | Bent-knee crouch, head and body retaining their physical scale               |
| 9     | Dazed reaction                                                               |

`src/animation.js` selects run frames from distance traveled, so the stride follows speed. Every pose uses **one scale derived from idle height** and a bottom-center anchor. Never fit every pose into an equal-height box: that turns a crouch into a miniature. Current standing art is about 89 world units high and the crouches about 60–65; the gull's lower clearance is 72. Collision boxes remain forgiving and identical across the cast.

Generated cells are not guaranteed to align. The exporter measures alpha bounds within each cell; inspect all crops for clipped hair, feet, neighbors, and stray marks. If a future source violates the cell contract, repair the source or adjust the importer explicitly. Do not silently stretch a pose.

## Scenery and props

Use wide 3:1 orthographic side-on panoramas with matching rail height at both edges. Keep furniture behind the running lane, open sea near tile boundaries, and no essential lettering. Scene scale is capped in portrait layouts; extended sky prevents buildings from dwarfing the player. Alternating mirrored tiles join identical edge pixels; the approved panoramas contain no essential text. The renderer scrolls panoramas at 0.36× course speed, decorative clouds at 0.075×, and deck seams at 0.95×. Reduced motion removes decorative clouds, trails, particles and shake while keeping essential course movement.

The generated prop atlas follows the cast's ink and cel-shading style. Fit props proportionally; do not squash the gull's wings to its smaller body hitbox. Double baggage reuses two suitcases. Espresso uses the stemmed glass with a dark coffee body, cream cap, and beans. It is the standard boost for all characters; Barbra’s selectable Morning Beer swaps in a foamy golden mug and her own boost feedback with identical gameplay timing. A runtime BOOST label makes the pickup legible at phone size.

## Prompt contract

Cast prompt: original adult animated sitcom character, transparent sprite atlas, bold confident dark hand-inked contours, clean vibrant cel color, simple shadow tone, exaggerated expressive eyes, consistent model-sheet anatomy and costume. Five columns by two rows, ten complete right-facing poses in the order above. Six genuinely different running leg positions. Crouch by bending knees and leaning forward, never by making the character smaller. Fixed camera scale and head size, ample transparent gutters, no backdrop, labels, grid, or embedded shadows.

Environment prompt: extra-wide 3:1 side-scrolling panorama, adult animated sitcom background, confident dark ink, clean cel shading, warm directional lighting and crisp shadows, orthographic side-on view, continuous level railing, uninterrupted walking plane, open ocean at both side edges. No characters, foreground hazards, text, UI, photorealism, watercolor, pixel art, or 3D.

Scene additions: sunny ship superstructure and tiki bar; pool club with coral loungers and parasols; turquoise Bahamas shore with pastel huts; sunset deck with warm string lights; Miami Art Deco promenade at dusk.

Prop prompt: transparent three-column by two-row atlas, full isolated objects, matching sitcom linework and shading, no backdrop or colored glow. Coral roller suitcase; comically overloaded green buffet trolley; indignant white gull; pink-frosted donut; espresso martini in a clear stemmed glass with coffee beans; simple puffy cloud. Leave transparent gutters and preserve complete silhouettes.

## Review gate

Run `npm run art:prepare`, `npm run validate`, and `npm run format:check`. Inspect actual play at phone and desktop sizes, every action pose, martini readability, gull clearance, scenery wrap, and port transition. Never infer physical-device performance or human enjoyment from screenshots or simulation tests alone.

## Drink style correction

Both drink pickups were revised with the built-in **imagegen** tool after feedback that glossy glass did not match the cast. Approved master: `assets/cartoon/source/drinks.png`; compressed runtime atlas: `assets/cartoon/drinks.webp`. The optional Morning Beer selection is only shown for Barbra, defaults to her signature drink, and is saved independently of character selection. Every drink uses the same three-second speed/protection rules.

Final drink prompt: “Two complete transparent sprites in one horizontal row, espresso martini left and Morning Beer mug right. Match the flat adult animated sitcom character reference: simple matte cel colors, confident dark contours, a single flat shadow shape per object. Coffee with cream band and three bean marks; amber mug with chunky handle and white foam. Equal visible height, large transparent gutter, fully contained stem and handle. No glossy reflections, refraction, specular shine, tiny bubbles, sparkles, realism, painterly texture, labels, text, scenery, or floor. Readable at 32 pixels.”
