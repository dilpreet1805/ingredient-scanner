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
import { mealReadyFrom } from "@/features/decode/scan-nutrition";
import { scanTitle } from "@/features/decode/scan-text";
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

/** Why a scan can't be added, in plain words. Null when it can be. */
function blockedReason(panelBasis: string | undefined, hasPanel: boolean) {
  if (!hasPanel) return "No nutrition facts were read, can't add";
  if (panelBasis === "per100ml") return "Per 100 ml only, can't add yet";
  return "Nutrition facts are incomplete, can't add";
}

export default function FromMyScans() {
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const date = usePlannerDate((s) => s.date);
  const { data: scans = [] } = useScans();
  const addMeal = useAddMeal();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState("");
  const [type, setType] = useState<MealType>(
    isMealType(typeParam) ? typeParam : defaultMealType(),
  );
  const [error, setError] = useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const visible = scans.filter((scan) =>
    scanTitle(scan).toLowerCase().includes(needle),
  );
  const selected = scans.find((scan) => scan.id === selectedId) ?? null;
  const ready = selected ? mealReadyFrom(selected.nutrition) : null;
  const dayLabel = formatDayLabel(date, toDateKey(new Date())).toLowerCase();

  // Weight for per-100 g products, number of servings for per-serving ones.
  const byWeight = ready?.basis === "per100g";
  const range = byWeight
    ? { min: 1, max: 5000, unit: "g" }
    : { min: 0.1, max: 50, unit: "servings" };

  const quantity = toNumber(amountText);
  const quantityOk =
    Number.isFinite(quantity) && quantity >= range.min && quantity <= range.max;

  const preview =
    ready && quantityOk
      ? itemTotals({
          basis: ready.basis,
          quantity,
          nutrition: ready.nutrition,
        })
      : null;

  const choose = (scanId: string, basis: string) => {
    setSelectedId(scanId);
    setAmountText(basis === "per100g" ? "100" : "1");
    setError(null);
  };

  const add = async () => {
    if (!selected || !ready) return;
    if (!quantityOk) {
      setError(
        byWeight
          ? "Enter an amount between 1 and 5000 g."
          : "Enter between 0.1 and 50 servings.",
      );
      return;
    }
    setError(null);
    try {
      await addMeal.mutateAsync({
        date,
        type,
        name: scanTitle(selected),
        basis: ready.basis,
        quantity,
        nutrition: ready.nutrition,
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
          <AppText variant="caption">Decode a product to see it here.</AppText>
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
            const rowReady = mealReadyFrom(scan.nutrition);
            const usable = rowReady !== null;
            const isSelected = scan.id === selectedId;
            return (
              <Pressable
                key={scan.id}
                disabled={!rowReady}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !usable }}
                onPress={() => rowReady && choose(scan.id, rowReady.basis)}
                className={cn(
                  "flex-row items-center gap-3 rounded-control px-2 py-3",
                  index < visible.length - 1 && "border-b border-primary-soft",
                  isSelected && "bg-primary-soft",
                  !usable && "opacity-50",
                )}
              >
                <ProductThumbnail category={scan.category} />
                <View className="flex-1">
                  <AppText
                    variant="body"
                    className="font-body-semibold"
                    numberOfLines={1}
                  >
                    {scanTitle(scan)}
                  </AppText>
                  <AppText variant="caption">
                    {rowReady
                      ? `${rowReady.basis === "per100g" ? "Per 100 g" : "Per serving"}: ${Math.round(rowReady.nutrition.calories)} kcal`
                      : blockedReason(
                          scan.nutrition?.basis,
                          scan.nutrition !== null,
                        )}
                  </AppText>
                </View>
                {isSelected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                  />
                ) : (
                  usable && (
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

      {selected && ready && (
        <Card className="gap-4">
          <AppText variant="title" numberOfLines={1}>
            {scanTitle(selected)}
          </AppText>
          {!byWeight && selected.servingSize && (
            <AppText variant="caption">
              One serving: {selected.servingSize}
            </AppText>
          )}
          <TextField
            label={byWeight ? "Amount you ate (g)" : "Servings you ate"}
            value={amountText}
            onChangeText={setAmountText}
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
