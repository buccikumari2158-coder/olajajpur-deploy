import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface DarkInputProps extends TextInputProps {
  label?: string;
  prefix?: string;
  icon?: React.ReactNode;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function DarkInput({
  label,
  prefix,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: DarkInputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.input,
            borderColor: focused ? colors.primary : error ? colors.destructive : colors.border,
          },
        ]}
      >
        {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
        {prefix ? (
          <Text style={[styles.prefix, { color: colors.foreground }]}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[styles.input, { color: colors.foreground }, style]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress} style={styles.iconRight}>
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
  prefix: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    height: "100%",
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
