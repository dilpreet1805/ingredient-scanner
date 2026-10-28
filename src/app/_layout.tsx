import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import "../global.css";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { colors } from "@/constants/colors";
import { useAgeStore } from "@/features/age/age-store";
import { useSessionGate } from "@/lib/session-gate";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  const ageLoaded = useAgeStore((s) => s.loaded);
  const tier = useAgeStore((s) => s.tier);
  const notBlocked = tier !== "blocked";

  useEffect(() => {
    void useAgeStore.getState().load();
  }, []);

  // No session (and so no server contact) for someone who is not allowed in.
  useEffect(() => {
    if (notBlocked) useSessionGate.getState().allow();
    else useSessionGate.getState().revoke();
  }, [notBlocked]);

  if ((!fontsLoaded && !fontError) || !ageLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Protected guard={notBlocked}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          {/* Profiles: for people who have not entered a date yet, and for adults. Never for teens. */}
          <Stack.Protected guard={tier === "unknown" || tier === "adult"}>
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="profile" />
          </Stack.Protected>

          <Stack.Protected guard={tier === "blocked"}>
            <Stack.Screen name="not-available" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
