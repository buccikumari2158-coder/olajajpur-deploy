import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasSelected } = useLanguage();
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Loading dots
    const dotAnim = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => dotAnim());
    };
    dotAnim();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        if (!isAuthenticated) {
          if (!hasSelected) {
            router.replace("/(auth)/language");
          } else {
            router.replace("/(auth)/login");
          }
        } else if (!user?.name || user.name.trim().length < 2) {
          // Logged in but never completed first-login profile
          router.replace("/(auth)/profile-setup");
        } else if (user?.role === "driver" || user?.isDriver) {
          if (user?.driverStatus === "pending") {
            router.replace("/(driver)/pending");
          } else if (user?.driverStatus === "rejected") {
            router.replace("/(driver)/rejected");
          } else if (user?.driverStatus === "approved") {
            router.replace("/(driver)/dashboard");
          } else {
            // isDriver set but application not started/incomplete → onboarding
            router.replace("/(driver)/intro");
          }
        } else {
          router.replace("/(passenger)/home");
        }
      }, 2200);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, user, hasSelected]);

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: taglineOpacity, alignItems: "center" }}>
        <Text style={styles.appName}>JAJPUR JATRI</Text>
        <Text style={styles.tagline}>Safe Rides, Anytime, Anywhere</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingTop: Platform.OS === "web" ? 67 : 0,
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#32FF7E",
    shadowColor: "#32FF7E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 20,
    top: height / 2 - 200,
  },
  logoContainer: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 170,
    height: 170,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: 3,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#888888",
    letterSpacing: 0.5,
    marginTop: 6,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#32FF7E",
  },
});
