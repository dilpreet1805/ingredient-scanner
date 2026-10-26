import { z } from "zod";

// Must match ProductCategory in the app (src/types/index.ts).
export const CATEGORIES = [
  "noodles",
  "bread",
  "beverage",
  "snack",
  "sweets",
  "dairy",
  "cereal",
  "sauce",
  "frozen",
  "fruit_veg",
  "meat_fish",
  "other",
] as const;

export const NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "carbsG",
  "totalSugarG",
  "addedSugarG",
  "fibreG",
  "fatG",
  "saturatedFatG",
  "transFatG",
  "cholesterolMg",
  "sodiumMg",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

// ---------- 1. Wire format: what Claude returns (no nullable fields) ----------

// "<2 g" is { nutrient: "totalSugarG", value: 2, lessThan: true }.
const entry = z.object({
  nutrient: z.enum(NUTRIENT_KEYS),
  value: z.number(),
  lessThan: z.boolean(),
});

// Empty string means "not visible". 0 servings means "not printed".
// An empty list means "the per 100 g column is not printed".
export const modelOutputSchema = z.object({
  isFoodLabel: z.boolean(),
  brand: z.string(),
  productName: z.string(),
  category: z.enum(CATEGORIES),
  ingredientsText: z.string(),
  allergenStatements: z.array(z.string()),
  servingSize: z.string(),
  servingsPerPack: z.number(),
  per100g: z.array(entry),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

// JSON Schema sent to Claude. Deliberately has no anyOf and no type arrays.
const text = { type: "string" };

const entryJson = {
  type: "object",
  properties: {
    nutrient: { type: "string", enum: [...NUTRIENT_KEYS] },
    value: { type: "number" },
    lessThan: { type: "boolean" },
  },
  required: ["nutrient", "value", "lessThan"],
  additionalProperties: false,
};

export const LABEL_JSON_SCHEMA = {
  type: "object",
  properties: {
    isFoodLabel: { type: "boolean" },
    brand: text,
    productName: text,
    category: { type: "string", enum: [...CATEGORIES] },
    ingredientsText: text,
    allergenStatements: { type: "array", items: text },
    servingSize: text,
    servingsPerPack: { type: "number" },
    per100g: { type: "array", items: entryJson },
  },
  required: Object.keys(modelOutputSchema.shape),
  additionalProperties: false,
};

// ---------- 2. App shape: what the function returns ----------

export type NutrientValue = { value: number; lessThan: boolean };
export type Nutrients = Record<NutrientKey, NutrientValue | null>;

export type LabelReading = {
  isFoodLabel: boolean;
  brand: string | null;
  productName: string | null;
  category: (typeof CATEGORIES)[number];
  ingredientsText: string | null;
  allergenStatements: string[];
  servingSize: string | null;
  servingsPerPack: number | null;
  per100g: Nutrients | null;
};

function toNutrients(entries: ModelOutput["per100g"]): Nutrients | null {
  const result = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, null]),
  ) as Nutrients;
  const seen = new Set<NutrientKey>();
  for (const item of entries) {
    if (seen.has(item.nutrient)) continue; // the first entry wins
    if (item.lessThan && item.value <= 0) continue; // "less than zero" means nothing, e.g. TRACE
    seen.add(item.nutrient);
    result[item.nutrient] = { value: item.value, lessThan: item.lessThan };
  }
  return seen.size === 0 ? null : result;
}

/** Converts the wire format to the app shape. Placeholders are cleaned in checkReading. */
export function toReading(output: ModelOutput): LabelReading {
  return {
    isFoodLabel: output.isFoodLabel,
    brand: output.brand,
    productName: output.productName,
    category: output.category,
    ingredientsText: output.ingredientsText,
    allergenStatements: output.allergenStatements,
    servingSize: output.servingSize,
    servingsPerPack: output.servingsPerPack,
    per100g: toNutrients(output.per100g),
  };
}

// ---------- 3. Our own checks on what Claude returned ----------

export type Missing = "ingredients" | "nutrition";
export type Warning =
  | "energy_mismatch"
  | "values_out_of_range"
  | "incomplete_nutrition"
  | "sugar_inconsistent";

