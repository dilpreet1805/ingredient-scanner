import type { NewScan } from "@/types";

import type { Draft } from "./draft";
import { toProductCategory } from "./label-reading";

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Builds what gets saved from what was read.
 * Returns null without an ingredient list, because there is no result to save without one.
 * The typed name is used only when the label gave neither a brand nor a product name.
 */
export function draftToNewScan(
  draft: Draft,
  options: { confirmed: boolean; typedName: string },
): NewScan | null {
  const reading = draft.reading;
  const ingredientsText = clean(reading.ingredientsText);
  if (!ingredientsText) return null;

  const brand = clean(reading.brand);
  let productName = clean(reading.productName);
  if (!brand && !productName) {
    productName = clean(options.typedName)?.slice(0, 120) ?? null;
  }

  return {
    brand,
    productName,
    category: toProductCategory(reading.category),
    ingredientsText,
    allergenStatements: reading.allergenStatements,
    servingSize: reading.servingSize,
    servingsPerPack: reading.servingsPerPack,
    nutrition: reading.nutrition,
    warnings: draft.warnings,
    barcode: null, // filled in when barcode scanning arrives
    confirmed: options.confirmed,
    photoUris: draft.photoUris,
  };
}
