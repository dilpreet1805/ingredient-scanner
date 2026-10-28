import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, type ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { useAgeStore } from "@/features/age/age-store";
import type { UserProfile } from "@/types";
import { useLaunch } from "./launch-state";
import { useProfile } from "./use-profile";

type Props = {
  children: (profile: UserProfile) => ReactNode;
  /** Only Home sets this: when the app starts with no profile, it opens on Decode. */
  startOnDecode?: boolean;
};

export function ProfileGate({ children, startOnDecode = false }: Props) {
  const { data: profile, isPending, isError, refetch } = useProfile();
  const tier = useAgeStore((s) => s.tier);
  const launchHandled = useLaunch((s) => s.handled);
  const markHandled = useLaunch((s) => s.markHandled);

  // True once, right after the profile lookup finishes at app start.
  const startingUp = startOnDecode && !isPending && !launchHandled;

  useEffect(() => {
    if (!startingUp) return;
    markHandled();
    if (!profile) router.navigate("/decode");
  }, [startingUp, profile, markHandled]);

  // Teens have no profile and no Home or Planner. Everyone else sees the lock card or the content.
  if (tier === "teen") return <Redirect href="/decode" />;

  if (isPending) return <View className="flex-1 bg-canvas" />;

  if (isError) {
    return (
      <Screen>
        <Card className="gap-3">
          <AppText variant="title">We couldn't load your profile</AppText>
          <AppText variant="caption">
            Check your connection to this phone's storage and try again.
          </AppText>
          <Button title="Try again" variant="soft" onPress={() => refetch()} />
        </Card>
      </Screen>
    );
  }

  if (profile) return <>{children(profile)}</>;

  // At app start with no profile we are about to move to Decode. Show nothing meanwhile.
  if (startingUp) return <View className="flex-1 bg-canvas" />;

  return (
    <Screen>
      <Card className="items-center gap-3 py-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons
            name="lock-closed-outline"
            size={26}
            color={colors.primary}
          />
        </View>
        <AppText variant="title" className="text-center">
          Set up your profile
        </AppText>
        <AppText variant="caption" className="text-center">
          Your profile powers your BMI and daily goals. It takes about a minute.
          Decode works without it.
        </AppText>
        <Button
          title="Create profile"
          variant="cta"
          className="self-stretch"
          onPress={() => router.push("/onboarding")}
        />
      </Card>
    </Screen>
  );
}
