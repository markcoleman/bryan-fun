# Active art prompts

The active direction is **original adult sitcom cartoon animation**: bold ink, expressive characters, clean cel shading, tropical settings, warm light and cast shadows. The user replaced the previous pixel/watercolor direction.

Read `docs/art-direction.md` for the prompt set used to generate the current art, file formats, crop metadata, and production constraints. The built-in imagegen tool produced the active cast/backgrounds in `assets/cartoon/`; original PNG masters are in its `source/` folder. Earlier `assets/images/` assets are retained as user source material and are not deployed.

The game consumes ten poses per character: idle, six running phases, jump, crouch, dazed. Use `assets/cartoon/frames.json` for exact pixel crops rather than assuming equal grid cells. Props use a matching transparent cartoon atlas. Run `npm run art:prepare` to reproduce exports from approved PNG masters. All poses are right-facing and bottom-center anchored at runtime.

- `character-set-template.md`: new character production brief.
- `bryan.md`, `barbra.md`, `kyle.md`: identity invariants.
- `environment-and-props.md`: scenery and hazard direction.
- `dr-m.md`: retired doctor-rescue concept; not an active game asset.
