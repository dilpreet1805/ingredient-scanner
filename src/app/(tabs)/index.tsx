import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { useScans } from "@/features/decode/use-scans";
import { BmiCard } from "@/features/home/bmi-card";
import { eatenToday } from "@/features/home/fixtures";
import { NutritionCard } from "@/features/home/nutrition-card";
import { RecentScans } from "@/features/home/recent-scans";
import { AvatarMenu } from "@/features/profile/avatar-menu";
import { ProfileGate } from "@/features/profile/profile-gate";
import type { UserProfile } from "@/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function HomeContent({ profile }: { profile: UserProfile }) {
  const { data: scans = [] } = useScans();

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="leaf" size={16} color={colors.primary} />
            <AppText variant="caption">{greeting()}</AppText>
          </View>
          <AppText variant="heading">{profile.name}</AppText>
        </View>
        <AvatarMenu profile={profile} />
      </View>

      <NutritionCard eaten={eatenToday} goals={profile.dailyGoals} />
      <BmiCard profile={profile} />

      <Card className="gap-3 bg-accent-soft">
        <View className="flex-row items-center">
          <View className="flex-1 gap-1 pr-2">
            <AppText variant="title">Shopping for something?</AppText>
            <AppText variant="caption">
              Decode the ingredient list to see what's inside.
            </AppText>
          </View>
          <Image
            source={require("@/assets/images/decode-hero.png")}
            resizeMode="contain"
            accessible={false}
            style={{ width: 150, aspectRatio: 1.5 }}
          />
        </View>
        <Button
          title="Decode a product"
          variant="accent"
          onPress={() => router.push("/decode")}
        />
      </Card>

      <RecentScans scans={scans.slice(0, 3)} />
    </Screen>
  );
}

export default function Home() {
  return (
    <ProfileGate redirectIfMissing>
      {(profile) => <HomeContent profile={profile} />}
    </ProfileGate>
  );
}
