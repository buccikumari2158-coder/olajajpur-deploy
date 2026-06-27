import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWalletBalance,
  useGetWalletTransactions,
  useCreatePaymentOrder,
  useVerifyPayment,
  getGetWalletBalanceQueryKey,
  getGetWalletTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { buildRazorpayHtml, openRazorpayWeb, type RazorpayMessage } from "@/lib/razorpay";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useColors } from "@/hooks/useColors";

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const colors = useColors();

  const { data: balance } = useGetWalletBalance({
    query: { queryKey: getGetWalletBalanceQueryKey() },
  });
  const { data: txData } = useGetWalletTransactions({
    query: { queryKey: getGetWalletTransactionsQueryKey() },
  });

  const { mutateAsync: createOrder } = useCreatePaymentOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState("");
  const [pendingAmount, setPendingAmount] = useState(0);

  const transactions = txData?.transactions ?? [];

  async function handleRazorpayResult(data: RazorpayMessage, amount: number) {
    if (data.type === "dismissed") return;
    if (data.type === "failed") {
      setError(data.description ?? "Payment was not completed. Try again.");
      return;
    }
    setLoading(true);
    try {
      await verifyPayment({
        data: {
          orderId: data.orderId,
          paymentId: data.paymentId,
          signature: data.signature,
          amount,
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetWalletBalanceQueryKey() }),
        qc.invalidateQueries({ queryKey: getGetWalletTransactionsQueryKey() }),
      ]);
      setSuccess(`₹${amount} added to your wallet.`);
      setCustomAmount("");
      setPendingAmount(0);
    } catch {
      setError(
        "Payment received but verification failed. We've logged this — contact support with your transaction ID."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startTopUp(amount: number) {
    if (amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (amount > 10000) {
      setError("Maximum top-up is ₹10,000 per transaction");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const order = await createOrder({ data: { amount } });
      const rzpOpts = {
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: Math.round(amount * 100),
        name: user?.name ?? "Jajpur Jatri User",
        phone: user?.phone ?? "",
        description: "Wallet Top-up",
      };
      setPendingAmount(amount);

      if (Platform.OS === "web") {
        setLoading(false);
        const result = await openRazorpayWeb(rzpOpts);
        await handleRazorpayResult(result, amount);
      } else {
        setRazorpayHtml(buildRazorpayHtml(rzpOpts));
        setShowRazorpay(true);
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes("503")
          ? "Payments are not configured yet. Please contact support."
          : "Could not start payment. Please try again.";
      setError(msg);
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
    await handleRazorpayResult(data, pendingAmount);
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (showRazorpay) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.webViewHeader, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setShowRazorpay(false)}
            style={[styles.webViewBack, { backgroundColor: colors.muted }]}
          >
            <Feather name="x" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.webViewTitle, { color: colors.text }]}>Secure Top-up · ₹{pendingAmount}</Text>
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
              <Text style={[styles.webViewLoadingText, { color: colors.mutedForeground }]}>Loading Razorpay…</Text>
            </View>
          )}
          style={{ flex: 1, backgroundColor: colors.background }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t("walletTitle")}</Text>

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.balanceGlow} />
        <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>{t("walletTitle")}</Text>
        <Text style={styles.balanceAmount}>
          ₹{balance?.balance?.toFixed(2) ?? "0.00"}
        </Text>
        <Text style={[styles.balanceCurrency, { color: colors.mutedForeground }]}>Indian Rupee</Text>
      </View>

      {/* Add money */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("addMoney")}</Text>

      {error ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={14} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.amountGrid}>
        {QUICK_AMOUNTS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[styles.amountBtn, { backgroundColor: colors.muted, borderColor: "#32FF7E44" }]}
            onPress={() => startTopUp(amount)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.amountText}>+₹{amount}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom amount */}
      <View style={styles.customRow}>
        <View style={[styles.customInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.customCurrency, { color: colors.mutedForeground }]}>₹</Text>
          <TextInput
            value={customAmount}
            onChangeText={(v) => {
              const cleaned = v.replace(/[^0-9]/g, "");
              setCustomAmount(cleaned);
            }}
            placeholder="Other amount"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            style={[styles.customInput, { color: colors.text }]}
            editable={!loading}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.customAddBtn,
            (!customAmount || loading) && { opacity: 0.4 },
          ]}
          onPress={() => startTopUp(parseInt(customAmount || "0", 10))}
          disabled={!customAmount || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.customAddText}>Pay</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("recentTransactions")}</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!transactions.length}
        contentContainerStyle={styles.txList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("noTransactions")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View
              style={[
                styles.txIcon,
                {
                  backgroundColor:
                    item.type === "credit" ? "#32FF7E18" : "#FF444418",
                },
              ]}
            >
              <Feather
                name={
                  item.type === "credit" ? "arrow-down-left" : "arrow-up-right"
                }
                size={18}
                color={item.type === "credit" ? "#32FF7E" : "#FF4444"}
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={[styles.txDesc, { color: colors.text }]}>{item.description}</Text>
              <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{formatDate(item.createdAt ?? "")}</Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                { color: item.type === "credit" ? "#32FF7E" : "#FF4444" },
              ]}
            >
              {item.type === "credit" ? "+" : "-"}₹{item.amount}
            </Text>
          </View>
        )}
      />

      <ConfirmModal
        visible={!!success}
        title="Wallet updated"
        message={success ?? ""}
        confirmLabel="Done"
        icon="check-circle"
        onCancel={() => setSuccess(null)}
        onConfirm={() => setSuccess(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", paddingHorizontal: 20 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
    paddingVertical: 20,
  },
  balanceCard: {
    backgroundColor: "#141414",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#252525",
    overflow: "hidden",
    position: "relative",
  },
  balanceGlow: {
    position: "absolute",
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#32FF7E",
    opacity: 0.04,
  },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#888" },
  balanceAmount: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: "#32FF7E",
    letterSpacing: 1,
  },
  balanceCurrency: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#555" },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFF",
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF6B6B18",
    borderColor: "#FF6B6B44",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#FF6B6B", fontSize: 13, flex: 1, fontFamily: "Inter_500Medium" },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  amountBtn: {
    flex: 1,
    minWidth: "22%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#32FF7E44",
  },
  amountText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  customRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  customInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#252525",
  },
  customCurrency: { color: "#888", fontSize: 15, marginRight: 6, fontFamily: "Inter_500Medium" },
  customInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 15,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
  },
  customAddBtn: {
    paddingHorizontal: 24,
    backgroundColor: "#32FF7E",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  customAddText: { color: "#000", fontSize: 14, fontFamily: "Inter_700Bold" },
  txList: { gap: 10, paddingBottom: 100 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#141414",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#252525",
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#FFF" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#666" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#555" },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#141414",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },
  webViewBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  webViewTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#0A0A0A",
  },
  webViewLoadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#888" },
});
