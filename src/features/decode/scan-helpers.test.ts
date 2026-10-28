import { describe, expect, it } from "vitest";

import type { NewScan, ScanNutrition } from "@/types";

import type { Draft } from "./draft";
import type { LabelReading } from "./label-reading";
import { draftToNewScan } from "./new-scan";
import { mealReadyFrom } from "./scan-nutrition";
import { rowToScan, scanToParams, type ScanRow } from "./scan-row";
import { additiveLine, scanTitle } from "./scan-text";

const amount = (value: number, lessThan = false) => ({ value, lessThan });

const panel = (basis: ScanNutrition["basis"], values: object = {}): ScanNutrition =>
  ({
    basis,
    // All 12 keys, like a real reading: the real schema rejects a panel with a key missing.
    values: {
      energyKcal: amount(362.5),
      proteinG: amount(1.5),
      carbsG: amount(13.4),
      totalSugarG: null,
      addedSugarG: null,
      polyolG: null,
      fibreG: null,
      fatG: amount(33.7),
      saturatedFatG: null,
      transFatG: null,
      cholesterolMg: null,
      sodiumMg: null,
      ...values,
    },
  }) as unknown as ScanNutrition;

describe("scanTitle", () => {
  it("joins brand and name, and never repeats the brand", () => {
    expect(scanTitle({ brand: "Dr. Oetker", productName: "FunFoods Veg Mayonnaise" })).toBe(
      "Dr. Oetker FunFoods Veg Mayonnaise",
    );
    expect(scanTitle({ brand: "Dr. Oetker", productName: "Dr. Oetker Veg Mayonnaise" })).toBe(
      "Dr. Oetker Veg Mayonnaise",
    );
    expect(scanTitle({ brand: "MUSCLEBLAZE", productName: "BIOZYME 5-in-1" })).toBe(
      "MUSCLEBLAZE BIOZYME 5-in-1",
    );
  });

  it("handles a missing brand, a missing name, or neither", () => {
    expect(scanTitle({ brand: null, productName: "Tomato Ketchup" })).toBe("Tomato Ketchup");
    expect(scanTitle({ brand: "Kissan", productName: null })).toBe("Kissan");
    expect(scanTitle({ brand: "  ", productName: "" })).toBe("Unnamed product");
  });
});

describe("additiveLine", () => {
  it("states a count and nothing else", () => {
    expect(additiveLine("Water, Sugar")).toBe("No additive codes found");
    expect(additiveLine("Acid (INS330)")).toBe("1 additive code");
    expect(additiveLine("Acid (INS330), Gum (INS415), Colour (E 102)")).toBe("3 additive codes");
  });
});

describe("mealReadyFrom", () => {
  it("logs per 100 g by weight and per serving by servings", () => {
    expect(mealReadyFrom(panel("per100g"))).toEqual({
      basis: "per100g",
      nutrition: { calories: 362.5, carbsG: 13.4, proteinG: 1.5, fatG: 33.7 },
    });
    expect(mealReadyFrom(panel("perServing"))?.basis).toBe("serving");
  });

  it("returns null for per 100 ml, for no panel, and for a missing macro", () => {
    expect(mealReadyFrom(panel("per100ml"))).toBeNull();
    expect(mealReadyFrom(null)).toBeNull();
    expect(mealReadyFrom(panel("per100g", { fatG: null }))).toBeNull();
    expect(mealReadyFrom(panel("per100g", { energyKcal: null }))).toBeNull();
  });
});

function draft(reading: Partial<LabelReading>, warnings: string[] = []): Draft {
  return {
    reading: {
      isFoodLabel: true,
      brand: "Dr. Oetker",
      productName: "FunFoods Veg Mayonnaise",
      category: "sauce",
      ingredientsText: "Water, Sugar, Thickener (INS415)",
      allergenStatements: ["CONTAINS MILK & SOY"],
      servingSize: "15 g",
      servingsPerPack: 6,
      nutrition: panel("per100g"),
      ...reading,
    },
    missing: [],
    warnings,
    photoUris: ["file:///prepared.jpg"],
    quota: { used: 1, limit: 20, subscriber: false },
  };
}

