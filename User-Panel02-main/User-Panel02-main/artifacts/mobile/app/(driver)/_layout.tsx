import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { Platform, StyleSheet, View } from "react-native";
import React from "react";
import { useColors } from "@/hooks/useColors";

const ONBOARDING_SCREENS = ["intro", "pending", "rejected", "register"];

export default function DriverLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const colors = useColors();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const isOnboarding = ONBOARDING_SCREENS.includes(route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: isOnboarding
            ? { display: "none" }
            : {
                position: "absolute",
                backgroundColor: isIOS ? "transparent" : colors.card,
                borderTopWidth: 0,
                height: isWeb ? 84 : 64,
                paddingBottom: isWeb ? 34 : 8,
              },
          tabBarBackground: isOnboarding
            ? undefined
            : () =>
                isIOS ? (
                  <BlurView
                    intensity={80}
                    tint="dark"
                    style={[StyleSheet.absoluteFill, { backgroundColor: colors.card + "CC" }]}
                  />
                ) : !isWeb ? (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: colors.card,
                        borderTopWidth: 0.5,
                        borderTopColor: colors.border,
                      },
                    ]}
                  />
                ) : null,
        };
      }}
    >
      {/* ── Onboarding screens – hidden from tab bar, no tab bar shown ── */}
      <Tabs.Screen name="intro" options={{ href: null }} />
      <Tabs.Screen name="pending" options={{ href: null }} />
      <Tabs.Screen name="rejected" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />

      {/* ── Driver navigation tabs – shown only after approval ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="gauge.medium" tintColor={color} size={size} />
            ) : (
              <Feather name="activity" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="indianrupeesign.circle.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="trending-up" size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="car.fill" tintColor={color} size={size} />
            ) : (
              <Feather name="map" size={size} color={color} />
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
