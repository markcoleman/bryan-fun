import { describe, expect, it } from "vitest";
import {
  compareVersions,
  getNotesSince,
  getProgressiveSpeedGain,
  normalizeLevelId,
  parseVersion
} from "../src/game-logic.js";

describe("normalizeLevelId", () => {
  it("clamps values to min/max bounds", () => {
    expect(normalizeLevelId(0, 5, 2)).toBe(1);
    expect(normalizeLevelId(9, 5, 2)).toBe(5);
  });

  it("falls back for non-numeric values", () => {
    expect(normalizeLevelId("abc", 5, 3)).toBe(3);
  });
});

describe("version helpers", () => {
  it("parses dotted versions", () => {
    expect(parseVersion("1.9.0")).toEqual([1, 9, 0]);
  });

  it("compares versions accurately", () => {
    expect(compareVersions("1.9.0", "1.8.5")).toBe(1);
    expect(compareVersions("1.9.0", "1.9.0")).toBe(0);
    expect(compareVersions("1.9.0", "2.0.0")).toBe(-1);
  });

  it("returns notes newer than the supplied version", () => {
    const notes = [
      { version: "1.9.0" },
      { version: "1.8.0" },
      { version: "1.2.0" }
    ];

    expect(getNotesSince("1.7.0", notes)).toEqual([{ version: "1.9.0" }, { version: "1.8.0" }]);
  });
});

describe("getProgressiveSpeedGain", () => {
  it("scales gain and respects max speed", () => {
    const nextSpeed = getProgressiveSpeedGain({
      score: 12,
      speedGainPerCollectibleBase: 10,
      speedGainPerCollectibleScale: 8,
      speedGainMultiplier: 1.1,
      currentSpeed: 200,
      maxSpeed: 500
    });

    expect(nextSpeed).toBeGreaterThan(200);
    expect(nextSpeed).toBeLessThanOrEqual(500);
  });

  it("caps at max speed", () => {
    expect(
      getProgressiveSpeedGain({
        score: 100,
        speedGainPerCollectibleBase: 30,
        speedGainPerCollectibleScale: 3,
        speedGainMultiplier: 1.2,
        currentSpeed: 495,
        maxSpeed: 500
      })
    ).toBe(500);
  });
});
