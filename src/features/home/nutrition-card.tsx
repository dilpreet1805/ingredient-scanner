import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { colors } from "@/constants/colors";
import type { DailyGoals, Nutrition } from "@/types";

function IconChip({ children }: { children: ReactNode }) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
      {children}
    </View>
  );
}

function MacroRow(props: {
  label: string;
  value: number;
  goal: number;
  icon: ReactNode;
}) {
  const { label, value, goal, icon } = props;
  return (
    <View className="flex-row items-center gap-3">
      <IconChip>{icon}</IconChip>
      <View className="flex-1 gap-1.5">
        <View className="flex-row justify-between">
          <AppText variant="body" className="font-body-semibold">
            {label}
          </AppText>
          <AppText variant="caption">
            {Math.round(value)} / {goal} g
          </AppText>
        </View>
        <ProgressBar value={value} max={goal} />
      </View>
    </View>
  );
}

type Props = { eaten: Nutrition; goals: DailyGoals };

export function NutritionCard({ eaten, goals }: Props) {
  const diff = goals.calories - eaten.calories;
  const diffLabel =
    diff >= 0 ? `${Math.round(diff)} left` : `${Math.round(-diff)} over`;

  return (
    <Card className="gap-5">
      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <IconChip>
            <Ionicons name="flame" size={20} color={colors.accent} />
          </IconChip>
          <AppText variant="caption">Calories today</AppText>
        </View>

        <View className="flex-row items-end justify-between">
          <AppText variant="heading" className="text-4xl">
            {Math.round(eaten.calories)}
            <AppText variant="caption"> of {goals.calories} kcal</AppText>
          </AppText>
          <View className="rounded-full bg-primary-soft px-3 py-1">
            <AppText variant="caption" className="font-body-bold text-ink">
              {diffLabel}
            </AppText>
          </View>
        </View>

        <ProgressBar
          value={eaten.calories}
          max={goals.calories}
          tone="accent"
        />
      </View>

      <View className="gap-4">
        <MacroRow
          label="Carbs"
          value={eaten.carbsG}
          goal={goals.carbsG}
          icon={
            <MaterialCommunityIcons
              name="grain"
              size={20}
              color={colors.primary}
            />
          }
        />
        <MacroRow
          label="Protein"
          value={eaten.proteinG}
          goal={goals.proteinG}
          icon={
            <MaterialCommunityIcons
              name="arm-flex"
              size={20}
              color={colors.primary}
            />
          }
        />
        <MacroRow
          label="Fat"
          value={eaten.fatG}
          goal={goals.fatG}
          icon={<Ionicons name="water" size={20} color={colors.primary} />}
        />
      </View>
    </Card>
  );
}
