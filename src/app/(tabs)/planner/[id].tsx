import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Screen } from "@/components/ui/screen";
import { colors } from "@/constants/colors";
import {
    editMealSchema,
    toNumber,
    type EditMealValues,
} from "@/features/planner/meal-schema";
import { mealMeta } from "@/features/planner/meal-types";
import {
    useDeleteMeal,
    useMeal,
    useUpdateMeal,
} from "@/features/planner/use-meals";
import { itemTotals } from "@/lib/meal-math";
import type { MealItem } from "@/types";

const round1 = (n: number) => String(Math.round(n * 10) / 10);

function MacroPill({ label, grams }: { label: string; grams: number }) {
  return (
    <View className="flex-1 items-center rounded-control bg-primary-soft py-2">
      <AppText variant="caption">{label}</AppText>
      <AppText variant="body" className="font-body-bold text-forest">
        {Math.round(grams)} g
      </AppText>
    </View>
  );
}

function EditForm({ meal }: { meal: MealItem }) {
  const update = useUpdateMeal();
  const remove = useDeleteMeal();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditMealValues>({
    resolver: zodResolver(editMealSchema),
    defaultValues: {
      name: meal.name,
      quantity: round1(meal.quantity),
      calories: round1(meal.nutrition.calories),
      carbsG: round1(meal.nutrition.carbsG),
      proteinG: round1(meal.nutrition.proteinG),
      fatG: round1(meal.nutrition.fatG),
    },
  });

  const values = useWatch({ control });
  const quantity = toNumber(values.quantity);
  const totals = itemTotals({
    basis: meal.basis,
    quantity,
    nutrition: {
      calories: toNumber(values.calories),
      carbsG: toNumber(values.carbsG),
      proteinG: toNumber(values.proteinG),
      fatG: toNumber(values.fatG),
    },
  });

  const stepQuantity = (delta: number) => {
    const next = Math.min(
      20,
      Math.max(0.5, Math.round((quantity + delta) * 2) / 2),
    );
    setValue("quantity", String(next), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this item?",
      `"${meal.name}" will be removed from your day.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            remove.mutate(meal.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  };

  const onSubmit = handleSubmit(async (v) => {
    setSaveError(null);
    try {
      await update.mutateAsync({
        id: meal.id,
        patch: {
          name: v.name,
          quantity: toNumber(v.quantity),
          nutrition: {
            calories: toNumber(v.calories),
            carbsG: toNumber(v.carbsG),
            proteinG: toNumber(v.proteinG),
            fatG: toNumber(v.fatG),
          },
        },
      });
      router.back();
    } catch {
      setSaveError("We couldn't save your changes. Please try again.");
    }
  });

  return (
    <View className="gap-4">
      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <ProductThumbnail category={meal.category ?? "other"} />
          <View className="flex-1">
            <AppText variant="title" numberOfLines={2}>
              {meal.name}
            </AppText>
            <AppText variant="caption">
              {mealMeta[meal.type].label} · {Math.round(totals.calories)} kcal
            </AppText>
          </View>
        </View>
        <View className="flex-row gap-2">
          <MacroPill label="Carbs" grams={totals.carbsG} />
          <MacroPill label="Protein" grams={totals.proteinG} />
          <MacroPill label="Fat" grams={totals.fatG} />
        </View>
      </Card>

      <Card className="gap-4">
        <AppText variant="title">Quantity</AppText>
        {meal.basis === "serving" ? (
          <View className="flex-row items-center justify-between rounded-control bg-canvas p-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease servings"
              onPress={() => stepQuantity(-0.5)}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface active:opacity-70"
            >
              <Ionicons name="remove" size={22} color={colors.forest} />
            </Pressable>
            <AppText variant="body" className="font-body-bold text-forest">
              {quantity === 1 ? "1 serving" : `${round1(quantity)} servings`}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase servings"
              onPress={() => stepQuantity(0.5)}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-70"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <FormField
            control={control}
            name="quantity"
            label="Amount you ate (g)"
            error={errors.quantity?.message}
            keyboardType="decimal-pad"
          />
        )}
        {meal.basis === "serving" && errors.quantity?.message && (
          <AppText variant="caption" className="text-risk-high">
            {errors.quantity.message}
          </AppText>
        )}
      </Card>

      <Card className="gap-4">
        <View className="gap-1">
          <AppText variant="title">Edit details</AppText>
          <AppText variant="caption">
            Nutrition values are{" "}
            {meal.basis === "per100g" ? "per 100 g" : "per serving"}.
          </AppText>
        </View>
        <FormField
          control={control}
          name="name"
          label="Name"
          error={errors.name?.message}
        />
        <FormField
          control={control}
          name="calories"
          label="Calories (kcal)"
          error={errors.calories?.message}
          keyboardType="decimal-pad"
        />
        <FormField
          control={control}
          name="carbsG"
          label="Carbs (g)"
          error={errors.carbsG?.message}
          keyboardType="decimal-pad"
        />
        <FormField
          control={control}
          name="proteinG"
          label="Protein (g)"
          error={errors.proteinG?.message}
          keyboardType="decimal-pad"
        />
        <FormField
          control={control}
          name="fatG"
          label="Fat (g)"
          error={errors.fatG?.message}
          keyboardType="decimal-pad"
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
        title="Update"
        variant="cta"
        loading={update.isPending}
        onPress={() => onSubmit()}
      />

      <Pressable
        accessibilityRole="button"
        onPress={confirmDelete}
        className="min-h-[48px] flex-row items-center justify-center gap-2 active:opacity-70"
      >
        <Ionicons name="trash-outline" size={18} color={colors.riskHigh} />
        <AppText variant="body" className="font-body-bold text-risk-high">
          Delete this item
        </AppText>
      </Pressable>
    </View>
  );
}

export default function EditMeal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: meal, isPending } = useMeal(id);

  return (
    <Screen>
      <BackButton />
      {isPending ? null : !meal ? (
        <Card className="gap-3">
          <AppText variant="title">We couldn't find that item</AppText>
          <AppText variant="caption">
            It may have been deleted. Go back and try another.
          </AppText>
          <Button
            title="Go back"
            variant="soft"
            onPress={() => router.back()}
          />
        </Card>
      ) : (
        <EditForm meal={meal} />
      )}
    </Screen>
  );
}
