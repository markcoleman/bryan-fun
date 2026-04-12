function toFiniteTimestamp(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

export function getProfileSyncWinner(localMeta = {}, remoteMeta = {}) {
  const localUpdatedAt = toFiniteTimestamp(localMeta.updatedAt);
  const remoteUpdatedAt = toFiniteTimestamp(remoteMeta.updatedAt);

  if (localUpdatedAt > remoteUpdatedAt) {
    return "local";
  }

  if (remoteUpdatedAt > localUpdatedAt) {
    return "remote";
  }

  const localDevice = String(localMeta.deviceId ?? "");
  const remoteDevice = String(remoteMeta.deviceId ?? "");
  return localDevice.localeCompare(remoteDevice) >= 0 ? "local" : "remote";
}

export function mergeProfileProgression(localProfile = {}, remoteProfile = {}) {
  const localProgress = localProfile.progression ?? {};
  const remoteProgress = remoteProfile.progression ?? {};

  return {
    ...remoteProfile,
    ...localProfile,
    progression: {
      maxUnlockedLevel: Math.max(
        Number(localProgress.maxUnlockedLevel ?? 1),
        Number(remoteProgress.maxUnlockedLevel ?? 1)
      ),
      coinBank: Math.max(Number(localProgress.coinBank ?? 0), Number(remoteProgress.coinBank ?? 0)),
      unlockedCharacters: uniqueSorted([
        ...(Array.isArray(localProgress.unlockedCharacters) ? localProgress.unlockedCharacters : []),
        ...(Array.isArray(remoteProgress.unlockedCharacters) ? remoteProgress.unlockedCharacters : [])
      ])
    }
  };
}

export function createSerializableSyncPayload({ profile, updatedAt, source }) {
  return JSON.stringify({
    schema: "bbcd.sync.v1",
    source,
    updatedAt: toFiniteTimestamp(updatedAt, Date.now()),
    profile
  });
}
