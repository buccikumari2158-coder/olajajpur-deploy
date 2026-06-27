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
import { useRegisterDriver } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NeonButton } from "@/components/NeonButton";
import { uploadImage } from "@/lib/uploadImage";
import { useColors } from "@/hooks/useColors";

interface PhotoSlot {
  uri: string | null;
  cloudUrl: string | null;
  uploading: boolean;
}

export default function Step4Screen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { updateUser, token } = useAuth();
  const colors = useColors();

  const [selfie, setSelfie] = useState<PhotoSlot>({ uri: null, cloudUrl: null, uploading: false });
  const [vehiclePhoto, setVehiclePhoto] = useState<PhotoSlot>({ uri: null, cloudUrl: null, uploading: false });
  const [agreed, setAgreed] = useState(false);

  const { mutate: registerDriver, isPending: registering } = useRegisterDriver({
    mutation: {
      onSuccess: () => {
        updateUser({ isDriver: true, driverStatus: "pending" });
        AsyncStorage.multiRemove(["driver_reg_step1", "driver_reg_step2", "driver_reg_step3"]);
        router.replace("/(driver)/pending");
      },
      onError: (err: { message?: string }) => {
        Alert.alert("Registration Failed", err?.message || "Something went wrong. Try again.");
      },
    },
  });

  async function pickAndUpload(type: "selfie" | "vehicle") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Allow photo access to upload photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;

    const setter = type === "selfie" ? setSelfie : setVehiclePhoto;
    setter({ uri, cloudUrl: null, uploading: true });

    try {
      const folder = type === "selfie" ? "photos" : "vehicles";
      const url = await uploadImage(uri, folder, token ?? "");
      setter({ uri, cloudUrl: url, uploading: false });
    } catch (err) {
      setter({ uri: null, cloudUrl: null, uploading: false });
      const msg = err instanceof Error ? err.message : "Upload failed";
      Alert.alert("Upload Failed", msg);
    }
  }

  async function handleSubmit() {
    if (!agreed) {
      Alert.alert("Terms Required", "Please agree to the terms and conditions");
      return;
    }
    if (!selfie.cloudUrl || !vehiclePhoto.cloudUrl) {
      Alert.alert("Photos Required", "Please upload both your selfie and vehicle photo");
      return;
    }

    const [step1Raw, step2Raw, step3Raw] = await Promise.all([
      AsyncStorage.getItem("driver_reg_step1"),
      AsyncStorage.getItem("driver_reg_step2"),
      AsyncStorage.getItem("driver_reg_step3"),
    ]);

    const step1 = JSON.parse(step1Raw || "{}") as Record<string, string>;
    const step2 = JSON.parse(step2Raw || "{}") as Record<string, string>;
    const step3 = JSON.parse(step3Raw || "{}") as Record<string, string>;

    registerDriver({
      data: {
        fullName: step1["fullName"] ?? "",
        email: step1["email"],
        address: step1["address"],
        vehicleType: step2["vehicleType"] ?? "auto",
        vehicleNumber: step2["vehicleNumber"] ?? "",
        vehicleModel: step2["vehicleModel"] ?? "",
        aadhaarUrl: step3["aadhaarUrl"],
        licenseUrl: step3["licenseUrl"],
        vehicleRcUrl: step3["vehicleRcUrl"],
        vehiclePhotoUrl: vehiclePhoto.cloudUrl ?? undefined,
        driverPhotoUrl: selfie.cloudUrl ?? undefined,
      },
    });
  }

  const anyUploading = selfie.uploading || vehiclePhoto.uploading;

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="arrow-left" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={[styles.progressStep, { backgroundColor: colors.border }, s <= 4 && styles.progressDone]} />
        ))}
      </View>

      <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>Step 4 of 4</Text>
      <Text style={[styles.title, { color: colors.text }]}>Photos</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Upload your selfie and vehicle photo</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {/* Selfie */}
        <TouchableOpacity
          style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }, selfie.cloudUrl && styles.photoCardDone]}
          onPress={() => !selfie.uploading && pickAndUpload("selfie")}
          activeOpacity={0.8}
        >
          {selfie.uri ? (
            <Image source={{ uri: selfie.uri }} style={styles.previewThumb} />
          ) : (
            <View style={[styles.photoBox, { backgroundColor: colors.muted }, selfie.cloudUrl && { backgroundColor: "#32FF7E22" }]}>
              <Feather name={selfie.cloudUrl ? "check" : "camera"} size={28} color={selfie.cloudUrl ? "#32FF7E" : colors.mutedForeground} />
            </View>
          )}
          <View style={styles.photoInfo}>
            <Text style={[styles.photoLabel, { color: colors.text }]}>{t("uploadPhoto")}</Text>
            <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>Clear front-facing selfie</Text>
            <Text style={[styles.photoStatus, { color: colors.mutedForeground }, selfie.cloudUrl && { color: "#32FF7E" }]}>
              {selfie.uploading ? "Uploading…" : selfie.cloudUrl ? "Uploaded ✓" : "Tap to upload"}
            </Text>
          </View>
          {selfie.uploading
            ? <ActivityIndicator color="#32FF7E" size="small" />
            : <Feather name="chevron-right" size={18} color={selfie.cloudUrl ? "#32FF7E" : colors.mutedForeground} />
          }
        </TouchableOpacity>

        {/* Vehicle photo */}
        <TouchableOpacity
          style={[styles.photoCard, { backgroundColor: colors.card, borderColor: colors.border }, vehiclePhoto.cloudUrl && styles.photoCardDone]}
          onPress={() => !vehiclePhoto.uploading && pickAndUpload("vehicle")}
          activeOpacity={0.8}
        >
          {vehiclePhoto.uri ? (
            <Image source={{ uri: vehiclePhoto.uri }} style={styles.previewThumb} />
          ) : (
            <View style={[styles.photoBox, { backgroundColor: colors.muted }, vehiclePhoto.cloudUrl && { backgroundColor: "#32FF7E22" }]}>
              <Feather name={vehiclePhoto.cloudUrl ? "check" : "truck"} size={28} color={vehiclePhoto.cloudUrl ? "#32FF7E" : colors.mutedForeground} />
            </View>
          )}
          <View style={styles.photoInfo}>
            <Text style={[styles.photoLabel, { color: colors.text }]}>{t("uploadVehiclePhoto")}</Text>
            <Text style={[styles.photoSub, { color: colors.mutedForeground }]}>Full view of your vehicle</Text>
            <Text style={[styles.photoStatus, { color: colors.mutedForeground }, vehiclePhoto.cloudUrl && { color: "#32FF7E" }]}>
              {vehiclePhoto.uploading ? "Uploading…" : vehiclePhoto.cloudUrl ? "Uploaded ✓" : "Tap to upload"}
            </Text>
          </View>
          {vehiclePhoto.uploading
            ? <ActivityIndicator color="#32FF7E" size="small" />
            : <Feather name="chevron-right" size={18} color={vehiclePhoto.cloudUrl ? "#32FF7E" : colors.mutedForeground} />
          }
        </TouchableOpacity>

        {/* Terms */}
        <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
          <View style={[styles.checkbox, { borderColor: colors.border }, agreed && styles.checkboxDone]}>
            {agreed && <Feather name="check" size={12} color="#000" />}
          </View>
          <Text style={[styles.termsText, { color: colors.mutedForeground }]}>{t("termsAgree")}</Text>
        </TouchableOpacity>

        <NeonButton
          title={
            anyUploading
              ? "Uploading photos…"
              : registering
              ? "Submitting…"
              : t("submitApplication")
          }
          onPress={handleSubmit}
          loading={registering || anyUploading}
          disabled={!agreed || !selfie.cloudUrl || !vehiclePhoto.cloudUrl || anyUploading}
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
  progressDone: { backgroundColor: "#32FF7E" },
  stepLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#888" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF", marginTop: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888", marginBottom: 8 },
  form: { gap: 16, paddingBottom: 40 },
  photoCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
    backgroundColor: "#141414", borderRadius: 16, borderWidth: 1.5, borderColor: "#252525",
  },
  photoCardDone: { borderColor: "#32FF7E44" },
  previewThumb: { width: 60, height: 60, borderRadius: 12 },
  photoBox: {
    width: 60, height: 60, borderRadius: 16, backgroundColor: "#1E1E1E",
    alignItems: "center", justifyContent: "center",
  },
  photoInfo: { flex: 1, gap: 2 },
  photoLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  photoSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555" },
  photoStatus: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#888" },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 4 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: "#444",
    alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#32FF7E", borderColor: "#32FF7E" },
  termsText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
  btn: { marginTop: 4 },
});
