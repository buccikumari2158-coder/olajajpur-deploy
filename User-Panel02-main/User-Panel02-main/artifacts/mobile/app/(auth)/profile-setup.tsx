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
import { useColors } from "@/hooks/useColors";
import { DarkInput } from "@/components/DarkInput";
import { NeonButton } from "@/components/NeonButton";
import { pickImage, uploadImage } from "@/lib/imageUpload";

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const colors = useColors();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { mutateAsync: updateMe } = useUpdateMe();

  async function handlePickPhoto() {
    setError(null);
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

  async function handleContinue() {
    setError(null);
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

      if (user?.role === "driver" || user?.isDriver) {
        if (user?.driverStatus === "pending") router.replace("/(driver)/pending");
        else if (user?.driverStatus === "approved") router.replace("/(driver)/dashboard");
        else if (user?.driverStatus === "rejected") router.replace("/(driver)/rejected");
        else router.replace("/(driver)/intro");
      } else {
        router.replace("/(passenger)/home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Just a couple of details so drivers can recognize you.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handlePickPhoto}
        activeOpacity={0.8}
        style={styles.avatarWrap}
        disabled={uploading}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
            <Feather name="user" size={42} color={colors.border} />
          </View>
        )}
        <View style={[styles.avatarBadge, { borderColor: colors.background }]}>
          {uploading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="camera" size={16} color="#000" />
          )}
        </View>
      </TouchableOpacity>
      <Text style={[styles.avatarHint, { color: colors.mutedForeground }]}>
        {uploading ? "Uploading photo..." : "Tap to add a profile photo"}
      </Text>

      <View style={styles.form}>
        <DarkInput
          label="Full Name"
          value={name}
          onChangeText={(v) => { setName(v); setError(null); }}
          placeholder="e.g. Ramesh Kumar"
          icon={<Feather name="user" size={18} color={colors.mutedForeground} />}
        />
        <DarkInput
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Feather name="mail" size={18} color={colors.mutedForeground} />}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={14} color="#FF4757" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <NeonButton
        title="Continue"
        onPress={handleContinue}
        loading={saving}
        disabled={name.trim().length < 2 || saving || uploading}
      />

      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        You can change these later from Profile → Edit.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 18, alignItems: "stretch" },
  header: { gap: 6, marginTop: Platform.OS === "web" ? 40 : 8 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  avatarWrap: { alignSelf: "center", marginTop: 12 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "#32FF7E55" },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute", right: 0, bottom: 0,
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#32FF7E",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3,
  },
  avatarHint: { textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 13 },
  form: { gap: 14, marginTop: 8 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FF475715", borderWidth: 1, borderColor: "#FF475740",
    borderRadius: 10, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#FF4757", lineHeight: 19 },
  footnote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
});
