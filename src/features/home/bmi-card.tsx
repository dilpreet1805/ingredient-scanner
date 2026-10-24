import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Card } from "@/components/ui/card";
import { bmiCategory, calculateBmi, type BmiCategory } from "@/lib/bmi";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/types";

const copy: Record<BmiCategory, { label: string; note: string; chip: string }> =
  {
    underweight: {
      label: "Underweight",
      note: "Below the typical range.",
      chip: "bg-accent-soft",
    },
    normal: {
      label: "Healthy range",
      note: "Within the typical range.",
      chip: "bg-primary-soft",
    },
    overweight: {
      label: "Overweight",
      note: "Above the typical range.",
      chip: "bg-accent-soft",
    },
    obese: {
      label: "Obese range",
      note: "Well above the typical range.",
      chip: "bg-accent-soft",
    },
  };

// The scale bar covers BMI 15 to 35. Segment sizes match the category widths.
const SCALE_MIN = 15;
const SCALE_MAX = 35;

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

  const { label, note, chip } = copy[bmiCategory(bmi)];
  const markerPercent = Math.min(
    100,
    Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100),
  );

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between">
        <View>
          <AppText variant="caption">Your BMI</AppText>
          <AppText variant="heading" className="text-4xl">
            {bmi.toFixed(1)}
          </AppText>
        </View>
        <View className={cn("rounded-full px-3 py-1", chip)}>
          <AppText variant="caption" className="font-body-bold text-ink">
            {label}
          </AppText>
        </View>
      </View>

      <View className="relative justify-center">
        <View className="h-3 flex-row overflow-hidden rounded-full">
          <View className="bg-risk-mid" style={{ flex: 3.5 }} />
          <View className="bg-primary" style={{ flex: 6.5 }} />
          <View className="bg-risk-mid" style={{ flex: 5 }} />
          <View className="bg-risk-high" style={{ flex: 5 }} />
        </View>
        <View
          className="absolute h-6 w-1.5 rounded-full border border-surface bg-ink"
          style={{ left: `${markerPercent}%` }}
        />
      </View>

      <AppText variant="caption">
        {note} Based on {profile.heightCm} cm and {profile.weightKg} kg. BMI is
        a rough guide, not a diagnosis.
      </AppText>
    </Card>
  );
}
