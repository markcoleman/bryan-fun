import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  POSE,
  runnerPose,
  spriteSize,
  tilePositions,
} from "../src/animation.js";
import { TUNING as T, HAZARDS } from "../src/content.js";
const metadata = JSON.parse(
  await readFile(new URL("../assets/cartoon/frames.json", import.meta.url)),
);
test("actual character assets crouch below the gull without changing their pixel scale", () => {
  for (const frames of Object.values(metadata.characters)) {
    const idle = spriteSize(frames, POSE.idle, 104 * 0.86);
    const duck = spriteSize(frames, POSE.duck, 104 * 0.86);
    assert.ok(
      duck.height > idle.height * 0.6,
      "crouch must not shrink into a miniature",
    );
    assert.ok(
      duck.height < HAZARDS.gull.bottom - 3,
      "actual artwork must fit under the gull",
    );
    assert.ok(
      duck.height >= T.duckHeight - 6,
      "collision size follows the visible pose",
    );
    for (let i = 0; i < frames.length; i++) {
      const pose = spriteSize(frames, i, 104 * 0.86);
      assert.ok(
        Math.abs(pose.height / frames[i].h - idle.height / frames[0].h) < 1e-9,
      );
    }
  }
});
test("a stride includes six poses and action poses override running", () => {
  const run = { status: "running", y: 0, duck: 0, scroll: 0 };
  const poses = Array.from({ length: 6 }, (_, i) =>
    runnerPose({ ...run, scroll: i * 22 }),
  );
  assert.equal(new Set(poses).size, 6);
  assert.equal(runnerPose({ ...run, scroll: 132 }), poses[0]);
  assert.equal(runnerPose({ ...run, y: 10 }), POSE.jump);
  assert.equal(runnerPose({ ...run, duck: 0.5 }), POSE.duck);
  assert.equal(runnerPose({ ...run, status: "over" }), POSE.hurt);
});
test("panorama layers scroll left at distinct depths and tile without gaps through wraps", () => {
  for (const scroll of [0, 100, 4400, 200000])
    for (const factor of [0.075, 0.36, 0.95]) {
      const tiles = tilePositions(scroll, factor, 1700);
      assert.ok(tiles[0] <= 0);
      assert.ok(tiles.at(-1) + 1700 >= 800);
      for (let i = 1; i < tiles.length; i++)
        assert.ok(Math.abs(tiles[i] - tiles[i - 1] - 1700) < 1e-8);
    }
  assert.ok(
    tilePositions(100, 0.36, 1700)[0] < tilePositions(100, 0.075, 1700)[0],
  );
});
