import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PanicGate } from "@/components/PanicGate";
import { AdaptiveProvider } from "@/contexts/AdaptiveContext";
import { BackgroundProvider } from "@/contexts/BackgroundContext";
import { GlassProvider } from "@/contexts/GlassContext";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { MeshProvider } from "@/contexts/MeshContext";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { ready, completed } = useOnboarding();
  const pathname = usePathname();
  if (!ready) return null;
  const onOnboardingScreen = pathname === "/onboarding";
  if (!completed && !onOnboardingScreen) {
    return <Redirect href="/onboarding" />;
  }
  if (completed && onOnboardingScreen) {
    return <Redirect href="/(tabs)" />;
  }
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      {/* Скрытый аварийный жест — 5 быстрых тапов по самой верхней полосе
          стирают всю локальную базу и ключи. */}
      <PanicGate />
      <OnboardingGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
            animation: Platform.OS === "ios" ? "default" : "fade",
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="chat/[id]"
            options={{ presentation: "card", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="channel/[id]"
            options={{ presentation: "card", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="group/[id]"
            options={{ presentation: "card", animation: "slide_from_right" }}
          />
        </Stack>
      </OnboardingGate>
    </View>
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

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000" }}>
            <KeyboardProvider>
              <AdaptiveProvider>
                <LocaleProvider>
                  <ThemeProvider>
                    <BackgroundProvider>
                      <GlassProvider>
                        <IdentityProvider>
                          <OnboardingProvider>
                            <MeshProvider>
                              <RootLayoutNav />
                            </MeshProvider>
                          </OnboardingProvider>
                        </IdentityProvider>
                      </GlassProvider>
                    </BackgroundProvider>
                  </ThemeProvider>
                </LocaleProvider>
              </AdaptiveProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
