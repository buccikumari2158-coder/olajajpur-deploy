import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RideProvider } from "@/contexts/RideContext";
import { SocketProvider } from "@/contexts/SocketContext";

// Set up API base URL (outside component for immediate effect)
setBaseUrl(`https://${process.env["EXPO_PUBLIC_DOMAIN"]}`);
// Default getter returns null; AuthProvider will override this
setAuthTokenGetter(() => null);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(passenger)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="ride" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="legal" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: "#32FF7E", borderTopColor: "transparent" }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SocketProvider>
                <RideProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    {Platform.OS !== "web" ? (
                      <KeyboardProvider>
                        <RootLayoutNav />
                      </KeyboardProvider>
                    ) : (
                      <RootLayoutNav />
                    )}
                  </GestureHandlerRootView>
                </RideProvider>
              </SocketProvider>
            </AuthProvider>
          </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
