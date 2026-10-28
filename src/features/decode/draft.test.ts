import { describe, expect, it } from "vitest";

import { mergeDrafts, type Draft } from "./draft";
import type { LabelReading } from "./label-reading";

const panel = (kcal: number): LabelReading["nutrition"] =>
  ({
    basis: "per100g",
    values: { energyKcal: { value: kcal, lessThan: false } },
  }) as unknown as LabelReading["nutrition"];

function draft(
  reading: Partial<LabelReading>,
  extra: Partial<Draft> = {},
): Draft {
  const full: LabelReading = {
    isFoodLabel: true,
    brand: null,
    productName: null,
    category: "other",
    ingredientsText: null,
    allergenStatements: [],
    servingSize: null,
    servingsPerPack: null,
    nutrition: null,
    ...reading,
  };
  return {
    reading: full,
    missing: [],
    warnings: [],
    photoUris: ["file:///x.jpg"],
    quota: { used: 1, limit: 20, subscriber: false },
    ...extra,
  };
}

describe("mergeDrafts", () => {
  it("takes ingredients from the second photo when the first has none", () => {
    const first = draft({ nutrition: panel(250) });
    const second = draft({ ingredientsText: "SUGAR, SALT" });
    const merged = mergeDrafts(first, second);
    expect(merged.reading.ingredientsText).toBe("SUGAR, SALT");
    expect(merged.missing).toEqual([]);
  });

  it("takes the nutrition panel, and its warnings, from the second photo", () => {
    const first = draft({ ingredientsText: "OATS" });
    const second = draft(
      { nutrition: panel(380) },
      { warnings: ["energy_mismatch"] },
    );
    const merged = mergeDrafts(first, second);
    expect(merged.reading.nutrition).toEqual(panel(380));
    expect(merged.warnings).toEqual(["energy_mismatch"]);
  });

  it("keeps the first photo's values when both have them", () => {
    const first = draft({ ingredientsText: "A", nutrition: panel(100) });
    const second = draft({ ingredientsText: "B", nutrition: panel(200) });
    const merged = mergeDrafts(first, second);
    expect(merged.reading.ingredientsText).toBe("A");
    expect(merged.reading.nutrition).toEqual(panel(100));
  });

  it("treats blank text as missing", () => {
    const merged = mergeDrafts(
      draft({ ingredientsText: "   " }),
      draft({ ingredientsText: "MILK" }),
    );
    expect(merged.reading.ingredientsText).toBe("MILK");
  });

  it("joins allergens without repeats and fills a generic category", () => {
    const merged = mergeDrafts(
      draft({ allergenStatements: ["Contains soy"], category: "other" }),
      draft({
        allergenStatements: ["Contains soy", "Contains milk"],
        category: "sweets",
      }),
    );
    expect(merged.reading.allergenStatements).toEqual([
      "Contains soy",
      "Contains milk",
    ]);
    expect(merged.reading.category).toBe("sweets");
  });

  it("reports what is still missing, keeps both photos, and uses the newer quota", () => {
    const merged = mergeDrafts(
      draft({}),
      draft(
        {},
        {
          photoUris: ["file:///y.jpg"],
          quota: { used: 2, limit: 20, subscriber: false },
        },
      ),
    );
    expect(merged.missing).toEqual(["ingredients", "nutrition"]);
    expect(merged.photoUris).toEqual(["file:///x.jpg", "file:///y.jpg"]);
    expect(merged.quota.used).toBe(2);
  });
});
