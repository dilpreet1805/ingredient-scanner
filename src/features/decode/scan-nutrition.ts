import type { MealBasis, Nutrition, ScanNutrition } from "@/types";

export type MealReady = { basis: MealBasis; nutrition: Nutrition };

/**
 * Turns a scanned nutrition panel into what the Planner can log.
 * Per 100 g is logged by weight and per serving by number of servings.
 * Per 100 ml, or a panel without all four of energy, carbs, protein and fat, returns null:
 * we never log a missing value as zero.
 */
export function mealReadyFrom(panel: ScanNutrition | null): MealReady | null {
  if (!panel) return null;

  let basis: MealBasis;
  if (panel.basis === "per100g") basis = "per100g";
  else if (panel.basis === "perServing") basis = "serving";
  else return null;

  const { energyKcal, carbsG, proteinG, fatG } = panel.values;
  if (!energyKcal || !carbsG || !proteinG || !fatG) return null;

  return {
    basis,
    nutrition: {
      calories: energyKcal.value,
      carbsG: carbsG.value,
      proteinG: proteinG.value,
      fatG: fatG.value,
    },
  };
}
