import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { signInWithPhoneNumber, RecaptchaVerifier, type ApplicationVerifier } from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { firebaseAuth, firebaseConfig, isFirebaseConfigured } from "@/lib/firebase";
import {
  getConfirmationResult,
  setConfirmationResult,
  clearConfirmationResult,
} from "@/lib/firebaseConfirmation";
import { useFirebaseLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useColors } from "@/hooks/useColors";
import { OTPInput } from "@/components/OTPInput";
import { NeonButton } from "@/components/NeonButton";
import { usePublicSettings } from "@/hooks/usePublicSettings";

function mapOtpError(err: unknown): string {
  if (!(err instanceof Error)) return "Verification failed. Please try again.";
  const code = (err as { code?: string }).code ?? "";
  console.error("[OTP] Verification error code:", code, "| message:", err.message);
  if (code === "auth/invalid-verification-code") return "Wrong OTP — double-check the code and try again.";
  if (code === "auth/code-expired") return "OTP expired — go back and request a new one.";
  if (code === "auth/session-expired") return "Session expired — go back and request a new OTP.";
  if (code === "auth/too-many-requests") return "Too many attempts — please wait a few minutes.";
  if (code === "auth/network-request-failed") return "Network error — check your connection and try again.";
  if (err.message.includes("Invalid or expired Firebase token")) {
    return "Session expired — go back and request a new OTP.";
  }
  if (err.message.includes("Auth not configured") || err.message.includes("FIREBASE_WEB_API_KEY")) {
    return "Server not configured for Firebase — add FIREBASE_WEB_API_KEY or EXPO_PUBLIC_FIREBASE_API_KEY to server secrets.";
  }
  return err.message || "Verification failed. Please try again.";
}

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { login } = useAuth();
  const colors = useColors();
  const { data: settings } = usePublicSettings();
  const params = useLocalSearchParams<{ phone: string; role: string }>();
  const phone = params.phone || "";
  const role = (params.role || "passenger") as "passenger" | "driver";

  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const webVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || !configured) return;
    const auth = firebaseAuth;
    if (!auth) return;
    try {
      webVerifierRef.current = new RecaptchaVerifier(auth, "otp-recaptcha-container", {
        size: "invisible",
      });
      console.log("[Firebase] OTP screen web RecaptchaVerifier ready (for resend)");
    } catch (e) {
      console.error("[Firebase] OTP screen failed to create web RecaptchaVerifier:", e);
    }
    return () => {
      if (webVerifierRef.current) {
        try { webVerifierRef.current.clear(); } catch { /* ignore */ }
        webVerifierRef.current = null;
      }
    };
  }, [configured]);

  function startTimer() {
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  const { mutateAsync: firebaseLogin } = useFirebaseLogin();

  async function handleVerify() {
    if (otp.length !== 6) return;
    setError(null);
    setInfo(null);

    const confirmation = getConfirmationResult();
    if (!confirmation) {
      setError("Session expired — go back and request a new OTP.");
      return;
    }

    setIsVerifying(true);
    console.log("[OTP] Verifying code:", otp, "for phone:", phone);
    try {
      const credential = await confirmation.confirm(otp);
      console.log("[OTP] Firebase confirmed OTP ✓ — UID:", credential.user.uid);

      const idToken = await credential.user.getIdToken();
      console.log("[OTP] Got Firebase ID token ✓ (length:", idToken.length, ")");

      console.log("[OTP] Calling /auth/firebase-login with role:", role);
      const data = await firebaseLogin({ data: { idToken, role } });
      console.log("[OTP] Backend JWT received ✓ — user id:", data.user.id, "| role:", data.user.role);

      await login(data.token, {
        id: data.user.id,
        phone: data.user.phone,
        name: data.user.name ?? undefined,
        email: data.user.email ?? undefined,
        photo: data.user.photo ?? undefined,
        role: data.user.role as "passenger" | "driver",
        walletBalance: data.user.walletBalance ?? 0,
        isDriver: data.user.isDriver ?? false,
        driverStatus: data.user.driverStatus ?? undefined,
      });

      clearConfirmationResult();
      setInfo("Logged in! Redirecting...");
      console.log(
        "[OTP] Login complete — driverStatus:", data.user.driverStatus,
        "| isDriver:", data.user.isDriver
      );

      if (!data.user.name || data.user.name.trim().length < 2) {
        router.replace("/(auth)/profile-setup");
        return;
      }

      if (role === "driver" || data.user.isDriver) {
        if (data.user.driverStatus === "pending") {
          router.replace("/(driver)/pending");
        } else if (data.user.driverStatus === "approved") {
          router.replace("/(driver)/dashboard");
        } else if (data.user.driverStatus === "rejected") {
          router.replace("/(driver)/rejected");
        } else {
          router.replace("/(driver)/intro");
        }
      } else {
        router.replace("/(passenger)/home");
      }
    } catch (err: unknown) {
      setError(mapOtpError(err));
      setOtp("");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || isResending || !firebaseAuth) return;
    setError(null);
    setInfo(null);
    setIsResending(true);
    console.log("[OTP] Resending OTP to", phone);
    try {
      let verifier: ApplicationVerifier;
      if (Platform.OS === "web") {
        if (!webVerifierRef.current) {
          webVerifierRef.current = new RecaptchaVerifier(firebaseAuth, "otp-recaptcha-container", {
            size: "invisible",
          });
        }
        verifier = webVerifierRef.current;
      } else {
        const nativeVerifier = recaptchaRef.current;
        if (!nativeVerifier) throw new Error("reCAPTCHA not ready — please try again.");
        verifier = nativeVerifier as unknown as ApplicationVerifier;
      }
      const confirmation = await signInWithPhoneNumber(firebaseAuth, phone, verifier);
      setConfirmationResult(confirmation);
      setOtp("");
      startTimer();
      setInfo(`New OTP sent to ${phone}`);
      console.log("[OTP] Resend successful ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? mapOtpError(err) : "Failed to resend OTP.";
      setError(msg);
      if (Platform.OS === "web" && webVerifierRef.current) {
        try { webVerifierRef.current.clear(); } catch { /* ignore */ }
        webVerifierRef.current = null;
      }
    } finally {
      setIsResending(false);
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

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom + 20, Platform.OS === "web" ? 54 : 20),
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

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name="shield" size={40} color="#32FF7E" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{t("enterOtp")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t("otpDesc")}
            {"\n"}
            <Text style={styles.phone}>{phone}</Text>
          </Text>

          <View style={styles.otpWrapper}>
            <OTPInput
              length={6}
              value={otp}
              onChange={(v) => { setOtp(v); setError(null); }}
              onComplete={handleVerify}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#FF4757" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {info ? (
            <View style={styles.infoBox}>
              <Feather name="check-circle" size={14} color="#32FF7E" />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          <NeonButton
            title={t("verifyOtp")}
            onPress={handleVerify}
            loading={isVerifying}
            disabled={otp.length !== 6 || isVerifying}
          />

          <TouchableOpacity
            onPress={() => {
              const url = settings?.termsUrl;
              if (!url) {
                setInfo("Terms & Conditions not configured yet. Please contact support.");
                return;
              }
              Linking.openURL(url);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: colors.mutedForeground }]}>
                Resend OTP in{" "}
                <Text style={styles.countdownNum}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                <Text style={[styles.resendText, isResending && { opacity: 0.5 }]}>
                  {isResending ? "Sending..." : t("resendOtp")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {Platform.OS === "web" && (
        <View nativeID="otp-recaptcha-container" style={styles.recaptchaAnchor} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    marginBottom: 20,
  },
  content: { flex: 1, alignItems: "center", gap: 20, paddingTop: 12 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#32FF7E18",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#32FF7E44",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  phone: { color: "#32FF7E", fontFamily: "Inter_600SemiBold" },
  otpWrapper: { width: "100%", alignItems: "center", paddingVertical: 8 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FF475715",
    borderWidth: 1,
    borderColor: "#FF475740",
    borderRadius: 10,
    padding: 12,
    width: "100%",
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
    width: "100%",
  },
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
  resendRow: { marginTop: 4 },
  countdownText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  countdownNum: { color: "#32FF7E", fontFamily: "Inter_600SemiBold" },
  resendText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  recaptchaAnchor: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 1,
    height: 1,
    overflow: "hidden",
  },
  termsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#32FF7E",
  },
});
