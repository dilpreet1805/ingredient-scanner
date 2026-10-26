import { z } from "zod";

// "spread" must also be added to ProductCategory in the app (done in step 6.6).
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
  "spread",
  "other",
] as const;

export const NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "carbsG",
  "totalSugarG",
  "addedSugarG",
  "polyolG",
  "fibreG",
  "fatG",
  "saturatedFatG",
  "transFatG",
  "cholesterolMg",
  "sodiumMg",
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

// Which column of the label the values come from.
export const BASES = ["per100g", "per100ml", "perServing", "none"] as const;
export type NutritionBasis = Exclude<(typeof BASES)[number], "none">;

// ---------- 1. Wire format: what Claude returns (no nullable fields) ----------

// The value is copied as text exactly as printed: "62.6", "0.0", "<2", "TRACE".
const entry = z.object({
  nutrient: z.enum(NUTRIENT_KEYS),
  printed: z.string(),
});

// Empty string means "not visible". 0 servings means "not printed".
export const modelOutputSchema = z.object({
  isFoodLabel: z.boolean(),
  brand: z.string(),
  productName: z.string(),
  category: z.enum(CATEGORIES),
  ingredientsText: z.string(),
  allergenStatements: z.array(z.string()),
  servingSize: z.string(),
  servingsPerPack: z.number(),
  nutritionBasis: z.enum(BASES),
  nutrition: z.array(entry),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;

// JSON Schema sent to Claude. Deliberately has no anyOf and no type arrays.
const text = { type: "string" };

const entryJson = {
  type: "object",
  properties: {
    nutrient: { type: "string", enum: [...NUTRIENT_KEYS] },
    printed: text,
  },
  required: ["nutrient", "printed"],
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
    nutritionBasis: { type: "string", enum: [...BASES] },
    nutrition: { type: "array", items: entryJson },
  },
  required: Object.keys(modelOutputSchema.shape),
  additionalProperties: false,
};

// ---------- 2. Turning printed text into numbers (our code, fully tested) ----------

export type NutrientValue = { value: number; lessThan: boolean };
export type Nutrients = Record<NutrientKey, NutrientValue | null>;

/** Turns text copied from a label into a number. Words like TRACE or NA give null. */
export function parsePrinted(printed: string): NutrientValue | null {
  const text = printed.trim().toLowerCase();
  if (/^(nil|zero)\b/.test(text)) return { value: 0, lessThan: false };

  const lessThan = /^\s*[<≤]/.test(text) || text.startsWith("less than");
  const match = text.match(/\d+(?:[.,]\d+)*|[.,]\d+/);
  if (!match) return null;

  // "2,603" uses a comma for thousands. "1,5" uses a comma as the decimal point.
  const raw = match[0];
  const normalized = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)
    ? raw.replace(/,/g, "")
    : raw.replace(",", ".");

  const value = Number(normalized);
  return Number.isFinite(value) ? { value, lessThan } : null;
}

function toNutrients(entries: ModelOutput["nutrition"]): Nutrients | null {
  const result = Object.fromEntries(
    NUTRIENT_KEYS.map((key) => [key, null]),
  ) as Nutrients;
  const seen = new Set<NutrientKey>();
  for (const item of entries) {
    if (seen.has(item.nutrient)) continue; // the first entry wins
    const parsed = parsePrinted(item.printed);
    if (!parsed) continue; // a word such as TRACE or NA
    if (parsed.lessThan && parsed.value <= 0) continue; // "less than zero" means nothing
    seen.add(item.nutrient);
    result[item.nutrient] = parsed;
  }
  return seen.size === 0 ? null : result;
}

// ---------- 3. App shape: what the function returns ----------

export type LabelReading = {
  isFoodLabel: boolean;
  brand: string | null;
  productName: string | null;
  category: (typeof CATEGORIES)[number];
  ingredientsText: string | null;
  allergenStatements: string[];
  servingSize: string | null;
  servingsPerPack: number | null;
  nutrition: { basis: NutritionBasis; values: Nutrients } | null;
};

/** Converts the wire format to the app shape. Placeholders are cleaned in checkReading. */
export function toReading(output: ModelOutput): LabelReading {
  const values =
    output.nutritionBasis === "none" ? null : toNutrients(output.nutrition);
  return {
    isFoodLabel: output.isFoodLabel,
    brand: output.brand,
    productName: output.productName,
    category: output.category,
    ingredientsText: output.ingredientsText,
    allergenStatements: output.allergenStatements,
    servingSize: output.servingSize,
    servingsPerPack: output.servingsPerPack,
    nutrition:
      values && output.nutritionBasis !== "none"
        ? { basis: output.nutritionBasis, values }
        : null,
  };
}

// ---------- 4. Our own checks on what Claude returned ----------

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
  "polyolG",
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

function valuesPlausible(n: Nutrients, basis: NutritionBasis): boolean {
  const gramLimit = basis === "perServing" ? 1000 : 100;
  const kcalLimit = basis === "perServing" ? 5000 : 950;

  for (const key of NUTRIENT_KEYS) {
    const v = n[key]?.value;
    if (v !== undefined && (!Number.isFinite(v) || v < 0)) return false;
  }
  if ((n.energyKcal?.value ?? 0) > kcalLimit) return false;
  for (const key of GRAM_KEYS) {
    if ((n[key]?.value ?? 0) > gramLimit) return false;
  }
  if ((n.sodiumMg?.value ?? 0) > 40_000) return false;
  if ((n.cholesterolMg?.value ?? 0) > 3_000) return false;
  return true;
}

function coreComplete(n: Nutrients): boolean {
  return CORE_KEYS.every((key) => n[key] !== null);
}

/**
 * Energy should roughly equal 4 x protein + 4 x digestible carbs + 9 x fat,
 * with fibre counted at 2 and polyols at 2.4 kcal per gram.
 */
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
  const fibre = n.fibreG?.value ?? 0;
  const polyol = n.polyolG?.value ?? 0;
  const digestible = Math.max(carbs - fibre - polyol, 0);
  const expected =
    4 * protein + 4 * digestible + 2 * fibre + 2.4 * polyol + 9 * fat;
  const tolerance = polyol > 0 ? 0.12 : 0.05;
  return Math.abs(energy - expected) <= Math.max(tolerance * expected, 10);
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

  const cleanNutrition = (
    block: LabelReading["nutrition"],
  ): LabelReading["nutrition"] => {
    if (!block) return null;
    if (!valuesPlausible(block.values, block.basis)) {
      warn("values_out_of_range");
      return null; // never pass nonsense to the app
    }
    if (!coreComplete(block.values)) warn("incomplete_nutrition");
    if (!energyConsistent(block.values)) warn("energy_mismatch");
    if (!sugarsConsistent(block.values)) warn("sugar_inconsistent");
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
    nutrition: cleanNutrition(input.nutrition),
  };

  const missing: Missing[] = [];
  if (!reading.ingredientsText) missing.push("ingredients");
  if (!reading.nutrition) missing.push("nutrition");

  return { ok: true, reading, missing, warnings };
}
