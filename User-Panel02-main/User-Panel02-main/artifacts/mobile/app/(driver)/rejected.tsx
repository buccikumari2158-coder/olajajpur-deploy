import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function RejectedScreen() {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const colors = useColors();

  function handleBackToPassenger() {
    updateUser({ isDriver: false, driverStatus: undefined });
    router.replace("/(passenger)/home");
  }

  function handleReapply() {
    router.replace("/(driver)/intro");
  }

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
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather name="x-circle" size={52} color="#FF4444" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Application Declined</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Unfortunately your driver application was not approved at this time. You can go back to using the app as a passenger or reapply with updated documents.
        </Text>

        {/* Reasons card */}
        <View style={[styles.reasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={16} color="#FF4444" />
          <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>
            Common reasons for rejection: incomplete documents, unclear photos, or vehicle not meeting requirements.
          </Text>
        </View>

        {/* Support */}
        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="phone" size={18} color="#FFB300" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportLabel, { color: "#FFB300" }]}>Need help?</Text>
            <Text style={[styles.supportText, { color: colors.mutedForeground }]}>Contact support to understand the reason</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.reapplyBtn, { backgroundColor: colors.primary }]}
          onPress={handleReapply}
          activeOpacity={0.85}
        >
          <Feather name="refresh-cw" size={18} color="#000" />
          <Text style={styles.reapplyText}>Reapply</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.passengerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleBackToPassenger}
          activeOpacity={0.85}
        >
          <Feather name="user" size={18} color={colors.text} />
          <Text style={[styles.passengerText, { color: colors.text }]}>Back to Passenger</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FF444418",
    borderWidth: 2,
    borderColor: "#FF444444",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  supportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: "100%",
  },
  supportLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  supportText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    gap: 12,
  },
  reapplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  reapplyText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#000",
  },
  passengerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  passengerText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
