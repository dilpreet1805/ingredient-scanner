import { describe, expect, it } from "vitest";

import { labelReadingSchema, toProductCategory } from "./label-reading";

const emptyNutrients = {
  energyKcal: null,
  proteinG: null,
  carbsG: null,
  totalSugarG: null,
  addedSugarG: null,
  polyolG: null,
  fibreG: null,
  fatG: null,
  saturatedFatG: null,
  transFatG: null,
  cholesterolMg: null,
  sodiumMg: null,
};

const reading = {
  isFoodLabel: true,
  brand: "MyFitness",
  productName: "Peanut Butter",
  category: "other",
  ingredientsText: "Roasted Peanuts (100%)",
  allergenStatements: ["Contain Peanuts & Soya"],
  servingSize: "32g",
  servingsPerPack: 16,
  nutrition: {
    basis: "per100g",
    values: {
      ...emptyNutrients,
      energyKcal: { value: 637.3, lessThan: false },
      totalSugarG: { value: 2, lessThan: true },
    },
  },
};

describe("label reading", () => {
  it("accepts a complete reading", () => {
    expect(labelReadingSchema.safeParse(reading).success).toBe(true);
  });

  it("accepts a reading with no nutrition", () => {
    expect(
      labelReadingSchema.safeParse({ ...reading, nutrition: null }).success,
    ).toBe(true);
  });

  it("rejects an unknown nutrition basis", () => {
    const bad = {
      ...reading,
      nutrition: { ...reading.nutrition, basis: "perPack" },
    };
    expect(labelReadingSchema.safeParse(bad).success).toBe(false);
  });

  it("ignores fields the server adds later", () => {
    const result = labelReadingSchema.safeParse({ ...reading, newField: 1 });
    expect(result.success).toBe(true);
  });

  it("maps unknown categories to other", () => {
    expect(toProductCategory("noodles")).toBe("noodles");
    expect(toProductCategory("spread")).toBe("spread");
    expect(toProductCategory("supplement")).toBe("supplement");
    expect(toProductCategory("some_new_category")).toBe("other");
    expect(toProductCategory("constructor")).toBe("other");
    expect(toProductCategory("")).toBe("other");
  });
});
