import { CHARACTERS, STAMPS, RULESET } from "./content.js";
export const STORAGE_KEY = "bbcd:sketch:v1";
const integer = (n) =>
  Number.isFinite(Number(n))
    ? Math.max(0, Math.min(99999999, Math.floor(Number(n))))
    : 0;
export function defaultProfile() {
  return {
    version: 1,
    ruleset: RULESET,
    character: "bryan",
    barbraPower: "morning-beer",
    sound: true,
    motion: true,
    runs: 0,
    best: 0,
    practiceBest: 0,
    daily: {},
    stamps: [],
    recent: [],
    legacyBest: 0,
  };
}
export function sanitizeProfile(value) {
  const p = defaultProfile();
  if (!value || typeof value !== "object") return p;
  p.character = CHARACTERS.some((c) => c.id === value.character)
    ? value.character
    : "bryan";
  p.barbraPower =
    value.barbraPower === "espresso" ? "espresso" : "morning-beer";
  for (const k of ["runs", "best", "practiceBest", "legacyBest"])
    p[k] = integer(value[k]);
  if (value.ruleset !== RULESET) {
    p.legacyBest = Math.max(p.legacyBest, p.best);
    p.best = 0;
    p.practiceBest = 0;
  }
  p.sound = value.sound !== false;
  p.motion = value.motion !== false;
  p.stamps = STAMPS.filter(
    (s) => Array.isArray(value.stamps) && value.stamps.includes(s.id),
  ).map((s) => s.id);
  if (value.daily && typeof value.daily === "object")
    for (const [k, v] of Object.entries(value.daily).slice(-14))
      if (
        k.startsWith(`${RULESET}-`) &&
        /^\d{4}-\d{2}-\d{2}$/.test(k.slice(RULESET.length + 1))
      )
        p.daily[k] = integer(v);
  p.recent = Array.isArray(value.recent)
    ? value.recent
        .slice(0, 5)
        .filter((r) => r && CHARACTERS.some((c) => c.id === r.character))
        .map((r) => ({
          character: r.character,
          score: integer(r.score),
          distance: integer(r.distance),
        }))
    : [];
  return p;
}
export function loadProfile(storage) {
  try {
    const data = storage.getItem(STORAGE_KEY);
    if (data) return sanitizeProfile(JSON.parse(data));
    const p = defaultProfile(),
      old = JSON.parse(storage.getItem("bbcd:profile:v2") || "null");
    p.legacyBest = integer(old?.personalBests?.overall);
    return p;
  } catch {
    return defaultProfile();
  }
}
export function saveProfile(storage, profile) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
export function recordRun(profile, run) {
  const p = sanitizeProfile(profile),
    practice = run.mode === "practice",
    oldBest = practice ? p.practiceBest : p.best;
  p.runs++;
  if (practice) p.practiceBest = Math.max(p.practiceBest, run.score);
  else p.best = Math.max(p.best, run.score);
  if (run.mode === "daily")
    p.daily[run.seed] = Math.max(p.daily[run.seed] || 0, run.score);
  p.daily = Object.fromEntries(Object.entries(p.daily).slice(-14));
  const unlocked = practice
    ? []
    : STAMPS.filter((s) => !p.stamps.includes(s.id) && run[s.type] >= s.target);
  p.stamps.push(...unlocked.map((s) => s.id));
  if (!practice)
    p.recent = [
      {
        character: run.character,
        score: run.score,
        distance: Math.floor(run.distance),
      },
      ...p.recent,
    ].slice(0, 5);
  return { profile: p, unlocked, newBest: run.score > oldBest };
}
