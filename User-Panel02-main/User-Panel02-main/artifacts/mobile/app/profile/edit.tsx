import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUpdateMe } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { DarkInput } from "@/components/DarkInput";
import { NeonButton } from "@/components/NeonButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { pickImage, uploadImage } from "@/lib/imageUpload";
import { useColors } from "@/hooks/useColors";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuth();
  const colors = useColors();
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutateAsync: updateMe } = useUpdateMe();

  async function handlePickPhoto() {
    setError(null);
    setSuccess(null);
    try {
      const picked = await pickImage();
      if (!picked) return;
      setUploading(true);
      const url = await uploadImage(picked, "profile");
      setPhotoUri(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe({
        data: {
          name: name.trim(),
          ...(email.trim() && { email: email.trim() }),
          ...(photoUri && { photo: photoUri }),
        },
      });
      updateUser({
        name: updated.name ?? undefined,
        email: updated.email ?? undefined,
        photo: updated.photo ?? undefined,
      });
      setSuccess("Profile saved.");
      setTimeout(() => router.back(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.phone?.slice(-2) ?? "??";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} style={styles.avatarWrap} disabled={uploading}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={[styles.avatarBadge, { borderColor: colors.background }]}>
          {uploading ? <ActivityIndicator size="small" color="#000" /> : <Feather name="camera" size={16} color="#000" />}
        </View>
      </TouchableOpacity>
      <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
        {uploading ? "Uploading..." : "Tap photo to change"}
      </Text>

      <View style={styles.form}>
        <DarkInput
          label="Full Name"
          value={name}
          onChangeText={(v) => { setName(v); setError(null); setSuccess(null); }}
          placeholder="Your name"
          icon={<Feather name="user" size={18} color={colors.mutedForeground} />}
        />
        <DarkInput
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(null); setSuccess(null); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Feather name="mail" size={18} color={colors.mutedForeground} />}
        />

        <View style={[styles.phoneRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.phoneLabelRow}>
            <Feather name="phone" size={16} color={colors.mutedForeground} />
            <Text style={[styles.phoneLabel, { color: colors.mutedForeground }]}>Mobile Number</Text>
          </View>
          <Text style={[styles.phoneValue, { color: colors.text }]}>{user?.phone ?? "—"}</Text>
          <TouchableOpacity
            onPress={() => setShowChangePhone(true)}
            style={styles.changePhoneBtn}
            activeOpacity={0.85}
          >
            <Feather name="refresh-cw" size={13} color="#00D4FF" />
            <Text style={styles.changePhoneText}>Change Number</Text>
          </TouchableOpacity>
          <Text style={[styles.phoneHint, { color: colors.mutedForeground }]}>
            For your security we'll sign you out and re-verify the new number with OTP.
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={14} color="#FF4757" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={14} color="#32FF7E" />
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <NeonButton
        title="Save Changes"
        onPress={handleSave}
        loading={saving}
        disabled={uploading || saving}
      />

      <ConfirmModal
        visible={showChangePhone}
        title="Change mobile number?"
        message="We'll sign you out so you can sign in with the new number using OTP. Your account, wallet and history stay tied to the new number once verified."
        confirmLabel="Sign out & re-verify"
        icon="refresh-cw"
        onCancel={() => setShowChangePhone(false)}
        onConfirm={async () => {
          setShowChangePhone(false);
          await logout();
          router.replace("/(auth)/login");
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { paddingHorizontal: 20, gap: 18 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF" },
  avatarWrap: { alignSelf: "center", marginTop: 6 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: "#32FF7E55" },
  avatarPlaceholder: { backgroundColor: "#141414", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#32FF7E" },
  avatarBadge: {
    position: "absolute", right: 0, bottom: 0,
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#32FF7E",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#0A0A0A",
  },
  avatarHint: { textAlign: "center", color: "#888", fontFamily: "Inter_400Regular", fontSize: 13 },
  form: { gap: 14, marginTop: 6 },
  phoneRow: { backgroundColor: "#141414", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#252525", gap: 6 },
  phoneLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  phoneLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#888" },
  phoneValue: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  phoneHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555", lineHeight: 16 },
  changePhoneBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#00D4FF18", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: "#00D4FF44",
    marginTop: 4,
  },
  changePhoneText: { color: "#00D4FF", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FF475715", borderWidth: 1, borderColor: "#FF475740",
    borderRadius: 10, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#FF4757", lineHeight: 19 },
  successBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#32FF7E15", borderWidth: 1, borderColor: "#32FF7E40",
    borderRadius: 10, padding: 12,
  },
  successText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#32FF7E" },
});
