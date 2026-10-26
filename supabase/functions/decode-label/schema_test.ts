import { assertEquals, assertFalse } from "@std/assert";

import {
  checkReading,
  LABEL_JSON_SCHEMA,
  modelOutputSchema,
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
  category: "other",
  ingredientsText: "Roasted Peanuts (100%)",
  allergenStatements: ["Contain Peanuts & Soya"],
  servingSize: "32g",
  servingsPerPack: 16,
  per100g: peanutButter100g,
};

const output: ModelOutput = {
  isFoodLabel: true,
  brand: "MyFitness",
  productName: "Peanut Butter",
  category: "other",
  ingredientsText: "Roasted Peanuts (100%)",
  allergenStatements: [],
  servingSize: "32g",
  servingsPerPack: 16,
  per100g: [
    { nutrient: "energyKcal", value: 637.3, lessThan: false },
    { nutrient: "proteinG", value: 31.4, lessThan: false },
    { nutrient: "totalSugarG", value: 2, lessThan: true },
  ],
};

function mustCheck(reading: LabelReading) {
  const result = checkReading(reading);
  if (!result.ok) throw new Error("expected an accepted reading");
  return result;
}

Deno.test("a correctly read label passes cleanly", () => {
  const result = mustCheck(base);
  assertEquals(result.missing, []);
  assertEquals(result.warnings, []);
});

Deno.test("a misread energy value is flagged but kept", () => {
  const result = mustCheck({
    ...base,
    per100g: { ...peanutButter100g, energyKcal: value(63.7) },
  });
  assertEquals(result.warnings, ["energy_mismatch"]);
  assertEquals(result.reading.per100g?.energyKcal?.value, 63.7);
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
    per100g: { ...peanutButter100g, fatG: value(480) },
  });
  assertEquals(result.reading.per100g, null);
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

Deno.test("a sparse list becomes a full nutrient table", () => {
  const reading = toReading(output);
  assertEquals(reading.per100g?.proteinG, { value: 31.4, lessThan: false });
  assertEquals(reading.per100g?.totalSugarG, { value: 2, lessThan: true });
  assertEquals(reading.per100g?.fibreG, null);
});

Deno.test("the first entry wins when a nutrient is repeated", () => {
  const reading = toReading({
    ...output,
    per100g: [
      { nutrient: "proteinG", value: 10, lessThan: false },
      { nutrient: "proteinG", value: 99, lessThan: false },
    ],
  });
  assertEquals(reading.per100g?.proteinG?.value, 10);
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

Deno.test("a less-than-zero entry is ignored", () => {
  const reading = toReading({
    ...output,
    per100g: [
      { nutrient: "saturatedFatG", value: 0, lessThan: true },
      { nutrient: "proteinG", value: 0.3, lessThan: false },
    ],
  });
  assertEquals(reading.per100g?.saturatedFatG, null);
  assertEquals(reading.per100g?.proteinG?.value, 0.3);
});

Deno.test("a block with only meaningless entries becomes null", () => {
  const reading = toReading({
    ...output,
    per100g: [{ nutrient: "fatG", value: 0, lessThan: true }],
  });
  assertEquals(reading.per100g, null);
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
    per100g: { ...jam100g, energyKcal: value(265.5) },
  });
  assertEquals(result.warnings, ["energy_mismatch"]);
});

Deno.test("the correctly read jam energy passes", () => {
  const result = mustCheck({
    ...base,
    per100g: { ...jam100g, energyKcal: value(285.57) },
  });
  assertEquals(result.warnings, []);
});

Deno.test("a block with no energy is reported as incomplete", () => {
  const result = mustCheck({
    ...base,
    per100g: { ...peanutButter100g, energyKcal: null },
  });
  assertEquals(result.warnings, ["incomplete_nutrition"]);
});

Deno.test("added sugars above total sugars are flagged", () => {
  const result = mustCheck({
    ...base,
    per100g: {
      ...peanutButter100g,
      totalSugarG: value(5),
      addedSugarG: value(9),
    },
  });
  assertEquals(result.warnings, ["sugar_inconsistent"]);
});

Deno.test(
  "a label with no per 100 g column reports nutrition as missing",
  () => {
    const result = mustCheck(toReading({ ...output, per100g: [] }));
    assertEquals(result.missing, ["nutrition"]);
  },
);
