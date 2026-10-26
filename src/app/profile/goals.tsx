import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Screen } from "@/components/ui/screen";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ProfileGate } from "@/features/profile/profile-gate";
import {
  goalOptions,
  goalsSchema,
  type GoalsValues,
} from "@/features/profile/profile-schema";
import { TargetSuggestionCard } from "@/features/profile/target-suggestion-card";
import { useSaveProfile } from "@/features/profile/use-profile";
import { suggestTargets } from "@/lib/nutrition-targets";
import type { UserProfile } from "@/types";

function GoalsForm({ profile }: { profile: UserProfile }) {
  const save = useSaveProfile();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GoalsValues>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      goal: profile.goal,
      calories: String(profile.dailyGoals.calories),
      carbsG: String(profile.dailyGoals.carbsG),
      proteinG: String(profile.dailyGoals.proteinG),
      fatG: String(profile.dailyGoals.fatG),
    },
  });

  // Live values, so the suggestion follows the goal as you switch it.
  const values = useWatch({ control });
  const selectedGoal = values.goal ?? profile.goal;

  const suggestion = useMemo(
    () =>
      suggestTargets({
        sex: profile.sex,
        activity: profile.activity,
        goal: selectedGoal,
        birthYear: profile.birthYear,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
      }),
    [
      profile.sex,
      profile.activity,
      profile.birthYear,
      profile.heightCm,
      profile.weightKg,
      selectedGoal,
    ],
  );

  const matches =
    suggestion.status === "ok" &&
    values.calories === String(suggestion.goals.calories) &&
    values.carbsG === String(suggestion.goals.carbsG) &&
    values.proteinG === String(suggestion.goals.proteinG) &&
    values.fatG === String(suggestion.goals.fatG);

  // Fills the fields only when asked. It never changes what you typed on its own.
  const applySuggestion = () => {
    if (suggestion.status !== "ok") return;
    const options = { shouldValidate: true, shouldDirty: true };
    setValue("calories", String(suggestion.goals.calories), options);
    setValue("carbsG", String(suggestion.goals.carbsG), options);
    setValue("proteinG", String(suggestion.goals.proteinG), options);
    setValue("fatG", String(suggestion.goals.fatG), options);
  };

  const onSubmit = handleSubmit(async (v) => {
    setSaveError(null);
    try {
      await save.mutateAsync({
        ...profile,
        goal: v.goal,
        dailyGoals: {
          calories: Number(v.calories),
          carbsG: Number(v.carbsG),
          proteinG: Number(v.proteinG),
          fatG: Number(v.fatG),
        },
      });
      router.back();
    } catch {
      setSaveError("We couldn't save your goals. Please try again.");
    }
  });

  return (
    <View className="gap-4">
      <Card className="gap-1.5">
        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <>
              <AppText
                variant="body"
                className="font-body-semibold text-forest"
              >
                Your goal
              </AppText>
              <SegmentedControl
                label="Your goal"
                options={goalOptions}
                value={field.value}
                onChange={field.onChange}
              />
            </>
          )}
        />
      </Card>

      <TargetSuggestionCard
        suggestion={suggestion}
        profile={profile}
        matches={matches}
        onApply={applySuggestion}
      />

      <Card className="gap-4">
        <AppText variant="title">Your daily targets</AppText>
        <FormField
          control={control}
          name="calories"
          label="Daily calories (kcal)"
          error={errors.calories?.message}
          keyboardType="number-pad"
        />
        <FormField
          control={control}
          name="carbsG"
          label="Carbs (g)"
          error={errors.carbsG?.message}
          keyboardType="number-pad"
        />
        <FormField
          control={control}
          name="proteinG"
          label="Protein (g)"
          error={errors.proteinG?.message}
          keyboardType="number-pad"
        />
        <FormField
          control={control}
          name="fatG"
          label="Fat (g)"
          error={errors.fatG?.message}
          keyboardType="number-pad"
        />
        <AppText variant="caption">
          These are the targets the app tracks against. Change them to whatever
          suits you.
        </AppText>
      </Card>

      {saveError && (
        <Card className="bg-accent-soft">
          <AppText variant="caption" className="text-ink">
            {saveError}
          </AppText>
        </Card>
      )}

      <Button
        title="Save goals"
        variant="cta"
        loading={save.isPending}
        onPress={() => onSubmit()}
      />
    </View>
  );
}

export default function HealthGoals() {
  return (
    <ProfileGate>
      {(profile) => (
        <Screen safeBottom>
          <BackButton />
          <AppText variant="heading">Health goals</AppText>
          <GoalsForm profile={profile} />
        </Screen>
      )}
    </ProfileGate>
  );
}
