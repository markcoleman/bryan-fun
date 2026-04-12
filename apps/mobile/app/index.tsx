import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  createSerializableSyncPayload,
  getProfileSyncWinner,
  mergeProfileProgression
} from "../../src/sync-profile.js";

const initialLocalProfile = {
  progression: {
    maxUnlockedLevel: 2,
    coinBank: 50,
    unlockedCharacters: ["bryan"]
  }
};

const initialRemoteProfile = {
  progression: {
    maxUnlockedLevel: 3,
    coinBank: 25,
    unlockedCharacters: ["bryan", "kyle"]
  }
};

export default function HomeScreen() {
  const [localUpdatedAt, setLocalUpdatedAt] = useState(Date.now() - 1000);
  const [remoteUpdatedAt, setRemoteUpdatedAt] = useState(Date.now());

  const winner = useMemo(
    () =>
      getProfileSyncWinner(
        { updatedAt: localUpdatedAt, deviceId: "ios-device" },
        { updatedAt: remoteUpdatedAt, deviceId: "web-device" }
      ),
    [localUpdatedAt, remoteUpdatedAt]
  );

  const merged = useMemo(
    () => mergeProfileProgression(initialLocalProfile, initialRemoteProfile),
    []
  );

  const payload = useMemo(
    () =>
      createSerializableSyncPayload({
        profile: merged,
        updatedAt: Math.max(localUpdatedAt, remoteUpdatedAt),
        source: winner
      }),
    [localUpdatedAt, remoteUpdatedAt, merged, winner]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Cruise Dash iOS Build Starter</Text>
      <Text style={styles.subtitle}>Shared progression sync with web is active.</Text>
      <View style={styles.card}>
        <Text style={styles.row}>Sync winner: {winner}</Text>
        <Text style={styles.row}>Merged max level: {merged.progression.maxUnlockedLevel}</Text>
        <Text style={styles.row}>Merged coin bank: {merged.progression.coinBank}</Text>
        <Text style={styles.row}>Characters: {merged.progression.unlockedCharacters.join(", ")}</Text>
      </View>
      <Pressable style={styles.button} onPress={() => setLocalUpdatedAt(Date.now())}>
        <Text style={styles.buttonText}>Simulate Local Run</Text>
      </Pressable>
      <Pressable style={styles.buttonSecondary} onPress={() => setRemoteUpdatedAt(Date.now())}>
        <Text style={styles.buttonText}>Simulate Web Run</Text>
      </Pressable>
      <Text style={styles.payloadLabel}>Payload preview:</Text>
      <Text style={styles.payload}>{payload}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#041120",
    padding: 20,
    gap: 14
  },
  title: {
    color: "#d8f2ff",
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: "#9ec2da"
  },
  card: {
    backgroundColor: "#0f2236",
    borderRadius: 12,
    padding: 14,
    gap: 6
  },
  row: {
    color: "#d8f2ff"
  },
  button: {
    backgroundColor: "#1f8cff",
    borderRadius: 10,
    padding: 12
  },
  buttonSecondary: {
    backgroundColor: "#36b76d",
    borderRadius: 10,
    padding: 12
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "700"
  },
  payloadLabel: {
    color: "#9ec2da",
    fontWeight: "700"
  },
  payload: {
    color: "#d8f2ff",
    fontSize: 12
  }
});
