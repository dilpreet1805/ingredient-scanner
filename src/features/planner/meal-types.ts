import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { MealType } from "@/types";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const mealMeta: Record<MealType, { label: string; icon: IconName }> = {
  breakfast: { label: "Breakfast", icon: "cafe-outline" },
  lunch: { label: "Lunch", icon: "restaurant-outline" },
  dinner: { label: "Dinner", icon: "moon-outline" },
  snack: { label: "Snacks", icon: "nutrition-outline" },
};

export const mealTypes = (
  ["breakfast", "lunch", "dinner", "snack"] as const
).map((value) => ({
  value,
  ...mealMeta[value],
}));

export function isMealType(value: unknown): value is MealType {
  return typeof value === "string" && value in mealMeta;
}

/** A sensible default for "what meal is it now?". */
export function defaultMealType(now = new Date()): MealType {
  const hour = now.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}
