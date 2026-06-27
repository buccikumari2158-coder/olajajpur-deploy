import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useGetDriverEarnings } from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

const PERIODS = [
  { id: "daily" as const, label: "Daily" },
  { id: "weekly" as const, label: "Weekly" },
  { id: "monthly" as const, label: "Monthly" },
];

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data } = useGetDriverEarnings({ period });
  const total = data?.totalEarnings ?? 0;
  const dailyData = data?.dailyData ?? [];
  const maxAmount = Math.max(...dailyData.map((d) => d.amount), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("earnings")}</Text>

      {/* Period selector */}
      <View style={[styles.periodSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setPeriod(p.id)}
            style={[
              styles.periodBtn,
              period === p.id && styles.periodBtnActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                { color: colors.mutedForeground },
                period === p.id && styles.periodTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total card */}
      <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Earnings</Text>
        <Text style={styles.totalAmount}>₹{total.toLocaleString("en-IN")}</Text>
        <Text style={[styles.totalRides, { color: colors.mutedForeground }]}>
          {data?.totalRides ?? 0} rides completed
        </Text>
      </View>

      {/* Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Earnings by Day</Text>
        <View style={styles.chart}>
          {dailyData.map((d, i) => (
            <View key={i} style={styles.barColumn}>
              <Text style={[styles.barAmount, { color: colors.mutedForeground }]}>
                {d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max((d.amount / maxAmount) * 100, 4),
                    backgroundColor: i === new Date().getDay() ? "#32FF7E" : "#00D4FF44",
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Breakdown */}
      <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Earnings Breakdown</Text>
        {[
          { label: "Ride Fare", pct: 0.85, color: "#32FF7E" },
          { label: "Surge Bonus", pct: 0.10, color: "#00D4FF" },
          { label: "Tip", pct: 0.05, color: "#FFB300" },
        ].map((item) => (
          <View key={item.label} style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
              <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
            <View style={[styles.breakdownBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.breakdownFill,
                  { width: `${item.pct * 100}%`, backgroundColor: item.color },
                ]}
              />
            </View>
            <Text style={[styles.breakdownAmount, { color: item.color }]}>
              ₹{Math.round(total * item.pct)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 100 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", paddingTop: 16 },
  periodSelector: {
    flexDirection: "row", gap: 10,
    borderRadius: 14, padding: 4,
    borderWidth: 1,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  periodBtnActive: { backgroundColor: "#32FF7E" },
  periodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  periodTextActive: { color: "#000" },
  totalCard: {
    borderRadius: 24, padding: 24,
    alignItems: "center", gap: 4, borderWidth: 1,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  totalAmount: { fontSize: 42, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  totalRides: { fontSize: 13, fontFamily: "Inter_400Regular" },
  chartCard: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 16 },
  chartTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 130 },
  barColumn: { flex: 1, alignItems: "center", gap: 6 },
  barAmount: { fontSize: 10, fontFamily: "Inter_500Medium" },
  bar: { width: "60%", borderRadius: 6 },
  barLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  breakdownCard: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 14 },
  breakdownTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  breakdownLeft: { flexDirection: "row", alignItems: "center", gap: 8, width: 100 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  breakdownBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  breakdownFill: { height: "100%", borderRadius: 3 },
  breakdownAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", minWidth: 48, textAlign: "right" },
});
