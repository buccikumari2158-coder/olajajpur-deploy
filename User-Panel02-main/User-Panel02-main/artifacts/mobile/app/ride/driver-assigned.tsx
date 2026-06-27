import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGetCurrentRide, getGetCurrentRideQueryKey } from "@workspace/api-client-react";
import { useRide } from "@/contexts/RideContext";
import { useSocket } from "@/contexts/SocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function DriverAssignedScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { currentRideId } = useRide();
  const { socket, joinRide } = useSocket();

  const { data: rideData } = useGetCurrentRide({
    query: {
      queryKey: getGetCurrentRideQueryKey(),
      refetchInterval: 5000,
    },
  });
  const ride = rideData?.ride;
  const driver = ride?.driver;

  useEffect(() => {
    if (currentRideId) joinRide(currentRideId);

    function onRideStarted() {
      router.replace("/ride/tracking");
    }

    function onRideCancelled() {
      Alert.alert(
        "Ride Cancelled",
        "The driver has cancelled. We'll find you another driver.",
        [{ text: "OK", onPress: () => router.replace("/(passenger)/home") }]
      );
    }

    if (socket) {
      socket.on("ride:started", onRideStarted);
      socket.on("ride:cancelled", onRideCancelled);
    }

    return () => {
      socket?.off("ride:started", onRideStarted);
      socket?.off("ride:cancelled", onRideCancelled);
    };
  }, [currentRideId, socket]);

  const VEHICLE_ICONS: Record<string, string> = {
    bike: "motorbike",
    auto: "rickshaw",
  };

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background }]}
    >
      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{t("driverOnWay")}</Text>
      </View>

      {/* Driver card */}
      <View style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverInitials}>
            {(driver?.name ?? "DK").slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.driverName, { color: colors.text }]}>{driver?.name ?? "Connecting…"}</Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Feather
              key={s}
              name="star"
              size={16}
              color={s <= Math.round(driver?.rating ?? 4.5) ? "#FFB300" : colors.border}
            />
          ))}
          <Text style={styles.ratingText}>{(driver?.rating ?? 4.5).toFixed(1)}</Text>
        </View>

        <View style={styles.vehicleRow}>
          <MaterialCommunityIcons
            name={(VEHICLE_ICONS[driver?.vehicleType ?? ride?.vehicleType ?? "auto"] ?? "car-side") as never}
            size={24}
            color="#32FF7E"
          />
          <Text style={[styles.vehicleText, { color: colors.text }]}>
            {(driver?.vehicleType ?? ride?.vehicleType ?? "Auto").toUpperCase()} •{" "}
            <Text style={styles.plateText}>{driver?.vehicleNumber ?? "—"}</Text>
          </Text>
        </View>

        <View style={styles.etaBox}>
          <Feather name="clock" size={16} color="#32FF7E" />
          <Text style={styles.etaText}>{driver?.eta ?? "—"} min away</Text>
        </View>

        <View style={[styles.otpBox, { backgroundColor: colors.muted, borderColor: "#32FF7E44" }]}>
          <Text style={[styles.otpLabel, { color: colors.mutedForeground }]}>{t("otp")}</Text>
          <Text style={styles.otpValue}>{ride?.otp ?? "——"}</Text>
          <Text style={[styles.otpHint, { color: colors.mutedForeground }]}>{t("otpShare")}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: "#32FF7E44" }]}
          onPress={() => {
            const phone = driver?.phone;
            if (phone) {
              Linking.openURL(`tel:${phone}`);
            } else {
              Alert.alert("Unavailable", "Driver phone number is not available yet.");
            }
          }}
        >
          <Feather name="phone" size={20} color="#32FF7E" />
          <Text style={styles.actionText}>{t("callDriver")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: "#FF444444" }]}
          onPress={() =>
            Alert.alert("SOS Emergency", "Call emergency services?", [
              { text: "Cancel", style: "cancel" },
              { text: "Call 112", onPress: () => Linking.openURL("tel:112") },
            ])
          }
        >
          <Feather name="alert-triangle" size={20} color="#FF4444" />
          <Text style={[styles.actionText, { color: "#FF4444" }]}>{t("sos")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 24, paddingBottom: 30, gap: 20 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center",
    backgroundColor: "#141414", paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 30, borderWidth: 1, borderColor: "#252525",
    alignSelf: "center", marginTop: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#32FF7E" },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  driverCard: {
    flex: 1, backgroundColor: "#141414", borderRadius: 24, padding: 24,
    alignItems: "center", gap: 12, borderWidth: 1, borderColor: "#252525",
  },
  driverAvatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#32FF7E",
    alignItems: "center", justifyContent: "center",
  },
  driverInitials: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#000" },
  driverName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FFF" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFB300", marginLeft: 4 },
  vehicleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  vehicleText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFF" },
  plateText: { color: "#32FF7E" },
  etaBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#32FF7E18", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
  },
  etaText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  otpBox: {
    alignItems: "center", gap: 4, marginTop: 8,
    backgroundColor: "#1E1E1E", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#32FF7E44", width: "100%",
  },
  otpLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#888" },
  otpValue: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#32FF7E", letterSpacing: 8 },
  otpHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666", textAlign: "center" },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 14,
    backgroundColor: "#141414", borderRadius: 14, borderWidth: 1.5, borderColor: "#32FF7E44",
  },
  actionText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
});
