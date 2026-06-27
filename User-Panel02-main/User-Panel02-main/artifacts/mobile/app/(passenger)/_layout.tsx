import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { Platform, StyleSheet, View } from "react-native";
import React from "react";
import { useColors } from "@/hooks/useColors";

export default function PassengerLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          height: isWeb ? 84 : 64,
          paddingBottom: isWeb ? 34 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card + "CC" }]}
            />
          ) : !isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="home" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="clock.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="clock" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="wallet.pass.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="credit-card" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="user" size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}
