import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { colors } from "@/constants/colors";
import type { SuggestionNote, TargetSuggestion } from "@/lib/nutrition-targets";
import type { UserProfile, WeightGoal } from "@/types";
import { activityLabel, sexLabel } from "./profile-schema";

const noteText: Record<SuggestionNote, string> = {
  "underweight-no-deficit":
    "Your BMI is below the typical range, so these numbers are for maintaining your weight, not losing it. Please talk to a doctor.",
  "calorie-floor":
    "We raised this to a minimum intake. Eating less than this isn't recommended without medical advice.",
  "sex-unspecified":
    "You chose not to share your sex, so we used an average. Adding it gives a closer estimate.",
};

const goalPhrase: Record<WeightGoal, string> = {
  lose: "lose about 0.5 kg a week",
  maintain: "maintain your weight",
  gain: "gain about 0.25 kg a week",
};

type Props = {
  suggestion: TargetSuggestion;
  profile: Pick<UserProfile, "sex" | "activity">;
  matches: boolean;
  onApply: () => void;
};

export function TargetSuggestionCard({
  suggestion,
  profile,
  matches,
  onApply,
}: Props) {
  if (suggestion.status === "unavailable") {
    return (
      <Card className="gap-1 bg-accent-soft">
        <AppText variant="title">No suggestion available</AppText>
        <AppText variant="caption" className="text-ink">
          {suggestion.reason === "under-18"
            ? "These estimates are designed for adults. Please talk to a doctor or dietitian about targets."
            : "Check your height, weight and birth year in Personal information."}
        </AppText>
      </Card>
    );
  }

  const { goals } = suggestion;

  return (
    <Card className="gap-3 bg-primary-soft">
      <View className="flex-row items-center gap-2">
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <AppText variant="title">Suggested for you</AppText>
      </View>

      <View>
        <AppText variant="heading" className="text-4xl">
          {goals.calories}
          <AppText variant="caption"> kcal a day</AppText>
        </AppText>
        <AppText variant="caption" className="text-ink">
          To {goalPhrase[suggestion.goal]}.
        </AppText>
      </View>

      <View className="flex-row gap-2">
        {[
          ["Carbs", goals.carbsG],
          ["Protein", goals.proteinG],
          ["Fat", goals.fatG],
        ].map(([label, grams]) => (
          <View
            key={label}
            className="flex-1 items-center rounded-control bg-surface py-2"
          >
            <AppText variant="caption">{label}</AppText>
            <AppText variant="body" className="font-body-bold text-forest">
              {grams} g
            </AppText>
          </View>
        ))}
      </View>

      {suggestion.notes.map((note) => (
        <View key={note} className="flex-row gap-2">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accentStrong}
            style={{ marginTop: 2 }}
          />
          <AppText variant="caption" className="flex-1 text-ink">
            {noteText[note]}
          </AppText>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/profile/personal")}
        className="active:opacity-70"
      >
        <AppText variant="caption" className="text-ink">
          Based on your weight, height, age,{" "}
          {sexLabel[profile.sex].toLowerCase()} and{" "}
          {activityLabel[profile.activity].toLowerCase()}.{" "}
          <AppText variant="caption" className="font-body-bold text-forest">
            Edit
          </AppText>
        </AppText>
      </Pressable>

      <Button
        title={matches ? "Using these numbers" : "Use suggested numbers"}
        variant={matches ? "soft" : "cta"}
        disabled={matches}
        className={matches ? "bg-surface" : undefined}
        onPress={onApply}
      />

      <AppText variant="caption">
        An estimate from a standard formula, not medical advice. Pregnancy,
        breastfeeding and health conditions change what you need.
      </AppText>
    </Card>
  );
}
