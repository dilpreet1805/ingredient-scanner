import { router } from "expo-router";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { BmiCard } from "@/features/home/bmi-card";
import {
  eatenToday,
  goals,
  profile,
  recentScans,
} from "@/features/home/fixtures";
import { NutritionCard } from "@/features/home/nutrition-card";
import { RecentScans } from "@/features/home/recent-scans";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  return (
    <Screen>
      <View>
        <AppText variant="caption">{greeting()}</AppText>
        <AppText variant="heading">{profile.name}</AppText>
      </View>

      <NutritionCard eaten={eatenToday} goals={goals} />
      <BmiCard profile={profile} />

      <Card className="gap-3 bg-accent-soft">
        <AppText variant="title">Shopping for something?</AppText>
        <AppText variant="caption">
          Scan the ingredient list to see what's inside.
        </AppText>
        <Button
          title="Scan a product"
          variant="accent"
          onPress={() => router.push("/scan")}
        />
      </Card>

      <RecentScans scans={recentScans} />
    </Screen>
  );
}
