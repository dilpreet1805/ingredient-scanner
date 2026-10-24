import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DailyGoals, Nutrition } from "@/types";

type Props = { eaten: Nutrition; goals: DailyGoals };

function MacroRow({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal: number;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <AppText variant="body">{label}</AppText>
        <AppText variant="caption">
          {Math.round(value)} / {goal} g
        </AppText>
      </View>
      <ProgressBar value={value} max={goal} />
    </View>
  );
}

export function NutritionCard({ eaten, goals }: Props) {
  const remaining = Math.max(0, goals.calories - eaten.calories);

  return (
    <Card className="gap-5">
      <View className="gap-1">
        <AppText variant="caption">Calories today</AppText>
        <View className="flex-row items-end justify-between">
          <AppText variant="heading" className="text-4xl">
            {Math.round(eaten.calories)}
            <AppText variant="caption"> of {goals.calories} kcal</AppText>
          </AppText>
          <AppText variant="caption">{Math.round(remaining)} left</AppText>
        </View>
        <ProgressBar
          value={eaten.calories}
          max={goals.calories}
          tone="accent"
          className="mt-2"
        />
      </View>

      <View className="gap-3">
        <MacroRow label="Carbs" value={eaten.carbsG} goal={goals.carbsG} />
        <MacroRow
          label="Protein"
          value={eaten.proteinG}
          goal={goals.proteinG}
        />
        <MacroRow label="Fat" value={eaten.fatG} goal={goals.fatG} />
      </View>
    </Card>
  );
}
