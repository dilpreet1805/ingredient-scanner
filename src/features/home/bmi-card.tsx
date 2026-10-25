import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { colors } from "@/constants/colors";
import { bmiCategory, calculateBmi, type BmiCategory } from "@/lib/bmi";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/types";
import { BmiGauge } from "./bmi-gauge";

const categories: { key: BmiCategory; name: string; range: string }[] = [
  { key: "underweight", name: "Underweight", range: "< 18.5" },
  { key: "normal", name: "Healthy", range: "18.5 – 24.9" },
  { key: "overweight", name: "Overweight", range: "25 – 29.9" },
  { key: "obese", name: "Obese", range: "≥ 30" },
];

const notes: Record<BmiCategory, string> = {
  underweight: "Below the typical range.",
  normal: "Within the typical range.",
  overweight: "Above the typical range.",
  obese: "Well above the typical range.",
};

type Props = { profile: Pick<UserProfile, "heightCm" | "weightKg"> };

export function BmiCard({ profile }: Props) {
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);

  if (bmi === null) {
    return (
      <Card className="gap-1">
        <AppText variant="title">Your BMI</AppText>
        <AppText variant="caption">
          Add your height and weight in your profile to see it here.
        </AppText>
      </Card>
    );
  }

  const current = bmiCategory(bmi);
  const currentName = categories.find((c) => c.key === current)?.name ?? "";

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <Ionicons name="person-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <AppText variant="caption">Your BMI</AppText>
            <AppText variant="heading" className="text-4xl">
              {bmi.toFixed(1)}
            </AppText>
          </View>
        </View>
        <View
          className={cn(
            "rounded-full px-3 py-1",
            current === "normal" ? "bg-primary-soft" : "bg-accent-soft",
          )}
        >
          <AppText variant="caption" className="font-body-bold text-ink">
            {current === "normal" ? "Healthy range" : currentName}
          </AppText>
        </View>
      </View>

      <BmiGauge bmi={bmi} />

      <View className="flex-row">
        {categories.map((c) => (
          <View key={c.key} className="flex-1 items-center">
            <AppText
              variant="caption"
              className={cn(
                "text-center text-xs",
                c.key === current && "font-body-bold text-ink",
              )}
            >
              {c.name}
            </AppText>
            <AppText variant="caption" className="text-center text-xs">
              {c.range}
            </AppText>
          </View>
        ))}
      </View>

      <AppText variant="caption">
        {notes[current]} Based on {profile.heightCm} cm and {profile.weightKg}{" "}
        kg. BMI is a rough guide, not a diagnosis.
      </AppText>
    </Card>
  );
}
