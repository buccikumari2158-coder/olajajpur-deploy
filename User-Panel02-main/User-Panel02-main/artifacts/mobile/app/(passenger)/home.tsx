import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { useGetNearbyDrivers, getGetNearbyDriversQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRide } from "@/contexts/RideContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { VehicleSelector } from "@/components/VehicleSelector";
import { NeonButton } from "@/components/NeonButton";

const { height } = Dimensions.get("window");
const JAJPUR_COORDS = { latitude: 20.8522, longitude: 86.0 };

const QUICK_ADDRESSES = [
  { icon: "home" as const, label: "Home", address: "Sector 7, Jajpur" },
  { icon: "briefcase" as const, label: "Work", address: "MG Road, Jajpur Town" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const colors = useColors();
  const { pickup, drop, setPickup, setDrop, selectedVehicle, setSelectedVehicle, setCurrentRideId, getFareEstimate } = useRide();

  const [showSheet, setShowSheet] = useState(false);
  const [dropInput, setDropInput] = useState("");
  const [userLocation, setUserLocation] = useState(JAJPUR_COORDS);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) setLocationError("Location permission denied. Showing Jajpur center.");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(loc);
        mapRef.current?.animateToRegion?.({
          ...loc,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (err) {
        if (!cancelled) {
          setLocationError(err instanceof Error ? err.message : "Could not get location");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const driverParams = { lat: userLocation.latitude, lng: userLocation.longitude };
  const { data: driversData } = useGetNearbyDrivers(driverParams, {
    query: {
      queryKey: getGetNearbyDriversQueryKey(driverParams),
      refetchInterval: 15000,
    },
  });

  const DISTANCE = pickup && drop
    ? Math.round(
        Math.sqrt(
          Math.pow((drop.lat - pickup.lat) * 111, 2) +
          Math.pow((drop.lng - pickup.lng) * 111, 2)
        ) * 10
      ) / 10
    : 5.2;

  const drivers = driversData?.drivers ?? [];

  function handleSetDrop() {
    if (!dropInput.trim()) return;
    const offset = (Math.random() - 0.5) * 0.05;
    const loc = {
      lat: userLocation.latitude + offset,
      lng: userLocation.longitude + offset * 1.5,
      address: dropInput,
    };
    setDrop(loc);
    if (!pickup) {
      setPickup({
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        address: "Current Location",
      });
    }
  }

  function handleConfirmRide() {
    if (!selectedVehicle) {
      Alert.alert("Select Vehicle", "Please select a vehicle type");
      return;
    }
    if (!drop) {
      Alert.alert("Set Destination", "Please set your destination");
      return;
    }
    router.push("/ride/confirm");
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      >
        {Platform.OS === "web" && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="You"
          >
            <View style={styles.meMarker} />
          </Marker>
        )}
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup"
          >
            <View style={styles.pickupMarker}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        )}
        {drop && (
          <Marker
            coordinate={{ latitude: drop.lat, longitude: drop.lng }}
            title="Drop"
          >
            <View style={styles.dropMarker}>
              <Feather name="map-pin" size={24} color="#FF4444" />
            </View>
          </Marker>
        )}
        {drivers.slice(0, 5).map((d) => (
          <Marker
            key={d.id}
            coordinate={{ latitude: d.lat, longitude: d.lng }}
            title={d.name ?? "Driver"}
          >
            <View style={[styles.driverMarker, { backgroundColor: colors.card, borderColor: "#32FF7E" }]}>
              <MaterialCommunityIcons name="car-side" size={16} color="#32FF7E" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            top: insets.top + (Platform.OS === "web" ? 67 : 0),
            backgroundColor: colors.background + "EE",
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image source={require("../../assets/images/icon.png")} style={styles.headerLogo} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>JAJPUR JATRI</Text>
        </View>
        <TouchableOpacity style={[styles.headerRight, { backgroundColor: colors.secondary }]}>
          <Feather name="bell" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Bottom sheet */}
      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 70),
          },
        ]}
      >
        {!showSheet ? (
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            onPress={() => setShowSheet(true)}
            activeOpacity={0.9}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>{t("whereToGo")}</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Drop input */}
            <View style={styles.inputRow}>
              <View style={styles.inputDots}>
                <View style={styles.dotGreen} />
                <View style={[styles.inputLine, { backgroundColor: colors.border }]} />
                <View style={styles.dotRed} />
              </View>
              <View style={styles.inputFields}>
                <View style={[styles.locationInput, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.locationLabel, { color: colors.mutedForeground }]}>{t("pickupLocation")}</Text>
                  <Text style={[styles.locationValue, { color: colors.text }]}>
                    {pickup?.address || "Current Location"}
                  </Text>
                </View>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                <TextInput
                  style={[styles.dropTextInput, { backgroundColor: colors.secondary, color: colors.text }]}
                  placeholder={t("dropLocation")}
                  placeholderTextColor={colors.mutedForeground}
                  value={dropInput}
                  onChangeText={setDropInput}
                  onSubmitEditing={handleSetDrop}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Quick destinations */}
            {!drop && (
              <View style={styles.quickDests}>
                {QUICK_ADDRESSES.map((addr) => (
                  <TouchableOpacity
                    key={addr.label}
                    style={[styles.quickDestCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => {
                      setDropInput(addr.address);
                      setDrop({ lat: JAJPUR_COORDS.latitude + 0.02, lng: JAJPUR_COORDS.longitude + 0.02, address: addr.address });
                      if (!pickup) setPickup({ lat: JAJPUR_COORDS.latitude, lng: JAJPUR_COORDS.longitude, address: "Current Location" });
                    }}
                  >
                    <View style={styles.quickDestIcon}>
                      <Feather name={addr.icon} size={16} color="#32FF7E" />
                    </View>
                    <View>
                      <Text style={[styles.quickDestLabel, { color: colors.text }]}>{addr.label}</Text>
                      <Text style={[styles.quickDestAddress, { color: colors.mutedForeground }]}>{addr.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Vehicle selector */}
            {drop && (
              <>
                <View style={[styles.routeInfo, { backgroundColor: colors.background }]}>
                  <View style={styles.routeStat}>
                    <Feather name="navigation" size={14} color="#32FF7E" />
                    <Text style={[styles.routeStatValue, { color: colors.text }]}>{DISTANCE} km</Text>
                  </View>
                  <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.routeStat}>
                    <Feather name="clock" size={14} color="#32FF7E" />
                    <Text style={[styles.routeStatValue, { color: colors.text }]}>{Math.round(DISTANCE * 2)} min</Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("chooseRide")}</Text>
                <VehicleSelector
                  selected={selectedVehicle?.type ?? null}
                  onSelect={(type, fare, eta) => {
                    setSelectedVehicle({ type: type as "bike"|"auto", label: type, fare, eta, capacity: 4 });
                  }}
                  distance={DISTANCE}
                />

                <NeonButton
                  title={t("confirmRide")}
                  onPress={handleConfirmRide}
                  disabled={!selectedVehicle}
                  style={styles.confirmBtn}
                />
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  headerRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    maxHeight: height * 0.65,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  searchPlaceholder: { fontSize: 15, fontFamily: "Inter_400Regular" },
  inputRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  inputDots: { alignItems: "center", paddingTop: 14, gap: 0 },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#32FF7E" },
  inputLine: { width: 1.5, height: 40 },
  dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF4444" },
  inputFields: { flex: 1, gap: 0 },
  locationInput: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 4 },
  locationLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  locationValue: { fontSize: 14, fontFamily: "Inter_500Medium", marginTop: 2 },
  separator: { height: 1 },
  dropTextInput: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, fontFamily: "Inter_400Regular", fontSize: 14 },
  quickDests: { gap: 10, marginBottom: 12 },
  quickDestCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  quickDestIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#32FF7E18", alignItems: "center", justifyContent: "center" },
  quickDestLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  quickDestAddress: { fontSize: 12, fontFamily: "Inter_400Regular" },
  routeInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16, borderRadius: 12, padding: 12 },
  routeStat: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeStatValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  routeDivider: { width: 1, height: 20 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  confirmBtn: { marginTop: 16, marginBottom: 4 },
  pickupMarker: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#32FF7E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  markerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#000" },
  dropMarker: { alignItems: "center", justifyContent: "center" },
  driverMarker: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  meMarker: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#00D4FF", borderWidth: 3, borderColor: "#FFF" },
});
