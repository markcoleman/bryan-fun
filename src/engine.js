import {
  TUNING as T,
  HAZARDS,
  PORTS,
  RULESET,
  characterPower,
} from "./content.js";

export function hashSeed(text) {
  let n = 2166136261;
  for (const char of String(text))
    n = Math.imul(n ^ char.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function createRng(seed) {
  let n = hashSeed(seed);
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function dailySeed(date = new Date()) {
  return `${RULESET}-${date.toISOString().slice(0, 10)}`;
}
export function intersects(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
export function playerBox(run) {
  const h = run.duck > 0 && run.y === 0 ? T.duckHeight : T.runnerHeight;
  return {
    x: T.runnerX + 9,
    y: T.groundY - run.y - h + 7,
    w: T.runnerWidth - 16,
    h: h - 10,
  };
}
export function obstacleBox(item, scroll) {
  const h = HAZARDS[item.type];
  return {
    x: item.x - scroll + 5,
    y: T.groundY - h.bottom - h.height + 4,
    w: h.width - 10,
    h: h.height - 6,
  };
}
export function createRun({
  seed = "cruise",
  mode = "arcade",
  character = "bryan",
  power = "morning-beer",
} = {}) {
  return {
    seed: String(seed),
    mode,
    character,
    power: characterPower(character, power),
    rng: createRng(seed),
    status: "running",
    time: 0,
    scroll: 0,
    distance: 0,
    speed: T.startSpeed,
    y: 0,
    vy: 0,
    duck: 0,
    buffer: 0,
    held: false,
    lives: mode === "practice" ? 3 : 1,
    invulnerable: 0,
    boost: 0,
    boosts: 0,
    score: 0,
    bonus: 0,
    snacks: 0,
    streak: 0,
    bestStreak: 0,
    multiplier: 1,
    cleared: 0,
    port: 0,
    lap: 0,
    obstacles: [],
    pickups: [],
    nextSpawn: 870,
    pattern: 0,
    lastType: "",
    events: [],
    cause: null,
  };
}
export function inputRun(run, action) {
  if (run.status !== "running") return;
  if (action === "jump") {
    run.buffer = T.jumpBuffer;
    run.held = true;
  }
  if (action === "release") {
    run.held = false;
    if (run.vy > T.shortHopVelocity) run.vy = T.shortHopVelocity;
  }
  if (action === "duck" && run.y === 0) {
    run.duck = T.duckDuration;
    run.buffer = 0;
    run.events.push({ type: "duck" });
  }
}
export function makePattern(run) {
  const n = run.pattern++,
    r = run.rng();
  const type =
    n >= 12 && r > 0.8 && run.mode !== "practice"
      ? "baggage"
      : n < 3
        ? "suitcase"
        : n === 3
          ? "trolley"
          : n === 4
            ? "gull"
            : r < 0.33
              ? "suitcase"
              : r < 0.63
                ? "trolley"
                : "gull";
  // Never repeat a duck twice. Every obstacle has at least 1.4 s of recovery at maximum speed.
  const chosen = type === "gull" && run.lastType === "gull" ? "suitcase" : type;
  const x = run.nextSpawn;
  run.obstacles.push({ x, type: chosen, passed: false, hit: false, id: n });
  const low = chosen === "gull";
  for (let i = 0; i < 3; i++)
    run.pickups.push({
      kind: "donut",
      x: x - 90 + i * 52,
      y: low ? 24 : 85 + Math.sin((i * Math.PI) / 2) * 27,
      taken: false,
      missed: false,
    });
  // A low, clearly separated reward between hazards, available to every character.
  if (n % 5 === 1)
    run.pickups.push({
      kind: run.power,
      x: x - 240,
      y: 40,
      taken: false,
      missed: false,
    });
  run.lastType = chosen;
  run.nextSpawn +=
    T.maxSpeed * 1.4 +
    HAZARDS[chosen].width +
    run.rng() * 145 +
    (n % 6 === 5 ? 170 : 0);
}
export function stepRun(run, dt = T.step) {
  if (run.status !== "running") return run;
  dt = Math.min(Math.max(0, dt), 0.05);
  const factor = run.mode === "practice" ? 0.78 : 1;
  run.time += dt;
  const wasBoosted = run.boost > 0;
  run.boost = Math.max(0, run.boost - dt);
  run.invulnerable = Math.max(0, run.invulnerable - dt);
  if (wasBoosted && run.boost === 0)
    run.invulnerable = Math.max(run.invulnerable, T.boostRecovery);
  run.speed =
    (Math.min(T.maxSpeed, T.startSpeed + run.time * T.acceleration) +
      (run.boost > 0 ? T.boostSpeed : 0)) *
    factor;
  run.duck = Math.max(0, run.duck - dt);
  if (run.buffer > 0 && run.y === 0) {
    run.vy = run.held ? T.jumpVelocity : T.shortHopVelocity;
    run.duck = 0;
    run.buffer = 0;
    run.events.push({ type: "jump" });
  }
  run.buffer = Math.max(0, run.buffer - dt);
  if (run.y > 0 || run.vy > 0) {
    run.vy -= T.gravity * dt;
    run.y += run.vy * dt;
    if (run.y <= 0) {
      run.y = 0;
      run.vy = 0;
      run.events.push({ type: "land" });
    }
  }
  run.scroll += run.speed * dt;
  run.distance = run.scroll * T.distanceScale;
  const port = Math.floor(run.distance / T.portDistance) % PORTS.length;
  if (port !== run.port) {
    run.port = port;
    run.events.push({ type: "port", port });
  }
  const lap = Math.floor(run.distance / (T.portDistance * PORTS.length));
  if (lap > run.lap) {
    run.lap = lap;
    run.events.push({ type: "voyage" });
  }
  while (run.nextSpawn < run.scroll + T.worldWidth + 400) makePattern(run);
  const box = playerBox(run);
  collectPickups(run, box);
  for (const ob of run.obstacles) {
    const h = HAZARDS[ob.type];
    if (
      !ob.hit &&
      run.invulnerable === 0 &&
      run.boost === 0 &&
      intersects(box, obstacleBox(ob, run.scroll))
    ) {
      ob.hit = true;
      run.lives--;
      run.streak = 0;
      run.multiplier = 1;
      run.cause = ob.type;
      run.events.push({ type: "hit", x: box.x, y: box.y });
      if (run.lives === 0) {
        run.status = "over";
        break;
      }
      run.invulnerable = T.invulnerability;
    }
    if (!ob.passed && ob.x + h.width < run.scroll + T.runnerX) {
      ob.passed = true;
      if (!ob.hit) {
        run.cleared++;
        run.bonus += 5;
        run.events.push({ type: "clear" });
      }
    }
  }
  run.score = Math.floor(run.distance) + run.bonus;
  run.obstacles = run.obstacles.filter((o) => o.x > run.scroll - 130);
  run.pickups = run.pickups.filter((p) => p.x > run.scroll - 100);
  return run;
}
function collectPickups(run, box) {
  for (const p of run.pickups) {
    if (p.taken || p.missed) continue;
    const rect = {
      x: p.x - run.scroll - 14,
      y: T.groundY - p.y - 14,
      w: 28,
      h: 28,
    };
    if (
      intersects(
        { x: box.x - 8, y: box.y - 8, w: box.w + 16, h: box.h + 16 },
        rect,
      )
    ) {
      p.taken = true;
      if (p.kind === "espresso" || p.kind === "morning-beer") {
        run.boost = T.boostDuration;
        run.boosts++;
        run.events.push({
          type: "boost",
          power: p.kind,
          x: rect.x + 14,
          y: rect.y + 14,
        });
        continue;
      }
      run.snacks++;
      run.streak++;
      run.bestStreak = Math.max(run.bestStreak, run.streak);
      run.multiplier = Math.min(3, 1 + Math.floor(run.streak / 5));
      run.bonus += 10 * run.multiplier;
      run.events.push({
        type: "snack",
        x: rect.x + 14,
        y: rect.y + 14,
        value: 10 * run.multiplier,
      });
    } else if (p.x < run.scroll + T.runnerX - 35) {
      p.missed = true;
      if (p.kind !== "espresso" && p.kind !== "morning-beer") {
        run.streak = 0;
        run.multiplier = 1;
      }
    }
  }
}
export function drainEvents(run) {
  return run.events.splice(0);
}
export function getMedal(score) {
  return score >= 1500
    ? "Buffet royalty"
    : score >= 750
      ? "Cruise menace"
      : score >= 300
        ? "Deck legend"
        : score >= 100
          ? "Snack enthusiast"
          : "Promising disaster";
}
export function challengeUrl(base, run) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("course", run.seed);
  url.searchParams.set("rules", RULESET);
  url.searchParams.set("target", String(run.score));
  return url.toString();
}
export function readChallenge(search) {
  const p = new URLSearchParams(search),
    seed = p.get("course"),
    target = p.get("target");
  if (!seed) return null;
  if (
    p.get("rules") !== RULESET ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(seed) ||
    !/^\d{1,7}$/.test(target ?? "")
  )
    return { error: true };
  return { seed, target: Number(target) };
}