export type CheckedReading =
  | { ok: false; reason: "not_a_label" }
  | {
      ok: true;
      reading: LabelReading;
      missing: Missing[];
      warnings: Warning[];
    };

const GRAM_KEYS = [
  "proteinG",
  "carbsG",
  "totalSugarG",
  "addedSugarG",
  "fibreG",
  "fatG",
  "saturatedFatG",
  "transFatG",
] as const;

// Every food label must print these four.
const CORE_KEYS = ["energyKcal", "proteinG", "carbsG", "fatG"] as const;

/** Trim, turn empty text into null, and cap the length. */
const clean = (value: string | null, max: number): string | null => {
  const trimmed = value?.trim().slice(0, max) ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

function valuesPlausible(n: Nutrients): boolean {
  for (const key of NUTRIENT_KEYS) {
    const v = n[key]?.value;
    if (v !== undefined && (!Number.isFinite(v) || v < 0)) return false;
  }
  if ((n.energyKcal?.value ?? 0) > 950) return false;
  for (const key of GRAM_KEYS) {
    if ((n[key]?.value ?? 0) > 100) return false;
  }
  if ((n.sodiumMg?.value ?? 0) > 40_000) return false;
  if ((n.cholesterolMg?.value ?? 0) > 3_000) return false;
  return true;
}

function coreComplete(n: Nutrients): boolean {
  return CORE_KEYS.every((key) => n[key] !== null);
}

/** Energy should roughly equal 4 x protein + 4 x carbs + 9 x fat. */
function energyConsistent(n: Nutrients): boolean {
  const energy = n.energyKcal?.value;
  const protein = n.proteinG?.value;
  const carbs = n.carbsG?.value;
  const fat = n.fatG?.value;
  if (
    energy === undefined ||
    protein === undefined ||
    carbs === undefined ||
    fat === undefined
  ) {
    return true; // not enough values to check; coreComplete reports that case
  }
  const expected = 4 * protein + 4 * carbs + 9 * fat;
  return Math.abs(energy - expected) <= Math.max(0.05 * expected, 10);
}

/** Added sugars cannot exceed total sugars, which cannot exceed carbohydrates. */
function sugarsConsistent(n: Nutrients): boolean {
  const added = n.addedSugarG?.value;
  const total = n.totalSugarG?.value;
  const carbs = n.carbsG?.value;
  if (added !== undefined && total !== undefined && added > total + 0.5)
    return false;
  if (total !== undefined && carbs !== undefined && total > carbs + 0.5)
    return false;
  return true;
}

export function checkReading(input: LabelReading): CheckedReading {
  if (!input.isFoodLabel) return { ok: false, reason: "not_a_label" };

  const warnings: Warning[] = [];
  const warn = (w: Warning) => {
    if (!warnings.includes(w)) warnings.push(w);
  };

  const cleanBlock = (block: Nutrients | null): Nutrients | null => {
    if (!block) return null;
    if (!valuesPlausible(block)) {
      warn("values_out_of_range");
      return null; // never pass nonsense to the app
    }
    if (!coreComplete(block)) warn("incomplete_nutrition");
    if (!energyConsistent(block)) warn("energy_mismatch");
    if (!sugarsConsistent(block)) warn("sugar_inconsistent");
    return block;
  };

  const servings = input.servingsPerPack;

  const reading: LabelReading = {
    ...input,
    brand: clean(input.brand, 80),
    productName: clean(input.productName, 120),
    ingredientsText: clean(input.ingredientsText, 3000),
    allergenStatements: input.allergenStatements
      .map((s) => clean(s, 200))
      .filter((s): s is string => s !== null)
      .slice(0, 10),
    servingSize: clean(input.servingSize, 40),
    servingsPerPack:
      servings !== null &&
      Number.isFinite(servings) &&
      servings > 0 &&
      servings <= 1000
        ? servings
        : null,
    per100g: cleanBlock(input.per100g),
  };

  const missing: Missing[] = [];
  if (!reading.ingredientsText) missing.push("ingredients");
  if (!reading.per100g) missing.push("nutrition");

  return { ok: true, reading, missing, warnings };
}
