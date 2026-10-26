import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import {
    addMealSchema,
    toNumber,
    type AddMealValues,
} from "@/features/planner/meal-schema";
import { MealTypePicker } from "@/features/planner/meal-type-picker";
import { defaultMealType, isMealType } from "@/features/planner/meal-types";
import { usePlannerDate } from "@/features/planner/planner-state";
import { useAddMeal } from "@/features/planner/use-meals";
import { cn } from "@/lib/cn";
import { formatDayLabel, toDateKey } from "@/lib/dates";

type Shortcut = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function AddMeal() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const date = usePlannerDate((s) => s.date);
  const addMeal = useAddMeal();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddMealValues>({
    resolver: zodResolver(addMealSchema),
    defaultValues: {
      type: isMealType(typeParam) ? typeParam : defaultMealType(),
      name: "",
      calories: "",
      carbsG: "",
      proteinG: "",
      fatG: "",
    },
  });

  const shortcuts: Shortcut[] = [
    {
      label: "From my scans",
      hint: "Add a product you decoded, by weight",
      icon: "scan-outline",
      onPress: () =>
        router.push({
          pathname: "/planner/scans",
          params: { type: getValues("type") },
        }),
    },
    {
      label: "Recent meals",
      hint: "Quick add things you've eaten before",
      icon: "time-outline",
      onPress: () => router.push("/planner/recent"),
    },
    {
      label: "Estimate from photo",
      hint: "Coming soon",
      icon: "camera-outline",
      onPress: () => router.push("/planner/photo"),
    },
  ];

  const onSubmit = handleSubmit(async (v) => {
    setSaveError(null);
    try {
      await addMeal.mutateAsync({
        date,
        type: v.type,
        name: v.name,
        basis: "serving",
        quantity: 1,
        nutrition: {
          calories: toNumber(v.calories),
          carbsG: toNumber(v.carbsG),
          proteinG: toNumber(v.proteinG),
          fatG: toNumber(v.fatG),
        },
        source: "manual",
        scanId: null,
        category: null,
      });
      router.back();
    } catch {
      setSaveError("We couldn't save this meal. Please try again.");
    }
  });

  return (
    <Screen>
      <BackButton />
      <View className="gap-1">
        <AppText variant="heading">Add meal</AppText>
        <AppText variant="caption">
          Adding to {formatDayLabel(date, toDateKey(new Date())).toLowerCase()}
        </AppText>
      </View>

      <Card className="gap-1 py-2">
        {shortcuts.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={item.onPress}
            className={cn(
              "flex-row items-center gap-3 py-3 active:opacity-70",
              index < shortcuts.length - 1 && "border-b border-primary-soft",
            )}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <AppText
                variant="body"
                className="font-body-semibold text-forest"
              >
                {item.label}
              </AppText>
              <AppText variant="caption">{item.hint}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>

      <Card className="gap-4">
        <AppText variant="title">Enter it yourself</AppText>

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <MealTypePicker value={field.value} onChange={field.onChange} />
          )}
        />

        <FormField
          control={control}
          name="name"
          label="Meal name"
          error={errors.name?.message}
          placeholder="e.g. Oats with banana & nuts"
        />

        <AppText variant="body" className="font-body-semibold text-forest">
          Nutrition (per serving)
        </AppText>
        <FormField
          control={control}
          name="calories"
          label="Calories (kcal)"
          error={errors.calories?.message}
          keyboardType="decimal-pad"
          placeholder="e.g. 250"
        />
        <FormField
          control={control}
          name="carbsG"
          label="Carbs (g)"
          error={errors.carbsG?.message}
          keyboardType="decimal-pad"
          placeholder="e.g. 30"
        />
        <FormField
          control={control}
          name="proteinG"
          label="Protein (g)"
          error={errors.proteinG?.message}
          keyboardType="decimal-pad"
          placeholder="e.g. 12"
        />
        <FormField
          control={control}
          name="fatG"
          label="Fat (g)"
          error={errors.fatG?.message}
          keyboardType="decimal-pad"
          placeholder="e.g. 8"
        />
      </Card>

      {saveError && (
        <Card className="bg-accent-soft">
          <AppText variant="caption" className="text-ink">
            {saveError}
          </AppText>
        </Card>
      )}

      <Button
        title="Save meal"
        variant="cta"
        loading={addMeal.isPending}
        onPress={() => onSubmit()}
      />
    </Screen>
  );
}
