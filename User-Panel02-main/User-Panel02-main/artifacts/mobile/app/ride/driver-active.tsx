import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useGetRide,
  getGetRideQueryKey,
  useStartRide,
  useCompleteRide,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

const JAJPUR = { latitude: 20.8522, longitude: 86.0 };

type TripStep = "navigate_pickup" | "arrived" | "otp_verify" | "in_progress" | "completing";

export default function DriverActiveRideScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = useColors();
  const { socket, arrivedPickup, emitLocation } = useSocket();
  const params = useLocalSearchParams<{ rideId: string }>();
  const rideId = params.rideId ?? "";

  const [step, setStep] = useState<TripStep>("navigate_pickup");
  const [otp, setOtp] = useState("");
  const [driverLoc, setDriverLoc] = useState(JAJPUR);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<MapView>(null);

  const { data: rideData, refetch } = useGetRide(rideId, {
    query: {
      queryKey: getGetRideQueryKey(rideId),
      enabled: !!rideId,
      refetchInterval: 8000,
    },
  });
  const ride = rideData;

  const { mutate: startRide, isPending: startingRide } = useStartRide({
    mutation: {
      onSuccess: () => {
        setStep("in_progress");
        refetch();
      },
      onError: (err: { message?: string }) => {
        Alert.alert("Invalid OTP", err?.message ?? "Wrong OTP. Ask the passenger again.");
      },
    },
  });

  const { mutate: completeRide, isPending: completingRide } = useCompleteRide({
    mutation: {
      onSuccess: () => {
        if (locationInterval.current) clearInterval(locationInterval.current);
        Alert.alert(
          "Trip Complete! 🎉",
          `Earnings: ₹${ride?.fare ?? 0}`,
          [{ text: "OK", onPress: () => router.replace("/(driver)/dashboard") }]
        );
      },
      onError: () => Alert.alert("Error", "Failed to complete trip. Try again."),
    },
  });

  useEffect(() => {
    if (!user) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted || cancelled) {
        Alert.alert(
          "Location required",
          "Please allow location access so the passenger can see your live position."
        );
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setDriverLoc({ latitude, longitude });
          emitLocation(latitude, longitude);
        }
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [user]);

  useEffect(() => {
    function onRideCancelled() {
      if (locationInterval.current) clearInterval(locationInterval.current);
      Alert.alert(
        "Ride Cancelled",
        "The passenger cancelled the ride.",
        [{ text: "OK", onPress: () => router.replace("/(driver)/dashboard") }]
      );
    }
    socket?.on("ride:cancelled", onRideCancelled);
    return () => { socket?.off("ride:cancelled", onRideCancelled); };
  }, [socket]);

  function handleArrived() {
    arrivedPickup(rideId);
    setStep("otp_verify");
  }

  function handleStartRide() {
    if (otp.length !== 4) {
      Alert.alert("Enter OTP", "Please enter the 4-digit OTP from the passenger.");
      return;
    }
    startRide({ id: rideId, data: { otp } });
  }

  function handleCompleteRide() {
    Alert.alert("Complete Trip?", "Mark this trip as completed?", [
      { text: "No", style: "cancel" },
      { text: "Yes, Complete", onPress: () => completeRide({ id: rideId }) },
    ]);
  }

  const pickup = ride?.pickupLat && ride?.pickupLng
    ? { latitude: ride.pickupLat, longitude: ride.pickupLng }
    : JAJPUR;
  const drop = ride?.dropLat && ride?.dropLng
    ? { latitude: ride.dropLat, longitude: ride.dropLng }
    : { latitude: JAJPUR.latitude + 0.03, longitude: JAJPUR.longitude + 0.03 };

  const destination = step === "in_progress" || step === "completing" ? drop : pickup;

  function renderStepCard() {
    if (step === "navigate_pickup" || step === "arrived") {
      return (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconBg, { backgroundColor: "#32FF7E22" }]}>
              <Feather name="map-pin" size={22} color="#32FF7E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Go to Pickup</Text>
              <Text style={[styles.stepAddress, { color: colors.mutedForeground }]} numberOfLines={2}>
                {ride?.pickupAddress ?? "Pickup location"}
              </Text>
            </View>
          </View>

          <View style={[styles.tripMeta, { backgroundColor: colors.muted }]}>
            <View style={styles.tripMetaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Fare</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>₹{ride?.fare ?? "—"}</Text>
            </View>
            <View style={[styles.tripMetaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.tripMetaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Distance</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{ride?.distance ?? "—"} km</Text>
            </View>
            <View style={[styles.tripMetaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.tripMetaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Payment</Text>
              <Text style={[styles.metaValue, { color: colors.text, textTransform: "capitalize" }]}>
                {ride?.paymentMethod ?? "cash"}
              </Text>
            </View>
          </View>

          <NeonButton
            title={step === "navigate_pickup" ? "I've Arrived at Pickup" : "Arrived ✓"}
            onPress={handleArrived}
            disabled={step === "arrived"}
            style={{ marginTop: 4 }}
          />
          {step === "arrived" && (
            <Text style={[styles.arrivedHint, { color: colors.mutedForeground }]}>
              Ask the passenger for their OTP to start the trip
            </Text>
          )}
        </View>
      );
    }

    if (step === "otp_verify") {
      return (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconBg, { backgroundColor: "#00D4FF22" }]}>
              <Feather name="shield" size={22} color="#00D4FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Verify Passenger OTP</Text>
              <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Ask the passenger for their 4-digit OTP</Text>
            </View>
          </View>

          <TextInput
            style={[styles.otpInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.text }]}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, "").slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="Enter 4-digit OTP"
            placeholderTextColor={colors.mutedForeground}
          />

          <NeonButton
            title="Start Trip"
            onPress={handleStartRide}
            loading={startingRide}
            disabled={otp.length !== 4}
            style={{ marginTop: 4 }}
          />
        </View>
      );
    }

    if (step === "in_progress" || step === "completing") {
      return (
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIconBg, { backgroundColor: "#32FF7E22" }]}>
              <MaterialCommunityIcons name="car-side" size={22} color="#32FF7E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>Trip in Progress</Text>
              <Text style={[styles.stepAddress, { color: colors.mutedForeground }]} numberOfLines={2}>
                {ride?.dropAddress ?? "Destination"}
              </Text>
            </View>
          </View>

          <View style={[styles.tripMeta, { backgroundColor: colors.muted }]}>
            <View style={styles.tripMetaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Earning</Text>
              <Text style={[styles.metaValue, { color: "#32FF7E" }]}>₹{ride?.fare ?? "—"}</Text>
            </View>
            <View style={[styles.tripMetaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.tripMetaItem}>
              <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Distance</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{ride?.distance ?? "—"} km</Text>
            </View>
          </View>

          <NeonButton
            title="Complete Trip"
            onPress={handleCompleteRide}
            loading={completingRide}
            style={{ marginTop: 4 }}
          />
        </View>
      );
    }

    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={{
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={darkMapStyle}
      >
        <Marker coordinate={pickup} title="Pickup">
          <View style={styles.pickupMarker}>
            <View style={styles.markerInner} />
          </View>
        </Marker>
        <Marker coordinate={drop} title="Drop">
          <Feather name="map-pin" size={26} color="#FF4444" />
        </Marker>
        <Marker coordinate={driverLoc} title="You">
          <View style={styles.driverMarker}>
            <MaterialCommunityIcons name="car-side" size={18} color="#00D4FF" />
          </View>
        </Marker>
        <Polyline
          coordinates={[driverLoc, destination]}
          strokeColor="#00D4FF"
          strokeWidth={2.5}
          lineDashPattern={[6, 4]}
        />
      </MapView>

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: "#00D4FF" }]} />
          <Text style={styles.statusText}>
            {step === "navigate_pickup" ? "Navigate to Pickup"
              : step === "arrived" ? "Arrived — Await OTP"
              : step === "otp_verify" ? "Verify OTP"
              : "Trip in Progress"}
          </Text>
        </View>
      </View>

      {/* Bottom step card */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 16), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {renderStepCard()}
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  map: { flex: 1 },
  topBar: {
    position: "absolute", left: 16, right: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#0A0A0AEE",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#252525",
  },
  statusPill: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0A0A0AEE", paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 30, borderWidth: 1, borderColor: "#252525",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#32FF7E" },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  bottomSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#0F0F0F", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, borderTopWidth: 1, borderColor: "#252525",
  },
  stepCard: { gap: 14 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF" },
  stepAddress: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888", marginTop: 2 },
  stepSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888", marginTop: 2 },
  tripMeta: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 14, padding: 12 },
  tripMetaItem: { flex: 1, alignItems: "center", gap: 2 },
  tripMetaDivider: { width: 1, height: 28, backgroundColor: "#252525" },
  metaLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#666" },
  metaValue: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#FFF" },
  otpInput: {
    backgroundColor: "#1E1E1E", borderRadius: 14, padding: 16,
    color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 28,
    textAlign: "center", letterSpacing: 8, borderWidth: 1.5, borderColor: "#252525",
  },
  arrivedHint: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },
  pickupMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#32FF7E", borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center" },
  markerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#000" },
  driverMarker: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#141414", borderWidth: 1.5, borderColor: "#00D4FF", alignItems: "center", justifyContent: "center" },
});
