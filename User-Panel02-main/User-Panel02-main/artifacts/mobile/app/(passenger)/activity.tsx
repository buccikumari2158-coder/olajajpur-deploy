import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGetRideHistory, getGetRideHistoryQueryKey } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS: Record<string, string> = {
  completed: "#32FF7E",
  cancelled: "#FF4444",
  searching: "#FFB300",
};

const VEHICLE_ICONS: Record<string, string> = {
  bike: "motorbike",
  auto: "rickshaw",
};

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { data, isLoading } = useGetRideHistory({}, {
    query: {
      queryKey: getGetRideHistoryQueryKey(),
      refetchOnWindowFocus: true,
    },
  });

  const rides = data?.rides ?? [];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("activity")}</Text>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!rides.length}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Feather name="clock" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noRides")}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[styles.rideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rideIcon}>
              <MaterialCommunityIcons
                name={(VEHICLE_ICONS[item.vehicleType] ?? "car-side") as never}
                size={22}
                color="#32FF7E"
              />
            </View>
            <View style={styles.rideInfo}>
              <Text style={[styles.rideDest, { color: colors.text }]} numberOfLines={1}>
                {item.dropAddress}
              </Text>
              <Text style={[styles.rideDate, { color: colors.mutedForeground }]}>{formatDate(item.createdAt ?? "")}</Text>
              <View style={styles.rideMeta}>
                <Text style={[styles.rideDistance, { color: colors.mutedForeground }]}>{item.distance} km</Text>
                <View style={[styles.dot, { backgroundColor: colors.border }]} />
                <Text
                  style={[
                    styles.rideStatus,
                    { color: STATUS_COLORS[item.status] ?? colors.mutedForeground },
                  ]}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.rideFareCol}>
              <Text style={styles.rideFare}>₹{item.fare}</Text>
              <Text style={[styles.ridePayment, { color: colors.mutedForeground }]}>{item.paymentMethod}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
    paddingVertical: 20,
  },
  list: { gap: 12, paddingBottom: 100 },
  rideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#252525",
  },
  rideIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#32FF7E18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#32FF7E44",
  },
  rideInfo: { flex: 1, gap: 3 },
  rideDest: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  rideDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  rideMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  rideDistance: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#444" },
  rideStatus: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  rideFareCol: { alignItems: "flex-end", gap: 2 },
  rideFare: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  ridePayment: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#666", textTransform: "capitalize" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 80,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#555" },
});
