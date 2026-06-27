import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useBookRide } from "@workspace/api-client-react";
import { useRide } from "@/contexts/RideContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

const PAYMENT_OPTIONS = [
  { id: "cash" as const, label: "Cash", icon: "cash" },
  { id: "wallet" as const, label: "Wallet", icon: "wallet" },
  { id: "online" as const, label: "Online", icon: "card" },
];

export default function ConfirmRideScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { pickup, drop, selectedVehicle, paymentMethod, setPaymentMethod, setCurrentRideId } = useRide();

  const { mutate: bookRide, isPending } = useBookRide({
    mutation: {
      onSuccess: (data) => {
        setCurrentRideId(data.id);
        router.replace("/ride/searching");
      },
      onError: (err: { message?: string }) => {
        Alert.alert("Booking Failed", err?.message || "Unable to book ride. Try again.");
      },
    },
  });

  function handleBook() {
    if (!pickup || !drop || !selectedVehicle) return;

    const distance = Math.sqrt(
      Math.pow((drop.lat - pickup.lat) * 111, 2) +
      Math.pow((drop.lng - pickup.lng) * 111, 2)
    );

    bookRide({
      data: {
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupAddress: pickup.address,
        dropLat: drop.lat,
        dropLng: drop.lng,
        dropAddress: drop.address,
        vehicleType: selectedVehicle.type,
        paymentMethod,
        fare: selectedVehicle.fare,
        distance: parseFloat(distance.toFixed(1)),
      },
    });
  }

  const VEHICLE_ICONS: Record<string, string> = {
    bike: "motorbike",
    auto: "rickshaw",
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), backgroundColor: colors.background },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>{t("confirmRide")}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Route card */}
        <View style={[styles.routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.routeRow}>
            <View style={styles.dotGreen} />
            <View style={styles.routeTextBox}>
              <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={2}>
                {pickup?.address || "Current Location"}
              </Text>
            </View>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={styles.dotRed} />
            <View style={styles.routeTextBox}>
              <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>Drop</Text>
              <Text style={[styles.routeAddress, { color: colors.text }]} numberOfLines={2}>
                {drop?.address || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle summary */}
        {selectedVehicle && (
          <View style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons
              name={(VEHICLE_ICONS[selectedVehicle.type] || "car-side") as never}
              size={40}
              color="#32FF7E"
            />
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleType, { color: colors.text }]}>
                {selectedVehicle.type.charAt(0).toUpperCase() + selectedVehicle.type.slice(1)}
              </Text>
              <Text style={[styles.vehicleMeta, { color: colors.mutedForeground }]}>
                {selectedVehicle.eta} min • Standard
              </Text>
            </View>
            <Text style={styles.vehicleFare}>₹{selectedVehicle.fare}</Text>
          </View>
        )}

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setPaymentMethod(opt.id)}
                style={[
                  styles.paymentBtn,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  paymentMethod === opt.id && styles.paymentBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Feather
                  name={opt.icon as never}
                  size={18}
                  color={paymentMethod === opt.id ? "#000" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    { color: colors.mutedForeground },
                    paymentMethod === opt.id && styles.paymentLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fare breakdown */}
        <View style={[styles.fareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fare Details</Text>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.mutedForeground }]}>Base Fare</Text>
            <Text style={[styles.fareValue, { color: colors.text }]}>₹{Math.round((selectedVehicle?.fare || 0) * 0.4)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.mutedForeground }]}>Distance Charge</Text>
            <Text style={[styles.fareValue, { color: colors.text }]}>₹{Math.round((selectedVehicle?.fare || 0) * 0.5)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareLabel, { color: colors.mutedForeground }]}>Platform Fee</Text>
            <Text style={[styles.fareValue, { color: colors.text }]}>₹{Math.round((selectedVehicle?.fare || 0) * 0.1)}</Text>
          </View>
          <View style={[styles.fareDivider, { backgroundColor: colors.border }]} />
          <View style={styles.fareRow}>
            <Text style={[styles.fareTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={styles.fareTotalValue}>₹{selectedVehicle?.fare || 0}</Text>
          </View>
        </View>

        <NeonButton
          title={`Book ${selectedVehicle?.type.toUpperCase() || "Ride"} · ₹${selectedVehicle?.fare || 0}`}
          onPress={handleBook}
          loading={isPending}
          style={styles.bookBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 20 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#141414", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#252525", marginBottom: 16,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#FFF", marginBottom: 20 },
  scrollContent: { gap: 16, paddingBottom: 40 },
  routeCard: {
    backgroundColor: "#141414", borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: "#252525", gap: 0,
  },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#32FF7E", marginTop: 4 },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#FF4444", marginTop: 4 },
  routeLine: { width: 1.5, height: 24, backgroundColor: "#333", marginLeft: 5, marginVertical: 4 },
  routeTextBox: { flex: 1, gap: 2 },
  routeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#666" },
  routeAddress: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  vehicleCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#141414", borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: "#32FF7E44",
  },
  vehicleInfo: { flex: 1, gap: 3 },
  vehicleType: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  vehicleMeta: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  vehicleFare: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  paymentOptions: { flexDirection: "row", gap: 10 },
  paymentBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#1E1E1E", borderWidth: 1.5, borderColor: "#252525",
  },
  paymentBtnActive: { backgroundColor: "#32FF7E", borderColor: "#32FF7E" },
  paymentLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#888" },
  paymentLabelActive: { color: "#000" },
  fareCard: { backgroundColor: "#141414", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#252525", gap: 10 },
  fareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fareLabel: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  fareValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFF" },
  fareDivider: { height: 1, backgroundColor: "#252525" },
  fareTotalLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  fareTotalValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  bookBtn: { marginTop: 4 },
});
