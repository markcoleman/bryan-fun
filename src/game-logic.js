export function normalizeLevelId(value, maxLevel, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(maxLevel, Math.max(1, parsed));
}

export function parseVersion(version) {
  return version
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isFinite(segment) ? segment : 0));
}

export function compareVersions(a, b) {
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;

    if (aValue > bValue) {
      return 1;
    }

    if (aValue < bValue) {
      return -1;
    }
  }

  return 0;
}

export function getNotesSince(version, notes) {
  return notes
    .filter((note) => compareVersions(note.version, version) > 0)
    .sort((a, b) => compareVersions(b.version, a.version));
}

export function getProgressiveSpeedGain({
  score,
  speedGainPerCollectibleBase,
  speedGainPerCollectibleScale,
  speedGainMultiplier,
  maxSpeed,
  currentSpeed
}) {
  const scoreScale = 1 + score / speedGainPerCollectibleScale;
  const gain = speedGainPerCollectibleBase * scoreScale * speedGainMultiplier;
  return Math.min(maxSpeed, currentSpeed + gain);
}

export const CHALLENGE_CURRENT_VERSION = "1";
export const PROFILE_STORAGE_KEY_V2 = "bbcd:profile:v2";

const OLD_STORAGE_KEYS = {
  maxUnlockedLevel: "bbcd:maxUnlockedLevel",
  coinBank: "bbcd:coinBank",
  unlockedCharacters: "bbcd:unlockedCharacters"
};

const DAY_MS = 24 * 60 * 60 * 1000;

const PATTERN_LIBRARY_BY_ACT = {
  1: [
    {
      id: "warmup-gap",
      difficulty: "easy",
      gapScale: 1.18,
      wallHeightScale: 0.94,
      extraObstacle: "none",
      riskGateBias: 0.45
    },
    {
      id: "single-ball",
      difficulty: "easy",
      gapScale: 1.12,
      wallHeightScale: 0.98,
      extraObstacle: "beachBall",
      riskGateBias: 0.4
    },
    {
      id: "early-board",
      difficulty: "medium",
      gapScale: 1.04,
      wallHeightScale: 1,
      extraObstacle: "surfboard",
      riskGateBias: 0.55
    },
    {
      id: "intro-low-bar",
      difficulty: "medium",
      gapScale: 1.07,
      wallHeightScale: 1,
      extraObstacle: "lowBar",
      riskGateBias: 0.58
    }
  ],
  2: [
    {
      id: "mixed-board",
      difficulty: "medium",
      gapScale: 1,
      wallHeightScale: 1.05,
      extraObstacle: "surfboard",
      riskGateBias: 0.65
    },
    {
      id: "mixed-low-bar",
      difficulty: "hard",
      gapScale: 0.93,
      wallHeightScale: 1.08,
      extraObstacle: "lowBar",
      riskGateBias: 0.7
    },
    {
      id: "double-ball",
      difficulty: "medium",
      gapScale: 0.96,
      wallHeightScale: 1.03,
      extraObstacle: "beachBall",
      riskGateBias: 0.67
    },
    {
      id: "tight-none",
      difficulty: "hard",
      gapScale: 0.9,
      wallHeightScale: 1.12,
      extraObstacle: "none",
      riskGateBias: 0.72
    }
  ],
  3: [
    {
      id: "sprint-low-bar",
      difficulty: "hard",
      gapScale: 0.86,
      wallHeightScale: 1.15,
      extraObstacle: "lowBar",
      riskGateBias: 0.78
    },
    {
      id: "sprint-board",
      difficulty: "hard",
      gapScale: 0.88,
      wallHeightScale: 1.12,
      extraObstacle: "surfboard",
      riskGateBias: 0.76
    },
    {
      id: "sprint-ball",
      difficulty: "medium",
      gapScale: 0.92,
      wallHeightScale: 1.08,
      extraObstacle: "beachBall",
      riskGateBias: 0.73
    },
    {
      id: "sprint-breath",
      difficulty: "medium",
      gapScale: 1.02,
      wallHeightScale: 1.04,
      extraObstacle: "none",
      riskGateBias: 0.7
    }
  ]
};

function hashToUint32(value) {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let state = hashToUint32(seed) || 1;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return ((state >>> 0) & 0xffffffff) / 0x100000000;
  };
}

function pickFrom(pool, rng) {
  if (!pool.length) {
    return null;
  }
  return pool[Math.floor(rng() * pool.length)];
}

function textToBytes(text) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(text);
  }
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(text, "utf8"));
  }
  throw new Error("No text encoder available.");
}

function bytesToText(bytes) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("utf8");
  }
  throw new Error("No text decoder available.");
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    out[index] = binary.charCodeAt(index);
  }
  return out;
}

function toBase64Url(text) {
  return text.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(text) {
  const normalized = String(text || "").replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4 || 4)) % 4;
  return normalized + "=".repeat(padLength);
}

function normalizeChallengeRunner(value) {
  return String(value || "bryan")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24) || "bryan";
}

