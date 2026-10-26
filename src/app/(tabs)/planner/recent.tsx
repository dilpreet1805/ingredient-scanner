import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import { usePlannerDate } from "@/features/planner/planner-state";
import { useAddMeal, useRecentMeals } from "@/features/planner/use-meals";
import { cn } from "@/lib/cn";
import { itemTotals } from "@/lib/meal-math";
import type { MealItem } from "@/types";

export default function RecentMeals() {
  const date = usePlannerDate((s) => s.date);
  const { data: meals = [], isPending } = useRecentMeals();
  const addMeal = useAddMeal();
  const [added, setAdded] = useState<string[]>([]);

  const reAdd = async (meal: MealItem) => {
    await addMeal.mutateAsync({
      date,
      type: meal.type,
      name: meal.name,
      basis: meal.basis,
      quantity: meal.quantity,
      nutrition: meal.nutrition,
      source: meal.source,
      scanId: meal.scanId,
      category: meal.category,
    });
    setAdded((current) => [...current, meal.id]);
  };

  return (
    <Screen>
      <BackButton />
      <View className="gap-1">
        <AppText variant="heading">Recent meals</AppText>
        <AppText variant="caption">
          Quick add your favourite meals to the selected day.
        </AppText>
      </View>

      {isPending ? null : meals.length === 0 ? (
        <Card className="gap-1">
          <AppText variant="title">Nothing here yet</AppText>
          <AppText variant="caption">
            Meals you add will show up here for quick re-adding.
          </AppText>
        </Card>
      ) : (
        <Card className="gap-1">
          {meals.map((meal, index) => {
            const totals = itemTotals(meal);
            const isAdded = added.includes(meal.id);
            return (
              <View
                key={meal.id}
                className={cn(
                  "flex-row items-center gap-3 py-3",
                  index < meals.length - 1 && "border-b border-primary-soft",
                )}
              >
                <ProductThumbnail category={meal.category ?? "other"} />
                <View className="flex-1">
                  <AppText
                    variant="body"
                    className="font-body-semibold"
                    numberOfLines={1}
                  >
                    {meal.name}
                  </AppText>
                  <AppText variant="caption">
                    {Math.round(totals.calories)} kcal · C{" "}
                    {Math.round(totals.carbsG)} · P{" "}
                    {Math.round(totals.proteinG)} · F {Math.round(totals.fatG)}
                  </AppText>
                </View>
                <Button
                  title={isAdded ? "Added" : "Add"}
                  variant="soft"
                  disabled={isAdded || addMeal.isPending}
                  className="min-h-[44px] px-4"
                  left={
                    <Ionicons
                      name={isAdded ? "checkmark" : "add"}
                      size={18}
                      color={colors.forest}
                    />
                  }
                  onPress={() => reAdd(meal)}
                />
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
