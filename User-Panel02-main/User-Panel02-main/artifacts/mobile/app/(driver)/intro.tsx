import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { NeonButton } from "@/components/NeonButton";

const BENEFITS: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }[] = [
  {
    icon: "calendar",
    title: "Earn on your own schedule",
    desc: "Drive whenever you want — morning, evening, or weekends. You are in control.",
  },
  {
    icon: "navigation",
    title: "Receive nearby ride requests",
    desc: "Get instant ride requests from passengers near your location in real time.",
  },
  {
    icon: "zap",
    title: "Fast and secure payouts",
    desc: "Earnings go directly to your in-app wallet. Withdraw anytime, instantly.",
  },
];

export default function DriverIntroScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
          paddingBottom: insets.bottom + 40,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: colors.card }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoWrap}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: colors.text }]}>JAJPUR JATRI</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Driver Partner Program</Text>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={[styles.heading, { color: colors.text }]}>Start earning today</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Join hundreds of drivers already earning with Jajpur Jatri.
        </Text>
      </View>

      {/* Benefits */}
      <View style={styles.benefits}>
        {BENEFITS.map((b, i) => (
          <View key={i} style={[styles.benefitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.benefitIcon}>
              <Feather name={b.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: colors.text }]}>{b.title}</Text>
              <Text style={[styles.benefitDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Continue button */}
      <NeonButton
        title="Continue"
        onPress={() => router.push("/(driver)/register/step1")}
        style={styles.btn}
      />

      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        Registration takes only a few minutes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 28 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: { alignItems: "center", gap: 8 },
  logo: { width: 88, height: 88 },
  appName: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
  headingWrap: { gap: 6 },
  heading: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subheading: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  benefits: { gap: 12 },
  benefitCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#32FF7E18",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, gap: 4 },
  benefitTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  benefitDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  btn: { marginTop: 4 },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: -12 },
});
