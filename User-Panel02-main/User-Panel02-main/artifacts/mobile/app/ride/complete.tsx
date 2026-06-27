import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGetCurrentRide, useRateRide } from "@workspace/api-client-react";
import { useRide } from "@/contexts/RideContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  wallet: "Wallet",
  online: "Online (Razorpay)",
};

export default function RideCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { currentRideId, selectedVehicle, paymentMethod, clearRide } = useRide();
  const params = useLocalSearchParams<{ fare?: string; vehicleType?: string; rideId?: string }>();
  const [rating, setRating] = useState(0);
  const [rated, setRated] = useState(false);

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const { data: rideData } = useGetCurrentRide();
  const displayFare = rideData?.ride?.fare ?? selectedVehicle?.fare ?? Number(params.fare) ?? 0;
  const displayVehicle = rideData?.ride?.vehicleType ?? selectedVehicle?.type ?? params.vehicleType ?? "Auto";
  const displayPayment = PAYMENT_LABELS[rideData?.ride?.paymentMethod ?? paymentMethod ?? "cash"] ?? "Cash";
  const rideId = rideData?.ride?.id ?? currentRideId ?? params.rideId ?? null;

  const { mutate: rateRide } = useRateRide();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleRate(s: number) {
    if (rated) return;
    setRating(s);
    Haptics.selectionAsync();
    if (rideId) {
      rateRide({ id: rideId, data: { rating: s } });
      setRated(true);
    }
  }

  function handleDone() {
    clearRide();
    router.replace("/(passenger)/home");
  }

  const ratingLabel =
    rating === 5 ? "Excellent! 🌟"
    : rating >= 4 ? "Great ride!"
    : rating >= 3 ? "Good ride"
    : rating >= 2 ? "Could be better"
    : rating === 1 ? "Poor experience"
    : null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 30, backgroundColor: colors.background },
      ]}
    >
      {/* Success animation */}
      <Animated.View
        style={[styles.successCircle, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}
      >
        <View style={styles.checkInner}>
          <Feather name="check" size={50} color="#000" />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t("rideComplete")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Thank you for riding with Jajpur Jatri!</Text>

        {/* Fare card */}
        <View style={[styles.fareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fareLabel, { color: colors.mutedForeground }]}>You paid</Text>
          <Text style={styles.fareAmount}>₹{displayFare}</Text>
          <View style={styles.fareRow}>
            <View style={[styles.farePill, { backgroundColor: colors.border }]}>
              <Feather name="navigation" size={12} color={colors.mutedForeground} />
              <Text style={[styles.farePillText, { color: colors.mutedForeground }]}>{displayVehicle.toUpperCase()}</Text>
            </View>
            <View style={[styles.farePill, { backgroundColor: colors.border }]}>
              <Feather name={paymentMethod === "online" ? "smartphone" : paymentMethod === "wallet" ? "credit-card" : "dollar-sign"} size={12} color={colors.mutedForeground} />
              <Text style={[styles.farePillText, { color: colors.mutedForeground }]}>{displayPayment}</Text>
            </View>
          </View>
        </View>

        {/* Rating */}
        <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ratingTitle, { color: colors.text }]}>{t("rateRide")}</Text>
          <Text style={[styles.ratingSub, { color: colors.mutedForeground }]}>How was your experience?</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => handleRate(s)}
                disabled={rated}
              >
                <Feather
                  name="star"
                  size={38}
                  color={s <= rating ? "#FFB300" : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {ratingLabel && (
            <Text style={styles.ratingFeedback}>{ratingLabel}</Text>
          )}
          {rated && <Text style={styles.ratedNote}>Rating submitted — thank you!</Text>}
        </View>

        <NeonButton title={t("done")} onPress={handleDone} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 24,
    alignItems: "center", gap: 28,
  },
  successCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "#32FF7E22", borderWidth: 3, borderColor: "#32FF7E",
    alignItems: "center", justifyContent: "center", marginTop: 20,
    shadowColor: "#32FF7E", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  checkInner: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#32FF7E", alignItems: "center", justifyContent: "center",
  },
  content: { width: "100%", alignItems: "center", gap: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFF" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  fareCard: {
    width: "100%", backgroundColor: "#141414", borderRadius: 20,
    padding: 24, alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#252525",
  },
  fareLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  fareAmount: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#32FF7E", letterSpacing: -1 },
  fareRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  farePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#252525", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  farePillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  ratingCard: {
    width: "100%", backgroundColor: "#141414", borderRadius: 20,
    padding: 20, alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: "#252525",
  },
  ratingTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF" },
  ratingSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  stars: { flexDirection: "row", gap: 8, marginVertical: 4 },
  ratingFeedback: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFB300" },
  ratedNote: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#32FF7E" },
});
