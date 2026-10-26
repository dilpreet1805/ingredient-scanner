import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { NutritionCard } from "@/features/home/nutrition-card";
import { MealSection } from "@/features/planner/meal-section";
import { mealTypes } from "@/features/planner/meal-types";
import { usePlannerDate } from "@/features/planner/planner-state";
import { useMealsForDate } from "@/features/planner/use-meals";
import { WeekStrip } from "@/features/planner/week-strip";
import { ProfileGate } from "@/features/profile/profile-gate";
import { formatDayLabel, toDateKey } from "@/lib/dates";
import { itemTotals, sumNutrition } from "@/lib/meal-math";
import type { MealType, UserProfile } from "@/types";

function PlannerContent({ profile }: { profile: UserProfile }) {
  const date = usePlannerDate((s) => s.date);
  const setDate = usePlannerDate((s) => s.setDate);
  const goToToday = usePlannerDate((s) => s.goToToday);

  const today = toDateKey(new Date());
  const { data: meals = [], isPending } = useMealsForDate(date);
  const eaten = useMemo(() => sumNutrition(meals.map(itemTotals)), [meals]);

  const summaryTitle =
    date === today ? "Today's summary" : formatDayLabel(date, today);

  const openAdd = (type?: MealType) =>
    router.push({ pathname: "/planner/add", params: type ? { type } : {} });

  return (
    <Screen>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1">
          <AppText variant="heading">Planner</AppText>
          <AppText variant="caption">
            Plan your meals. Reach your goals.
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Jump to today"
          onPress={goToToday}
          className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft active:opacity-70"
        >
          <Ionicons name="today-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <WeekStrip selected={date} onSelect={setDate} />

      <NutritionCard
        title={summaryTitle}
        eaten={eaten}
        goals={profile.dailyGoals}
      />

      {isPending ? null : meals.length === 0 ? (
        <Card className="items-center gap-3 py-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
            <Ionicons
              name="restaurant-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <View className="items-center gap-1">
            <AppText variant="title">No meals added yet</AppText>
            <AppText variant="caption" className="text-center">
              Track your meals to stay on top of your nutrition goals.
            </AppText>
          </View>
          <Button
            title="Add meal"
            variant="cta"
            className="self-stretch"
            left={<Ionicons name="add" size={22} color="#FFFFFF" />}
            onPress={() => openAdd()}
          />
          <Button
            title="Estimate from photo"
            variant="soft"
            className="self-stretch"
            left={
              <Ionicons name="camera-outline" size={20} color={colors.forest} />
            }
            onPress={() => router.push("/planner/photo")}
          />
        </Card>
      ) : (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="title">Meals</AppText>
            <Button
              title="Add meal"
              variant="soft"
              className="min-h-[40px] px-4"
              left={<Ionicons name="add" size={18} color={colors.forest} />}
              onPress={() => openAdd()}
            />
          </View>
          {mealTypes.map((type, index) => (
            <MealSection
              key={type.value}
              type={type.value}
              items={meals.filter((meal) => meal.type === type.value)}
              isLast={index === mealTypes.length - 1}
              onAdd={() => openAdd(type.value)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

export default function Planner() {
  return (
    <ProfileGate>
      {(profile) => <PlannerContent profile={profile} />}
    </ProfileGate>
  );
}
