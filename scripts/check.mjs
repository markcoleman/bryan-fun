import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
let count = 0;
for (const dir of ["src", "scripts", "tests"])
  for (const file of await readdir(dir))
    if (/\.(m?js)$/.test(file)) {
      const result = spawnSync(process.execPath, ["--check", join(dir, file)], {
        stdio: "inherit",
      });
      if (result.status) process.exit(result.status);
      count++;
    }
const html = await readFile("index.html", "utf8");
for (const [, url] of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g))
  if (url !== "./" && !url.startsWith("http")) await stat(url);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length) throw Error("Duplicate HTML ids");
const code = await readFile("src/game.js", "utf8");
for (const [, id] of code.matchAll(/\$\(['"]([^'"]+)['"]\)/g))
  if (!ids.includes(id)) throw Error(`Missing DOM element: ${id}`);
const frames = JSON.parse(await readFile("assets/cartoon/frames.json", "utf8"));
for (const [name, poses] of Object.entries(frames.characters)) {
  if (poses.length !== 10) throw Error(`Expected 10 poses: ${name}`);
  await stat(`assets/cartoon/${name}.webp`);
  for (const f of poses)
    if (
      f.x < 0 ||
      f.y < 0 ||
      f.w <= 0 ||
      f.h <= 0 ||
      f.x + f.w > frames.atlases[name].width ||
      f.y + f.h > frames.atlases[name].height
    )
      throw Error(`Sprite bounds: ${name}`);
}
if (frames.props.length !== 7) throw Error("Expected seven cartoon props");
for (const f of frames.props) {
  const source = f.image || "props",
    bounds = frames.atlases[source];
  if (
    !bounds ||
    f.x < 0 ||
    f.y < 0 ||
    f.w <= 0 ||
    f.h <= 0 ||
    f.x + f.w > bounds.width ||
    f.y + f.h > bounds.height
  )
    throw Error(`Prop bounds: ${source}`);
  await stat(`assets/cartoon/${source}.webp`);
}
await stat("assets/cartoon/props.webp");
for (let i = 1; i <= 5; i++) await stat(`assets/cartoon/port-${i}.webp`);
console.log(
  `Checked ${count} JavaScript files, HTML references, DOM bindings, and sprite bounds.`,
);
