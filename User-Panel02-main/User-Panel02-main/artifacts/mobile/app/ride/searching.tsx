import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCancelRide } from "@workspace/api-client-react";
import { useRide } from "@/contexts/RideContext";
import { useSocket } from "@/contexts/SocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

const NO_DRIVER_TIMEOUT_MS = 5 * 60 * 1000;

export default function SearchingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { currentRideId, clearRide } = useRide();
  const { socket, joinRide } = useSocket();

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const [searchTime, setSearchTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Broadcasting to nearby drivers…");

  const { mutate: cancelRide } = useCancelRide({
    mutation: {
      onSuccess: () => {
        clearRide();
        router.replace("/(passenger)/home");
      },
    },
  });

  useEffect(() => {
    if (currentRideId) joinRide(currentRideId);

    function onRideAccepted() {
      router.replace("/ride/driver-assigned");
    }

    function onDriverRejected(data: { message?: string }) {
      setStatusMessage(data.message ?? "A driver declined. Looking for another…");
    }

    function onNoDrivers(data: { message?: string }) {
      Alert.alert(
        "No Drivers Available",
        data.message ?? "No drivers available near you. Please try again in a few minutes."
      );
      clearRide();
      router.replace("/(passenger)/home");
    }

    function onRideCancelled() {
      Alert.alert("Ride Cancelled", "Your ride request was cancelled.");
      clearRide();
      router.replace("/(passenger)/home");
    }

    if (socket) {
      socket.on("ride:accepted", onRideAccepted);
      socket.on("ride:driver_rejected", onDriverRejected);
      socket.on("ride:no_drivers", onNoDrivers);
      socket.on("ride:cancelled", onRideCancelled);
    }

    const noDriverTimeout = setTimeout(() => {
      if (currentRideId) {
        cancelRide({ id: currentRideId });
      } else {
        clearRide();
        router.replace("/(passenger)/home");
      }
      Alert.alert(
        "Request Timed Out",
        "We couldn't find a driver in 5 minutes. Please try again."
      );
    }, NO_DRIVER_TIMEOUT_MS);

    return () => {
      clearTimeout(noDriverTimeout);
      socket?.off("ride:accepted", onRideAccepted);
      socket?.off("ride:driver_rejected", onDriverRejected);
      socket?.off("ride:no_drivers", onNoDrivers);
      socket?.off("ride:cancelled", onRideCancelled);
    };
  }, [currentRideId, socket]);

  useEffect(() => {
    const timer = setInterval(() => setSearchTime((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    pulse(ring1, 0);
    pulse(ring2, 600);
    pulse(ring3, 1200);
  }, []);

  function handleCancel() {
    Alert.alert("Cancel Ride?", "Do you want to cancel this ride request?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          if (currentRideId) cancelRide({ id: currentRideId });
          else { clearRide(); router.replace("/(passenger)/home"); }
        },
      },
    ]);
  }

  const ringScale = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.8] });
  const ringOpacity = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.7, 0.2, 0] });

  const minutes = Math.floor(searchTime / 60);
  const seconds = searchTime % 60;
  const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background }]}>
      <View style={styles.radarContainer}>
        {[ring1, ring2, ring3].map((ring, i) => (
          <Animated.View
            key={i}
            style={[
              styles.ring,
              { transform: [{ scale: ringScale(ring) }], opacity: ringOpacity(ring) },
            ]}
          />
        ))}
        <View style={styles.centerCircle}>
          <MaterialCommunityIcons name="car-side" size={36} color="#32FF7E" />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{t("searchingDriver")}</Text>
        <View style={[styles.statusPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusDot} />
          <Text style={[styles.statusMessage, { color: colors.mutedForeground }]}>{statusMessage}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Searching for</Text>
          <Text style={styles.timeValue}>{timeLabel}</Text>
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>Auto-cancels after 5 minutes if no driver accepts</Text>
      </View>

      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>{t("cancelRide")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0A0A0A",
    alignItems: "center", justifyContent: "center",
    gap: 40, paddingHorizontal: 24,
  },
  radarContainer: { width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5, borderColor: "#32FF7E",
  },
  centerCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#32FF7E18", borderWidth: 2, borderColor: "#32FF7E",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#32FF7E", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 8,
  },
  textContainer: { alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#141414", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: "#252525",
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#32FF7E" },
  statusMessage: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#CCC", flexShrink: 1 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  timeValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#555", textAlign: "center" },
  cancelBtn: {
    paddingVertical: 14, paddingHorizontal: 36,
    borderRadius: 14, borderWidth: 1.5, borderColor: "#FF4444",
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FF4444" },
});
