import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { useSaveProfile } from "@/features/profile/use-profile";
import type { UserProfile } from "@/types";

function GoalsForm({ profile }: { profile: UserProfile }) {
  const save = useSaveProfile();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
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
      <Card className="gap-4">
        <Controller
          control={control}
          name="goal"
          render={({ field }) => (
            <View className="gap-1.5">
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
            </View>
          )}
        />
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
          These are targets you choose. They aren't calculated for you. For
          personal advice, talk to a doctor or dietitian.
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
        <Screen>
          <BackButton />
          <AppText variant="heading">Health goals</AppText>
          <GoalsForm profile={profile} />
        </Screen>
      )}
    </ProfileGate>
  );
}
