import { z } from "zod";

import type { ProductCategory } from "@/types";

const nutrientValue = z
  .object({ value: z.number(), lessThan: z.boolean() })
  .nullable();

export const nutrientsSchema = z.object({
  energyKcal: nutrientValue,
  proteinG: nutrientValue,
  carbsG: nutrientValue,
  totalSugarG: nutrientValue,
  addedSugarG: nutrientValue,
  polyolG: nutrientValue,
  fibreG: nutrientValue,
  fatG: nutrientValue,
  saturatedFatG: nutrientValue,
  transFatG: nutrientValue,
  cholesterolMg: nutrientValue,
  sodiumMg: nutrientValue,
});

export const labelReadingSchema = z.object({
  isFoodLabel: z.boolean(),
  brand: z.string().nullable(),
  productName: z.string().nullable(),
  // A plain string, so a category added on the server never breaks an older app.
  category: z.string(),
  ingredientsText: z.string().nullable(),
  allergenStatements: z.array(z.string()),
  servingSize: z.string().nullable(),
  servingsPerPack: z.number().nullable(),
  nutrition: z
    .object({
      basis: z.enum(["per100g", "per100ml", "perServing"]),
      values: nutrientsSchema,
    })
    .nullable(),
});

export type LabelReading = z.infer<typeof labelReadingSchema>;

// A Record, so adding a category to ProductCategory is a compile error until it is listed here.
const KNOWN_CATEGORIES: Record<ProductCategory, true> = {
  noodles: true,
  bread: true,
  beverage: true,
  snack: true,
  sweets: true,
  dairy: true,
  cereal: true,
  sauce: true,
  frozen: true,
  fruit_veg: true,
  meat_fish: true,
  other: true,
};

/** Unknown categories from the server fall back to "other". */
export function toProductCategory(value: string): ProductCategory {
  return Object.prototype.hasOwnProperty.call(KNOWN_CATEGORIES, value)
    ? (value as ProductCategory)
    : "other";
}