describe("draftToNewScan", () => {
  it("keeps everything that was read and the confirmed flag", () => {
    const scan = draftToNewScan(draft({}, ["energy_mismatch"]), { confirmed: true, typedName: "" });
    expect(scan).toMatchObject({
      brand: "Dr. Oetker",
      productName: "FunFoods Veg Mayonnaise",
      category: "sauce",
      ingredientsText: "Water, Sugar, Thickener (INS415)",
      allergenStatements: ["CONTAINS MILK & SOY"],
      servingSize: "15 g",
      warnings: ["energy_mismatch"],
      barcode: null,
      confirmed: true,
      photoUris: ["file:///prepared.jpg"],
    });
  });

  it("refuses to save without an ingredient list", () => {
    expect(draftToNewScan(draft({ ingredientsText: null }), { confirmed: true, typedName: "" })).toBeNull();
    expect(draftToNewScan(draft({ ingredientsText: "  " }), { confirmed: true, typedName: "" })).toBeNull();
  });

  it("uses the typed name only when the label gave no brand and no name", () => {
    const blank = draft({ brand: "", productName: null });
    expect(draftToNewScan(blank, { confirmed: false, typedName: "  My jam " })?.productName).toBe("My jam");
    expect(draftToNewScan(draft({}), { confirmed: false, typedName: "Ignored" })?.productName).toBe(
      "FunFoods Veg Mayonnaise",
    );
    expect(draftToNewScan(blank, { confirmed: false, typedName: "" })?.productName).toBeNull();
  });

  it("maps an unknown category to other", () => {
    expect(draftToNewScan(draft({ category: "mystery" }), { confirmed: false, typedName: "" })?.category).toBe(
      "other",
    );
  });
});

describe("saving and reading a scan", () => {
  const scan: NewScan = draftToNewScan(draft({}, ["energy_mismatch"]), { confirmed: true, typedName: "" })!;

  function rowFrom(overrides: Partial<ScanRow> = {}): ScanRow {
    const p = scanToParams(scan, "id-1", "2026-10-28T10:00:00.000Z", ["a.jpg", "b.jpg"]);
    return {
      id: p[0] as string,
      created_at: p[1] as string,
      pinned: 0,
      brand: p[2] as string | null,
      product_name: p[3] as string | null,
      category: p[4] as string,
      ingredients_text: p[5] as string,
      allergen_statements: p[6] as string,
      serving_size: p[7] as string | null,
      servings_per_pack: p[8] as number | null,
      nutrition: p[9] as string | null,
      warnings: p[10] as string,
      barcode: p[11] as string | null,
      confirmed: p[12] as number,
      image_files: p[13] as string,
      ...overrides,
    };
  }

  it("gives back what was saved", () => {
    const read = rowToScan(rowFrom({ pinned: 1 }), (file) => `file:///images/${file}`);
    expect(read).toMatchObject({
      id: "id-1",
      pinned: true,
      brand: "Dr. Oetker",
      category: "sauce",
      allergenStatements: ["CONTAINS MILK & SOY"],
      warnings: ["energy_mismatch"],
      confirmed: true,
      imageUris: ["file:///images/a.jpg", "file:///images/b.jpg"],
    });
    expect(read.nutrition).toEqual(scan.nutrition);
  });

  it("falls back safely when stored JSON is damaged or has the wrong shape", () => {
    const read = rowToScan(
      rowFrom({ allergen_statements: "{oops", warnings: '{"a":1}', nutrition: '{"basis":"weird"}', image_files: "[1]" }),
      (file) => file,
    );
    expect(read.allergenStatements).toEqual([]);
    expect(read.warnings).toEqual([]);
    expect(read.nutrition).toBeNull();
    expect(read.imageUris).toEqual([]);
  });

  it("maps an unknown stored category to other", () => {
    expect(rowToScan(rowFrom({ category: "from_the_future" }), (f) => f).category).toBe("other");
  });
});
