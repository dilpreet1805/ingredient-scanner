import { describe, expect, it } from "vitest";

import { describeQuantity, itemTotals, sumNutrition } from "./meal-math";

describe("meal math", () => {
  it("scales per-serving nutrition by servings", () => {
    const totals = itemTotals({
      basis: "serving",
      quantity: 1.5,
      nutrition: { calories: 200, carbsG: 30, proteinG: 5, fatG: 4 },
    });
    expect(totals).toEqual({
      calories: 300,
      carbsG: 45,
      proteinG: 7.5,
      fatG: 6,
    });
  });

  it("scales per-100 g nutrition by grams", () => {
    const totals = itemTotals({
      basis: "per100g",
      quantity: 150,
      nutrition: { calories: 250, carbsG: 43, proteinG: 10, fatG: 3 },
    });
    expect(totals).toEqual({
      calories: 375,
      carbsG: 64.5,
      proteinG: 15,
      fatG: 4.5,
    });
  });

  it("adds items together", () => {
    const total = sumNutrition([
      { calories: 100, carbsG: 10, proteinG: 1, fatG: 2 },
      { calories: 50, carbsG: 5, proteinG: 4, fatG: 1 },
    ]);
    expect(total).toEqual({ calories: 150, carbsG: 15, proteinG: 5, fatG: 3 });
  });

  it("describes quantities", () => {
    expect(describeQuantity({ basis: "serving", quantity: 1 })).toBe(
      "1 serving",
    );
    expect(describeQuantity({ basis: "serving", quantity: 1.5 })).toBe(
      "1.5 servings",
    );
    expect(describeQuantity({ basis: "per100g", quantity: 150 })).toBe("150 g");
  });
});
