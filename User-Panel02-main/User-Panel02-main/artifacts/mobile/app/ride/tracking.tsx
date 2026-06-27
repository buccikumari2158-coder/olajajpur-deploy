import React, { useEffect, useRef, useState } from "react";
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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useGetCurrentRide, getGetCurrentRideQueryKey } from "@workspace/api-client-react";
import { useSocket } from "@/contexts/SocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

const JAJPUR = { latitude: 20.8522, longitude: 86.0 };

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { socket } = useSocket();
  const mapRef = useRef<MapView>(null);

  const { data: rideData } = useGetCurrentRide({
    query: {
      queryKey: getGetCurrentRideQueryKey(),
      refetchInterval: 8000,
    },
  });
  const ride = rideData?.ride;

  const [driverLocation, setDriverLocation] = useState({
    latitude: JAJPUR.latitude - 0.01,
    longitude: JAJPUR.longitude - 0.01,
  });

  useEffect(() => {
    function onDriverLocation(data: { lat: number; lng: number }) {
      const newLoc = { latitude: data.lat, longitude: data.lng };
      setDriverLocation(newLoc);
      mapRef.current?.animateToRegion({
        ...newLoc,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 500);
    }

    function onRideCompleted() {
      router.replace("/ride/payment");
    }

    function onRideCancelled() {
      Alert.alert("Ride Cancelled", "The driver has cancelled the ride.");
      router.replace("/(passenger)/home");
    }

    if (socket) {
      socket.on("driver:location", onDriverLocation);
      socket.on("ride:completed", onRideCompleted);
      socket.on("ride:cancelled", onRideCancelled);
    }

    return () => {
      socket?.off("driver:location", onDriverLocation);
      socket?.off("ride:completed", onRideCompleted);
      socket?.off("ride:cancelled", onRideCancelled);
    };
  }, [socket]);

  const pickup = ride?.pickupLat != null && ride?.pickupLng != null
    ? { latitude: ride.pickupLat, longitude: ride.pickupLng }
    : JAJPUR;
  const drop = ride?.dropLat != null && ride?.dropLng != null
    ? { latitude: ride.dropLat, longitude: ride.dropLng }
    : { latitude: JAJPUR.latitude + 0.03, longitude: JAJPUR.longitude + 0.03 };

  const midLat = (pickup.latitude + drop.latitude) / 2;
  const midLng = (pickup.longitude + drop.longitude) / 2;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        region={{ latitude: midLat, longitude: midLng, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
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
        <Marker coordinate={driverLocation} title="Driver">
          <View style={styles.driverMarker}>
            <MaterialCommunityIcons name="car-side" size={18} color="#32FF7E" />
          </View>
        </Marker>
        <Polyline
          coordinates={[driverLocation, pickup, drop]}
          strokeColor="#32FF7E"
          strokeWidth={2.5}
          lineDashPattern={[6, 4]}
        />
      </MapView>

      {/* Header */}
      <View style={[styles.topBar, { top: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {ride?.status === "started" ? "Ride in progress" : "Driver on the way"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sosBtn}
          onPress={() =>
            Alert.alert("SOS", "Emergency?", [
              { text: "Cancel" },
              { text: "Call 112", onPress: () => Linking.openURL("tel:112") },
            ])
          }
        >
          <Text style={styles.sosText}>{t("sos")}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 16), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={styles.etaRow}>
          <View style={styles.etaStat}>
            <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>Distance</Text>
            <Text style={[styles.etaValue, { color: colors.text }]}>{ride?.distance ?? "—"} km</Text>
          </View>
          <View style={[styles.etaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.etaStat}>
            <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>Status</Text>
            <Text style={[styles.etaValue, { fontSize: 12, color: "#32FF7E", textTransform: "capitalize" }]}>
              {ride?.status ?? "—"}
            </Text>
          </View>
          <View style={[styles.etaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.etaStat}>
            <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>Fare</Text>
            <Text style={[styles.etaValue, { color: "#32FF7E" }]}>₹{ride?.fare ?? "—"}</Text>
          </View>
        </View>

        <View style={[styles.destRow, { backgroundColor: colors.muted }]}>
          <Feather name="map-pin" size={16} color="#FF4444" />
          <Text style={[styles.destText, { color: colors.text }]} numberOfLines={1}>
            {ride?.dropAddress ?? "Destination"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: "#32FF7E44" }]}
            onPress={() => Linking.openURL("tel:+919583789411")}
          >
            <Feather name="phone" size={18} color="#32FF7E" />
            <Text style={styles.actionText}>{t("callDriver")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: "#32FF7E44" }]}>
            <Feather name="message-circle" size={18} color="#32FF7E" />
            <Text style={styles.actionText}>{t("message")}</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0A0A0AEE", paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 30, borderWidth: 1, borderColor: "#252525",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#32FF7E" },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  sosBtn: { backgroundColor: "#FF4444", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30 },
  sosText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FFF" },
  bottomCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#0F0F0F", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, gap: 14, borderTopWidth: 1, borderColor: "#252525",
  },
  etaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  etaStat: { flex: 1, alignItems: "center", gap: 3 },
  etaDivider: { width: 1, height: 36, backgroundColor: "#252525" },
  etaLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#666" },
  etaValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  destRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1E1E1E", borderRadius: 12, padding: 12,
  },
  destText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFF" },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, backgroundColor: "#141414",
    borderRadius: 12, borderWidth: 1, borderColor: "#32FF7E44",
  },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  pickupMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#32FF7E", borderWidth: 2, borderColor: "#FFF", alignItems: "center", justifyContent: "center" },
  markerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#000" },
  driverMarker: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#141414", borderWidth: 1.5, borderColor: "#32FF7E", alignItems: "center", justifyContent: "center" },
});
