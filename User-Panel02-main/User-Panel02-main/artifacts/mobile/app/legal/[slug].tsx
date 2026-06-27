import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env["EXPO_PUBLIC_DOMAIN"] ?? ""}`;

type LegalDoc = { slug: string; title: string; body: string; externalUrl: string };

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = params.slug ?? "terms";
  const colors = useColors();

  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/legal/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
        const json = (await res.json()) as LegalDoc;
        if (!cancelled) setDoc(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load document.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  async function openExternal() {
    if (!doc?.externalUrl) return;
    if (Platform.OS === "web") {
      Linking.openURL(doc.externalUrl);
    } else {
      await WebBrowser.openBrowserAsync(doc.externalUrl);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 16 : 8), backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{doc?.title ?? "Legal"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#32FF7E" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color="#FF4757" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : doc ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{doc.body}</Text>

          <TouchableOpacity onPress={openExternal} style={styles.externalBtn} activeOpacity={0.85}>
            <Feather name="external-link" size={16} color="#32FF7E" />
            <Text style={styles.externalText}>Open Full {doc.title}</Text>
          </TouchableOpacity>

          <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
            Last updated: managed by Jajpur Jatri. For questions, contact +91 9583789411.
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#141414", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#FFF", flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#FF4757", textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 18 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#CCC", lineHeight: 22 },
  externalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#32FF7E15", borderWidth: 1, borderColor: "#32FF7E40",
    borderRadius: 14, paddingVertical: 14,
  },
  externalText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#32FF7E" },
  footnote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#555", textAlign: "center" },
});
