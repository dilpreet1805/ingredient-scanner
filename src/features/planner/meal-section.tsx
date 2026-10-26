import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { ProductThumbnail } from "@/components/product-thumbnail";
import { AppText } from "@/components/ui/app-text";
import { colors } from "@/constants/colors";
import { cn } from "@/lib/cn";
import { describeQuantity, itemTotals, sumNutrition } from "@/lib/meal-math";
import type { MealItem, MealType } from "@/types";
import { mealMeta } from "./meal-types";

function MealItemRow({ item }: { item: MealItem }) {
  const kcal = Math.round(itemTotals(item).calories);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${kcal} calories. Edit`}
      onPress={() =>
        router.push({ pathname: "/planner/[id]", params: { id: item.id } })
      }
      className="flex-row items-center gap-3 py-2 active:opacity-70"
    >
      <ProductThumbnail category={item.category ?? "other"} />
      <View className="flex-1">
        <AppText
          variant="body"
          className="font-body-semibold"
          numberOfLines={1}
        >
          {item.name}
        </AppText>
        <AppText variant="caption">{describeQuantity(item)}</AppText>
      </View>
      <AppText variant="body" className="font-body-bold text-forest">
        {kcal} kcal
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

type Props = {
  type: MealType;
  items: MealItem[];
  isLast: boolean;
  onAdd: () => void;
};

export function MealSection({ type, items, isLast, onAdd }: Props) {
  const { label, icon } = mealMeta[type];
  const total = Math.round(sumNutrition(items.map(itemTotals)).calories);

  return (
    <View
      className={cn("gap-1 pb-2", !isLast && "border-b border-primary-soft")}
    >
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <AppText variant="body" className="flex-1 font-body-bold text-forest">
          {label}
        </AppText>
        {items.length > 0 && <AppText variant="caption">{total} kcal</AppText>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add to ${label}`}
          onPress={onAdd}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-primary-soft"
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>
      {items.map((item) => (
        <MealItemRow key={item.id} item={item} />
      ))}
    </View>
  );
}
