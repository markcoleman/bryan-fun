import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultProfile,
  loadProfile,
  saveProfile,
  sanitizeProfile,
  recordRun,
  STORAGE_KEY,
} from "../src/profile.js";
import { createRun } from "../src/engine.js";
import { RULESET } from "../src/content.js";
const storage = (data = {}) => ({
  getItem: (k) => data[k] ?? null,
  setItem: (k, v) => {
    data[k] = v;
  },
});
test("new saves roundtrip and preserve preferences", () => {
  const s = storage(),
    p = defaultProfile();
  p.character = "barbra";
  p.best = 100;
  p.sound = false;
  assert.equal(saveProfile(s, p), true);
  assert.deepEqual(loadProfile(s), p);
});
test("unavailable and corrupt storage still allow a playable session", () => {
  const fail = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.deepEqual(loadProfile(fail), defaultProfile());
  assert.equal(saveProfile(fail, defaultProfile()), false);
  assert.deepEqual(
    loadProfile(storage({ [STORAGE_KEY]: "{broken" })),
    defaultProfile(),
  );
  assert.deepEqual(loadProfile(null), defaultProfile());
});
test("invalid persisted fields cannot poison scores or inject characters", () => {
  const p = sanitizeProfile({
    best: "Infinity",
    runs: -10,
    character: "<script>",
    stamps: ["first", "fake", "first"],
    recent: [null, { character: "bryan", score: -7, distance: "bad" }],
    daily: { evil: 900 },
  });
  assert.equal(p.best, 0);
  assert.equal(p.runs, 0);
  assert.equal(p.character, "bryan");
  assert.deepEqual(p.stamps, ["first"]);
  assert.equal(p.recent[0].score, 0);
  assert.deepEqual(p.daily, {});
});
test("legacy record is preserved separately because scoring changed", () => {
  const p = loadProfile(
    storage({
      "bbcd:profile:v2": JSON.stringify({ personalBests: { overall: 88 } }),
    }),
  );
  assert.equal(p.legacyBest, 88);
  assert.equal(p.best, 0);
});
test("new records and stamps are credited once with no overwrite of earlier records", () => {
  const r = createRun();
  Object.assign(r, {
    score: 350,
    distance: 125,
    snacks: 8,
    cleared: 12,
    bestStreak: 10,
  });
  const a = recordRun(defaultProfile(), r);
  assert.equal(a.unlocked.length, 4);
  assert.equal(a.newBest, true);
  const b = recordRun(a.profile, r);
  assert.equal(b.unlocked.length, 0);
  assert.equal(b.newBest, false);
  assert.equal(b.profile.best, 350);
});
test("practice cannot award competitive records or stamps", () => {
  const r = createRun({ mode: "practice" });
  Object.assign(r, {
    score: 9999,
    distance: 9999,
    snacks: 99,
    bestStreak: 99,
    cleared: 99,
  });
  const { profile, unlocked } = recordRun(defaultProfile(), r);
  assert.equal(profile.best, 0);
  assert.equal(profile.practiceBest, 9999);
  assert.equal(profile.stamps.length, 0);
  assert.equal(unlocked.length, 0);
});
test("daily records are isolated by course and history remains bounded", () => {
  let p = defaultProfile();
  for (let i = 0; i < 20; i++) {
    const r = createRun({
      mode: "daily",
      seed: `${RULESET}-2026-09-${String(i + 1).padStart(2, "0")}`,
    });
    r.score = i * 10;
    p = recordRun(p, r).profile;
  }
  assert.ok(Object.keys(sanitizeProfile(p).daily).length <= 14);
  assert.equal(p.recent.length, 5);
  assert.equal(p.best, 190);
});
test("ruleset migration preserves old glory and preferences while separating new scores", () => {
  const p = sanitizeProfile({
    ...defaultProfile(),
    ruleset: "buffet-1",
    best: 420,
    practiceBest: 100,
    character: "kyle",
    stamps: ["first"],
    daily: { "buffet-1-2026-09-27": 400 },
  });
  assert.equal(p.ruleset, RULESET);
  assert.equal(p.legacyBest, 420);
  assert.equal(p.best, 0);
  assert.equal(p.practiceBest, 0);
  assert.equal(p.character, "kyle");
  assert.deepEqual(p.stamps, ["first"]);
  assert.deepEqual(p.daily, {});
  assert.deepEqual(sanitizeProfile(p), p, "migration is idempotent");
});
test("Barbra’s chosen drink survives reload and invalid options fall back safely", () => {
  const s = storage(),
    p = defaultProfile();
  p.character = "barbra";
  p.barbraPower = "espresso";
  saveProfile(s, p);
  assert.equal(loadProfile(s).barbraPower, "espresso");
  assert.equal(
    sanitizeProfile({ ...p, barbraPower: "unknown" }).barbraPower,
    "morning-beer",
  );
});
