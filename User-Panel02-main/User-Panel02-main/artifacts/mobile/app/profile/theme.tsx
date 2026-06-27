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
import { useTheme, type AppTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

const OPTIONS: { value: AppTheme; label: string; icon: keyof typeof Feather.glyphMap; description: string }[] = [
  { value: "dark", label: "Dark", icon: "moon", description: "Dark background, easy on the eyes at night" },
  { value: "light", label: "Light", icon: "sun", description: "Light background, bright and clear" },
];

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useTheme();
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + 32,
          backgroundColor: colors.background,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: colors.card }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Theme</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>Choose how the app looks</Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.card,
                {
                  backgroundColor: active ? colors.primary + "10" : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setTheme(opt.value)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: active ? colors.primary : colors.secondary }]}>
                <Feather name={opt.icon} size={22} color={active ? "#000" : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.label, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.desc, { color: colors.mutedForeground }]}>{opt.description}</Text>
              </View>
              <View style={[styles.radio, { borderColor: active ? colors.primary : colors.border }]}>
                {active && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
  },
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
