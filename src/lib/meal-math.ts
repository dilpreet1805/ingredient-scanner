import type { MealItem, Nutrition } from "@/types";

export const ZERO_NUTRITION: Nutrition = {
  calories: 0,
  carbsG: 0,
  proteinG: 0,
  fatG: 0,
};

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    calories: n.calories * factor,
    carbsG: n.carbsG * factor,
    proteinG: n.proteinG * factor,
    fatG: n.fatG * factor,
  };
}

/** What you actually ate: the per-serving or per-100 g values times the quantity. */
export function itemTotals(
  item: Pick<MealItem, "basis" | "quantity" | "nutrition">,
): Nutrition {
  const factor = item.basis === "per100g" ? item.quantity / 100 : item.quantity;
  return scaleNutrition(item.nutrition, factor);
}

export function sumNutrition(list: Nutrition[]): Nutrition {
  return list.reduce(
    (total, n) => ({
      calories: total.calories + n.calories,
      carbsG: total.carbsG + n.carbsG,
      proteinG: total.proteinG + n.proteinG,
      fatG: total.fatG + n.fatG,
    }),
    ZERO_NUTRITION,
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function describeQuantity(
  item: Pick<MealItem, "basis" | "quantity">,
): string {
  if (item.basis === "per100g") return `${round1(item.quantity)} g`;
  return item.quantity === 1
    ? "1 serving"
    : `${round1(item.quantity)} servings`;
}
