import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { useColors } from "@/hooks/useColors";

const LANGUAGES = [
  { code: "en" as const, label: "English", native: "English" },
  { code: "or" as const, label: "Odia", native: "ଓଡ଼ିଆ" },
];

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const colors = useColors();

  function handleContinue() {
    router.replace("/(auth)/login");
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: colors.text }]}>JAJPUR JATRI</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t("selectLanguage")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("selectLanguageDesc")}</Text>

        <View style={styles.options}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              activeOpacity={0.8}
              style={[
                styles.langCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                language === lang.code && styles.langCardSelected,
              ]}
            >
              <View style={styles.langInfo}>
                <Text style={[styles.langLabel, { color: colors.text }]}>{lang.label}</Text>
                <Text style={[styles.langNative, { color: colors.mutedForeground }]}>{lang.native}</Text>
              </View>
              {language === lang.code && (
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={16} color="#000" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <NeonButton title={t("continue")} onPress={handleContinue} />
      </View>

      {Platform.OS === "web" && <View style={{ height: 34 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#888888",
    textAlign: "center",
  },
  options: {
    gap: 12,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#141414",
    borderWidth: 1.5,
    borderColor: "#252525",
  },
  langCardSelected: {
    borderColor: "#32FF7E",
    backgroundColor: "#32FF7E18",
  },
  langInfo: {
    flex: 1,
    gap: 2,
  },
  langLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  langNative: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#888888",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#32FF7E",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingBottom: 10,
  },
});
