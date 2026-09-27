// The single balancing/content surface. Keep competitive physics identical for all runners.
export const RULESET = "buffet-2";
export const TUNING = Object.freeze({
  step: 1 / 120,
  worldWidth: 800,
  groundY: 420,
  startSpeed: 230,
  maxSpeed: 370,
  boostSpeed: 80,
  boostDuration: 3,
  boostRecovery: 0.4,
  acceleration: 1.7,
  gravity: 1900,
  jumpVelocity: 650,
  shortHopVelocity: 520,
  jumpBuffer: 0.13,
  duckDuration: 0.72,
  runnerX: 124,
  runnerWidth: 44,
  runnerHeight: 90,
  duckHeight: 64,
  invulnerability: 1.8,
  portDistance: 250,
  distanceScale: 0.06,
});
export const CHARACTERS = [
  {
    id: "bryan",
    name: "Bryan",
    role: "Tiny legs. Big buffet energy.",
    quip: "Unsupervised. Unstoppable. Mostly.",
    color: "#edbd79",
  },
  {
    id: "barbra",
    name: "Barbra",
    role: "Packed snacks. Taking no nonsense.",
    quip: "“I told you we should’ve left earlier.”",
    color: "#d8a5a1",
  },
  {
    id: "kyle",
    name: "Kyle",
    role: "Vacation mode. Questionable choices.",
    quip: "“Relax. I know a shortcut.”",
    color: "#98c5bd",
  },
];
export const POWERUPS = Object.freeze({
  espresso: {
    name: "Espresso martini",
    label: "Espresso Rush",
    frame: 4,
    toast: "Espresso Rush! Faster. Bonk-proof. Briefly.",
  },
  "morning-beer": {
    name: "Morning beer",
    label: "Morning Beer",
    frame: 6,
    toast: "Morning Beer! Barbra has entered vacation mode.",
  },
});
export function characterPower(character, preference = "morning-beer") {
  return character === "barbra" && preference === "morning-beer"
    ? "morning-beer"
    : "espresso";
}
export const PORTS = [
  {
    name: "All aboard",
    place: "The sun deck",
    toast: "The buffet is that way. Probably.",
    color: "#82b5a9",
  },
  {
    name: "Poolside panic",
    place: "The pool club",
    toast: "No running by the pool. Oops.",
    color: "#9cba80",
  },
  {
    name: "Shore thing",
    place: "The Bahamas",
    toast: "A very relaxing emergency.",
    color: "#81b8c5",
  },
  {
    name: "Golden hour",
    place: "The sunset deck",
    toast: "Great sunset. Terrible time to stop.",
    color: "#d49a81",
  },
  {
    name: "Miami, finally",
    place: "The boardwalk",
    toast: "Your group chat will hear about this.",
    color: "#ba9eb7",
  },
];
export const HAZARDS = {
  baggage: {
    width: 90,
    height: 43,
    bottom: 0,
    frame: 0,
    instruction: "HOLD ↑",
    fail: "Overpacked. Underprepared.",
    tip: "Two bags, one jump. Hold a little longer and take off closer to the first bag.",
  },
  suitcase: {
    width: 43,
    height: 47,
    bottom: 0,
    frame: 0,
    instruction: "JUMP",
    fail: "Excess baggage.",
    tip: "Jump a little before the suitcase. Hold for a higher arc.",
  },
  trolley: {
    width: 59,
    height: 66,
    bottom: 0,
    frame: 1,
    instruction: "JUMP",
    fail: "The buffet fought back.",
    tip: "Hold your jump to clear the taller buffet cart.",
  },
  gull: {
    width: 66,
    height: 35,
    bottom: 72,
    frame: 2,
    instruction: "DUCK",
    fail: "Seagull: 1. Dignity: 0.",
    tip: "Tap Duck as the seagull approaches. Jumping feeds its ego.",
  },
};
export const STAMPS = [
  {
    id: "first",
    title: "Sea legs",
    detail: "Travel 100 m in one run",
    type: "distance",
    target: 100,
    icon: "⚓",
  },
  {
    id: "snack",
    title: "Snack captain",
    detail: "Collect 8 donuts in one run",
    type: "snacks",
    target: 8,
    icon: "◎",
  },
  {
    id: "clean",
    title: "Smooth sailing",
    detail: "Clear 12 obstacles in one run",
    type: "cleared",
    target: 12,
    icon: "≋",
  },
  {
    id: "combo",
    title: "On a roll",
    detail: "Build a 10-donut streak",
    type: "bestStreak",
    target: 10,
    icon: "✦",
  },
  {
    id: "voyage",
    title: "Port collector",
    detail: "Reach Miami at 1,000 m",
    type: "distance",
    target: 1000,
    icon: "☀",
  },
  {
    id: "legend",
    title: "Buffet legend",
    detail: "Complete the 1,250 m voyage",
    type: "distance",
    target: 1250,
    icon: "♔",
  },
];
export const QUIPS = [
  "Your towel is still reserving a chair.",
  "This counts as the shore excursion.",
  "The group chat is going to love this.",
  "Zero plans. Excellent cardio.",
  "Someone said “last call for pancakes.”",
];
export const MODES = {
  arcade: {
    label: "Endless dash",
    detail: "One life. Infinite poor decisions.",
  },
  daily: {
    label: "Daily departure",
    detail: "Same route for everyone. Resets at midnight UTC.",
  },
  party: {
    label: "Pass & play",
    detail: "2–6 friends. One phone. Same course.",
  },
  practice: {
    label: "Easy breezy",
    detail: "Three lives, a slower pace. Practice records stay separate.",
  },
};
