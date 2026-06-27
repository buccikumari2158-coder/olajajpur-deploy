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
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { DarkInput } from "@/components/DarkInput";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

export default function Step1Screen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  async function handleNext() {
    if (!fullName || !address) return;
    await AsyncStorage.setItem("driver_reg_step1", JSON.stringify({ fullName, email, address }));
    router.push("/(driver)/register/step2");
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

      {/* Progress */}
      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              { backgroundColor: colors.border },
              s === 1 && styles.progressActive,
              s < 1 && styles.progressDone,
            ]}
          />
        ))}
      </View>

      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 1 of 4</Text>
      <Text style={[styles.title, { color: colors.text }]}>Personal Info</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Tell us about yourself</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <DarkInput
          label={t("fullName")}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          icon={<Feather name="user" size={18} color={colors.mutedForeground} />}
        />
        <DarkInput
          label={t("email")}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Feather name="mail" size={18} color={colors.mutedForeground} />}
        />
        <DarkInput
          label={t("address")}
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
          icon={<Feather name="map-pin" size={18} color={colors.mutedForeground} />}
          multiline
        />

        <NeonButton
          title={t("next")}
          onPress={handleNext}
          disabled={!fullName || !address}
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
  btn: { marginTop: 8 },
});
