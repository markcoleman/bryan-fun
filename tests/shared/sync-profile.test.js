import test from "node:test";
import assert from "node:assert/strict";
import {
  createSerializableSyncPayload,
  getProfileSyncWinner,
  mergeProfileProgression
} from "../../src/sync-profile.js";

test("getProfileSyncWinner returns latest timestamp", () => {
  assert.equal(
    getProfileSyncWinner({ updatedAt: 100, deviceId: "ios" }, { updatedAt: 200, deviceId: "web" }),
    "remote"
  );
});

test("getProfileSyncWinner breaks ties by device id", () => {
  assert.equal(
    getProfileSyncWinner({ updatedAt: 100, deviceId: "z-device" }, { updatedAt: 100, deviceId: "a-device" }),
    "local"
  );
});

test("mergeProfileProgression keeps highest progression and union of characters", () => {
  const merged = mergeProfileProgression(
    {
      progression: {
        maxUnlockedLevel: 2,
        coinBank: 45,
        unlockedCharacters: ["bryan"]
      }
    },
    {
      progression: {
        maxUnlockedLevel: 4,
        coinBank: 31,
        unlockedCharacters: ["kyle", "bryan"]
      }
    }
  );

  assert.equal(merged.progression.maxUnlockedLevel, 4);
  assert.equal(merged.progression.coinBank, 45);
  assert.deepEqual(merged.progression.unlockedCharacters, ["bryan", "kyle"]);
});

test("createSerializableSyncPayload creates valid sync envelope", () => {
  const serialized = createSerializableSyncPayload({
    profile: { progression: { maxUnlockedLevel: 5 } },
    updatedAt: 98765,
    source: "remote"
  });

  const parsed = JSON.parse(serialized);
  assert.equal(parsed.schema, "bbcd.sync.v1");
  assert.equal(parsed.updatedAt, 98765);
  assert.equal(parsed.source, "remote");
  assert.equal(parsed.profile.progression.maxUnlockedLevel, 5);
});
