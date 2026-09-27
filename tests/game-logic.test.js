import test from "node:test";
import assert from "node:assert/strict";
import {
  createRun,
  createRng,
  dailySeed,
  inputRun,
  stepRun,
  makePattern,
  playerBox,
  obstacleBox,
  intersects,
  challengeUrl,
  readChallenge,
  drainEvents,
} from "../src/engine.js";
import { TUNING as T, HAZARDS, RULESET } from "../src/content.js";

const tick = (run, seconds) => {
  for (let i = 0; i < Math.round(seconds / T.step); i++) stepRun(run);
  return run;
};
function cruise(seed, seconds = 180, mode = "arcade") {
  const run = createRun({ seed, mode });
  for (let i = 0; i < seconds / T.step && run.status === "running"; i++) {
    const ob = run.obstacles.find(
      (o) => !o.passed && !o.hit && o.x - run.scroll > T.runnerX - 5,
    );
    if (ob) {
      const d = ob.x - run.scroll - T.runnerX;
      if (ob.type === "gull") {
        if (d < run.speed * 0.2 && run.duck === 0) inputRun(run, "duck");
      } else if (
        d < run.speed * (ob.type === "baggage" ? 0.2 : 0.3) &&
        run.y === 0
      )
        inputRun(run, "jump");
    }
    stepRun(run);
    drainEvents(run);
  }
  return run;
}
test("seeded courses are repeatable, different seeds vary after the intro", () => {
  const a = createRun({ seed: "friends" }),
    b = createRun({ seed: "friends" }),
    c = createRun({ seed: "new-friends" });
  for (let i = 0; i < 100; i++) {
    makePattern(a);
    makePattern(b);
    makePattern(c);
  }
  assert.deepEqual(a.obstacles, b.obstacles);
  assert.notDeepEqual(a.obstacles, c.obstacles);
  assert.deepEqual(
    a.obstacles.slice(0, 5).map((o) => o.type),
    ["suitcase", "suitcase", "suitcase", "trolley", "gull"],
  );
});
test("patterns have safe recovery gaps even at maximum speed", () => {
  for (let seed = 0; seed < 100; seed++) {
    const run = createRun({ seed });
    for (let i = 0; i < 150; i++) makePattern(run);
    for (let i = 1; i < run.obstacles.length; i++) {
      const prev = run.obstacles[i - 1],
        next = run.obstacles[i];
      assert.ok(
        next.x - prev.x - HAZARDS[prev.type].width >= T.maxSpeed * 1.4 - 1e-7,
      );
      assert.ok(!(prev.type === "gull" && next.type === "gull"));
    }
  }
});
test("reactive inputs can complete and loop the entire voyage over many seeds", () => {
  for (let seed = 0; seed < 35; seed++) {
    const run = cruise(`route-${seed}`);
    assert.equal(
      run.status,
      "running",
      `seed ${seed}, hit ${run.cause} at ${run.distance} m`,
    );
    assert.ok(run.distance > 3000);
    assert.ok(run.cleared > 60);
    assert.ok(run.lap >= 2);
    assert.ok(run.speed <= T.maxSpeed + T.boostSpeed);
  }
});
test("practice is survivable with the same timing strategy", () => {
  const run = cruise("practice", 180, "practice");
  assert.equal(run.lives, 3);
  assert.equal(run.status, "running");
});
test("jump release produces a short hop and buffer survives until landing", () => {
  const full = createRun(),
    short = createRun();
  inputRun(full, "jump");
  inputRun(short, "jump");
  stepRun(full);
  stepRun(short);
  inputRun(short, "release");
  let maxFull = 0,
    maxShort = 0;
  for (let i = 0; i < 100; i++) {
    stepRun(full);
    stepRun(short);
    maxFull = Math.max(maxFull, full.y);
    maxShort = Math.max(maxShort, short.y);
  }
  assert.ok(maxFull > maxShort + 20);
  assert.equal(full.y, 0);
  assert.equal(short.y, 0);
  inputRun(full, "jump");
  tick(full, 0.59);
  inputRun(full, "jump");
  tick(full, 0.1);
  assert.ok(full.y > 0);
  assert.ok(full.vy > 0);
});
test("duck clears gulls, standing hits, ground obstacles still hit when ducked", () => {
  const run = createRun();
  const gull = { type: "gull", x: T.runnerX };
  assert.equal(intersects(playerBox(run), obstacleBox(gull, 0)), true);
  inputRun(run, "duck");
  assert.equal(intersects(playerBox(run), obstacleBox(gull, 0)), false);
  assert.equal(
    intersects(
      playerBox(run),
      obstacleBox({ type: "suitcase", x: T.runnerX }, 0),
    ),
    true,
  );
});
test("one collision ends arcade; practice loses exactly one life with recovery immunity", () => {
  for (const mode of ["arcade", "practice"]) {
    const run = createRun({ mode });
    run.obstacles = [{ x: T.runnerX, type: "suitcase" }];
    stepRun(run);
    assert.equal(run.lives, mode === "arcade" ? 0 : 2);
    assert.equal(run.status, mode === "arcade" ? "over" : "running");
    stepRun(run);
    assert.equal(run.lives, mode === "arcade" ? 0 : 2);
  }
});
test("donuts reward streaks without changing speed; missed donuts break streaks", () => {
  const run = createRun();
  for (let i = 0; i < 10; i++) {
    run.pickups = [{ x: run.scroll + T.runnerX + 20, y: 30 }];
    stepRun(run);
  }
  assert.equal(run.snacks, 10);
  assert.equal(run.multiplier, 3);
  assert.equal(run.bestStreak, 10);
  assert.ok(run.speed < 231);
  run.pickups = [{ x: run.scroll + T.runnerX - 40, y: 160 }];
  stepRun(run);
  assert.equal(run.streak, 0);
  assert.equal(run.multiplier, 1);
});
test("pause is owned by the runtime; finished engines cannot advance", () => {
  const run = createRun();
  run.status = "over";
  stepRun(run, 100);
  inputRun(run, "jump");
  assert.equal(run.time, 0);
  assert.equal(run.y, 0);
});
test("UTC daily route is the same world-wide and changes at UTC midnight", () => {
  assert.equal(
    dailySeed(new Date("2026-09-27T23:30:00Z")),
    dailySeed(new Date("2026-09-28T01:30:00+02:00")),
  );
  assert.notEqual(
    dailySeed(new Date("2026-09-27T23:59:59Z")),
    dailySeed(new Date("2026-09-28T00:00:00Z")),
  );
});
test("challenge links validate input, ruleset, and preserve subpath hosting", () => {
  const run = createRun({ seed: "cruise-friends" });
  run.score = 420;
  const url = challengeUrl("https://example.com/bryan-fun/?secret=no#old", run);
  assert.equal(new URL(url).pathname, "/bryan-fun/");
  assert.equal(new URL(url).searchParams.has("secret"), false);
  assert.deepEqual(readChallenge(new URL(url).search), {
    seed: run.seed,
    target: 420,
  });
  for (const q of [
    `?course=%3Cscript%3E&rules=${RULESET}&target=4`,
    "?course=x&rules=old&target=1",
    `?course=x&rules=${RULESET}&target=-1`,
    `?course=x&rules=${RULESET}&target=NaN`,
  ])
    assert.deepEqual(readChallenge(q), { error: true });
  assert.equal(readChallenge(""), null);
});
test("all characters have identical simulation and competitive scoring", () => {
  const runs = ["bryan", "barbra", "kyle"].map((character) =>
    createRun({ character, seed: "equal" }),
  );
  for (const r of runs) tick(r, 6);
  assert.deepEqual(
    runs.map((r) => r.score),
    [runs[0].score, runs[0].score, runs[0].score],
  );
  assert.deepEqual(playerBox(runs[0]), playerBox(runs[2]));
});
test("espresso martinis boost every character equally and protect against a same-tick collision", () => {
  for (const character of ["bryan", "barbra", "kyle"]) {
    const r = createRun({ character });
    r.pickups = [{ kind: "espresso", x: T.runnerX + 20, y: 40 }];
    r.obstacles = [{ x: T.runnerX, type: "suitcase" }];
    stepRun(r);
    assert.equal(r.boost, T.boostDuration);
    assert.equal(r.boosts, 1);
    assert.equal(r.snacks, 0);
    assert.equal(r.lives, 1);
    assert.ok(drainEvents(r).some((e) => e.type === "boost"));
    stepRun(r);
    assert.ok(r.speed > T.startSpeed + T.boostSpeed);
    r.obstacles = [];
    r.pickups = [];
    r.nextSpawn = 1e9;
    tick(r, T.boostDuration);
    assert.equal(r.boost, 0);
    assert.ok(r.invulnerable > 0);
    assert.ok(r.speed < T.startSpeed + T.boostSpeed);
    r.obstacles = [{ x: r.scroll + T.runnerX, type: "trolley" }];
    stepRun(r);
    assert.equal(
      r.status,
      "running",
      "end-of-rush grace prevents a surprise hit",
    );
    r.obstacles = [];
    tick(r, T.boostRecovery);
    r.obstacles = [{ x: r.scroll + T.runnerX, type: "trolley" }];
    stepRun(r);
    assert.equal(r.status, "over", "normal collision rules return after grace");
  }
});
test("missing espresso does not break a donut streak and picking up more refreshes the rush", () => {
  const r = createRun();
  r.streak = 5;
  r.multiplier = 2;
  r.pickups = [{ kind: "espresso", x: T.runnerX - 60, y: 40 }];
  stepRun(r);
  assert.equal(r.streak, 5);
  r.boost = 0.3;
  r.pickups = [{ kind: "espresso", x: r.scroll + T.runnerX + 20, y: 40 }];
  stepRun(r);
  assert.equal(r.boost, T.boostDuration);
  assert.equal(r.multiplier, 2);
});
test("Morning Beer is Barbra’s optional signature pickup; other runners keep espresso", () => {
  for (const [character, power, expected] of [
    ["barbra", "morning-beer", "morning-beer"],
    ["barbra", "espresso", "espresso"],
    ["bryan", "morning-beer", "espresso"],
    ["kyle", "morning-beer", "espresso"],
  ]) {
    const r = createRun({ character, power, seed: "breakfast" });
    for (let i = 0; i < 7; i++) makePattern(r);
    assert.equal(r.power, expected);
    const drinks = r.pickups.filter((p) => p.kind !== "donut");
    assert.equal(drinks.length, 2);
    assert.ok(drinks.every((p) => p.kind === expected));
  }
});
test("Morning Beer uses the same safe boost as espresso and never changes course fairness", () => {
  const a = createRun({
    character: "barbra",
    power: "morning-beer",
    seed: "breakfast",
  });
  const b = createRun({
    character: "barbra",
    power: "espresso",
    seed: "breakfast",
  });
  for (const r of [a, b]) {
    r.pickups = [{ kind: r.power, x: T.runnerX + 20, y: 40 }];
    r.obstacles = [{ x: T.runnerX, type: "suitcase" }];
    stepRun(r);
    assert.equal(r.boost, T.boostDuration);
    assert.equal(r.lives, 1);
    assert.equal(drainEvents(r).find((e) => e.type === "boost").power, r.power);
    tick(r, 3);
  }
  assert.equal(a.distance, b.distance);
  assert.equal(a.score, b.score);
  assert.deepEqual(a.obstacles, b.obstacles);
  assert.equal(a.invulnerable, b.invulnerable);
});
