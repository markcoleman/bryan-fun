import test from "node:test";
import assert from "node:assert/strict";
import {
  compareVersions,
  getNotesSince,
  getProgressiveSpeedGain,
  normalizeLevelId,
  parseVersion
} from "../src/game-logic.js";

test("normalizeLevelId clamps values to min/max bounds", () => {
  assert.equal(normalizeLevelId(0, 5, 2), 1);
  assert.equal(normalizeLevelId(9, 5, 2), 5);
});

test("normalizeLevelId falls back for non-numeric values", () => {
  assert.equal(normalizeLevelId("abc", 5, 3), 3);
});

test("parseVersion parses dotted versions", () => {
  assert.deepEqual(parseVersion("1.9.0"), [1, 9, 0]);
});

test("compareVersions compares versions accurately", () => {
  assert.equal(compareVersions("1.9.0", "1.8.5"), 1);
  assert.equal(compareVersions("1.9.0", "1.9.0"), 0);
  assert.equal(compareVersions("1.9.0", "2.0.0"), -1);
});

test("getNotesSince returns notes newer than supplied version", () => {
  const notes = [{ version: "1.9.0" }, { version: "1.8.0" }, { version: "1.2.0" }];
  assert.deepEqual(getNotesSince("1.7.0", notes), [{ version: "1.9.0" }, { version: "1.8.0" }]);
});

test("getProgressiveSpeedGain scales gain and respects max speed", () => {
  const nextSpeed = getProgressiveSpeedGain({
    score: 12,
    speedGainPerCollectibleBase: 10,
    speedGainPerCollectibleScale: 8,
    speedGainMultiplier: 1.1,
    currentSpeed: 200,
    maxSpeed: 500
  });

  assert.ok(nextSpeed > 200);
  assert.ok(nextSpeed <= 500);
});

test("getProgressiveSpeedGain caps at max speed", () => {
  const result = getProgressiveSpeedGain({
    score: 100,
    speedGainPerCollectibleBase: 30,
    speedGainPerCollectibleScale: 3,
    speedGainMultiplier: 1.2,
    currentSpeed: 495,
    maxSpeed: 500
  });

  assert.equal(result, 500);
});
