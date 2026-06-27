import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  value: string;
  onChange: (val: string) => void;
}

export function OTPInput({ length = 6, onComplete, value, onChange }: OTPInputProps) {
  const colors = useColors();
  const inputs = useRef<(TextInput | null)[]>([]);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  function handleChange(index: number, char: string) {
    const filtered = char.replace(/[^0-9]/g, "");
    if (!filtered) return;

    const newDigits = [...digits];
    newDigits[index] = filtered[filtered.length - 1] ?? "";
    const newValue = newDigits.join("");
    onChange(newValue);

    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (newValue.length === length) {
      onComplete(newValue);
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace") {
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
      }
    }
  }

  return (
    <View style={styles.container}>
      {digits.map((digit, i) => (
        <View
          key={i}
          style={[
            styles.box,
            {
              backgroundColor: colors.input,
              borderColor: digit ? colors.primary : colors.border,
            },
          ]}
        >
          <TextInput
            ref={(ref) => { inputs.current[i] = ref; }}
            style={[styles.digit, { color: colors.primary }]}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(t) => handleChange(i, t)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            selectTextOnFocus
            caretHidden
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  digit: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    width: "100%",
  },
});
