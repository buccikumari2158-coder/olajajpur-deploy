import React, { useRef, useState, useEffect } from "react";
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
import { Feather } from        "@expo/vector-icons";
import { signInWithPhoneNumber, RecaptchaVerifier, type ApplicationVerifier } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { firebaseAuth, firebaseConfig, isFirebaseConfigured } from "@/lib/firebase";
import { setConfirmationResult } from "@/lib/firebaseConfirmation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { DarkInput } from "@/components/DarkInput";
import { NeonButton } from "@/components/NeonButton";

function mapFirebaseError(err: unknown): string {
  if (!(err instanceof Error)) return "Failed to send OTP. Please try again.";
  const code = (err as { code?: string }).code ?? "";
  console.error("[OTP] Firebase error code:", code, "| message:", err.message);
  if (code === "auth/invalid-phone-number") return "Invalid phone number. Use a valid 10-digit Indian number.";
  if (code === "auth/too-many-requests") return "Too many requests — please wait a few minutes and try again.";
  if (code === "auth/quota-exceeded") return "SMS quota exceeded. Please try again later.";
  if (code === "auth/network-request-failed") return "Network error. Check your internet connection.";
  if (code === "auth/app-not-authorized") return "This app is not authorized for Firebase Phone Auth. Check your Firebase console.";
  if (code === "auth/missing-app-credential") return "reCAPTCHA not ready — please wait a moment and try again.";
  if (code === "auth/captcha-check-failed") return "reCAPTCHA failed — please try again.";
  if (code === "auth/web-storage-unsupported") return "Browser storage is blocked — enable cookies and try again.";
  if (code === "auth/internal-error") return "Firebase internal error. Check that Phone Auth is enabled in the Firebase Console.";
  return err.message || "Failed to send OTP. Please try again.";
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const webVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (Platform.OS !== "web" || !configured) return;
    const auth = firebaseAuth;
    if (!auth) return;

    console.log("[Firebase] Initializing web RecaptchaVerifier (invisible)...");
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("[Firebase] reCAPTCHA solved automatically");
        },
        "expired-callback": () => {
          console.warn("[Firebase] reCAPTCHA token expired — will recreate on next attempt");
          webVerifierRef.current = null;
        },
      });
      webVerifierRef.current = verifier;
      console.log("[Firebase] Web RecaptchaVerifier ready");
    } catch (e) {
      console.error("[Firebase] Failed to create web RecaptchaVerifier:", e);
    }

    return () => {
      if (webVerifierRef.current) {
        try { webVerifierRef.current.clear(); } catch { /* ignore */ }
        webVerifierRef.current = null;
      }
    };
  }, [configured]);

  async function handleSendOtp() {
    setError(null);
    setInfo(null);

    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!configured || !firebaseAuth) {
      setError(
        "Firebase is not configured yet. Add the EXPO_PUBLIC_FIREBASE_* secrets in the Replit Secrets panel, then restart the Expo workflow."
      );
      return;
    }

    setLoading(true);
    const fullPhone = `+91${phone}`;
    console.log("[OTP] Initiating phone auth for", fullPhone, "| platform:", Platform.OS);

    try {
      let verifier: ApplicationVerifier;

      if (Platform.OS === "web") {
        if (!webVerifierRef.current) {
          console.log("[Firebase] Recreating web RecaptchaVerifier...");
          webVerifierRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
            size: "invisible",
          });
        }
        verifier = webVerifierRef.current;
        console.log("[Firebase] Using DOM RecaptchaVerifier for web");
      } else {
        const nativeVerifier = recaptchaRef.current;
        if (!nativeVerifier) {
          setError("reCAPTCHA widget not ready — please wait a moment and try again.");
          setLoading(false);
          return;
        }
        verifier = nativeVerifier as unknown as ApplicationVerifier;
        console.log("[Firebase] Using native FirebaseRecaptchaVerifierModal");
      }

      console.log("[Firebase] Calling signInWithPhoneNumber...");
      const confirmation = await signInWithPhoneNumber(firebaseAuth, fullPhone, verifier);
      console.log("[OTP] OTP dispatched successfully ✓ — navigating to OTP screen");

      setConfirmationResult(confirmation);
      setInfo("OTP sent! Check your SMS.");

      setTimeout(() => {
        router.push({ pathname: "/(auth)/otp", params: { phone: fullPhone, role } });
      }, 600);
    } catch (err: unknown) {
      const msg = mapFirebaseError(err);
      setError(msg);
      if (Platform.OS === "web" && webVerifierRef.current) {
        try { webVerifierRef.current.clear(); } catch { /* ignore */ }
        webVerifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {Platform.OS !== "web" && configured && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaRef}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification
          title="Verify you're human"
          cancelLabel="Cancel"
        />
      )}

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom + 20, Platform.OS === "web" ? 54 : 20),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>JAJPUR JATRI</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t("login")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t("loginDesc")}</Text>

          {!configured && (
            <View style={styles.warningBanner}>
              <Feather name="alert-triangle" size={15} color="#FF6B35" />
              <Text style={styles.warningText}>
                Firebase not configured. Add{" "}
                <Text style={styles.warningCode}>EXPO_PUBLIC_FIREBASE_API_KEY</Text>
                {" "}and the other Firebase secrets in the Replit Secrets panel, then restart the Expo workflow.
              </Text>
            </View>
          )}

          <View style={styles.roleSelector}>
            {(["passenger", "driver"] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[
                  styles.roleBtn,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                  role === r && styles.roleBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Feather
                  name={r === "passenger" ? "user" : "truck"}
                  size={16}
                  color={role === r ? "#000" : colors.mutedForeground}
                />
                <Text style={[styles.roleText, { color: colors.mutedForeground }, role === r && styles.roleTextActive]}>
                  {r === "passenger" ? "Passenger" : "Driver"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DarkInput
            label={t("phoneNumber")}
            prefix="+91"
            value={phone}
            onChangeText={(v) => {
              setError(null);
              setInfo(null);
              setPhone(v.replace(/[^0-9]/g, "").slice(0, 10));
            }}
            keyboardType="phone-pad"
            placeholder="Enter 10-digit number"
            icon={<Feather name="phone" size={18} color={colors.mutedForeground} />}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#FF4757" style={styles.msgIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {info ? (
            <View style={styles.infoBox}>
              <Feather name="check-circle" size={14} color="#32FF7E" style={styles.msgIcon} />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          <NeonButton
            title={t("sendOtp")}
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length !== 10 || loading}
            style={styles.btnTop}
          />

          <View style={styles.terms}>
            <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {Platform.OS === "web" && (
        <View nativeID="recaptcha-container" style={styles.recaptchaAnchor} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 32 },
  header: { alignItems: "center", gap: 8, paddingTop: 20 },
  logo: { width: 90, height: 90 },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    gap: 18,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FF6B3515",
    borderWidth: 1,
    borderColor: "#FF6B3540",
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#FF6B35",
    lineHeight: 18,
  },
  warningCode: {
    fontFamily: "Inter_600SemiBold",
  },
  roleSelector: { flexDirection: "row", gap: 12 },
  roleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  roleBtnActive: { backgroundColor: "#32FF7E", borderColor: "#32FF7E" },
  roleText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  roleTextActive: { color: "#000000" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FF475715",
    borderWidth: 1,
    borderColor: "#FF475740",
    borderRadius: 10,
    padding: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#32FF7E15",
    borderWidth: 1,
    borderColor: "#32FF7E40",
    borderRadius: 10,
    padding: 12,
  },
  msgIcon: { marginTop: 1 },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#FF4757",
    lineHeight: 19,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#32FF7E",
  },
  btnTop: { marginTop: 4 },
  terms: { alignItems: "center" },
  termsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  termsLink: { color: "#32FF7E" },
  recaptchaAnchor: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 1,
    height: 1,
    overflow: "hidden",
  },
});
