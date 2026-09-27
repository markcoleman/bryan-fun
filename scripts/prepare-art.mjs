// Reproducible technical export of approved imagegen masters; no runtime image dependency.
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const root = "assets/cartoon";
const metadata = { characters: {}, atlases: {}, props: [] };
async function atlas(name, columns, rows) {
  const source = `${root}/source/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const frames = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const boundaries =
        name === "barbra" ? [0, 350, 793, 1190, 1586, info.width] : null;
      const left =
          boundaries?.[col] ?? Math.round((col * info.width) / columns),
        right =
          boundaries?.[col + 1] ??
          Math.round(((col + 1) * info.width) / columns);
      // Approved prop objects cross the mathematical halfway line; use the visible gutters.
      const split =
        name === "props"
          ? [540, 506, 512][col]
          : name === "barbra" && col === 4
            ? 375
            : Math.round(info.height / rows);
      const top = row === 0 ? 0 : split,
        bottom = row === 0 ? split : info.height;
      let x0 = right,
        y0 = bottom,
        x1 = left,
        y1 = top;
      for (let y = top; y < bottom; y++)
        for (let x = left; x < right; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 128) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
        }
      if (x1 <= x0 || y1 <= y0)
        throw Error(`Empty pose in ${name}: ${frames.length}`);
      x0 = Math.max(left, x0 - 2);
      y0 = Math.max(top, y0 - 2);
      x1 = Math.min(right - 1, x1 + 2);
      y1 = Math.min(bottom - 1, y1 + 2);
      frames.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    }
  await sharp(source)
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${root}/${name}.webp`);
  metadata.atlases[name] = { width: info.width, height: info.height };
  return frames;
}
for (const name of ["bryan", "barbra", "kyle"]) {
  metadata.characters[name] = await atlas(name, 5, 2);
  const f = metadata.characters[name][0];
  await sharp(`${root}/source/${name}.png`)
    .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
    .resize({ height: 210 })
    .webp({ quality: 90 })
    .toFile(`${root}/${name}-portrait.webp`);
}
metadata.props = await atlas("props", 3, 2);
const drinks = await atlas("drinks", 2, 1);
metadata.props[4] = { ...drinks[0], image: "drinks" };
metadata.props.push({ ...drinks[1], image: "drinks" });
for (const [i, name] of ["espresso", "morning-beer"].entries()) {
  const f = drinks[i];
  await sharp(`${root}/source/drinks.png`)
    .extract({ left: f.x, top: f.y, width: f.w, height: f.h })
    .resize({ height: 128 })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${root}/${name}-icon.webp`);
}
for (let i = 1; i <= 5; i++)
  await sharp(`${root}/source/panorama-${i}.png`)
    .resize({ width: 2172, withoutEnlargement: true })
    .webp({ quality: 87 })
    .toFile(`${root}/port-${i}.webp`);
await writeFile(
  `${root}/frames.json`,
  JSON.stringify(metadata, null, 2) + "\n",
);
console.log(
  "Exported 30 character poses, 7 active props, 3 portraits, 2 drink icons, and 5 panoramic ports.",
);
