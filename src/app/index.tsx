import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
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
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="leaf" size={16} color={colors.primary} />
            <AppText variant="caption">{greeting()}</AppText>
          </View>
          <AppText variant="heading">{profile.name}</AppText>
        </View>

        {/* Opens the profile screen once we build it (Step 4). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
        >
          <Ionicons name="person" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <NutritionCard eaten={eatenToday} goals={goals} />
      <BmiCard profile={profile} />

      <Card className="flex-row items-center gap-3 bg-accent-soft">
        <View className="flex-1 gap-3">
          <View className="gap-1">
            <AppText variant="title">Shopping for something?</AppText>
            <AppText variant="caption">
              Decode the ingredient list to see what's inside.
            </AppText>
          </View>
          <Button
            title="Decode a product"
            variant="accent"
            onPress={() => router.push("/decode")}
          />
        </View>
        <View className="h-24 w-24 items-center justify-center rounded-full bg-surface">
          <MaterialCommunityIcons
            name="text-box-search-outline"
            size={44}
            color={colors.accent}
          />
        </View>
      </Card>

      <RecentScans scans={recentScans.slice(0, 3)} />
    </Screen>
  );
}
