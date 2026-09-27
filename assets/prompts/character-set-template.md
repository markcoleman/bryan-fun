# Character production brief

Use case: stylized-concept. Asset type: transparent 2D browser-game sprite sheet.

Create an original adult animated sitcom character with confident dark hand-inked outlines, large expressive eyes, exaggerated comic expressions, flat vibrant cel coloring, and a simple shadow tone. Match `assets/cartoon/bryan.webp`, `barbra.webp`, and `kyle.webp` in line weight and facial language. Preserve the character's supplied identity, outfit, accessories and proportions.

Ten fully contained right-facing poses in a five-column, two-row atlas: idle; six running phases (contact, down, passing, airborne, opposite contact, opposite down); knees-raised jump; bent-knee crouch; comic dazed reaction. Maintain identical head size and physical scale across all poses; crouching must never shrink the whole character. Keep identities consistent. The running poses must have visibly opposite leg positions. No scenery, text, grid lines or cast shadows in the atlas. Use real transparency and ample margins; do not crop hair, fingers, or feet.

Preserve the source master. Measure actual pixel rectangles and add them to `assets/cartoon/frames.json`; generated layouts are not guaranteed to land on an exact grid. Inspect every crop for neighboring-row bleed. Export WebP with preserved alpha. Gameplay collision sizes remain independent of costume details.

Avoid watercolor, pixel art, photorealism, 3D, tiny decorative details that disappear at phone size, and inconsistent facing direction.