function toFiniteInt(value, fallback, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function normalizeChallengePayload(rawPayload = {}, now = Date.now()) {
  const createdAt = toFiniteInt(rawPayload.createdAt, now, 0);
  const expiresAt = toFiniteInt(
    rawPayload.expiresAt,
    createdAt + DAY_MS,
    createdAt + 1,
    createdAt + DAY_MS * 30
  );
  const chainDepth = toFiniteInt(rawPayload.chainDepth, 0, 0, 999);
  const payload = {
    version: String(rawPayload.version || CHALLENGE_CURRENT_VERSION),
    seed: toFiniteInt(rawPayload.seed, hashToUint32(`${createdAt}`), 0, 0x7fffffff),
    targetScore: toFiniteInt(rawPayload.targetScore, 0, 0, 999999),
    runner: normalizeChallengeRunner(rawPayload.runner),
    level: toFiniteInt(rawPayload.level, 1, 1, 99),
    createdAt,
    expiresAt
  };
  if (chainDepth > 0) {
    payload.chainDepth = chainDepth;
  }
  return payload;
}

export function encodeChallengePayload(payload) {
  const normalized = normalizeChallengePayload(payload);
  const encodedJson = bytesToBase64(textToBytes(JSON.stringify(normalized)));
  return toBase64Url(encodedJson);
}

export function decodeChallengePayload(encodedPayload, options = {}) {
  if (!encodedPayload || typeof encodedPayload !== "string") {
    return { ok: false, error: "missing" };
  }
  try {
    const bytes = base64ToBytes(fromBase64Url(encodedPayload));
    const rawObject = JSON.parse(bytesToText(bytes));
    if (!rawObject || typeof rawObject !== "object") {
      return { ok: false, error: "invalid_json" };
    }
    const now = Number.isFinite(options.now) ? options.now : Date.now();
    const payload = normalizeChallengePayload(rawObject, now);
    const supportedVersions =
      Array.isArray(options.supportedVersions) && options.supportedVersions.length
        ? options.supportedVersions.map(String)
        : [CHALLENGE_CURRENT_VERSION];
    if (!supportedVersions.includes(payload.version)) {
      return { ok: false, error: "unsupported_version", payload };
    }
    if (payload.expiresAt <= now) {
      return { ok: false, error: "expired", payload };
    }
    return { ok: true, payload };
  } catch (_) {
    return { ok: false, error: "invalid_encoding" };
  }
}

function normalizeDateInput(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyQuestSeed(dateInput = new Date(), userSeed = "") {
  const date = normalizeDateInput(dateInput);
  return hashToUint32(`${formatDateKey(date)}|${String(userSeed || "")}`) % 2147483647;
}

function canUsePatternAfterState(pattern, state) {
  if (!pattern || typeof pattern !== "object") {
    return false;
  }
  const nextHardStreak = pattern.difficulty === "hard" ? state.hardStreak + 1 : 0;
  const nextLowBarStreak = pattern.extraObstacle === "lowBar" ? state.lowBarStreak + 1 : 0;
  if (nextHardStreak > 2) {
    return false;
  }
  if (nextLowBarStreak > 2) {
    return false;
  }
  return true;
}

function applyPatternState(pattern, state) {
  if (!pattern || typeof pattern !== "object") {
    return state;
  }
  return {
    hardStreak: pattern.difficulty === "hard" ? state.hardStreak + 1 : 0,
    lowBarStreak: pattern.extraObstacle === "lowBar" ? state.lowBarStreak + 1 : 0
  };
}

function normalizeAct(act) {
  const parsed = Number.parseInt(act, 10);
  if (parsed <= 1) {
    return 1;
  }
  if (parsed >= 3) {
    return 3;
  }
  return 2;
}

export function buildPatternDeck(seed, act, options = {}) {
  const normalizedAct = normalizeAct(act);
  const sourcePatternsRaw = PATTERN_LIBRARY_BY_ACT[normalizedAct] || PATTERN_LIBRARY_BY_ACT[1];
  const sourcePatterns = Array.isArray(sourcePatternsRaw)
    ? sourcePatternsRaw.filter((pattern) => pattern && typeof pattern === "object")
    : [];
  const fallbackPattern = {
    id: "fallback-safe",
    difficulty: "medium",
    gapScale: 1,
    wallHeightScale: 1,
    extraObstacle: "none",
    riskGateBias: 0.6
  };
  const deckLength = Math.max(4, Math.min(32, toFiniteInt(options.deckLength, 12, 4, 32)));
  const rng = makeRng(`${seed}:${normalizedAct}`);

  if (!sourcePatterns.length) {
    return Array.from({ length: deckLength }, (_, index) => ({
      ...fallbackPattern,
      slot: index,
      act: normalizedAct
    }));
  }

  const deck = [];
  let state = { hardStreak: 0, lowBarStreak: 0 };
  for (let index = 0; index < deckLength; index += 1) {
    const candidates = [...sourcePatterns];
    const picked = [];
    while (candidates.length) {
      const next = pickFrom(candidates, rng);
      const nextIndex = candidates.indexOf(next);
      if (nextIndex >= 0) {
        candidates.splice(nextIndex, 1);
      }
      picked.push(next);
    }

    let selected = picked.find((pattern) => canUsePatternAfterState(pattern, state));
    if (!selected) {
      selected =
        sourcePatterns.find((pattern) => pattern.difficulty !== "hard") ||
        sourcePatterns[0] ||
        fallbackPattern;
    }
    state = applyPatternState(selected, state);
    deck.push({
      ...selected,
      slot: index,
      act: normalizedAct
    });
  }
  return deck;
}

function safeParseJson(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

export function createDefaultProfileV2() {
  return {
    version: 2,
    pass: {
      xp: 0,
      level: 1,
      unlockedPerkSlots: 1
    },
    perks: {
      selected: "safe_landing",
      unlocked: ["safe_landing", "combo_shield", "lucky_pull"]
    },
    personalBests: {
      overall: 0,
      byRunner: {}
    },
    progression: {
      maxUnlockedLevel: 1,
      coinBank: 0,
      unlockedCharacters: ["bryan"],
      clearedDestinations: []
    }
  };
}

function sanitizeUnlockedCharacters(value) {
  if (!Array.isArray(value)) {
    return ["bryan"];
  }
  const unique = new Set(
    value
      .map((entry) => String(entry || "").toLowerCase())
      .filter(Boolean)
  );
  unique.add("bryan");
  return [...unique];
}

function sanitizeUnlockedPerks(value) {
  const defaults = ["safe_landing", "combo_shield", "lucky_pull"];
  if (!Array.isArray(value)) {
    return defaults;
  }
  const allowed = new Set(defaults);
  const unique = new Set(
    value
      .map((entry) => String(entry || "").toLowerCase())
      .filter((entry) => allowed.has(entry))
  );
  if (!unique.size) {
    return defaults;
  }
  return [...unique];
}

function sanitizeProfile(profile) {
  const defaults = createDefaultProfileV2();
  const input = profile && typeof profile === "object" ? profile : {};

  const passXp = toFiniteInt(input.pass?.xp, defaults.pass.xp, 0, 99999999);
  const sanitized = {
    version: 2,
    pass: {
      xp: passXp,
      level: Math.max(1, Math.floor(passXp / 180) + 1),
      unlockedPerkSlots: toFiniteInt(input.pass?.unlockedPerkSlots, defaults.pass.unlockedPerkSlots, 1, 3)
    },
    perks: {
      selected: String(input.perks?.selected || defaults.perks.selected),
      unlocked: sanitizeUnlockedPerks(input.perks?.unlocked || defaults.perks.unlocked)
    },
    personalBests: {
      overall: toFiniteInt(input.personalBests?.overall, defaults.personalBests.overall, 0, 999999),
      byRunner: input.personalBests?.byRunner && typeof input.personalBests.byRunner === "object"
        ? { ...input.personalBests.byRunner }
        : {}
    },
    progression: {
      maxUnlockedLevel: toFiniteInt(input.progression?.maxUnlockedLevel, defaults.progression.maxUnlockedLevel, 1, 99),
      coinBank: toFiniteInt(input.progression?.coinBank, defaults.progression.coinBank, 0, 9999999),
      unlockedCharacters: sanitizeUnlockedCharacters(
        input.progression?.unlockedCharacters || defaults.progression.unlockedCharacters
      ),
      clearedDestinations: Array.isArray(input.progression?.clearedDestinations)
        ? [...new Set(input.progression.clearedDestinations.map((entry) => Number.parseInt(entry, 10)).filter(Number.isFinite))]
        : []
    }
  };
  if (!sanitized.perks.unlocked.includes(sanitized.perks.selected)) {
    sanitized.perks.selected = sanitized.perks.unlocked[0] || defaults.perks.selected;
  }
  return sanitized;
}

export function migrateProfileV2(storageSnapshot = {}) {
  const defaults = createDefaultProfileV2();
  const existingV2Raw = storageSnapshot[PROFILE_STORAGE_KEY_V2];
  const existingV2Parsed = safeParseJson(existingV2Raw, null);
  if (existingV2Parsed && typeof existingV2Parsed === "object") {
    return {
      profile: sanitizeProfile(existingV2Parsed),
      migrated: false
    };
  }

  const maxUnlockedLevel = normalizeLevelId(
    storageSnapshot[OLD_STORAGE_KEYS.maxUnlockedLevel],
    99,
    defaults.progression.maxUnlockedLevel
  );
  const coinBank = toFiniteInt(
    storageSnapshot[OLD_STORAGE_KEYS.coinBank],
    defaults.progression.coinBank,
    0,
    9999999
  );
  const oldUnlocks = safeParseJson(storageSnapshot[OLD_STORAGE_KEYS.unlockedCharacters], []);
  const unlockedCharacters = sanitizeUnlockedCharacters(oldUnlocks);

  const migratedProfile = sanitizeProfile({
    ...defaults,
    progression: {
      ...defaults.progression,
      maxUnlockedLevel,
      coinBank,
      unlockedCharacters
    }
  });

  return {
    profile: migratedProfile,
    migrated: true
  };
}
