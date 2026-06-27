import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Feather.glyphMap;
};

/**
 * In-app confirmation modal. Use instead of Alert.alert because Chrome
 * silently blocks window.alert() inside Replit's cross-origin preview iframe.
 */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
  icon,
}: Props) {
  const accent = destructive ? "#FF4444" : "#32FF7E";
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          {icon ? (
            <View style={[styles.iconWrap, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
              <Feather name={icon} size={26} color={accent} />
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]} activeOpacity={0.8}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.btn, { backgroundColor: accent }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmText, destructive && { color: "#FFF" }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000000CC", alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%", maxWidth: 360,
    backgroundColor: "#141414", borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: "#252525", gap: 14, alignItems: "center",
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#FFF", textAlign: "center" },
  message: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#AAA", textAlign: "center", lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10, marginTop: 6, width: "100%" },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#2A2A2A" },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#CCC" },
  confirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#000" },
});
