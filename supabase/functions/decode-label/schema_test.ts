import { assertEquals, assertFalse } from "@std/assert";

import {
  checkReading,
  LABEL_JSON_SCHEMA,
  modelOutputSchema,
  parsePrinted,
  toReading,
  type LabelReading,
  type ModelOutput,
  type Nutrients,
} from "./schema.ts";

const value = (v: number, lessThan = false) => ({ value: v, lessThan });

const empty: Nutrients = {
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

// The numbers printed on the MyFitness peanut butter label.
const peanutButter100g: Nutrients = {
  ...empty,
  energyKcal: value(637.3),
  proteinG: value(31.4),
  carbsG: value(19.4),
  totalSugarG: value(2, true),
  fibreG: value(8.2),
  fatG: value(48.2),
  sodiumMg: value(11.5),
};

// The Kissan jam: energy 285.57, protein 0.3, carbs 70.5, fat 0.1 per 100 g.
const jam100g: Nutrients = {
  ...empty,
  proteinG: value(0.3),
  carbsG: value(70.5),
  fatG: value(0.1),
};

const base: LabelReading = {
  isFoodLabel: true,
  brand: "MyFitness",
  productName: "Peanut Butter",
  category: "spread",
  ingredientsText: "Roasted Peanuts (100%)",
  allergenStatements: ["Contain Peanuts & Soya"],
  servingSize: "32g",
  servingsPerPack: 16,
  nutrition: { basis: "per100g", values: peanutButter100g },
};

const output: ModelOutput = {
  isFoodLabel: true,
  brand: "MyFitness",
  productName: "Peanut Butter",
  category: "spread",
  ingredientsText: "Roasted Peanuts (100%)",
  allergenStatements: [],
  servingSize: "32g",
  servingsPerPack: 16,
  nutritionBasis: "per100g",
  nutrition: [
    { nutrient: "energyKcal", printed: "637.3" },
    { nutrient: "proteinG", printed: "31.4" },
    { nutrient: "totalSugarG", printed: "<2" },
  ],
};

function mustCheck(reading: LabelReading) {
  const result = checkReading(reading);
  if (!result.ok) throw new Error("expected an accepted reading");
  return result;
}

Deno.test("parsePrinted reads typical label text", () => {
  assertEquals(parsePrinted("62.6"), { value: 62.6, lessThan: false });
  assertEquals(parsePrinted("<2"), { value: 2, lessThan: true });
  assertEquals(parsePrinted("< 0.5 g"), { value: 0.5, lessThan: true });
  assertEquals(parsePrinted("0.0"), { value: 0, lessThan: false });
  assertEquals(parsePrinted("2,603"), { value: 2603, lessThan: false });
  assertEquals(parsePrinted("1,5"), { value: 1.5, lessThan: false });
  assertEquals(parsePrinted(".5"), { value: 0.5, lessThan: false });
  assertEquals(parsePrinted("NIL"), { value: 0, lessThan: false });
});

Deno.test("parsePrinted gives no value for words", () => {
  assertEquals(parsePrinted("TRACE"), null);
  assertEquals(parsePrinted("NA"), null);
  assertEquals(parsePrinted("--"), null);
  assertEquals(parsePrinted(""), null);
});

Deno.test("a correctly read label passes cleanly", () => {
  const result = mustCheck(base);
  assertEquals(result.missing, []);
  assertEquals(result.warnings, []);
});

Deno.test("a misread energy value is flagged but kept", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: { ...peanutButter100g, energyKcal: value(63.7) },
    },
  });
  assertEquals(result.warnings, ["energy_mismatch"]);
  assertEquals(result.reading.nutrition?.values.energyKcal?.value, 63.7);
});

Deno.test("a photo that is not a food label is rejected", () => {
  assertEquals(checkReading({ ...base, isFoodLabel: false }), {
    ok: false,
    reason: "not_a_label",
  });
});

Deno.test("impossible values are dropped and reported", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: { ...peanutButter100g, fatG: value(480) },
    },
  });
  assertEquals(result.reading.nutrition, null);
  assertEquals(result.warnings, ["values_out_of_range"]);
  assertEquals(result.missing, ["nutrition"]);
});

Deno.test("missing ingredients are reported", () => {
  const result = mustCheck({ ...base, ingredientsText: null });
  assertEquals(result.missing, ["ingredients"]);
});

Deno.test("text is trimmed and capped", () => {
  const result = mustCheck({
    ...base,
    ingredientsText: "   ",
    allergenStatements: ["x".repeat(500), "  "],
  });
  assertEquals(result.reading.ingredientsText, null);
  assertEquals(result.reading.allergenStatements.length, 1);
  assertEquals(result.reading.allergenStatements[0].length, 200);
});

