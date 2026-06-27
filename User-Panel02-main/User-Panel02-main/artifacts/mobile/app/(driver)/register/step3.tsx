import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { uploadImage } from "@/lib/uploadImage";
import { useColors } from "@/hooks/useColors";

interface DocSlot {
  key: string;
  label: string;
  hint: string;
  uri: string | null;
  cloudUrl: string | null;
  uploading: boolean;
}

export default function Step3Screen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { token } = useAuth();
  const colors = useColors();

  const [docs, setDocs] = useState<DocSlot[]>([
    { key: "aadhaar", label: t("uploadAadhaar"), hint: "Front side of Aadhaar card", uri: null, cloudUrl: null, uploading: false },
    { key: "license", label: t("uploadLicense"), hint: "Driving licence (front)", uri: null, cloudUrl: null, uploading: false },
    { key: "rc", label: t("uploadRC"), hint: "Vehicle registration certificate", uri: null, cloudUrl: null, uploading: false },
  ]);

  function updateDoc(index: number, patch: Partial<DocSlot>) {
    setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function pickAndUpload(index: number) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Allow photo access to upload documents");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    updateDoc(index, { uri, uploading: true, cloudUrl: null });

    try {
      const url = await uploadImage(uri, "documents", token ?? "");
      updateDoc(index, { cloudUrl: url, uploading: false });
    } catch (err) {
      updateDoc(index, { uri: null, uploading: false });
      const msg = err instanceof Error ? err.message : "Upload failed";
      Alert.alert("Upload Failed", `${docs[index]?.label}: ${msg}`);
    }
  }

  async function handleNext() {
    const allUploaded = docs.every((d) => d.cloudUrl);
    if (!allUploaded) {
      Alert.alert("Upload Required", "Please upload and wait for all documents to finish uploading.");
      return;
    }
    await AsyncStorage.setItem(
      "driver_reg_step3",
      JSON.stringify({
        aadhaarUrl: docs[0]?.cloudUrl ?? "",
        licenseUrl: docs[1]?.cloudUrl ?? "",
        vehicleRcUrl: docs[2]?.cloudUrl ?? "",
      })
    );
    router.push("/(driver)/register/step4");
  }

  const allDone = docs.every((d) => d.cloudUrl);
  const anyUploading = docs.some((d) => d.uploading);

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              { backgroundColor: colors.border },
              s < 3 && styles.progressDone,
              s === 3 && styles.progressActive,
            ]}
          />
        ))}
      </View>

      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 3 of 4</Text>
      <Text style={[styles.title, { color: colors.text }]}>Documents</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Upload clear photos of your documents</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {docs.map((doc, i) => (
          <TouchableOpacity
            key={doc.key}
            onPress={() => !doc.uploading && pickAndUpload(i)}
            style={[styles.uploadCard, { backgroundColor: colors.card, borderColor: colors.border }, doc.cloudUrl && styles.uploadCardDone]}
            activeOpacity={0.8}
          >
            {doc.uri ? (
              <Image source={{ uri: doc.uri }} style={styles.previewThumb} />
            ) : (
              <View style={[styles.uploadIcon, { backgroundColor: colors.muted }, doc.cloudUrl && { backgroundColor: "#32FF7E22" }]}>
                <Feather
                  name={doc.cloudUrl ? "check-circle" : "upload"}
                  size={24}
                  color={doc.cloudUrl ? "#32FF7E" : colors.mutedForeground}
                />
              </View>
            )}
            <View style={styles.uploadInfo}>
              <Text style={[styles.uploadLabel, { color: colors.text }]}>{doc.label}</Text>
              <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>{doc.hint}</Text>
              <Text style={[styles.uploadStatus, { color: colors.mutedForeground }, doc.cloudUrl && { color: "#32FF7E" }]}>
                {doc.uploading ? "Uploading…" : doc.cloudUrl ? "Uploaded to cloud ✓" : "Tap to upload"}
              </Text>
            </View>
            {doc.uploading ? (
              <ActivityIndicator color="#32FF7E" size="small" />
            ) : (
              <Feather name="chevron-right" size={18} color={doc.cloudUrl ? "#32FF7E" : colors.mutedForeground} />
            )}
          </TouchableOpacity>
        ))}

        <View style={[styles.notice, { backgroundColor: colors.card }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            Documents are encrypted and securely stored on Cloudinary. Only used for driver verification.
          </Text>
        </View>

        <NeonButton
          title={
            anyUploading
              ? "Uploading…"
              : allDone
              ? t("next")
              : `Upload ${docs.filter((d) => !d.cloudUrl).length} more document(s)`
          }
          onPress={handleNext}
          disabled={!allDone || anyUploading}
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
  form: { gap: 14, paddingBottom: 40 },
  uploadCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
    backgroundColor: "#141414", borderRadius: 16, borderWidth: 1.5, borderColor: "#252525",
  },
  uploadCardDone: { borderColor: "#32FF7E44" },
  previewThumb: { width: 52, height: 52, borderRadius: 10 },
  uploadIcon: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: "#1E1E1E",
    alignItems: "center", justifyContent: "center",
  },
  uploadInfo: { flex: 1, gap: 2 },
  uploadLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  uploadHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  uploadStatus: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  notice: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 14, backgroundColor: "#141414", borderRadius: 12 },
  noticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: "#555", lineHeight: 18 },
  btn: { marginTop: 4 },
});
