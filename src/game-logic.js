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