Deno.test("printed text becomes a full nutrient table", () => {
  const reading = toReading(output);
  assertEquals(reading.nutrition?.basis, "per100g");
  assertEquals(reading.nutrition?.values.proteinG, {
    value: 31.4,
    lessThan: false,
  });
  assertEquals(reading.nutrition?.values.totalSugarG, {
    value: 2,
    lessThan: true,
  });
  assertEquals(reading.nutrition?.values.fibreG, null);
});

Deno.test("the first entry wins when a nutrient is repeated", () => {
  const reading = toReading({
    ...output,
    nutrition: [
      { nutrient: "proteinG", printed: "10" },
      { nutrient: "proteinG", printed: "99" },
    ],
  });
  assertEquals(reading.nutrition?.values.proteinG?.value, 10);
});

Deno.test("empty-string and zero placeholders become null", () => {
  const result = mustCheck(
    toReading({
      ...output,
      brand: "",
      servingSize: "",
      servingsPerPack: 0,
      ingredientsText: "",
    }),
  );
  assertEquals(result.reading.brand, null);
  assertEquals(result.reading.servingSize, null);
  assertEquals(result.reading.servingsPerPack, null);
  assertEquals(result.missing, ["ingredients"]);
});

Deno.test("TRACE and less-than-zero entries are ignored", () => {
  const reading = toReading({
    ...output,
    nutrition: [
      { nutrient: "saturatedFatG", printed: "TRACE" },
      { nutrient: "fatG", printed: "<0" },
      { nutrient: "proteinG", printed: "0.3" },
    ],
  });
  assertEquals(reading.nutrition?.values.saturatedFatG, null);
  assertEquals(reading.nutrition?.values.fatG, null);
  assertEquals(reading.nutrition?.values.proteinG?.value, 0.3);
});

Deno.test("a block with only meaningless entries becomes null", () => {
  const reading = toReading({
    ...output,
    nutrition: [{ nutrient: "fatG", printed: "<0" }],
  });
  assertEquals(reading.nutrition, null);
});

Deno.test("a label with no nutrition information reports it as missing", () => {
  const result = mustCheck(
    toReading({ ...output, nutritionBasis: "none", nutrition: [] }),
  );
  assertEquals(result.reading.nutrition, null);
  assertEquals(result.missing, ["nutrition"]);
});

Deno.test("a per-serve-only label with polyols passes without warnings", () => {
  // The GoZero ice cream: per serve (100 ml), 10 g of polyols.
  const iceCream: ModelOutput = {
    ...output,
    productName: "Medium Fat Ice Cream",
    category: "frozen",
    servingSize: "100ml",
    nutritionBasis: "perServing",
    nutrition: [
      { nutrient: "energyKcal", printed: "99" },
      { nutrient: "fatG", printed: "4.8" },
      { nutrient: "saturatedFatG", printed: "2.7" },
      { nutrient: "transFatG", printed: "0.0" },
      { nutrient: "cholesterolMg", printed: "8.2" },
      { nutrient: "carbsG", printed: "19.7" },
      { nutrient: "totalSugarG", printed: "3.9" },
      { nutrient: "addedSugarG", printed: "0.0" },
      { nutrient: "polyolG", printed: "10.0" },
      { nutrient: "fibreG", printed: "4.8" },
      { nutrient: "proteinG", printed: "2.7" },
      { nutrient: "sodiumMg", printed: "45.3" },
    ],
  };
  const result = mustCheck(toReading(iceCream));
  assertEquals(result.reading.nutrition?.basis, "perServing");
  assertEquals(result.warnings, []);
  assertEquals(result.missing, []);
});

Deno.test("the JSON schema has no union types", () => {
  const schemaText = JSON.stringify(LABEL_JSON_SCHEMA);
  assertFalse(schemaText.includes("anyOf"));
  assertFalse(schemaText.includes('"type":['));
});

Deno.test("the JSON schema and the Zod schema list the same fields", () => {
  assertEquals(
    Object.keys(LABEL_JSON_SCHEMA.properties).sort(),
    Object.keys(modelOutputSchema.shape).sort(),
  );
});

Deno.test("a 6-for-8 digit slip in energy is flagged", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: { ...jam100g, energyKcal: value(265.5) },
    },
  });
  assertEquals(result.warnings, ["energy_mismatch"]);
});

Deno.test("the correctly read jam energy passes", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: { ...jam100g, energyKcal: value(285.57) },
    },
  });
  assertEquals(result.warnings, []);
});

Deno.test("a block with no energy is reported as incomplete", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: { ...peanutButter100g, energyKcal: null },
    },
  });
  assertEquals(result.warnings, ["incomplete_nutrition"]);
});

Deno.test("added sugars above total sugars are flagged", () => {
  const result = mustCheck({
    ...base,
    nutrition: {
      basis: "per100g",
      values: {
        ...peanutButter100g,
        totalSugarG: value(5),
        addedSugarG: value(9),
      },
    },
  });
  assertEquals(result.warnings, ["sugar_inconsistent"]);
});
