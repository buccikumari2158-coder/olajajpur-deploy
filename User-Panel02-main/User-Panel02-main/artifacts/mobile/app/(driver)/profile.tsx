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
  Modal,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGetDriverProfile, getGetDriverProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { ConfirmModal } from "@/components/ConfirmModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function DocViewer({ url, label, visible, onClose }: { url: string | null; label: string; visible: boolean; onClose: () => void }) {
  if (!url) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dvStyles.overlay}>
        <View style={dvStyles.header}>
          <Text style={dvStyles.title}>{label}</Text>
          <TouchableOpacity onPress={onClose} style={dvStyles.closeBtn}>
            <Feather name="x" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Image source={{ uri: url }} style={dvStyles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const dvStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#000000EE", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, justifyContent: "space-between" },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.75 },
});

export default function DriverProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const colors = useColors();
  const { data: profile } = useGetDriverProfile({ query: { queryKey: getGetDriverProfileQueryKey() } });
  const [viewingDoc, setViewingDoc] = useState<{ url: string; label: string } | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const SUPPORT_NUMBER = "+919583789411";

  const documents = [
    { key: "aadhaarUrl", label: "Aadhaar Card", url: profile?.aadhaarUrl ?? null, icon: "user" },
    { key: "licenseUrl", label: "Driving Licence", url: profile?.licenseUrl ?? null, icon: "credit-card" },
    { key: "vehicleRcUrl", label: "RC Book", url: profile?.vehicleRcUrl ?? null, icon: "file-text" },
    { key: "vehiclePhotoUrl", label: "Vehicle Photo", url: profile?.vehiclePhotoUrl ?? null, icon: "truck" },
  ] as const;

  const statusColor = profile?.status === "approved" ? "#32FF7E" : profile?.status === "rejected" ? "#FF4444" : "#FFB300";
  const vehicleIconName = profile?.vehicleType === "bike" ? "motorbike" : profile?.vehicleType === "auto" ? "rickshaw" : "car-side";

  async function confirmLogout() {
    setShowLogout(false);
    await logout();
    router.replace("/(auth)/login");
  }

  const initials = (profile?.name ?? user?.name ?? "DK")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("profile")}</Text>

      {profile?.status === "pending" && (
        <View style={styles.pendingBanner}>
          <Feather name="clock" size={16} color="#FFB300" />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Application Under Review</Text>
            <Text style={[styles.pendingSub, { color: colors.mutedForeground }]}>We're verifying your documents. Usually 24–48 hours.</Text>
          </View>
        </View>
      )}

      {profile?.status === "rejected" && (
        <View style={[styles.pendingBanner, { borderColor: "#FF444444", backgroundColor: "#FF444410" }]}>
          <Feather name="alert-circle" size={16} color="#FF4444" />
          <Text style={[styles.pendingTitle, { color: "#FF4444" }]}>Application Rejected — Contact Support</Text>
        </View>
      )}

      {/* Profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {profile?.photo ? (
          <Image source={{ uri: profile.photo }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]}>{profile?.name ?? user?.name ?? "Driver"}</Text>
        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{profile?.phone ?? user?.phone}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="star" size={12} color="#FFB300" />
            <Text style={[styles.statValue, { color: colors.text }]}>{(profile?.rating ?? 4.5).toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Rating</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="car-side" size={12} color="#00D4FF" />
            <Text style={[styles.statValue, { color: colors.text }]}>{profile?.totalRides ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <MaterialCommunityIcons name="currency-inr" size={12} color="#32FF7E" />
            <Text style={[styles.statValue, { color: "#32FF7E" }]}>
              {profile?.totalEarnings ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Earned</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20", borderColor: statusColor + "44" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {(profile?.status ?? "pending").charAt(0).toUpperCase() + (profile?.status ?? "pending").slice(1)}
          </Text>
        </View>
      </View>

      {/* Vehicle */}
      {profile && (
        <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name={vehicleIconName as never} size={32} color="#00D4FF" />
          <View style={styles.vehicleInfo}>
            <Text style={[styles.vehicleModel, { color: colors.text }]}>{profile.vehicleModel ?? "Vehicle"}</Text>
            <Text style={[styles.vehicleNumber, { color: colors.mutedForeground }]}>{profile.vehicleNumber}</Text>
            <Text style={[styles.vehicleType, { color: colors.mutedForeground }]}>{profile.vehicleType?.toUpperCase()}</Text>
          </View>
        </View>
      )}

      {/* Documents */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>My Documents</Text>
      <View style={styles.docsGrid}>
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.key}
            style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }, !!doc.url && styles.docCardUploaded]}
            onPress={() => doc.url && setViewingDoc({ url: doc.url, label: doc.label })}
            activeOpacity={doc.url ? 0.8 : 1}
          >
            {doc.url ? (
              <Image source={{ uri: doc.url }} style={styles.docThumb} />
            ) : (
              <View style={[styles.docIconBox, { backgroundColor: colors.muted }]}>
                <Feather name={doc.icon as never} size={20} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={[styles.docLabel, { color: colors.text }]}>{doc.label}</Text>
            <Text style={[styles.docStatus, { color: colors.mutedForeground }, !!doc.url && { color: "#32FF7E" }]}>
              {doc.url ? "Uploaded ✓" : "Not uploaded"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Language */}
      <View style={[styles.langCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.langLeft}>
          <Feather name="globe" size={18} color="#32FF7E" />
          <Text style={[styles.langLabel, { color: colors.text }]}>Language</Text>
        </View>
        <View style={styles.langToggle}>
          {(["en", "or"] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              onPress={() => setLanguage(lang)}
              style={[styles.langBtn, { backgroundColor: colors.muted }, language === lang && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, { color: colors.mutedForeground }, language === lang && styles.langBtnActiveText]}>
                {lang === "en" ? "EN" : "ଓ"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme */}
      <TouchableOpacity
        style={[styles.langCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push("/profile/theme")}
        activeOpacity={0.8}
      >
        <View style={styles.langLeft}>
          <Feather name={theme === "dark" ? "moon" : "sun"} size={18} color="#32FF7E" />
          <Text style={[styles.langLabel, { color: colors.text }]}>Theme</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.themeValue, { color: colors.mutedForeground }]}>{theme === "dark" ? "Dark" : "Light"}</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Menu */}
      <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: "edit-2", label: "Edit Profile", sub: "Update name and photo", onPress: () => router.push("/profile/edit"), color: "#32FF7E", danger: false },
          { icon: "headphones", label: "Help & Support", sub: `Call ${SUPPORT_NUMBER}`, onPress: () => setShowSupport(true), color: "#00D4FF", danger: false },
          { icon: "file-text", label: "Terms & Conditions", sub: "Read our service terms", onPress: () => router.push("/legal/terms"), color: "#32FF7E", danger: false },
          { icon: "shield", label: "Privacy Policy", sub: "Driver data handling", onPress: () => router.push("/legal/privacy-driver"), color: "#32FF7E", danger: false },
          { icon: "log-out", label: "Logout", sub: "Sign out of your account", onPress: () => setShowLogout(true), color: "#FF4444", danger: true },
        ].map((item, i, arr) => (
          <TouchableOpacity
            key={i}
            style={[styles.menuItem, i < arr.length - 1 && [styles.menuBorder, { borderBottomColor: colors.muted }]]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + "18" }]}>
              <Feather name={item.icon as never} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }, item.danger && { color: "#FF4444" }]}>{item.label}</Text>
              <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
            </View>
            {!item.danger && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>Jajpur Jatri Driver v1.0.0</Text>

      <DocViewer
        url={viewingDoc?.url ?? null}
        label={viewingDoc?.label ?? ""}
        visible={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
      />

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
        message={`Reach our driver-partner team 24/7 at ${SUPPORT_NUMBER}`}
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
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 100 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF", paddingBottom: 4 },
  pendingBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14,
    backgroundColor: "#FFB30010", borderRadius: 14, borderWidth: 1, borderColor: "#FFB30044",
  },
  pendingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FFB300" },
  pendingSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#888", marginTop: 2 },
  profileCard: {
    backgroundColor: "#141414", borderRadius: 24, padding: 24, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#252525",
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#00D4FF", alignItems: "center", justifyContent: "center" },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#000" },
  name: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#FFF" },
  phone: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  statsRow: { flexDirection: "row", width: "100%", marginTop: 8, justifyContent: "space-around" },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statDivider: { width: 1, backgroundColor: "#252525" },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#888" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  vehicleCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#141414", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#1A1A2E" },
  vehicleInfo: { flex: 1, gap: 2 },
  vehicleModel: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  vehicleNumber: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  vehicleType: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  docsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  docCard: { width: "47%", backgroundColor: "#141414", borderRadius: 14, padding: 12, gap: 6, borderWidth: 1, borderColor: "#252525", alignItems: "center" },
  docCardUploaded: { borderColor: "#32FF7E44" },
  docThumb: { width: "100%", height: 70, borderRadius: 8 },
  docIconBox: { width: "100%", height: 70, borderRadius: 8, backgroundColor: "#1E1E1E", alignItems: "center", justifyContent: "center" },
  docLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFF", textAlign: "center" },
  docStatus: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555", textAlign: "center" },
  langCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#141414", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#252525" },
  langLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  langLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#FFF" },
  langToggle: { flexDirection: "row", gap: 6 },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: "#252525" },
  langBtnActive: { backgroundColor: "#32FF7E" },
  langBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#888" },
  langBtnActiveText: { color: "#000" },
  themeValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  menu: { backgroundColor: "#141414", borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#252525" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: "#1E1E1E" },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#444", textAlign: "center", paddingBottom: 8 },
});
