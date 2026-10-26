import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { colors } from "@/constants/colors";
import { useScans } from "@/features/decode/use-scans";
import { toNumber } from "@/features/planner/meal-schema";
import { MealTypePicker } from "@/features/planner/meal-type-picker";
import { defaultMealType, isMealType } from "@/features/planner/meal-types";
import { usePlannerDate } from "@/features/planner/planner-state";
import { useAddMeal } from "@/features/planner/use-meals";
import { cn } from "@/lib/cn";
import { formatDayLabel, toDateKey } from "@/lib/dates";
import { itemTotals } from "@/lib/meal-math";
import type { MealType } from "@/types";

export default function FromMyScans() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const date = usePlannerDate((s) => s.date);
  const { data: scans = [] } = useScans();
  const addMeal = useAddMeal();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [grams, setGrams] = useState("100");
  const [type, setType] = useState<MealType>(
    isMealType(typeParam) ? typeParam : defaultMealType(),
  );
  const [error, setError] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = scans.filter((scan) =>
    (scan.productName ?? "").toLowerCase().includes(needle),
  );
  const selected = scans.find((scan) => scan.id === selectedId) ?? null;
  const dayLabel = formatDayLabel(date, toDateKey(new Date())).toLowerCase();

  const preview =
    selected?.nutritionPer100g &&
    itemTotals({
      basis: "per100g",
      quantity: toNumber(grams),
      nutrition: selected.nutritionPer100g,
    });

  const add = async () => {
    if (!selected?.nutritionPer100g) return;
    const amount = toNumber(grams);
    if (amount <= 0 || amount > 5000) {
      setError("Enter an amount between 1 and 5000 g.");
      return;
    }
    setError(null);
    try {
      await addMeal.mutateAsync({
        date,
        type,
        name: selected.productName ?? "Scanned product",
        basis: "per100g",
        quantity: amount,
        nutrition: selected.nutritionPer100g,
        source: "scan",
        scanId: selected.id,
        category: selected.category,
      });
      router.dismissTo("/planner");
    } catch {
      setError("We couldn't add this. Please try again.");
    }
  };

  return (
    <Screen>
      <BackButton />
      <View className="gap-1">
        <AppText variant="heading">From my scans</AppText>
        <AppText variant="caption">
          Pick a product you've decoded and enter how much you ate. Scanning
          alone never counts as eating.
        </AppText>
      </View>

      <TextField
        label="Search scanned products"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. bread"
        autoCorrect={false}
      />

      {scans.length === 0 ? (
        <Card className="gap-3">
          <AppText variant="title">No scanned products yet</AppText>
          <AppText variant="caption">
            Decode a product and add a nutrition photo to see it here.
          </AppText>
          <Button
            title="Go to Decode"
            variant="soft"
            onPress={() => router.dismissTo("/decode")}
          />
        </Card>
      ) : (
        <Card className="gap-1">
          {visible.length === 0 && (
            <AppText variant="caption">No products match your search.</AppText>
          )}
          {visible.map((scan, index) => {
            const hasData = scan.nutritionPer100g !== null;
            const isSelected = scan.id === selectedId;
            return (
              <Pressable
                key={scan.id}
                disabled={!hasData}
                accessibilityRole="button"
                accessibilityState={{
                  selected: isSelected,
                  disabled: !hasData,
                }}
                onPress={() => {
                  setSelectedId(scan.id);
                  setError(null);
                }}
                className={cn(
                  "flex-row items-center gap-3 rounded-control px-2 py-3",
                  index < visible.length - 1 && "border-b border-primary-soft",
                  isSelected && "bg-primary-soft",
                  !hasData && "opacity-50",
                )}
              >
                <ProductThumbnail category={scan.category} />
                <View className="flex-1">
                  <AppText
                    variant="body"
                    className="font-body-semibold"
                    numberOfLines={1}
                  >
                    {scan.productName ?? "Unnamed product"}
                  </AppText>
                  <AppText variant="caption">
                    {scan.nutritionPer100g
                      ? `Per 100 g: ${Math.round(scan.nutritionPer100g.calories)} kcal`
                      : "No nutrition photo, can't add by weight"}
                  </AppText>
                </View>
                {isSelected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                  />
                ) : (
                  hasData && (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.muted}
                    />
                  )
                )}
              </Pressable>
            );
          })}
        </Card>
      )}

      {selected?.nutritionPer100g && (
        <Card className="gap-4">
          <AppText variant="title" numberOfLines={1}>
            {selected.productName ?? "Scanned product"}
          </AppText>
          <TextField
            label="Amount you ate (g)"
            value={grams}
            onChangeText={setGrams}
            keyboardType="decimal-pad"
            error={error ?? undefined}
          />
          {preview && (
            <AppText variant="caption" className="text-ink">
              That's about {Math.round(preview.calories)} kcal ·{" "}
              {Math.round(preview.carbsG)} g carbs ·{" "}
              {Math.round(preview.proteinG)} g protein ·{" "}
              {Math.round(preview.fatG)} g fat
            </AppText>
          )}
          <MealTypePicker value={type} onChange={setType} />
          <Button
            title={`Add to ${dayLabel}`}
            variant="cta"
            loading={addMeal.isPending}
            onPress={add}
          />
        </Card>
      )}
    </Screen>
  );
}
