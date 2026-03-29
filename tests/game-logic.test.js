import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPatternDeck,
  CHALLENGE_CURRENT_VERSION,
  compareVersions,
  decodeChallengePayload,
  encodeChallengePayload,
  getDailyQuestSeed,
  getNotesSince,
  getProgressiveSpeedGain,
  migrateProfileV2,
  normalizeLevelId,
  parseVersion,
  PROFILE_STORAGE_KEY_V2
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

test("challenge payload roundtrip preserves values", () => {
  const now = Date.UTC(2026, 2, 29, 12, 0, 0);
  const payload = {
    version: CHALLENGE_CURRENT_VERSION,
    seed: 12345,
    targetScore: 77,
    runner: "bryan",
    level: 3,
    createdAt: now,
    expiresAt: now + 60 * 60 * 1000,
    chainDepth: 2
  };
  const encoded = encodeChallengePayload(payload);
  const decoded = decodeChallengePayload(encoded, { now });
  assert.equal(decoded.ok, true);
  assert.equal(decoded.payload.version, CHALLENGE_CURRENT_VERSION);
  assert.equal(decoded.payload.seed, 12345);
  assert.equal(decoded.payload.targetScore, 77);
  assert.equal(decoded.payload.runner, "bryan");
  assert.equal(decoded.payload.level, 3);
  assert.equal(decoded.payload.chainDepth, 2);
});

test("challenge decode rejects unsupported versions", () => {
  const now = Date.UTC(2026, 2, 29, 12, 0, 0);
  const encoded = encodeChallengePayload({
    version: "99",
    seed: 5,
    targetScore: 10,
    runner: "kyle",
    level: 2,
    createdAt: now,
    expiresAt: now + 20000
  });
  const decoded = decodeChallengePayload(encoded, {
    now,
    supportedVersions: [CHALLENGE_CURRENT_VERSION]
  });
  assert.equal(decoded.ok, false);
  assert.equal(decoded.error, "unsupported_version");
});

test("challenge decode flags expiry", () => {
  const now = Date.UTC(2026, 2, 29, 12, 0, 0);
  const encoded = encodeChallengePayload({
    version: CHALLENGE_CURRENT_VERSION,
    seed: 6,
    targetScore: 12,
    runner: "barbra",
    level: 1,
    createdAt: now - 20000,
    expiresAt: now - 1000
  });
  const decoded = decodeChallengePayload(encoded, { now });
  assert.equal(decoded.ok, false);
  assert.equal(decoded.error, "expired");
});

test("getDailyQuestSeed is deterministic for date and user seed", () => {
  const sameA = getDailyQuestSeed("2026-03-29T13:00:00", "guest");
  const sameB = getDailyQuestSeed("2026-03-29T23:00:00", "guest");
  const nextDay = getDailyQuestSeed("2026-03-30T01:00:00", "guest");
  assert.equal(sameA, sameB);
  assert.notEqual(sameA, nextDay);
});

test("buildPatternDeck is deterministic and avoids impossible streaks", () => {
  const first = buildPatternDeck(404, 3, { deckLength: 20 });
  const second = buildPatternDeck(404, 3, { deckLength: 20 });
  assert.deepEqual(first, second);

  let hardStreak = 0;
  let lowBarStreak = 0;
  first.forEach((pattern) => {
    hardStreak = pattern.difficulty === "hard" ? hardStreak + 1 : 0;
    lowBarStreak = pattern.extraObstacle === "lowBar" ? lowBarStreak + 1 : 0;
    assert.ok(hardStreak <= 2, "too many hard patterns in a row");
    assert.ok(lowBarStreak <= 2, "too many low-bar patterns in a row");
  });
});

test("migrateProfileV2 upgrades legacy keys", () => {
  const migrated = migrateProfileV2({
    "bbcd:maxUnlockedLevel": "4",
    "bbcd:coinBank": "150",
    "bbcd:unlockedCharacters": JSON.stringify(["barbra"])
  });
  assert.equal(migrated.migrated, true);
  assert.equal(migrated.profile.version, 2);
  assert.equal(migrated.profile.progression.maxUnlockedLevel, 4);
  assert.equal(migrated.profile.progression.coinBank, 150);
  assert.ok(migrated.profile.progression.unlockedCharacters.includes("barbra"));
  assert.ok(migrated.profile.progression.unlockedCharacters.includes("bryan"));
});

test("migrateProfileV2 keeps existing v2 profiles", () => {
  const existing = {
    version: 2,
    pass: { xp: 120, level: 1, unlockedPerkSlots: 1 },
    perks: { selected: "combo_shield", unlocked: ["safe_landing", "combo_shield"] },
    personalBests: { overall: 88, byRunner: { bryan: 88 } },
    progression: {
      maxUnlockedLevel: 5,
      coinBank: 200,
      unlockedCharacters: ["bryan", "kyle"],
      clearedDestinations: [1, 2]
    }
  };
  const migrated = migrateProfileV2({
    [PROFILE_STORAGE_KEY_V2]: JSON.stringify(existing),
    "bbcd:maxUnlockedLevel": "2",
    "bbcd:coinBank": "10"
  });
  assert.equal(migrated.migrated, false);
  assert.equal(migrated.profile.progression.maxUnlockedLevel, 5);
  assert.equal(migrated.profile.progression.coinBank, 200);
  assert.equal(migrated.profile.personalBests.overall, 88);
});
