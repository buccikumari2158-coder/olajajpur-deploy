import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  useGetCurrentRide,
  useCreatePaymentOrder,
  useVerifyPayment,
  useGetWalletBalance,
} from "@workspace/api-client-react";
import { useRide } from "@/contexts/RideContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { NeonButton } from "@/components/NeonButton";
import { buildRazorpayHtml, openRazorpayWeb, type RazorpayMessage } from "@/lib/razorpay";
import { useColors } from "@/hooks/useColors";

const PAYMENT_OPTIONS = [
  { id: "cash" as const, icon: "dollar-sign", label: "Cash", desc: "Pay in cash to driver" },
  { id: "wallet" as const, icon: "credit-card", label: "Wallet", desc: "Pay from Jajpur Jatri Wallet" },
  { id: "online" as const, icon: "smartphone", label: "Online", desc: "UPI / Card / Net Banking" },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const colors = useColors();
  const { paymentMethod, setPaymentMethod, clearRide, currentRideId } = useRide();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState("");

  const { data: rideData } = useGetCurrentRide();
  const { data: walletData } = useGetWalletBalance();
  const ride = rideData?.ride;
  const fare = ride?.fare ?? 0;
  const walletBalance = walletData?.balance ?? 0;

  const { mutateAsync: createOrder } = useCreatePaymentOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  async function handlePayment() {
    if (paymentMethod === "cash") {
      clearRide();
      router.replace("/ride/complete");
      return;
    }

    if (paymentMethod === "wallet") {
      if (walletBalance < fare) {
        Alert.alert(
          "Insufficient Balance",
          `Your wallet balance ₹${walletBalance} is less than the fare ₹${fare}. Please add money or choose another payment method.`
        );
        return;
      }
      clearRide();
      router.replace("/ride/complete");
      return;
    }

    if (paymentMethod === "online") {
      setLoading(true);
      try {
        const order = await createOrder({
          data: { amount: fare, rideId: currentRideId ?? undefined },
        });
        const rzpOpts = {
          keyId: order.keyId,
          orderId: order.orderId,
          amountPaise: Math.round(fare * 100),
          name: user?.name ?? "Jajpur Jatri Passenger",
          phone: user?.phone ?? "",
          description: "Ride Payment",
        };

        if (Platform.OS === "web") {
          setLoading(false);
          const result = await openRazorpayWeb(rzpOpts);
          await applyRazorpayResult(result);
        } else {
          setRazorpayHtml(buildRazorpayHtml(rzpOpts));
          setShowRazorpay(true);
        }
      } catch {
        Alert.alert("Payment Error", "Could not initialize payment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function applyRazorpayResult(data: RazorpayMessage) {
    if (data.type === "dismissed") return;
    if (data.type === "failed") {
      Alert.alert("Payment Failed", data.description ?? "Payment was not completed. Try again.");
      return;
    }
    setLoading(true);
    try {
      await verifyPayment({
        data: {
          orderId: data.orderId,
          paymentId: data.paymentId,
          signature: data.signature,
          rideId: currentRideId ?? undefined,
          amount: fare,
        },
      });
      clearRide();
      router.replace("/ride/complete");
    } catch {
      Alert.alert("Verification Failed", "Payment received but verification failed. Contact support.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRazorpayMessage(event: { nativeEvent: { data: string } }) {
    let data: RazorpayMessage;
    try {
      data = JSON.parse(event.nativeEvent.data) as RazorpayMessage;
    } catch {
      setShowRazorpay(false);
      return;
    }
    setShowRazorpay(false);
    await applyRazorpayResult(data);
  }

  if (showRazorpay) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.webViewHeader, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowRazorpay(false)} style={[styles.webViewBack, { backgroundColor: colors.muted }]}>
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.webViewTitle, { color: colors.text }]}>Secure Payment · ₹{fare}</Text>
        </View>
        <WebView
          source={{ html: razorpayHtml }}
          onMessage={handleRazorpayMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.webViewLoading, { backgroundColor: colors.background }]}>
              <ActivityIndicator color="#32FF7E" size="large" />
              <Text style={[styles.webViewLoadingText, { color: colors.mutedForeground }]}>Loading payment…</Text>
            </View>
          )}
          style={{ flex: 1, backgroundColor: colors.background }}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("payment")}</Text>

      {/* Fare display */}
      <View style={[styles.fareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.fareLabel, { color: colors.mutedForeground }]}>{t("totalFare")}</Text>
        <Text style={styles.fareAmount}>₹{fare}</Text>
        <View style={styles.fareDetails}>
          <View style={styles.fareRow}>
            <Text style={[styles.fareItemLabel, { color: colors.mutedForeground }]}>Distance</Text>
            <Text style={[styles.fareItemValue, { color: colors.text }]}>{ride?.distance ?? "—"} km</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareItemLabel, { color: colors.mutedForeground }]}>Vehicle</Text>
            <Text style={[styles.fareItemValue, { color: colors.text }]}>{(ride?.vehicleType ?? "Auto").toUpperCase()}</Text>
          </View>
          <View style={[styles.fareDivider, { backgroundColor: colors.border }]} />
          <View style={styles.fareRow}>
            <Text style={[styles.fareItemLabel, { color: colors.mutedForeground }]}>From</Text>
            <Text style={[styles.fareItemValue, { color: colors.text }]} numberOfLines={1}>{ride?.pickupAddress ?? "—"}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={[styles.fareItemLabel, { color: colors.mutedForeground }]}>To</Text>
            <Text style={[styles.fareItemValue, { color: colors.text }]} numberOfLines={1}>{ride?.dropAddress ?? "—"}</Text>
          </View>
        </View>
      </View>

      {/* Payment method */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Payment Method</Text>
      <View style={styles.paymentList}>
        {PAYMENT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => setPaymentMethod(opt.id)}
            style={[
              styles.paymentCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              paymentMethod === opt.id && styles.paymentCardActive,
            ]}
            activeOpacity={0.8}
          >
            <View style={[styles.paymentIcon, { backgroundColor: colors.muted }, paymentMethod === opt.id && { backgroundColor: "#32FF7E" }]}>
              <Feather name={opt.icon as never} size={20} color={paymentMethod === opt.id ? "#000" : colors.mutedForeground} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>{opt.label}</Text>
              <Text style={[styles.paymentDesc, { color: colors.mutedForeground }]}>
                {opt.id === "wallet" ? `Balance: ₹${walletBalance}` : opt.desc}
              </Text>
            </View>
            {paymentMethod === opt.id && (
              <View style={styles.checkmark}>
                <Feather name="check" size={14} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <NeonButton
        title={
          paymentMethod === "cash"
            ? `Pay Cash · ₹${fare}`
            : paymentMethod === "wallet"
            ? `Pay from Wallet · ₹${fare}`
            : `Pay Online · ₹${fare}`
        }
        onPress={handlePayment}
        loading={loading}
        style={styles.payBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 24, gap: 18 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#FFF", paddingTop: 4 },
  fareCard: {
    backgroundColor: "#141414", borderRadius: 24, padding: 20,
    alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#252525",
  },
  fareLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  fareAmount: { fontSize: 48, fontFamily: "Inter_700Bold", color: "#32FF7E", letterSpacing: -1 },
  fareDetails: { width: "100%", gap: 8, marginTop: 4 },
  fareRow: { flexDirection: "row", justifyContent: "space-between" },
  fareItemLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#666" },
  fareItemValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFF", maxWidth: "55%", textAlign: "right" },
  fareDivider: { height: 1, backgroundColor: "#252525" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#FFF" },
  paymentList: { gap: 10 },
  paymentCard: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    backgroundColor: "#141414", borderRadius: 16, borderWidth: 1.5, borderColor: "#252525",
  },
  paymentCardActive: { borderColor: "#32FF7E", backgroundColor: "#32FF7E08" },
  paymentIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#1E1E1E",
    alignItems: "center", justifyContent: "center",
  },
  paymentInfo: { flex: 1, gap: 2 },
  paymentLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  paymentDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  checkmark: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: "#32FF7E",
    alignItems: "center", justifyContent: "center",
  },
  payBtn: { marginTop: "auto", marginBottom: 24 },
  webViewHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#141414", paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#252525",
  },
  webViewBack: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#1E1E1E",
    alignItems: "center", justifyContent: "center",
  },
  webViewTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  webViewLoading: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#0A0A0A",
  },
  webViewLoadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
});
