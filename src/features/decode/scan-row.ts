import type { NewScan, ScanNutrition, ScanResult } from "@/types";

import { labelReadingSchema, toProductCategory } from "./label-reading";

/** One row of the scans table, exactly as SQLite returns it. Lists are stored as JSON text. */
export type ScanRow = {
  id: string;
  created_at: string;
  pinned: number;
  brand: string | null;
  product_name: string | null;
  category: string;
  ingredients_text: string;
  allergen_statements: string;
  serving_size: string | null;
  servings_per_pack: number | null;
  nutrition: string | null;
  warnings: string;
  barcode: string | null;
  confirmed: number;
  image_files: string;
};

type Parser<T> = {
  safeParse(data: unknown): { success: true; data: T } | { success: false };
};

const textList: Parser<string[]> = {
  safeParse(data) {
    return Array.isArray(data) && data.every((item) => typeof item === "string")
      ? { success: true, data }
      : { success: false };
  },
};

/** Reads JSON text we saved earlier. If it is damaged, the fallback is used and the app keeps working. */
function readJson<T>(text: string | null, parser: Parser<T>, fallback: T): T {
  if (text === null) return fallback;
  try {
    const result = parser.safeParse(JSON.parse(text));
    return result.success ? result.data : fallback;
  } catch {
    return fallback;
  }
}

export function rowToScan(
  row: ScanRow,
  uriFromFile: (fileName: string) => string,
): ScanResult {
  return {
    id: row.id,
    createdAt: row.created_at,
    pinned: row.pinned === 1,
    brand: row.brand,
    productName: row.product_name,
    category: toProductCategory(row.category),
    ingredientsText: row.ingredients_text,
    allergenStatements: readJson(row.allergen_statements, textList, []),
    servingSize: row.serving_size,
    servingsPerPack: row.servings_per_pack,
    nutrition: readJson<ScanNutrition | null>(
      row.nutrition,
      labelReadingSchema.shape.nutrition,
      null,
    ),
    warnings: readJson(row.warnings, textList, []),
    barcode: row.barcode,
    confirmed: row.confirmed === 1,
    imageUris: readJson(row.image_files, textList, []).map(uriFromFile),
  };
}

/** The values for the INSERT, in the same order as the columns in scan-repository.ts. */
export function scanToParams(
  scan: NewScan,
  id: string,
  createdAt: string,
  imageFiles: string[],
): (string | number | null)[] {
  return [
    id,
    createdAt,
    scan.brand,
    scan.productName,
    scan.category,
    scan.ingredientsText,
    JSON.stringify(scan.allergenStatements),
    scan.servingSize,
    scan.servingsPerPack,
    scan.nutrition ? JSON.stringify(scan.nutrition) : null,
    JSON.stringify(scan.warnings),
    scan.barcode,
    scan.confirmed ? 1 : 0,
    JSON.stringify(imageFiles),
  ];
}
