import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { ConfirmModal } from "@/components/ConfirmModal";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const colors = useColors();
  const [showLogout, setShowLogout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const SUPPORT_NUMBER = "+919583789411";

  async function confirmLogout() {
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  const MENU_ITEMS: MenuItem[] = [
    {
      icon: "clock",
      label: t("myRides"),
      sub: "View your ride history",
      onPress: () => router.push("/(passenger)/activity"),
    },
    {
      icon: "credit-card",
      label: t("paymentMethods"),
      sub: "Manage payment options",
      onPress: () => router.push("/(passenger)/wallet"),
    },
    {
      icon: "truck",
      label: t("becomeDriver"),
      sub: "Start earning with us",
      onPress: () => router.push("/(driver)/intro"),
      badge: t("new"),
    },
    {
      icon: "file-text",
      label: "Terms & Conditions",
      sub: "Read our service terms",
      onPress: () => router.push("/legal/terms"),
    },
    {
      icon: "shield",
      label: "Privacy Policy",
      sub: "How we handle your data",
      onPress: () => router.push("/legal/privacy-passenger"),
    },
    {
      icon: "phone",
      label: t("helpSupport"),
      sub: "24/7 ride assistance",
      onPress: () => setShowSupport(true),
    },
    {
      icon: "log-out",
      label: t("logout"),
      sub: "Sign out of your account",
      onPress: () => setShowLogout(true),
      danger: true,
    },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.phone?.slice(-2) ?? "??";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile header */}
      <View style={[styles.profileHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {user?.photo ? (
          <Image source={{ uri: user.photo }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || "User"}</Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user?.phone}</Text>
          {user?.email ? <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text> : null}
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push("/profile/edit")}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={16} color="#32FF7E" />
        </TouchableOpacity>
      </View>

      {/* Wallet card */}
      <TouchableOpacity
        style={[styles.walletCard, { backgroundColor: colors.card }]}
        activeOpacity={0.85}
        onPress={() => router.push("/(passenger)/wallet")}
      >
        <View style={styles.walletLeft}>
          <View style={styles.walletIcon}>
            <Feather name="credit-card" size={18} color="#000" />
          </View>
          <View>
            <Text style={[styles.walletLabel, { color: colors.mutedForeground }]}>{t("wallet")} Balance</Text>
            <Text style={styles.walletAmount}>₹{user?.walletBalance?.toFixed(0) ?? "0"}</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="#32FF7E" />
      </TouchableOpacity>

      {/* Language toggle */}
      <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Feather name="globe" size={18} color="#32FF7E" />
          </View>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Language</Text>
        </View>
        <View style={styles.langToggle}>
          <TouchableOpacity
            onPress={() => setLanguage("en")}
            style={[styles.langBtn, { backgroundColor: colors.muted }, language === "en" && styles.langBtnActive]}
          >
            <Text style={[styles.langBtnText, { color: colors.mutedForeground }, language === "en" && styles.langBtnTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLanguage("or")}
            style={[styles.langBtn, { backgroundColor: colors.muted }, language === "or" && styles.langBtnActive]}
          >
            <Text style={[styles.langBtnText, { color: colors.mutedForeground }, language === "or" && styles.langBtnTextActive]}>ଓ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme */}
      <TouchableOpacity
        style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push("/profile/theme")}
        activeOpacity={0.8}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Feather name={theme === "dark" ? "moon" : "sun"} size={18} color="#32FF7E" />
          </View>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.themeValue, { color: colors.mutedForeground }]}>{theme === "dark" ? "Dark" : "Light"}</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Menu */}
      <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {MENU_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={item.onPress}
            style={[
              styles.menuItem,
              idx < MENU_ITEMS.length - 1 && [styles.menuItemBorder, { borderBottomColor: colors.muted }],
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.menuIcon,
                { backgroundColor: item.danger ? "#FF444418" : "#32FF7E18" },
              ]}
            >
              <Feather
                name={item.icon}
                size={18}
                color={item.danger ? "#FF4444" : "#32FF7E"}
              />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }, item.danger && { color: "#FF4444" }]}>{item.label}</Text>
              {item.sub ? <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text> : null}
            </View>
            <View style={styles.menuRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              {!item.danger && <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>Jajpur Jatri v1.0.0</Text>

      <ConfirmModal
        visible={showLogout}
        title="Log out?"
        message="You'll need to sign in again with your phone number."
        confirmLabel="Log out"
        destructive
        icon="log-out"
        onCancel={() => setShowLogout(false)}
        onConfirm={confirmLogout}
      />

      <ConfirmModal
        visible={showSupport}
        title="Contact Support"
        message={`Reach our team 24/7 at ${SUPPORT_NUMBER}`}
        confirmLabel="Call now"
        icon="phone"
        onCancel={() => setShowSupport(false)}
        onConfirm={() => {
          setShowSupport(false);
          Linking.openURL(`tel:${SUPPORT_NUMBER}`);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { paddingHorizontal: 20, gap: 16 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#252525",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#32FF7E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 60, height: 60, borderRadius: 30 },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#000" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  userPhone: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#555" },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#32FF7E18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#32FF7E33",
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#32FF7E22",
  },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#32FF7E", alignItems: "center", justifyContent: "center" },
  walletLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#888" },
  walletAmount: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#252525",
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#32FF7E18", alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFF" },
  langToggle: { flexDirection: "row", gap: 6 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: "#252525" },
  langBtnActive: { backgroundColor: "#32FF7E" },
  langBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#888" },
  langBtnTextActive: { color: "#000" },
  themeValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  menu: {
    backgroundColor: "#141414",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#252525",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#1E1E1E" },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { backgroundColor: "#32FF7E", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#000" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#444", textAlign: "center", marginTop: 4 },
});
