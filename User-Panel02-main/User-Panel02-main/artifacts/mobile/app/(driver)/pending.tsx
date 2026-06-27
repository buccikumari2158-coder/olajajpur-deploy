import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function PendingScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const colors = useColors();

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + 30,
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: pulse }] }]}
        >
          <Feather name="clock" size={48} color="#FFB300" />
        </Animated.View>

        <Text style={[styles.title, { color: colors.text }]}>{t("pending")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("pendingDesc")}</Text>

        {/* Status steps */}
        <View style={styles.steps}>
          {[
            { label: "Application Submitted", done: true },
            { label: "Documents Under Review", done: true },
            { label: "Verification in Progress", done: false },
            { label: "Account Approved", done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View
                style={[
                  styles.stepCircle,
                  step.done ? styles.stepDone : [styles.stepPending, { backgroundColor: colors.secondary, borderColor: colors.border }],
                ]}
              >
                {step.done ? (
                  <Feather name="check" size={14} color="#000" />
                ) : (
                  <View style={[styles.stepDot, { backgroundColor: colors.mutedForeground }]} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: step.done ? colors.text : colors.mutedForeground },
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: "#FFB30033" }]}>
          <Feather name="phone" size={18} color="#FFB300" />
          <View style={{ flex: 1 }}>
            <Text style={styles.supportLabel}>Need help?</Text>
            <Text style={[styles.supportText, { color: colors.mutedForeground }]}>Contact support for faster approval</Text>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL("tel:+919583789411")}
            style={styles.callBtn}
          >
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace("/(auth)/login");
        }}
        style={styles.logoutBtn}
      >
        <Feather name="log-out" size={16} color="#FF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, paddingHorizontal: 24,
    alignItems: "center", gap: 20,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, width: "100%" },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#FFB30018", borderWidth: 2, borderColor: "#FFB30044",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 22, paddingHorizontal: 10,
  },
  steps: { width: "100%", gap: 14, marginTop: 8 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  stepDone: { backgroundColor: "#32FF7E" },
  stepPending: { borderWidth: 1 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  supportCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1, width: "100%",
  },
  supportLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFB300" },
  supportText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  callBtn: {
    backgroundColor: "#FFB300", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
  },
  callBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#000" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14,
    borderWidth: 1, borderColor: "#FF444444",
  },
  logoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF4444" },
});
