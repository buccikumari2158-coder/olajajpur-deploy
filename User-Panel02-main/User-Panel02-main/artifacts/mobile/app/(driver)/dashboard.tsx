import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useGetDriverProfile,
  useUpdateDriverStatus,
  useGetDriverEarnings,
  useGetRideHistory,
  getGetRideHistoryQueryKey,
  getGetDriverProfileQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";
import { useColors } from "@/hooks/useColors";
import { useQueryClient } from "@tanstack/react-query";

interface RideRequest {
  rideId: string;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
  distance: number;
  vehicleType?: string;
}

export default function DriverDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { socket, isConnected, joinDriverRoom, acceptRide, rejectRide } = useSocket();
  const colors = useColors();
  const qc = useQueryClient();
  const [showRequest, setShowRequest] = useState(false);
  const [pendingRide, setPendingRide] = useState<RideRequest | null>(null);
  const requestTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState(30);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { data: profileData } = useGetDriverProfile();
  const { data: earningsData } = useGetDriverEarnings();
  const { data: tripsData } = useGetRideHistory({}, {
    query: {
      queryKey: getGetRideHistoryQueryKey(),
      staleTime: 60000,
    },
  });

  const profile = profileData;
  const isOnline = profile?.isOnline ?? false;
  const todayEarnings = (earningsData?.dailyData?.[new Date().getDay()] as { amount?: number } | undefined)?.amount ?? 0;

  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateDriverStatus({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getGetDriverProfileQueryKey() }),
      onError: (err: { message?: string }) => Alert.alert("Error", err?.message || "Failed to update status"),
    },
  });

  useEffect(() => {
    if (showRequest) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showRequest]);

  useEffect(() => {
    if (!profile?.id) return;
    joinDriverRoom(profile.id);

    function onRideRequest(data: RideRequest) {
      setPendingRide(data);
      setShowRequest(true);
      setCountdown(30);
      if (requestTimer.current) clearInterval(requestTimer.current);
      requestTimer.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(requestTimer.current!);
            setShowRequest(false);
            setPendingRide(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }

    socket?.on("ride:request", onRideRequest);
    return () => {
      socket?.off("ride:request", onRideRequest);
      if (requestTimer.current) clearInterval(requestTimer.current);
    };
  }, [socket, profile?.id]);

  function handleToggleOnline() {
    if (profile?.status !== "approved") {
      Alert.alert("Not Approved", "Your account is pending approval. You cannot go online yet.");
      return;
    }
    updateStatus({ data: { isOnline: !isOnline, lat: 20.8522, lng: 86.0 } });
  }

  function handleAcceptRide() {
    if (!pendingRide || !profile?.id) return;
    if (requestTimer.current) clearInterval(requestTimer.current);
    acceptRide(pendingRide.rideId, profile.id);
    setShowRequest(false);
    router.push({ pathname: "/ride/driver-active", params: { rideId: pendingRide.rideId } });
    setPendingRide(null);
  }

  function handleRejectRide() {
    if (!pendingRide) return;
    if (requestTimer.current) clearInterval(requestTimer.current);
    rejectRide(pendingRide.rideId);
    setShowRequest(false);
    setPendingRide(null);
  }

  const recentTrips = tripsData?.rides?.slice(0, 3) ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      {/* Ride request overlay */}
      {showRequest && pendingRide && (
        <View style={styles.requestOverlay}>
          <Animated.View style={[styles.requestCard, { backgroundColor: colors.card, transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.countdownRow}>
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>NEW RIDE REQUEST</Text>
              </View>
            </View>

            <Text style={[styles.requestTitle, { color: colors.text }]}>{t("newRideRequest")}</Text>

            <View style={styles.requestRoute}>
              <View style={styles.requestStop}>
                <View style={styles.stopDotGreen} />
                <Text style={[styles.stopText, { color: colors.text }]} numberOfLines={2}>{pendingRide.pickupAddress}</Text>
              </View>
              <View style={[styles.requestLine, { backgroundColor: colors.border }]} />
              <View style={styles.requestStop}>
                <View style={styles.stopDotRed} />
                <Text style={[styles.stopText, { color: colors.text }]} numberOfLines={2}>{pendingRide.dropAddress}</Text>
              </View>
            </View>

            <View style={styles.requestMeta}>
              <View style={styles.requestMetaItem}>
                <Feather name="navigation" size={14} color={colors.mutedForeground} />
                <Text style={[styles.requestMetaText, { color: colors.mutedForeground }]}>{pendingRide.distance} km</Text>
              </View>
              <View style={[styles.requestMetaDot, { backgroundColor: colors.mutedForeground }]} />
              <Text style={styles.requestFare}>₹{pendingRide.fare}</Text>
              {pendingRide.vehicleType && (
                <>
                  <View style={[styles.requestMetaDot, { backgroundColor: colors.mutedForeground }]} />
                  <Text style={[styles.requestMetaText, { color: colors.mutedForeground }]}>{pendingRide.vehicleType.toUpperCase()}</Text>
                </>
              )}
            </View>

            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectRide}>
                <Feather name="x" size={18} color="#FF4444" />
                <Text style={styles.rejectText}>{t("reject")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
                <Feather name="check" size={18} color="#000" />
                <Text style={styles.acceptText}>{t("accept")}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good{new Date().getHours() < 12 ? " Morning" : new Date().getHours() < 17 ? " Afternoon" : " Evening"} 👋
            </Text>
            <Text style={[styles.driverName, { color: colors.text }]}>{profile?.name ?? user?.name ?? "Driver"}</Text>
          </View>
          <View style={[styles.onlinePill, { backgroundColor: isOnline ? "#32FF7E22" : colors.secondary, borderColor: colors.border }]}>
            <View style={[styles.onlineDot, { backgroundColor: isConnected ? (isOnline ? "#32FF7E" : colors.mutedForeground) : "#FF4444" }]} />
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={updatingStatus}
              trackColor={{ false: colors.border, true: "#32FF7E66" }}
              thumbColor={isOnline ? "#32FF7E" : colors.mutedForeground}
            />
            <Text style={[styles.onlineText, { color: isOnline ? "#32FF7E" : colors.mutedForeground }]}>
              {isOnline ? t("online") : t("offline")}
            </Text>
          </View>
        </View>

        {/* Connection status */}
        {!isConnected && (
          <View style={styles.connectionWarn}>
            <Feather name="wifi-off" size={14} color="#FFB300" />
            <Text style={styles.connectionWarnText}>Reconnecting to server…</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="currency-inr" size={22} color="#32FF7E" />
            <Text style={styles.statValue}>₹{todayEarnings}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("todaysEarnings")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="navigation" size={22} color="#00D4FF" />
            <Text style={[styles.statValue, { color: "#00D4FF" }]}>{profile?.totalRides ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t("totalRides")}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="star" size={22} color="#FFB300" />
            <Text style={[styles.statValue, { color: "#FFB300" }]}>{(profile?.rating ?? 4.5).toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
          </View>
        </View>

        {/* Vehicle info */}
        {profile && (
          <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons
              name={(profile.vehicleType === "bike" ? "motorbike" : profile.vehicleType === "auto" ? "rickshaw" : "car-side") as never}
              size={36}
              color="#00D4FF"
            />
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleModel, { color: colors.text }]}>{profile.vehicleModel ?? "Your Vehicle"}</Text>
              <Text style={[styles.vehicleNumber, { color: colors.mutedForeground }]}>{profile.vehicleNumber}</Text>
            </View>
            <View style={[styles.vehicleStatus, { backgroundColor: profile.status === "approved" ? "#32FF7E22" : "#FFB30022" }]}>
              <Text style={[styles.vehicleStatusText, { color: profile.status === "approved" ? "#32FF7E" : "#FFB300" }]}>
                {(profile.status ?? "pending").charAt(0).toUpperCase() + (profile.status ?? "pending").slice(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Online prompt */}
        {!isOnline && profile?.status === "approved" && (
          <View style={[styles.offlineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="power" size={24} color={colors.mutedForeground} />
            <Text style={[styles.offlineTitle, { color: colors.mutedForeground }]}>You are offline</Text>
            <Text style={[styles.offlineSubtitle, { color: colors.mutedForeground }]}>Toggle the switch above to go online and receive ride requests</Text>
          </View>
        )}

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Trips</Text>
            {recentTrips.map((trip) => (
              <View key={trip.id} style={[styles.tripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.tripIcon}>
                  <Feather name="navigation" size={16} color="#00D4FF" />
                </View>
                <View style={styles.tripInfo}>
                  <Text style={[styles.tripDest, { color: colors.text }]} numberOfLines={1}>{trip.dropAddress}</Text>
                  <Text style={[styles.tripDate, { color: colors.mutedForeground }]}>{new Date(trip.createdAt ?? "").toLocaleDateString()}</Text>
                </View>
                <Text style={styles.tripFare}>₹{trip.fare}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  driverName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  onlinePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  connectionWarn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFB30022", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#FFB30044",
  },
  connectionWarnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#FFB300" },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14,
    alignItems: "center", gap: 5, borderWidth: 1,
  },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  vehicleCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  vehicleInfo: { flex: 1, gap: 3 },
  vehicleModel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  vehicleNumber: { fontSize: 13, fontFamily: "Inter_400Regular" },
  vehicleStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  vehicleStatusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  offlineCard: {
    alignItems: "center", gap: 8, padding: 28,
    borderRadius: 16, borderWidth: 1,
  },
  offlineTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  offlineSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  tripCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14,
    borderWidth: 1,
  },
  tripIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#00D4FF18", alignItems: "center", justifyContent: "center" },
  tripInfo: { flex: 1, gap: 2 },
  tripDest: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tripDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tripFare: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  // Request overlay
  requestOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#000000CC", zIndex: 999,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 20,
  },
  requestCard: {
    width: "100%", borderRadius: 28,
    padding: 22, gap: 14, borderWidth: 2, borderColor: "#32FF7E44",
    alignItems: "center",
    shadowColor: "#32FF7E", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  countdownBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FF444422",
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#FF444466",
  },
  countdownText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#FF4444" },
  requestBadge: { flex: 1, backgroundColor: "#32FF7E22", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: "center" },
  requestBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#32FF7E", letterSpacing: 1 },
  requestTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  requestRoute: { width: "100%", gap: 0 },
  requestStop: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  stopDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#32FF7E", marginTop: 3 },
  stopDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF4444", marginTop: 3 },
  requestLine: { width: 1.5, height: 16, marginLeft: 4 },
  stopText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  requestMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  requestMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  requestMetaText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  requestMetaDot: { width: 4, height: 4, borderRadius: 2 },
  requestFare: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  requestActions: { flexDirection: "row", gap: 12, width: "100%" },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#FF4444",
  },
  rejectText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FF4444" },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: "#32FF7E",
  },
  acceptText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#000" },
});
