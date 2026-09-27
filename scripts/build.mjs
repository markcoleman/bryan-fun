// A small allowlisted static build. Original art, tests, and prototypes are never published.
import {
  mkdir,
  rm,
  cp,
  readdir,
  readFile,
  writeFile,
  stat,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { createOfflineWorker } from "./offline-worker.mjs";
const out = resolve("dist");
await rm(out, { recursive: true, force: true });
await mkdir(join(out, "assets/cartoon"), { recursive: true });
for (const name of ["index.html", "manifest.webmanifest", ".nojekyll"])
  await cp(name, join(out, name));
await cp("src", join(out, "src"), { recursive: true });
for (const name of await readdir("assets/cartoon"))
  if (
    /\.(webp|png|svg|json)$/.test(name) &&
    (await stat(join("assets/cartoon", name))).isFile()
  )
    await cp(join("assets/cartoon", name), join(out, "assets/cartoon", name));
async function files(dir, prefix = "") {
  let all = [];
  for (const name of await readdir(dir)) {
    const path = join(dir, name),
      key = prefix + name;
    all.push(
      ...((await stat(path)).isDirectory()
        ? await files(path, key + "/")
        : [key]),
    );
  }
  return all.sort();
}
let list = await files(out);
const hash = createHash("sha256");
for (const file of list) hash.update(await readFile(join(out, file)));
const version = hash.digest("hex").slice(0, 12),
  cache = `cruise-${version}`;
let html = await readFile(join(out, "index.html"), "utf8");
html = html.replace(
  "</head>",
  `<meta name="cruise-build" content="${version}"></head>`,
);
await writeFile(join(out, "index.html"), html);
// Include query-bearing entrypoints exactly as the HTML requests them.
const urls = [
  "./",
  ...list.map((f) => "./" + f),
  "./src/game.js?v=3",
  "./src/style.css?v=3",
];
const worker = createOfflineWorker(version, urls);
await writeFile(join(out, "sw.js"), worker);
list = await files(out);
let bytes = 0;
for (const file of list) bytes += (await stat(join(out, file))).size;
console.log(
  `Built ${list.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB, offline cache ${cache}.`,
);
