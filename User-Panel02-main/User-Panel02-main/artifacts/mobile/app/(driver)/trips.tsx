import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetRideHistory } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { data, isLoading } = useGetRideHistory({});
  const rides = data?.rides ?? [];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("trips")}</Text>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noRides")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "completed" ? "#32FF7E22" : "#FF444422",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: item.status === "completed" ? "#32FF7E" : "#FF4444",
                    },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.fare}>₹{item.fare}</Text>
            </View>

            <View style={styles.route}>
              <View style={styles.routeRow}>
                <View style={styles.dotGreen} />
                <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                  {item.pickupAddress ?? "—"}
                </Text>
              </View>
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <View style={styles.routeRow}>
                <View style={styles.dotRed} />
                <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                  {item.dropAddress}
                </Text>
              </View>
            </View>

            <View style={styles.meta}>
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.distance} km</Text>
              <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {new Date(item.createdAt ?? "").toLocaleDateString("en-IN")}
              </Text>
              <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, textTransform: "capitalize" }]}>
                {item.paymentMethod}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF", paddingVertical: 20 },
  list: { gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: "#141414", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#252525", gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  fare: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  route: { gap: 0 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeLine: { width: 1.5, height: 14, backgroundColor: "#333", marginLeft: 4 },
  dotGreen: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#32FF7E" },
  dotRed: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#FF4444" },
  routeText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#FFF", flex: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#444" },
  empty: { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular", color: "#555" },
});
