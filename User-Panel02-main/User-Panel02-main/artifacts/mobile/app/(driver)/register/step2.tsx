import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { DarkInput } from "@/components/DarkInput";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

const VEHICLE_TYPES = [
  { id: "bike" as const, label: "Bike", icon: "motorbike", capacity: "1 person" },
  { id: "auto" as const, label: "Auto", icon: "rickshaw", capacity: "3 persons" },
];

export default function Step2Screen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const [vehicleType, setVehicleType] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  async function handleNext() {
    if (!vehicleType || !vehicleNumber || !vehicleModel) return;
    await AsyncStorage.setItem(
      "driver_reg_step2",
      JSON.stringify({ vehicleType, vehicleNumber, vehicleModel })
    );
    router.push("/(driver)/register/step3");
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background },
      ]}
    >
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              { backgroundColor: colors.border },
              s <= 2 && styles.progressDone,
              s === 2 && styles.progressActive,
            ]}
          />
        ))}
      </View>

      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 2 of 4</Text>
      <Text style={[styles.title, { color: colors.text }]}>Vehicle Info</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Tell us about your vehicle</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t("vehicleType")}</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setVehicleType(v.id)}
              style={[
                styles.vehicleCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                vehicleType === v.id && styles.vehicleCardActive,
              ]}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={v.icon as never}
                size={28}
                color={vehicleType === v.id ? "#000" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.vehicleLabel,
                  { color: colors.text },
                  vehicleType === v.id && { color: "#000" },
                ]}
              >
                {v.label}
              </Text>
              <Text
                style={[
                  styles.vehicleCapacity,
                  { color: colors.mutedForeground },
                  vehicleType === v.id && { color: "#000" },
                ]}
              >
                {v.capacity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <DarkInput
          label={t("vehicleNumber")}
          value={vehicleNumber}
          onChangeText={(t) => setVehicleNumber(t.toUpperCase())}
          placeholder="e.g. OD 06 AB 1234"
          autoCapitalize="characters"
          icon={<Feather name="hash" size={18} color={colors.mutedForeground} />}
        />
        <DarkInput
          label={t("vehicleModel")}
          value={vehicleModel}
          onChangeText={setVehicleModel}
          placeholder="e.g. Honda Activa 6G"
          icon={<Feather name="truck" size={18} color={colors.mutedForeground} />}
        />

        <NeonButton
          title={t("next")}
          onPress={handleNext}
          disabled={!vehicleType || !vehicleNumber || !vehicleModel}
          style={styles.btn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 24 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#141414",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#252525",
    marginBottom: 20,
  },
  progress: { flexDirection: "row", gap: 6, marginBottom: 12 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#252525" },
  progressActive: { backgroundColor: "#32FF7E" },
  progressDone: { backgroundColor: "#32FF7E88" },
  stepLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#888" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF", marginTop: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888", marginBottom: 8 },
  form: { gap: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#888" },
  vehicleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  vehicleCard: {
    width: "47%", padding: 16, borderRadius: 16, borderWidth: 1.5,
    borderColor: "#252525", backgroundColor: "#141414", alignItems: "center", gap: 6,
  },
  vehicleCardActive: { backgroundColor: "#32FF7E", borderColor: "#32FF7E" },
  vehicleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  vehicleCapacity: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#888" },
  btn: { marginTop: 8 },
});
